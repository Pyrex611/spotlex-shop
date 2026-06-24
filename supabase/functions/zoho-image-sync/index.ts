/**
 * supabase/functions/zoho-image-sync/index.ts
 *
 * Downloads the primary image for a single Zoho Inventory item, uploads it
 * to Supabase Storage, and updates the product row's `image` column.
 *
 * Called per-product from the Admin Dashboard "Sync Images" orchestrator.
 * Body: { productId: string, zohoItemId: string }
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
    const { productId, zohoItemId } = await req.json();

    if (!productId || !zohoItemId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: productId and zohoItemId.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const orgId   = Deno.env.get('ZOHO_ORG_ID')!;
    const token   = await getZohoAccessToken();
    const apiBase = getZohoApiBase();

    // ── 1. Check whether the item actually has an image ───────────────────────
    const itemRes  = await fetch(
      `${apiBase}/items/${zohoItemId}?organization_id=${orgId}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const itemData = await itemRes.json() as Record<string, unknown>;

    if (itemData.code !== undefined && itemData.code !== 0) {
      throw new Error(`Zoho API Error (${itemData.code}): ${itemData.message}`);
    }

    const item = itemData.item as Record<string, unknown> | undefined;
    if (!item?.image_name) {
      // Not an error — many items simply have no image in Zoho yet
      return new Response(
        JSON.stringify({ success: false, reason: 'No image on this item in Zoho.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Download the binary image from Zoho ────────────────────────────────
    const imageRes = await fetch(
      `${apiBase}/items/${zohoItemId}/image?organization_id=${orgId}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );

    if (!imageRes.ok) {
      throw new Error(`Failed to download image from Zoho (HTTP ${imageRes.status}).`);
    }

    const imageBuffer  = await imageRes.arrayBuffer();
    const contentType  = imageRes.headers.get('content-type') ?? 'image/jpeg';
    const ext          = contentType.split('/')[1]?.split(';')[0] ?? 'jpg';
    const fileName     = `${zohoItemId}-${Date.now()}.${ext}`;

    // ── 3. Upload to Supabase Storage ─────────────────────────────────────────
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, { contentType, upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    // ── 4. Update the product row ─────────────────────────────────────────────
    const { error: dbError } = await supabase
      .from('products')
      .update({ image: imageUrl })
      .eq('id', productId);

    if (dbError) throw new Error(`Database update failed: ${dbError.message}`);

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[zoho-image-sync]', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});