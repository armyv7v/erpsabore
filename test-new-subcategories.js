const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpwrvrrvabgmibplkenv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd3J2cnJ2YWJnbWlicGxrZW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcwNTUxMCwiZXhwIjoyMDg5MjgxNTEwfQ.QOUNcZDrtmlqd9OmPTcEj66T8kvw4dHbHzugAfnffuI';
const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_CATEGORIES = [
  { id: '01', name: 'Papeles y Rollos Kraft', keywords: ['kraft', 'mantequilla', 'antigrasa'] },
  { id: '02', name: 'Cajas y Porta Alimentos', keywords: ['caja', 'porta completo', 'porta completo carton'] },
  { id: '03', name: 'Vasos, Tapas y Accesorios', keywords: ['vaso', 'tapa', 'cubre vaso', 'porta vaso', 'porta vasos'] },
  { id: '04', name: 'Bandejas', keywords: ['bandeja'] },
  { id: '05', name: 'Bolsas y Prepicados', keywords: ['bolsa', 'fullpack', 'prepicado'] },
  { id: '06', name: 'Higiene y Papel Tisú', keywords: ['toalla', 'servilleta', 'confort'] },
  { id: '07', name: 'Envases de Plástico', keywords: ['bowl', 'pote', 'gelatinero', 'clamshell', 'sushi', 'plato', 'marmita', 'envase redondo', 'envase rectangular', 'envase triangular', 'envase 401', 'envase 7190', 'envase 247', 'portacomidas wabe', 'envase plastico', 'inserto vaso', 'vaso plastico', 'tapa plana', 'tapa plastica domo', 'tapa capuchino'] },
  { id: '08', name: 'Cubiertos, Bombillas y Utensilios', keywords: ['bombilla', 'chinos', 'revolvedor', 'mondadientes', 'cuchara', 'cuchillo', 'tenedor'] },
  { id: '09', name: 'Protección e Higiene Personal', keywords: ['guante', 'gorro', 'cofia'] },
  { id: '10', name: 'Librería, Embalaje y Oficina', keywords: ['rollo termico', 'resma', 'borrador', 'cinta embalaje'] },
  { id: '11', name: 'Aluminio y Metálicos', keywords: ['aluminio', 'foil'] },
  { id: '12', name: 'Otros', keywords: [] }
];

function getProductCategory(name) {
  const lowerName = name.toLowerCase();
  
  // 1. Rollos térmicos y Transbank
  if (lowerName.includes("rollo termico") || lowerName.includes("transbank")) {
    return 'Librería, Embalaje y Oficina';
  }

  // 2. Envases de Plumavit (vasos, tapas, bandejas de plumavit y todos los contenedores térmicos)
  if (lowerName.includes("plumavit") || lowerName.includes("termico")) {
    return 'Envases de Plumavit';
  }

  for (const cat of PRODUCT_CATEGORIES) {
    if (cat.keywords.length === 0) continue;
    if (cat.keywords.some(keyword => lowerName.includes(keyword))) {
      return cat.name;
    }
  }
  return 'Otros';
}

async function main() {
  const { data, error } = await supabase
    .from('products')
    .select('sku, name')
    .order('name');
  
  if (error) {
    console.error(error);
    return;
  }

  console.log(`Productos cargados: ${data.length}`);
  
  const groups = {};
  data.forEach(p => {
    const cat = getProductCategory(p.name);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  Object.keys(groups).sort().forEach(cat => {
    console.log(`\n=== SUBCATEGORÍA: ${cat} (Total: ${groups[cat].length}) ===`);
    groups[cat].forEach(p => {
      console.log(`  [${p.sku}] - ${p.name}`);
    });
  });
}

main();
