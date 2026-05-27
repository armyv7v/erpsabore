import fs from 'fs';
import path from 'path';

// Read the parsed catalog
const parsedCatalog = JSON.parse(fs.readFileSync('parsed-catalog.json', 'utf8'));

// Import productSeed from inventory.ts using require/tsx or dynamic import
import { mockProducts } from './src/data/inventory';

console.log('Comparing prices and updating src/data/inventory.ts with new PDF catalog prices...');

// Normalize names for comparison
function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Manual mappings for products where names or package sizes changed
const manualMappings: Record<string, string> = {
  "Bandeja redonda de carton N7 30,8 cm 100 und": "Bandeja redonda de carton N7, 30,8 cms, 100 und",
  "Bandeja rectangular N°7 200 und 23x16 cm": "Bandeja Rectangular N° 7, 100 und, 23x16 cm",
  "Bandeja rectangular N°8 200 und 24x17 cm": "Bandeja Rectangular N° 8, 100 und, 24x17 cms",
  "Bandeja rectangular N°10 200 und": "Bandeja Rectangular N° 10, 100 und",
  "Bombilla polipapel 6 mm 100 und": "Bombilla polipapel 6mm, 400 und",
  "Foil aluminio 100 mts x 30 cm con estuche": "Foil aluminio 100 mts x 30 cms con estuche",
  "Bolsa camiseta 60x70 (100 und)": "Bolsa camiseta 60x70 x 100 und",
  "Bolsa camiseta negra 35x40 (100 und)": "Bolsa camiseta 35x40 y 35x45 ( 100 und)",
  "Bolsa botillera 40x50 (100 und)": "Bolsa botillera 40x50 x 100 und",
  "Bolsa de basura 50x70 0.5 (10 und)": "Bolsa de basura 50x70 0.3 (10 und)",
  "Bolsa de basura 70x90 0.5 (10 und)": "Bolsa de basura 70x90 0.3 ( 10 und)",
  "Bolsa de basura 80x110 0.5 (10 und)": "Bolsa de basura 80x110 0.3( 10 und)",
  "Bolsa de basura 110x130 0.7 (10 und)": "Bolsa de basura 110x130 0.6 ( 10 und)",
  "Plato ovalado con tapa microondeable 50 und": "Plato ovalado con tapa microndeable, 50 und",
  "Guantes nitrilo azul talla S/M/L": "Guantes nitrilo azul S/M/L",
  "Guante latex talla M": "Guante latex M",
  "Portacomidas wabe B-1 CT6 x und": "Portacomidas wabe B-1 CT6, und",
};

let matchedCount = 0;
let updatedCount = 0;
const priceUpdates: Array<{ name: string; oldPrice: number; newPrice: number }> = [];

// Read original inventory.ts to perform in-place replacements of price
const inventoryPath = path.join('src', 'data', 'inventory.ts');
let inventoryContent = fs.readFileSync(inventoryPath, 'utf8');

const updatedSeed = mockProducts.map((p) => {
  const normSeed = normalizeName(p.name);
  let match: { name: string; price: number } | undefined = undefined;

  // 1. Check if there's a manual mapping
  if (manualMappings[p.name]) {
    const targetName = manualMappings[p.name];
    match = parsedCatalog.find((c: any) => normalizeName(c.name) === normalizeName(targetName));
  }

  // 2. Try exact normalized match
  if (!match) {
    match = parsedCatalog.find((c: any) => normalizeName(c.name) === normSeed);
  }
  
  // 3. Try fuzzy substring match
  if (!match) {
    match = parsedCatalog.find((c: any) => {
      const normC = normalizeName(c.name);
      return normSeed.includes(normC) || normC.includes(normSeed);
    });
  }

  if (match) {
    matchedCount++;
    if (p.price !== match.price) {
      updatedCount++;
      priceUpdates.push({ name: p.name, oldPrice: p.price, newPrice: match.price });
      
      // Update price in-place in file content using Regex
      const escapedName = p.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(\{\\s*name:\\s*"${escapedName}",\\s*price:\\s*)\\d+(\\s*\})`);
      if (regex.test(inventoryContent)) {
        inventoryContent = inventoryContent.replace(regex, `$1${match.price}$2`);
      } else {
        console.log(`⚠️ Warning: Could not perform regex replace for product: "${p.name}"`);
      }
      
      return { name: p.name, price: match.price };
    }
    return { name: p.name, price: p.price };
  } else {
    // Keep original price if no match found (e.g. Servilleta tipo coctel)
    console.log(`❌ No match found for seed product: "${p.name}" (Keeping Price: ${p.price})`);
    return { name: p.name, price: p.price };
  }
});

console.log(`\nMatched: ${matchedCount} / ${mockProducts.length} products.`);
console.log(`Prices updated: ${updatedCount} products.`);
console.log('\nPrice updates:');
priceUpdates.forEach(up => {
  console.log(`- ${up.name}: $${up.oldPrice} -> $${up.newPrice}`);
});

// Save updated inventory.ts back to disk
fs.writeFileSync(inventoryPath, inventoryContent, 'utf8');
console.log(`\nSuccessfully updated ${inventoryPath} with the new prices!`);

fs.writeFileSync('new-seed.json', JSON.stringify(updatedSeed, null, 2));

