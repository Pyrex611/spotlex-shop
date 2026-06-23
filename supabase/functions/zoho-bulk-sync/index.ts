// supabase/functions/zoho-bulk-sync/index.ts
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

    // 1. Fetch Zoho Access Token
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

    // 2. Fetch Catalog Items List
    const itemsRes = await fetch(`https://www.zohoapis.com/inventory/v1/items?organization_id=${ZOHO_ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` }
    })
    const itemsData = await itemsRes.json()
    
    if (itemsData.code && itemsData.code !== 0) {
      throw new Error(`Zoho API Error (${itemsData.code}): ${itemsData.message}`)
    }

    if (!itemsData.items) {
      throw new Error("No items returned from Zoho")
    }

    // 3. Map to Database Schema
    const formattedProducts = itemsData.items.map((item: any) => ({
      zoho_item_id: item.item_id,
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      price: Number(item.rate || 0),
      stock_quantity: Number(item.stock_on_hand || 0),
    }))

    // 4. Upsert into database
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(formattedProducts, { onConflict: 'zoho_item_id', ignoreDuplicates: false })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ success: true, count: formattedProducts.length }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    // Return 200 so the Supabase JS Client does not swallow the JSON error body
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})