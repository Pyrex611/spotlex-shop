/**
 * supabase/functions/zoho-sync/index.ts
 *
 * Receives real-time item-change notifications from Zoho Inventory via a
 * Zoho Custom Function (Deluge script) that POSTs here whenever an item
 * is created or updated.
 *
 * Expected payload from the Deluge script:
 * {
 *   "secret":       "<ZOHO_WEBHOOK_SECRET env var>",
 *   "item_id":      "6642928000000163624",
 *   "name":         "UV Flashlight",
 *   "rate":         30000,
 *   "stock_on_hand": 2,
 *   "description":  "...",
 *   "sku":          "..."
 * }
 *
 * Zoho Deluge script to paste in Zoho → Settings → Automation → Custom Functions:
 * ─────────────────────────────────────────────────────────────────────────────
 * void function itemSync(String item_id) {
 *   item = zoho.inventory.getItemById(item_id, "<YOUR_ORG_ID>");
 *   data = Map();
 *   data.put("secret",         "<YOUR_ZOHO_WEBHOOK_SECRET>");
 *   data.put("item_id",        item.get("item_id").toString());
 *   data.put("name",           item.get("name").toString());
 *   data.put("rate",           item.get("rate"));
 *   data.put("stock_on_hand",  item.get("stock_on_hand"));
 *   data.put("description",    item.get("description").toString());
 *   data.put("sku",            item.get("sku").toString());
 *   response = invokeurl [
 *     url: "https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/zoho-sync"
 *     type: POST
 *     parameters: data.toString()
 *     headers: {"Content-Type":"application/json"}
 *   ];
 * }
 * ─────────────────────────────────────────────────────────────────────────────
 * Then add this function as a Workflow trigger on the Item module for:
 *   - Create  (run On Item Create)
 *   - Edit    (run On Item Edit)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // ── Security: validate the shared webhook secret ──────────────────────────
    const expectedSecret = Deno.env.get('ZOHO_WEBHOOK_SECRET');
    if (!expectedSecret || payload.secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Extract item fields (support both flat and nested formats) ────────────
    // Flat  (from our Deluge script):  payload.item_id, payload.name, …
    // Nested (future-proofing):         payload.data.item_id, …
    const src        = (payload.data ?? payload) as Record<string, unknown>;
    const item_id    = String(src.item_id    ?? src.zoho_item_id ?? '');
    const name       = src.name        as string | undefined;
    const rate       = src.rate        as number | undefined;
    const stock      = src.stock_on_hand as number | undefined;
    const description = (src.description as string) ?? '';
    const sku        = (src.sku as string) ?? '';

    if (!item_id || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: item_id and name are mandatory.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Upsert the product ────────────────────────────────────────────────────
    const product = {
      zoho_item_id:   item_id,
      name,
      price:          Number(rate  ?? 0),
      stock_quantity: Number(stock ?? 0),
      description,
      sku,
    };

    const { error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'zoho_item_id', ignoreDuplicates: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: `Synced item: ${name}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[zoho-sync]', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});