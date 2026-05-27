import fs from 'fs';
import path from 'path';

// Read the catalog text file
const textPath = path.join('C:', 'Users', 'EnderJavier', '.gemini', 'antigravity', 'brain', 'dd060b41-e48a-44a1-b1f9-5f95a7f840a5', 'scratch', 'catalog-text.txt');
const textContent = fs.readFileSync(textPath, 'utf8');

const lines = textContent.split('\n');
const catalogProducts: { name: string; price: number }[] = [];

// Pre-process and merge lines that are split across multiple lines
const cleanLines: string[] = [];
let accumulated = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Skip headers or dividers
  if (line.startsWith('---') || line.includes('Nombre del producto') || line.startsWith('*')) {
    continue;
  }
  
  // Skip category headers (all caps, length > 3, no price/$)
  if (line.toUpperCase() === line && line.length > 3 && !line.includes('$')) {
    continue;
  }
  
  if (line.includes('$')) {
    if (accumulated) {
      cleanLines.push(accumulated + " " + line);
      accumulated = "";
    } else {
      cleanLines.push(line);
    }
  } else {
    // Accumulate lines without price
    if (accumulated) {
      accumulated = accumulated + " " + line;
    } else {
      accumulated = line;
    }
  }
}

// Now parse each merged line
for (const line of cleanLines) {
  // Match: product name followed by price like $10,000 or $460 or $25
  const match = line.match(/^(.+?)\s*\$?([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*$/);
  if (match) {
    const name = match[1].trim();
    const priceStr = match[2].replace(/,/g, '');
    const price = parseInt(priceStr);
    catalogProducts.push({ name, price });
  } else {
    if (line.includes('$')) {
      console.log('Unmatched line containing price:', line);
    }
  }
}

console.log(`Parsed ${catalogProducts.length} products from the catalog PDF.`);
fs.writeFileSync('parsed-catalog.json', JSON.stringify(catalogProducts, null, 2));

