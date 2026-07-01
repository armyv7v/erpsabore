const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load environment variables
const env = {};
function parseEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        env[key] = val;
      }
    }
  }
}

parseEnvFile(path.resolve('.env'));
parseEnvFile(path.resolve('.env.local'));

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL or Service Key not found in env files.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// EAN-13 check digit calculator
function calculateEan13(base12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += (i % 2 === 0) ? digit * 1 : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base12}${checkDigit}`;
}

// category classifier (Guantes are in "Plástico: Insumos de Protección e Higiene" - ID: 13)
function getProductCategory(name) {
  return "13"; 
}

async function main() {
  const tenantId = '211edcae-b525-4d11-9413-1f659d5e846b'; // Active Tenant ID

  // Helpers to generate SKU & Barcode
  async function generateSku(name) {
    const normalized = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase()
      .slice(0, 18);

    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const nextSeq = (productCount ?? 0) + 1;
    let finalSku = `INS-${String(nextSeq).padStart(4, '0')}-${normalized}`;

    let attempts = 0;
    while (attempts < 10) {
      const { data: dupSku } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('sku', finalSku)
        .maybeSingle();

      if (!dupSku) break;
      attempts++;
      finalSku = `INS-${String(nextSeq + attempts).padStart(4, '0')}-${normalized}`;
    }
    return finalSku;
  }

  async function generateBarcode(name) {
    const catId = getProductCategory(name);
    const prefix = `780123${catId}`;

    const { data: barRecords } = await supabase
      .from('products')
      .select('barcode')
      .eq('tenant_id', tenantId)
      .like('barcode', `${prefix}%`);

    let maxSeq = 0;
    if (barRecords && barRecords.length > 0) {
      for (const rec of barRecords) {
        if (rec.barcode && rec.barcode.length === 13) {
          const seqStr = rec.barcode.slice(8, 12);
          const seq = parseInt(seqStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }

    const nextBarSeq = maxSeq + 1;
    const sequenceStr = String(nextBarSeq).padStart(4, '0');
    const base12 = `${prefix}${sequenceStr}`;
    return calculateEan13(base12);
  }

  // Define the updates
  const updates = [
    { id: '8d429760-cb46-4855-8798-dc996e198a5e', name: 'Guante nitrilo negro S x 100 und' },
    { id: '10a7f87b-76d5-4ac9-bebe-127c9712a543', name: 'Guante nitrilo azul S x 100 und' },
    { id: '156d4950-3c66-4a8e-96f6-f5469ac5cfdc', name: 'Guante látex M x 100 und' },
    { id: '8478bf8f-a4cb-4661-b007-e2f116be53f9', name: 'Guante vinilo blanco L x 100 und' }
  ];

  // Define the inserts
  const inserts = [
    { name: 'Guante nitrilo negro M x 100 und', price: 4800, imageUrl: '/catalogo_webp/page-12-img-05-0085.webp', stock: 120 },
    { name: 'Guante nitrilo negro L x 100 und', price: 4800, imageUrl: '/catalogo_webp/page-12-img-05-0085.webp', stock: 120 },
    { name: 'Guante nitrilo negro XL x 100 und', price: 4800, imageUrl: '/catalogo_webp/page-12-img-05-0085.webp', stock: 120 },
    { name: 'Guante nitrilo azul M x 100 und', price: 4700, imageUrl: '/catalogo_webp/page-12-img-06-0086.webp', stock: 120 },
    { name: 'Guante nitrilo azul L x 100 und', price: 4700, imageUrl: '/catalogo_webp/page-12-img-06-0086.webp', stock: 120 }
  ];

  // Apply updates
  for (const item of updates) {
    const sku = await generateSku(item.name);
    const barcode = await generateBarcode(item.name);
    console.log(`Updating product ${item.id} to "${item.name}"...`);
    console.log(`- SKU: ${sku}`);
    console.log(`- Barcode: ${barcode}`);
    
    const { error } = await supabase
      .from('products')
      .update({
        name: item.name,
        sku: sku,
        barcode: barcode,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (error) {
      console.error(`❌ Failed to update ${item.id}:`, error.message);
    } else {
      console.log(`✅ Successfully updated ${item.name}`);
    }
  }

  // Apply inserts
  for (const item of inserts) {
    const sku = await generateSku(item.name);
    const barcode = await generateBarcode(item.name);
    console.log(`Inserting product "${item.name}"...`);
    console.log(`- SKU: ${sku}`);
    console.log(`- Barcode: ${barcode}`);

    const { data: inserted, error } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        name: item.name,
        sku: sku,
        barcode: barcode,
        unit_price: item.price,
        stock_quantity: item.stock,
        stock_min_quantity: 10,
        image_url: item.imageUrl
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to insert "${item.name}":`, error.message);
    } else {
      console.log(`✅ Successfully inserted "${item.name}" (ID: ${inserted.id})`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error during split seeder:', err);
});
