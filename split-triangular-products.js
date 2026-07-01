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
  // Envase triangular will classify as Envases y Potes de Plástico (PET/PP) (ID: 09) or Plumavit (10) or Cajas (02)
  // Let's check barcode-generator.ts:
  // "bandeja" and "plumavit" -> Plumavit
  // "caja" -> Cajas y Contenedores de Carton
  // "Envase triangular" -> "Plástico: Envases y Potes de Plástico (PET/PP)" (ID: 09)
  return "09"; 
}

async function main() {
  const targetName = "Envase triangular 11x5 y 11x7 Darnel";
  console.log(`Searching for unified product: "${targetName}"...`);
  
  const { data: originalProduct, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .eq('name', targetName)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchErr) {
    console.error('❌ Error fetching product:', fetchErr.message);
    process.exit(1);
  }

  if (!originalProduct) {
    console.log(`⚠️ Unified product "${targetName}" not found. It might have been already split.`);
    
    // Check if the split ones already exist
    const { data: check1 } = await supabase.from('products').select('id, sku').eq('name', 'Envase triangular 11x5 Darnel').is('deleted_at', null).maybeSingle();
    const { data: check2 } = await supabase.from('products').select('id, sku').eq('name', 'Envase triangular 11x7 Darnel').is('deleted_at', null).maybeSingle();
    
    if (check1 && check2) {
      console.log(`✅ Both split products "Envase triangular 11x5 Darnel" and "Envase triangular 11x7 Darnel" already exist.`);
      process.exit(0);
    } else {
      console.error('❌ Could not find the unified product and split products are missing.');
      process.exit(1);
    }
  }

  const tenantId = originalProduct.tenant_id;
  console.log(`Found product with ID: ${originalProduct.id}, Tenant ID: ${tenantId}`);

  // Helper to generate SKU
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

  // Helper to generate Barcode
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

  // 1. Update the original product to "Envase triangular 11x5 Darnel"
  const name1 = "Envase triangular 11x5 Darnel";
  const sku1 = await generateSku(name1);
  const barcode1 = await generateBarcode(name1);

  console.log(`Updating original product to: "${name1}"...`);
  console.log(`- New SKU: ${sku1}`);
  console.log(`- New Barcode: ${barcode1}`);

  const { error: updateErr } = await supabase
    .from('products')
    .update({
      name: name1,
      sku: sku1,
      barcode: barcode1,
      updated_at: new Date().toISOString()
    })
    .eq('id', originalProduct.id);

  if (updateErr) {
    console.error('❌ Failed to update original product:', updateErr.message);
    process.exit(1);
  }
  console.log(`✅ Successfully updated original product.`);

  // 2. Insert the second product "Envase triangular 11x7 Darnel"
  const name2 = "Envase triangular 11x7 Darnel";
  const sku2 = await generateSku(name2);
  const barcode2 = await generateBarcode(name2);

  console.log(`Inserting second product: "${name2}"...`);
  console.log(`- SKU: ${sku2}`);
  console.log(`- Barcode: ${barcode2}`);

  const { data: inserted2, error: insertErr } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      name: name2,
      sku: sku2,
      barcode: barcode2,
      unit_price: originalProduct.unit_price,
      stock_quantity: originalProduct.stock_quantity,
      stock_min_quantity: originalProduct.stock_min_quantity,
      image_url: originalProduct.image_url
    })
    .select()
    .single();

  if (insertErr) {
    console.error('❌ Failed to insert second product:', insertErr.message);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted "${name2}" (ID: ${inserted2.id})`);
}

main().catch(err => {
  console.error('Fatal error during split seeder:', err);
});
