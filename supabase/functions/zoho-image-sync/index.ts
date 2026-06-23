// supabase/functions/zoho-image-sync/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId, zohoItemId } = await req.json()

    if (!productId || !zohoItemId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const ZOHO_CLIENT_ID = Deno.env.get('ZOHO_CLIENT_ID')!
    const ZOHO_CLIENT_SECRET = Deno.env.get('ZOHO_CLIENT_SECRET')!
    const ZOHO_REFRESH_TOKEN = Deno.env.get('ZOHO_REFRESH_TOKEN')!
    const ZOHO_ORG_ID = Deno.env.get('ZOHO_ORG_ID')!

    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_ORG_ID) {
      throw new Error("Missing Zoho secrets in Supabase dashboard. Please run 'supabase secrets set' for all keys.")
    }

    // 1. Get Zoho Access Token
    const tokenRes = await fetch(`https://accounts.zoho.com/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      throw new Error(`Zoho Auth Failed: ${JSON.stringify(tokenData)}`)
    }

    // 2. Get Item Details from Zoho
    const itemRes = await fetch(`https://www.zohoapis.com/inventory/v1/items/${zohoItemId}?organization_id=${ZOHO_ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` }
    })
    const itemData = await itemRes.json()

    if (itemData.code && itemData.code !== 0) {
      throw new Error(`Zoho API Error (${itemData.code}): ${itemData.message}`)
    }

    if (!itemData.item || !itemData.item.image_name) {
      return new Response(JSON.stringify({ success: false, reason: 'No image found on this item in Zoho.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 3. Download the Binary Image
    const imageRes = await fetch(`https://www.zohoapis.com/inventory/v1/items/${zohoItemId}/image?organization_id=${ZOHO_ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` }
    })

    if (!imageRes.ok) {
      throw new Error(`Failed to download image file from Zoho. Status: ${imageRes.status}`)
    }

    const imageBuffer = await imageRes.arrayBuffer()
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg'
    const fileExt = contentType.split('/')[1] || 'jpg'
    const fileName = `${zohoItemId}-${Date.now()}.${fileExt}`

    // 4. Upload to Supabase Storage Bucket
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, { contentType, upsert: true })

    if (uploadError) {
      throw new Error(`Supabase Storage Upload Error: ${uploadError.message}`)
    }

    // 5. Get Public URL and Save to Products Table
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName)
    const imageUrl = publicUrlData.publicUrl

    const { error: updateError } = await supabase
      .from('products')
      .update({ image: imageUrl })
      .eq('id', productId)

    if (updateError) {
      throw new Error(`Database Update Error: ${updateError.message}`)
    }

    return new Response(JSON.stringify({ success: true, imageUrl }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})