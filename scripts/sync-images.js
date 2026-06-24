/**
 * scripts/sync-images.js
 *
 * One-shot local script: downloads images from Zoho Inventory for all Supabase
 * products that have a zoho_item_id but an empty `image` field, uploads them
 * to Supabase Storage, and updates the database.
 *
 * Usage:
 *   1. Create a .env file (see below) — NEVER hardcode credentials here.
 *   2. node --env-file=.env scripts/sync-images.js
 *
 * Required .env variables:
 *   ZOHO_CLIENT_ID=1000.XXXXXXXXXX
 *   ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx
 *   ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxx.xxxxxxxxxx   ← from the OAuth flow
 *   ZOHO_ORG_ID=891984184
 *   SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Optional:
 *   ZOHO_ACCOUNTS_URL=https://accounts.zoho.com     (default; change for EU/IN/AU)
 *   ZOHO_API_URL=https://www.zohoapis.com/inventory/v1
 */

import { createClient } from '@supabase/supabase-js';

// ── Validate required env vars before doing anything ──────────────────────────
const REQUIRED = [
  'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN',
  'ZOHO_ORG_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`\n❌  Missing required environment variables:\n   ${missing.join(', ')}`);
  console.error('\nCreate a .env file with these values and run:');
  console.error('   node --env-file=.env scripts/sync-images.js\n');
  process.exit(1);
}

const CONFIG = {
  ZOHO_CLIENT_ID:     process.env.ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
  ZOHO_ORG_ID:        process.env.ZOHO_ORG_ID,
  ZOHO_ACCOUNTS_URL:  process.env.ZOHO_ACCOUNTS_URL ?? 'https://accounts.zoho.com',
  ZOHO_API_URL:       process.env.ZOHO_API_URL       ?? 'https://www.zohoapis.com/inventory/v1',
  SUPABASE_URL:       process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY);
const sleep    = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Zoho Auth ────────────────────────────────────────────────────────────────

async function getZohoAccessToken() {
  const res = await fetch(`${CONFIG.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     CONFIG.ZOHO_CLIENT_ID,
      client_secret: CONFIG.ZOHO_CLIENT_SECRET,
      refresh_token: CONFIG.ZOHO_REFRESH_TOKEN,
    }),
  });

  // Always parse as text first — Zoho returns 200 even for auth errors
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Zoho returned non-JSON (HTTP ${res.status}): ${raw}`);
  }

  if (data.error) {
    throw new Error(
      `Zoho OAuth Error: "${data.error}".\n` +
      (data.error_description ? `  Description: ${data.error_description}\n` : '') +
      '  → Re-generate your refresh token at https://api-console.zoho.com'
    );
  }

  if (!data.access_token) {
    throw new Error(`No access_token in Zoho response: ${raw}`);
  }

  return data.access_token;
}

// ─── Main sync loop ───────────────────────────────────────────────────────────

async function runImageSync() {
  console.log('\n⚡  Authenticating with Zoho...');
  const accessToken = await getZohoAccessToken(); // throws on failure
  console.log('✅  Authenticated.\n');

  console.log('📦  Fetching Supabase products with missing images...');
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, zoho_item_id, name')
    .or('image.is.null,image.eq.')          // null OR empty string
    .not('zoho_item_id', 'is', null);

  if (fetchError) {
    console.error('❌  Failed to fetch products from Supabase:', fetchError.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('🎉  All products already have images. Nothing to do.\n');
    return;
  }

  console.log(`🔍  Found ${products.length} products needing images.\n`);
  let successCount = 0;

  for (const product of products) {
    try {
      // 1. Check if the Zoho item has an image at all
      const itemRes  = await fetch(
        `${CONFIG.ZOHO_API_URL}/items/${product.zoho_item_id}?organization_id=${CONFIG.ZOHO_ORG_ID}`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
      );
      const itemData = await itemRes.json();

      // Respect Zoho rate limit: ~100 req/min on free tier → 1 call per 650ms
      await sleep(650);

      if (!itemData.item?.image_name) {
        console.log(`   ⏭️  Skipped: [${product.name}] — no image in Zoho`);
        continue;
      }

      // 2. Download the binary image
      const imageRes = await fetch(
        `${CONFIG.ZOHO_API_URL}/items/${product.zoho_item_id}/image?organization_id=${CONFIG.ZOHO_ORG_ID}`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
      );

      if (!imageRes.ok) {
        console.log(`   ❌  Failed to download image for [${product.name}] — HTTP ${imageRes.status}`);
        continue;
      }

      const imageBuffer = await imageRes.arrayBuffer();
      const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
      const ext         = contentType.split('/')[1]?.split(';')[0] ?? 'jpg';
      const fileName    = `${product.zoho_item_id}-${Date.now()}.${ext}`;

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, imageBuffer, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      // 4. Write public URL back to the product row
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from('products')
        .update({ image: urlData.publicUrl })
        .eq('id', product.id);

      if (updateError) throw updateError;

      console.log(`   ✨  Uploaded image for [${product.name}]`);
      successCount++;

    } catch (err) {
      console.error(`   ❌  Error processing [${product.name}]:`, err.message);
    }
  }

  console.log(`\n🎉  Done! Uploaded ${successCount} of ${products.length} images.\n`);
}

runImageSync().catch((err) => {
  console.error('\n💥  Fatal error:', err.message);
  process.exit(1);
});