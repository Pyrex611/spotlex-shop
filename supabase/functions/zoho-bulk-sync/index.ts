import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Auth with Zoho
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
    if (!tokenData.access_token) throw new Error("Failed to authenticate with Zoho")

    // Fetch Items from Zoho
    const ORG_ID = Deno.env.get('ZOHO_ORG_ID')!
    const itemsRes = await fetch(`https://www.zohoapis.com/inventory/v1/items?organization_id=${ORG_ID}`, {
      headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` }
    })
    const itemsData = await itemsRes.json()
    if (!itemsData.items) throw new Error("Failed to fetch items from Zoho")

    // Format for Supabase Bulk Upsert
    const formattedProducts = itemsData.items.map((item: any) => ({
      zoho_item_id: item.item_id,
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      price: Number(item.rate || 0),
      stock_quantity: Number(item.stock_on_hand || 0),
    }))

    // Upsert into Supabase (matches on zoho_item_id)
    const { error: upsertError } = await supabase
      .from('products')
      .upsert(formattedProducts, { onConflict: 'zoho_item_id', ignoreDuplicates: false })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ success: true, count: formattedProducts.length }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})