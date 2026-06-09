// scripts/sync-zoho.js
import fs from 'fs';
import csv from 'csv-parser';

const results = [];

// Helper function to safely escape text containing commas or quotes for CSV
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`; // Double quotes to escape quotes
  }
  return str;
};

console.log("⚡ Reading raw-zoho.csv offline...");

fs.createReadStream('raw-zoho.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Detect Zoho headers vs renamed headers
    const itemId = row['Item ID'] || row['zoho_item_id'];
    const name = row['Item Name'] || row['name'];
    const sku = row['SKU'] || row['sku'] || '';
    const description = row['Description'] || row['description'] || '';

    // Skip empty trailing rows
    if (!itemId || !name) return;

    if (itemId.includes('E+') || itemId.includes('e+')) {
      console.error(`\n🚨 ERROR: Excel corruption detected on "${name}". Export a fresh CSV from Zoho without opening it in Excel.`);
      process.exit(1);
    }

    // Clean prices and stock values to pure numbers
    const rawRate = row['Rate'] || row['price'] || "0";
    const cleanPrice = Number(rawRate.replace(/[^0-9.-]+/g, ""));
    
    const rawStock = row['Stock On Hand'] || row['stock_quantity'] || "0";
    const cleanStock = Number(rawStock.replace(/[^0-9.-]+/g, ""));

    results.push({
      zoho_item_id: itemId,
      name: name,
      sku: sku,
      description: description,
      price: cleanPrice,
      stock_quantity: cleanStock,
    });
  })
  .on('end', () => {
    // These headers EXACTLY match our Supabase table schema
    const headers = ['zoho_item_id', 'name', 'sku', 'description', 'price', 'stock_quantity'];
    const csvRows = [headers.join(',')]; // Start with headers

    for (const row of results) {
      const values = headers.map(h => escapeCsv(row[h]));
      csvRows.push(values.join(','));
    }

    fs.writeFileSync('supabase-ready.csv', csvRows.join('\n'));
    
    console.log(`\n✅ Successfully cleaned & formatted ${results.length} products!`);
    console.log(`📁 Saved new file as: supabase-ready.csv\n`);
    console.log(`🚀 NEXT STEPS FOR DIRECT UPLOAD:`);
    console.log(`1. Go to your Supabase Dashboard.`);
    console.log(`2. Click on 'Table Editor' (left sidebar) -> click 'products'.`);
    console.log(`3. Click 'Insert' (top right) -> 'Import data from CSV'.`);
    console.log(`4. Upload the newly created 'supabase-ready.csv' file.`);
  });