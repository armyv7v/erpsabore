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

// category classifier
function getProductCategory(name) {
  const lowerName = name.toLowerCase();
  if (
    lowerName.includes("cuchara") ||
    lowerName.includes("cuchillo") ||
    lowerName.includes("tenedor")
  ) {
    return "12"; // Plástico: Utensilios y Bombillas Plásticas
  }
  return "12";
}

async function main() {
  console.log('Fetching tenant_id from existing products...');
  const { data: existingProds, error: fetchErr } = await supabase
    .from('products')
    .select('tenant_id')
    .limit(1);

  if (fetchErr || !existingProds || existingProds.length === 0) {
    console.error('❌ Failed to get a valid tenant_id. Make sure products table has data or tenant exists.', fetchErr);
    process.exit(1);
  }

  const tenantId = existingProds[0].tenant_id;
  console.log(`Using tenant_id: ${tenantId}`);

  const productsToAdd = [
    { name: 'Cucharas 100 und', price: 1200, imageUrl: '/catalogo_webp/cucharas.webp' },
    { name: 'Tenedores 100 und', price: 1200, imageUrl: '/catalogo_webp/tenedores.webp' },
    { name: 'Cuchillos 100 und', price: 1200, imageUrl: '/catalogo_webp/cuchillos.webp' },
  ];

  for (const item of productsToAdd) {
    // 1. Check if product already exists
    const { data: alreadyExists } = await supabase
      .from('products')
      .select('id, sku, barcode')
      .eq('tenant_id', tenantId)
      .eq('name', item.name)
      .is('deleted_at', null)
      .maybeSingle();

    if (alreadyExists) {
      console.log(`⚠️ Product "${item.name}" already exists in database (SKU: ${alreadyExists.sku}, Barcode: ${alreadyExists.barcode}). Skipping.`);
      continue;
    }

    // 2. Generate unique SKU
    const normalized = item.name
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

    // Verify uniqueness
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

    // 3. Generate unique Barcode
    const catId = getProductCategory(item.name);
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
    const finalBarcode = calculateEan13(base12);

    // 4. Insert product
    console.log(`Inserting product "${item.name}"...`);
    console.log(`- SKU: ${finalSku}`);
    console.log(`- Barcode: ${finalBarcode}`);

    const { data: inserted, error: insertErr } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        name: item.name,
        sku: finalSku,
        barcode: finalBarcode,
        unit_price: item.price,
        stock_quantity: 120, // default stock level from mock
        stock_min_quantity: 10,
        image_url: item.imageUrl
      })
      .select()
      .single();

    if (insertErr) {
      console.error(`❌ Failed to insert "${item.name}":`, insertErr.message);
    } else {
      console.log(`✅ Successfully inserted "${item.name}" (ID: ${inserted.id})`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error during seed:', err);
});
