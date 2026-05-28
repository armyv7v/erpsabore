const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpwrvrrvabgmibplkenv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd3J2cnJ2YWJnbWlicGxrZW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcwNTUxMCwiZXhwIjoyMDg5MjgxNTEwfQ.QOUNcZDrtmlqd9OmPTcEj66T8kvw4dHbHzugAfnffuI';
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIES = [
  { id: '01', name: 'Papeles y Rollos Kraft', keywords: ['kraft', 'mantequilla', 'antigrasa'] },
  { id: '02', name: 'Cajas y Porta Alimentos', keywords: ['caja', 'porta completo', 'porta completo carton'] },
  { id: '03', name: 'Vasos, Tapas y Accesorios', keywords: ['vaso', 'tapa', 'cubre vaso', 'porta vaso', 'porta vasos'] },
  { id: '04', name: 'Bandejas', keywords: ['bandeja'] },
  { id: '05', name: 'Bolsas y Prepicados', keywords: ['bolsa', 'fullpack', 'prepicado'] },
  { id: '06', name: 'Higiene y Papel Tisú', keywords: ['toalla', 'servilleta', 'confort'] },
  { id: '07', name: 'Potes, Bowls y Envases Plásticos', keywords: ['bowl', 'pote', 'gelatinero', 'clamshell', 'sushi', 'plato', 'marmita', 'envase redondo', 'envase rectangular', 'envase triangular', 'envase 401', 'envase 7190', 'envase 247', 'portacomidas wabe', 'contenedor termico'] },
  { id: '08', name: 'Cubiertos, Bombillas y Utensilios', keywords: ['bombilla', 'chinos', 'revolvedor', 'mondadientes', 'cuchara', 'cuchillo', 'tenedor'] },
  { id: '09', name: 'Protección e Higiene Personal', keywords: ['guante', 'gorro', 'cofia'] },
  { id: '10', name: 'Librería, Embalaje y Oficina', keywords: ['rollo termico', 'resma', 'borrador', 'cinta embalaje'] },
  { id: '11', name: 'Aluminio y Metálicos', keywords: ['aluminio', 'foil'] },
  { id: '12', name: 'Otros', keywords: [] }
];

function getCategory(name) {
  const lowerName = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.length === 0) continue;
    if (cat.keywords.some(keyword => lowerName.includes(keyword))) {
      return cat;
    }
  }
  return CATEGORIES.find(c => c.id === '12'); // Otros
}

function calculateEan13(base12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += (i % 2 === 0) ? digit * 1 : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base12}${checkDigit}`;
}

async function main() {
  console.log('Obteniendo productos de Supabase...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, barcode')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('Error al obtener productos:', error);
    return;
  }

  console.log(`Encontrados ${products.length} productos.`);

  // Contadores por categoría para la secuencia
  const categoryCounters = {};
  CATEGORIES.forEach(c => {
    categoryCounters[c.id] = 0;
  });

  const updates = [];

  for (const product of products) {
    const cat = getCategory(product.name);
    categoryCounters[cat.id]++;
    const sequence = String(categoryCounters[cat.id]).padStart(4, '0');
    
    // Base de 12 dígitos: 780 (Chile) + 123 (ERP ID) + Categoría (2 dígitos) + Secuencia (4 dígitos)
    const base12 = `780123${cat.id}${sequence}`;
    const barcode = calculateEan13(base12);

    updates.push({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: cat.name,
      barcode: barcode
    });
  }

  console.log('\nEjemplo de códigos de barra generados:');
  console.log(JSON.stringify(updates.slice(0, 15), null, 2));

  console.log('\nActualizando productos en Supabase...');
  
  let successCount = 0;
  for (const item of updates) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ barcode: item.barcode, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (updateError) {
      console.error(`Error actualizando producto ${item.name}:`, updateError.message);
    } else {
      successCount++;
    }
  }

  console.log(`\n¡Migración de base de datos finalizada con éxito! ${successCount} de ${products.length} productos actualizados.`);
  
  // Imprimir estadísticas de categorías
  console.log('\nDistribución de productos por categoría:');
  CATEGORIES.forEach(c => {
    console.log(`- ${c.name}: ${categoryCounters[c.id]} productos`);
  });
}

main();
