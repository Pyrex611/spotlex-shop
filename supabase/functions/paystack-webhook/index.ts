/**
 * supabase/functions/paystack-webhook/index.ts
 *
 * Handles Paystack `charge.success` events:
 *   1. Verifies the HMAC-SHA512 signature (security)
 *   2. Re-verifies the transaction status against Paystack API
 *   3. Marks the order as "paid" in Supabase
 *   4. Deducts stock in Supabase for each line item
 *   5. Creates a Sales Invoice in Zoho Inventory for bookkeeping
 *
 * Required secrets:
 *   PAYSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID
 */

import { createClient }          from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { getZohoAccessToken, getZohoApiBase } from '../_shared/zoho-auth.ts';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Compute HMAC-SHA512 over rawBody using key, return hex string. */
async function hmacSha512Hex(key: string, data: string): Promise<string> {
  const enc     = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  const sig     = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Resolve or create the "Website Sales" umbrella customer in Zoho. */
async function resolveWebsiteCustomer(
  token: string, orgId: string, apiBase: string
): Promise<string> {
  const searchRes  = await fetch(
    `${apiBase}/contacts?search_text=Website+Sales&organization_id=${orgId}`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  const searchData = await searchRes.json() as Record<string, unknown>;
  const contacts   = searchData.contacts as Array<Record<string, unknown>> | undefined;

  if (contacts && contacts.length > 0) {
    return contacts[0].contact_id as string;
  }

  // Create it once
  const createRes  = await fetch(
    `${apiBase}/contacts?organization_id=${orgId}`,
    {
      method:  'POST',
      headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contact_name: 'Website Sales', contact_type: 'customer' }),
    }
  );
  const createData = await createRes.json() as Record<string, unknown>;
  const created    = createData.contact as Record<string, unknown>;
  if (!created?.contact_id) {
    throw new Error(`Failed to create Zoho customer: ${JSON.stringify(createData)}`);
  }
  return created.contact_id as string;
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Read raw body BEFORE parsing JSON — we need it for HMAC verification
  const rawBody      = await req.text();
  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')!;

  // ── 1. Verify Paystack HMAC-SHA512 signature ────────────────────────────────
  const paystackSig  = req.headers.get('x-paystack-signature') ?? '';
  const expectedSig  = await hmacSha512Hex(paystackSecret, rawBody);

  if (!paystackSig || paystackSig !== expectedSig) {
    console.warn('[paystack-webhook] Invalid signature — request rejected.');
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as Record<string, unknown>;

    // Only process successful charge events
    if (event.event !== 'charge.success') {
      return new Response('Ignored', { status: 200 });
    }

    const data      = event.data  as Record<string, unknown>;
    const reference = data.reference as string;

    // ── 2. Re-verify the transaction status with Paystack ────────────────────
    const verifyRes  = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } }
    );
    const verifyData = await verifyRes.json() as Record<string, unknown>;

    if (
      !verifyData.status ||
      (verifyData.data as Record<string, unknown>)?.status !== 'success'
    ) {
      console.warn('[paystack-webhook] Transaction verification failed:', reference);
      return new Response('Invalid transaction', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── 3. Mark the order as paid ─────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('reference', reference)
      .select()
      .single();

    if (orderError || !order) {
      console.error('[paystack-webhook] Order not found for reference:', reference, orderError);
      return new Response('Order not found', { status: 200 });
    }

    const items = order.items as Array<Record<string, unknown>>;

    // ── 4. Deduct stock in Supabase ───────────────────────────────────────────
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.id)
        .single();

      if (product) {
        const newQty = Math.max(0, (product.stock_quantity as number) - (item.quantity as number));
        await supabase.from('products').update({ stock_quantity: newQty }).eq('id', item.id);
      }
    }

    // ── 5. Create Zoho Invoice (best-effort — never block the Paystack ack) ───
    try {
      const orgId   = Deno.env.get('ZOHO_ORG_ID')!;
      const token   = await getZohoAccessToken();
      const apiBase = getZohoApiBase();

      const customerId = await resolveWebsiteCustomer(token, orgId, apiBase);

      // Only include line items that have a Zoho item ID (manually-added
      // products won't have one, and Zoho would reject null item_id)
      const lineItems = items
        .filter(item => item.zoho_item_id)
        .map(item => ({
          item_id:  String(item.zoho_item_id),
          rate:     Number(item.price),
          quantity: Number(item.quantity),
        }));

      if (lineItems.length === 0) {
        console.warn('[paystack-webhook] No zoho_item_id on any order item — skipping invoice.');
      } else {
        const invoiceRes  = await fetch(
          `${apiBase}/invoices?organization_id=${orgId}`,
          {
            method:  'POST',
            headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              customer_id:      customerId,
              reference_number: reference,
              line_items:       lineItems,
            }),
          }
        );
        const invoiceData = await invoiceRes.json() as Record<string, unknown>;

        if (invoiceData.code !== undefined && invoiceData.code !== 0) {
          // Log but don't fail — the payment was already confirmed
          console.error('[paystack-webhook] Zoho invoice error:', invoiceData);
        } else {
          console.log('[paystack-webhook] Zoho invoice created:', 
            (invoiceData.invoice as Record<string, unknown>)?.invoice_number
          );
        }
      }
    } catch (zohoErr) {
      // Zoho sync is best-effort; log the error but always ACK Paystack
      console.error('[paystack-webhook] Zoho sync error:', zohoErr);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error('[paystack-webhook] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 }
    );
  }
});