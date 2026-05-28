const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpwrvrrvabgmibplkenv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd3J2cnJ2YWJnbWlicGxrZW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcwNTUxMCwiZXhwIjoyMDg5MjgxNTEwfQ.QOUNcZDrtmlqd9OmPTcEj66T8kvw4dHbHzugAfnffuI';
const supabase = createClient(supabaseUrl, supabaseKey);

function getProductCategory(name) {
  const lowerName = name.toLowerCase();

  // 1. Aluminio y Metálicos
  if (lowerName.includes("aluminio") || lowerName.includes("foil")) {
    return 'Aluminio y Metálicos';
  }

  // 2. Envases de Plumavit
  if (
    lowerName.includes("plumavit") || 
    (lowerName.includes("termico") && !lowerName.includes("rollo termico") && !lowerName.includes("transbank")) || 
    lowerName.includes("wabe") || 
    lowerName.includes("darnel")
  ) {
    return 'Envases de Plumavit';
  }

  // 3. Papeles y Rollos Kraft
  if (
    lowerName.includes("kraft") || 
    lowerName.includes("mantequilla") || 
    lowerName.includes("antigrasa") || 
    lowerName.includes("rollo termico") || 
    lowerName.includes("transbank") || 
    lowerName.includes("resma") ||
    (lowerName.includes("papel") && !lowerName.includes("polipapel") && !lowerName.includes("confort") && !lowerName.includes("toalla") && !lowerName.includes("servilleta"))
  ) {
    return 'Papeles y Rollos Kraft';
  }

  // 4. Cajas y Porta Alimentos
  if (
    lowerName.includes("caja") || 
    lowerName.includes("porta completo") || 
    lowerName.includes("completo carton") ||
    lowerName.includes("canasto") || 
    lowerName.includes("canoa") ||
    lowerName.includes("organico")
  ) {
    return 'Cajas y Porta Alimentos';
  }

  // 5. Higiene y Papel Tisú
  if (
    lowerName.includes("toalla") || 
    lowerName.includes("servilleta") || 
    lowerName.includes("confort") || 
    lowerName.includes("sabanilla")
  ) {
    return 'Higiene y Papel Tisú';
  }

  // 6. Cubiertos, Bombillas y Utensilios
  if (
    lowerName.includes("bombilla") || 
    lowerName.includes("chinos") || 
    lowerName.includes("revolvedor") || 
    lowerName.includes("mondadientes") || 
    lowerName.includes("cuchara") || 
    lowerName.includes("cuchillo") || 
    lowerName.includes("tenedor") ||
    lowerName.includes("cubierto")
  ) {
    return 'Cubiertos, Bombillas y Utensilios';
  }

  // 7. Vasos, Tapas y Accesorios
  if (
    lowerName.includes("vaso") || 
    lowerName.includes("tapa capuchino") || 
    lowerName.includes("tapa plana") || 
    lowerName.includes("tapa plastica domo") || 
    lowerName.includes("inserto") ||
    lowerName.includes("cubre vaso") ||
    lowerName.includes("porta vaso")
  ) {
    return 'Vasos, Tapas y Accesorios';
  }

  // 8. Bolsas y Prepicados
  if (
    lowerName.includes("bolsa") || 
    lowerName.includes("fullpack") || 
    lowerName.includes("prepicado")
  ) {
    return 'Bolsas y Prepicados';
  }

  // 9. Bandejas
  if (lowerName.includes("bandeja")) {
    return 'Bandejas';
  }

  // 10. Envases de Plástico
  return 'Envases de Plástico';
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
