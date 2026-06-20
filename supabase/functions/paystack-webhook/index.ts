// supabase/functions/paystack-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Zoho Environment Variables
const ZOHO_CLIENT_ID = Deno.env.get('ZOHO_CLIENT_ID')!
const ZOHO_CLIENT_SECRET = Deno.env.get('ZOHO_CLIENT_SECRET')!
const ZOHO_REFRESH_TOKEN = Deno.env.get('ZOHO_REFRESH_TOKEN')!
const ZOHO_ORG_ID = Deno.env.get('ZOHO_ORG_ID')!

async function getZohoToken() {
  const res = await fetch(`https://accounts.zoho.com/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Zoho Token Error: ${JSON.stringify(data)}`);
  return data.access_token;
}

serve(async (req) => {
  try {
    const body = await req.json();

    // Only process successful payments
    if (body.event !== 'charge.success') {
      return new Response('Ignored', { status: 200 });
    }

    const reference = body.data.reference;

    // 1. VERIFY WITH PAYSTACK (Security check to prevent spoofed webhooks)
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response('Invalid transaction', { status: 400 });
    }

    // 2. UPDATE SUPABASE ORDER
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('reference', reference)
      .select()
      .single();

    if (!order || orderError) return new Response('Order not found', { status: 200 });

    const items = order.items;

    // 3. DEDUCT LOCAL SUPABASE STOCK
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single();
      if (product) {
        await supabase.from('products').update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) }).eq('id', item.id);
      }
    }

    // 4. PUSH TO ZOHO INVENTORY
    try {
      const token = await getZohoToken();
      
      // Step A: Find or Create a "Website Sales" Contact
      let customerId = "";
      const custRes = await fetch(`https://www.zohoapis.com/inventory/v1/contacts?company_name=Website+Sales&organization_id=${ZOHO_ORG_ID}`, {
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
      });
      const custData = await custRes.json();
      
      if (custData.contacts && custData.contacts.length > 0) {
        customerId = custData.contacts[0].contact_id;
      } else {
        const createCust = await fetch(`https://www.zohoapis.com/inventory/v1/contacts?organization_id=${ZOHO_ORG_ID}`, {
          method: 'POST',
          headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact_name: "Website Sales", company_name: "Website Sales", contact_type: "customer" })
        });
        const createData = await createCust.json();
        customerId = createData.contact.contact_id;
      }

      // Step B: Create the Sales Invoice in Zoho
      const lineItems = items.map((item: any) => ({
        item_id: item.zoho_item_id,
        rate: item.price,
        quantity: item.quantity
      }));

      const invoicePayload = {
        customer_id: customerId,
        line_items: lineItems,
        reference_number: reference
      };

      await fetch(`https://www.zohoapis.com/inventory/v1/invoices?organization_id=${ZOHO_ORG_ID}`, {
        method: 'POST',
        headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });

    } catch (zohoError) {
      console.error("Zoho Sync Error:", zohoError);
      // We don't return a 500 here because the payment succeeded and local DB updated.
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});