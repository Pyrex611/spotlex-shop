// supabase/functions/zoho-image-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId, zohoItemId } = await req.json()

    if (!productId || !zohoItemId) {
      return new Response(JSON.stringify({ error: 'Missing IDs' }), { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get Fresh Zoho Token
    const tokenRes = await fetch(`https://accounts.zoho.com/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: Deno.env.get('ZOHO_REFRESH_TOKEN')!,
        client_id: Deno.env.get('ZOHO_CLIENT_ID')!,
        client_secret: Deno.env.get('ZOHO_CLIENT_SECRET')!,
        grant_type: 'refresh_token',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error("Failed to auth with Zoho")

    // 2. Fetch Item from Zoho to check for image
    const ORG_ID = Deno.env.get('ZOHO_ORG_ID')!
    const itemRes = await fetch(`https://www.zohoapis.com/inventory/v1/items/${zohoItemId}?organization_id=${ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` }
    })
    const itemData = await itemRes.json()

    if (!itemData.item || !itemData.item.image_name) {
      return new Response(JSON.stringify({ success: false, reason: 'No image found in Zoho' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Download Binary Image File
    const imageRes = await fetch(`https://www.zohoapis.com/inventory/v1/items/${zohoItemId}/image?organization_id=${ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` }
    })

    if (!imageRes.ok) throw new Error('Failed to download image from Zoho')

    const imageBuffer = await imageRes.arrayBuffer()
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg'
    const fileExt = contentType.split('/')[1] || 'jpg'
    const fileName = `${zohoItemId}-${Date.now()}.${fileExt}`

    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, { contentType, upsert: true })

    if (uploadError) throw uploadError

    // 5. Save Public URL to Database
    const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName)
    await supabase.from('products').update({ image: publicUrlData.publicUrl }).eq('id', productId)

    return new Response(JSON.stringify({ success: true, imageUrl: publicUrlData.publicUrl }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})