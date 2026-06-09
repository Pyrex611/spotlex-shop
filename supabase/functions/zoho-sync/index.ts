// supabase/functions/zoho-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

// Initialize Supabase Client with the SERVICE ROLE KEY (Bypasses RLS to forcefully update the database)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    const payload = await req.json()

    // 1. Verify Secret to ensure only YOUR Zoho account can hit this endpoint
    if (payload.secret !== Deno.env.get('ZOHO_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { item_id, name, rate, stock_on_hand, description, sku } = payload

    if (!item_id) {
      return new Response(JSON.stringify({ error: 'Missing item_id' }), { status: 400 })
    }

    // 2. Check if the product already exists in Supabase
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('zoho_item_id', item_id)
      .single()

    if (existingProduct) {
      // UPDATE existing product (Notice we DO NOT update the image or category here, protecting Admin UI changes)
      const { error } = await supabase
        .from('products')
        .update({
          name: name,
          price: Number(rate),
          stock_quantity: Number(stock_on_hand),
          description: description || '',
          sku: sku || ''
        })
        .eq('zoho_item_id', item_id)

      if (error) throw error
    } else {
      // INSERT new product
      const { error } = await supabase
        .from('products')
        .insert({
          zoho_item_id: item_id,
          name: name,
          price: Number(rate),
          stock_quantity: Number(stock_on_hand),
          description: description || '',
          sku: sku || '',
          image: '' // Admin will add image later via the Dashboard
        })

      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true, message: 'Sync successful' }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})