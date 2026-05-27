import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { mockProducts } from './src/data/inventory';

// Manually load env variables from .env and .env.local to be fully environment-independent
const envPath = path.resolve('.env');
const envLocalPath = path.resolve('.env.local');

const env: Record<string, string> = {};

function parseEnvFile(filePath: string) {
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
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        env[key] = val;
      }
    }
  }
}

parseEnvFile(envPath);
parseEnvFile(envLocalPath);

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase URL or Service Role Key not found in env files.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log(`Syncing prices for ${mockProducts.length} products to Supabase...`);
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const product of mockProducts) {
    const { data, error } = await supabase
      .from('products')
      .update({ unit_price: product.price, updated_at: new Date().toISOString() })
      .eq('sku', product.sku)
      .select('id, name, sku, unit_price');

    if (error) {
      console.error(`❌ Failed to update SKU: ${product.sku} (${product.name}). Error:`, error.message);
      errorCount++;
    } else if (data && data.length > 0) {
      console.log(`✅ Updated SKU ${product.sku}: ${product.name} -> $${product.price}`);
      successCount++;
    } else {
      console.log(`⚠️ SKU ${product.sku} (${product.name}) not found in database.`);
      notFoundCount++;
    }
  }

  console.log(`\nSynchronization finished.`);
  console.log(`- Successfully updated in DB: ${successCount} products`);
  console.log(`- SKUs not found in DB: ${notFoundCount}`);
  console.log(`- Errors encountered: ${errorCount}`);
}

main().catch(err => {
  console.error('Fatal error during sync:', err);
});
