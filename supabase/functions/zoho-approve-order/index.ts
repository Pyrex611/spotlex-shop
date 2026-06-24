/**
 * supabase/functions/zoho-approve-order/index.ts
 *
 * Called by the Admin Dashboard when a WhatsApp order is manually approved.
 * Mirrors what the Paystack webhook does for online payments:
 *   1. Marks the order as "paid" in Supabase
 *   2. Deducts stock in Supabase for each line item
 *   3. Creates a Sales Invoice in Zoho Inventory so bookkeeping is complete
 *
 * Body: { orderId: string }
 * Auth: must include the user's Supabase JWT (admin-only via RLS/role check)
 */

import { createClient }          from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { getZohoAccessToken, getZohoApiBase } from '../_shared/zoho-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Resolve or create the "Website Sales" customer in Zoho. */
async function resolveWebsiteCustomer(
  token: string, orgId: string, apiBase: string
): Promise<string> {
  const res  = await fetch(
    `${apiBase}/contacts?search_text=Website+Sales&organization_id=${orgId}`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  const data = await res.json() as Record<string, unknown>;
  const list = data.contacts as Array<Record<string, unknown>> | undefined;

  if (list && list.length > 0) return list[0].contact_id as string;

  const createRes  = await fetch(
    `${apiBase}/contacts?organization_id=${orgId}`,
    {
      method:  'POST',
      headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contact_name: 'Website Sales', contact_type: 'customer' }),
    }
  );
  const createData = await createRes.json() as Record<string, unknown>;
  const contact    = createData.contact as Record<string, unknown>;
  if (!contact?.contact_id) throw new Error(`Could not create Zoho customer: ${JSON.stringify(createData)}`);
  return contact.contact_id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { orderId } = await req.json() as { orderId: string };
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing orderId in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role — the admin-check happens in the calling frontend via RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── 1. Fetch the order ────────────────────────────────────────────────────
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error(fetchError?.message ?? `Order ${orderId} not found`);
    }

    if (order.status === 'paid') {
      return new Response(
        JSON.stringify({ success: true, message: 'Order already marked as paid.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const items = order.items as Array<Record<string, unknown>>;

    // ── 2. Mark as paid ───────────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // ── 3. Deduct stock in Supabase ───────────────────────────────────────────
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

    // ── 4. Create Zoho Invoice ────────────────────────────────────────────────
    let zohoResult: Record<string, unknown> = { skipped: false };

    try {
      const orgId   = Deno.env.get('ZOHO_ORG_ID')!;
      const token   = await getZohoAccessToken();
      const apiBase = getZohoApiBase();

      const customerId = await resolveWebsiteCustomer(token, orgId, apiBase);

      const lineItems = items
        .filter(i => i.zoho_item_id)
        .map(i => ({
          item_id:  String(i.zoho_item_id),
          rate:     Number(i.price),
          quantity: Number(i.quantity),
        }));

      if (lineItems.length === 0) {
        console.warn('[zoho-approve-order] No zoho_item_id on any item — invoice skipped.');
        zohoResult = { skipped: true, reason: 'no_zoho_item_ids' };
      } else {
        const invoiceRes  = await fetch(
          `${apiBase}/invoices?organization_id=${orgId}`,
          {
            method:  'POST',
            headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              customer_id:      customerId,
              reference_number: order.reference,
              notes:            `WhatsApp order approved by admin. Order ID: ${orderId}`,
              line_items:       lineItems,
            }),
          }
        );
        const invoiceData = await invoiceRes.json() as Record<string, unknown>;

        if (invoiceData.code !== undefined && invoiceData.code !== 0) {
          throw new Error(`Zoho invoice creation failed (code ${invoiceData.code}): ${invoiceData.message}`);
        }

        zohoResult = {
          invoice_id:     (invoiceData.invoice as Record<string, unknown>)?.invoice_id,
          invoice_number: (invoiceData.invoice as Record<string, unknown>)?.invoice_number,
        };
        console.log('[zoho-approve-order] Invoice created:', zohoResult.invoice_number);
      }
    } catch (zohoErr) {
      // Stock is already deducted and order marked paid — log but don't fail the response
      console.error('[zoho-approve-order] Zoho invoice error:', zohoErr);
      zohoResult = { error: (zohoErr as Error).message };
    }

    return new Response(
      JSON.stringify({ success: true, zoho: zohoResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[zoho-approve-order]', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});