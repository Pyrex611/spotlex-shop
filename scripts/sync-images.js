// scripts/sync-images.js
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION BLOCK ---
const CONFIG = {
  ZOHO_CLIENT_ID: "1000.TPPSHV6CYVCPISOTH4S5YMBS0VV24P",
  ZOHO_CLIENT_SECRET: "862fceb02b123a3f500442ed30e7ad73a0d644ec32",
  ZOHO_REFRESH_TOKEN: "PASTE_YOUR_NEW_REFRESH_TOKEN_HERE", // The one you got from the browser auth!
  ZOHO_ORG_ID: "891984184",
  ZOHO_ACCOUNTS_URL: "https://accounts.zoho.com",
  ZOHO_API_URL: "https://www.zohoapis.com/inventory/v1",
  SUPABASE_URL: "https://jsxgggoxpjmdmigbyesh.supabase.co", 
  SUPABASE_SERVICE_ROLE_KEY: "PASTE_YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE" 
};
// ----------------------------

// Bypass local Windows Antivirus/SSL restrictions just in case
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const cleanUrl = CONFIG.SUPABASE_URL.trim();
const cleanKey = CONFIG.SUPABASE_SERVICE_ROLE_KEY.trim();
const supabase = createClient(cleanUrl, cleanKey);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getZohoAccessToken() {
  const response = await fetch(`${CONFIG.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: CONFIG.ZOHO_REFRESH_TOKEN,
      client_id: CONFIG.ZOHO_CLIENT_ID,
      client_secret: CONFIG.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Zoho Token Error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function runImageSync() {
  console.log("⚡ Authenticating with Zoho...");
  let accessToken;
  try {
    accessToken = await getZohoAccessToken();
  } catch (err) {
    console.error("❌ Auth Error:", err.message);
    return;
  }

  console.log("📦 Fetching products from Supabase that are missing images...");
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, zoho_item_id, name')
    .eq('image', '') // Only fetch products with empty images
    .not('zoho_item_id', 'is', null);

  if (fetchError) {
    console.error("❌ Failed to fetch Supabase products:", fetchError.message);
    return;
  }

  console.log(`🔍 Found ${products.length} products needing images. Starting download loop...\n`);

  let successCount = 0;

  for (const product of products) {
    try {
      // 1. Ask Zoho for the specific item details to see if it even has an image
      const itemRes = await fetch(`${CONFIG.ZOHO_API_URL}/items/${product.zoho_item_id}?organization_id=${CONFIG.ZOHO_ORG_ID}`, {
        headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
      });
      const itemData = await itemRes.json();
      
      // Delay to respect Zoho API Rate Limits (100 requests / minute)
      await sleep(600); 

      if (!itemRes.ok || !itemData.item || !itemData.item.image_name) {
        console.log(`   ⏭️ Skipped: [${product.name}] (No image found in Zoho)`);
        continue;
      }

      // 2. Download the binary image file from Zoho
      const imageRes = await fetch(`${CONFIG.ZOHO_API_URL}/items/${product.zoho_item_id}/image?organization_id=${CONFIG.ZOHO_ORG_ID}`, {
        headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
      });

      if (!imageRes.ok) {
        console.log(`   ❌ Failed to download image for: [${product.name}]`);
        continue;
      }

      const imageBuffer = await imageRes.arrayBuffer();
      const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
      const fileExt = contentType.split('/')[1] || 'jpg';
      const fileName = `${product.zoho_item_id}-${Date.now()}.${fileExt}`;

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, imageBuffer, {
          contentType: contentType,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. Get Public URL and update the database row
      const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ image: publicUrlData.publicUrl })
        .eq('id', product.id);

      if (updateError) throw updateError;

      console.log(`✨ Success: Uploaded image for [${product.name}]`);
      successCount++;

    } catch (err) {
      console.error(`❌ Error processing [${product.name}]:`, err.message);
    }
  }

  console.log(`\n🎉 Image Sync Completed! Uploaded ${successCount} new images to your storefront.`);
}

runImageSync();