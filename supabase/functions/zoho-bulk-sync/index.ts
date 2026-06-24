/**
 * supabase/functions/zoho-bulk-sync/index.ts
 *
 * Pulls ALL active items from Zoho Inventory (handles pagination) and
 * upserts them into the Supabase `products` table keyed on `zoho_item_id`.
 *
 * Called from the Admin Dashboard "Sync Full Catalog" button.
 * Requires secrets: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { getZohoAccessToken, getZohoApiBase } from '../_shared/zoho-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const orgId = Deno.env.get('ZOHO_ORG_ID');
    if (!orgId) throw new Error('Missing ZOHO_ORG_ID secret.');

    // Auth — throws a descriptive error if credentials are wrong/missing
    const token  = await getZohoAccessToken();
    const apiBase = getZohoApiBase();

    // ── Paginate through ALL Zoho Inventory active items ──────────────────────
    const allItems: Record<string, unknown>[] = [];
    let page = 1;
    const PER_PAGE = 200; // Zoho's maximum per-page value

    while (true) {
      const res  = await fetch(
        `${apiBase}/items?organization_id=${orgId}&page=${page}&per_page=${PER_PAGE}&status=active`,
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
      );
      const body = await res.json() as Record<string, unknown>;

      if (body.code !== undefined && body.code !== 0) {
        throw new Error(`Zoho API Error (code ${body.code}): ${body.message}`);
      }

      const items = body.items as Record<string, unknown>[] | undefined;
      if (!items || items.length === 0) break;

      allItems.push(...items);

      // page_context.has_more_page is false when we've reached the last page
      const pageCtx = body.page_context as Record<string, unknown> | undefined;
      if (!pageCtx?.has_more_page) break;
      page++;
    }

    if (allItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No active items found in Zoho.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Map Zoho item fields → Supabase products columns ─────────────────────
    const formatted = allItems.map((item) => ({
      // item_id from Zoho is a large integer; store as text to avoid JS precision loss
      zoho_item_id:   String(item.item_id),
      name:           item.name as string,
      sku:            (item.sku as string)         ?? '',
      description:    (item.description as string) ?? '',
      price:          Number(item.rate             ?? 0),
      // actual_available_stock is more accurate than stock_on_hand for committed stock
      stock_quantity: Number(
        (item.actual_available_stock ?? item.stock_on_hand) ?? 0
      ),
    }));

    // Upsert — insert new rows, update existing ones by zoho_item_id
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(formatted, { onConflict: 'zoho_item_id', ignoreDuplicates: false });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, count: formatted.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[zoho-bulk-sync]', err);
    // Return 500 so the frontend knows this is a real failure, not a success
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});