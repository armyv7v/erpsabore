const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpwrvrrvabgmibplkenv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd3J2cnJ2YWJnbWlicGxrZW52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcwNTUxMCwiZXhwIjoyMDg5MjgxNTEwfQ.QOUNcZDrtmlqd9OmPTcEj66T8kvw4dHbHzugAfnffuI';
const supabase = createClient(supabaseUrl, supabaseKey);

function getProductCategory(name) {
  const lowerName = name.toLowerCase();

  // ==================== 1. ALUMINIO Y METÁLICOS ====================
  if (lowerName.includes("aluminio") || lowerName.includes("foil")) {
    if (lowerName.includes("c20") || lowerName.includes("envase") || lowerName.includes("marmita")) {
      return "Aluminio: Envases de Aluminio";
    }
    return "Aluminio: Rollos y Hojas de Aluminio";
  }

  // ==================== 2. PAPEL Y CARTÓN ====================
  // Rollos Térmicos y Oficina
  if (lowerName.includes("rollo termico") || lowerName.includes("transbank") || lowerName.includes("resma")) {
    return "Paper: Rollos Térmicos y Oficina"; // El prompt principal de getMajorCategory retorna 'Paper' pero el nombre visual es 'Papel: ...'
  }
  // Papeles y Kraft
  if (
    (lowerName.includes("kraft") && !lowerName.includes("bolsa") && !lowerName.includes("bowl") && !lowerName.includes("cubre vaso") && !lowerName.includes("pote")) ||
    lowerName.includes("mantequilla") || 
    lowerName.includes("antigrasa") ||
    (lowerName.includes("papel") && !lowerName.includes("polipapel") && !lowerName.includes("confort") && !lowerName.includes("toalla") && !lowerName.includes("servilleta"))
  ) {
    return "Papel: Papeles, Resmas y Kraft";
  }
  // Cajas, Bandejas y Contenedores de Cartón
  if (
    lowerName.includes("caja") || 
    lowerName.includes("porta completo") || 
    lowerName.includes("completo carton") ||
    lowerName.includes("canasto") || 
    lowerName.includes("canoa") ||
    lowerName.includes("organico") ||
    (lowerName.includes("bandeja") && !lowerName.includes("plumavit") && !lowerName.includes("plastico") && !lowerName.includes("rectangular")) || 
    (lowerName.includes("bandeja rectangular n°") && !lowerName.includes("plumavit"))
  ) {
    return "Papel: Cajas y Contenedores de Cartón";
  }
  // Bolsas y Vasos de Papel (Bolsas Kraft, Vasos Polipapel, Cubrevasos, Vasos Corrugados)
  if (
    (lowerName.includes("bolsa") && (lowerName.includes("kraft") || lowerName.includes("blanca") || lowerName.includes("rinon"))) ||
    (lowerName.includes("vaso") && (lowerName.includes("polipapel") || lowerName.includes("corrugado") || lowerName.includes("kraft"))) ||
    lowerName.includes("cubre vaso")
  ) {
    return "Papel: Bolsas y Vasos de Papel";
  }
  // Higiene y Papel Tisú
  if (
    lowerName.includes("toalla") || 
    lowerName.includes("servilleta") || 
    lowerName.includes("confort") || 
    lowerName.includes("sabanilla")
  ) {
    return "Papel: Higiene y Papel Tisú";
  }
  // Utensilios de Madera y Pulpa (Incluyendo bombillas de polipapel)
  if (
    lowerName.includes("madera") || 
    lowerName.includes("chinos") || 
    lowerName.includes("revolvedor") || 
    lowerName.includes("mondadientes") ||
    lowerName.includes("porta vaso") || 
    lowerName.includes("porta vasos") ||
    (lowerName.includes("bombilla") && lowerName.includes("polipapel"))
  ) {
    return "Papel: Utensilios de Madera y Pulpa";
  }

  // ==================== 3. PLÁSTICOS ====================
  // Envases de Plumavit (Poliestireno expandido - Contenedores térmicos, bandejas de plumavit, vasos de plumavit)
  if (
    lowerName.includes("plumavit") || 
    lowerName.includes("termico") || 
    lowerName.includes("wabe") || 
    lowerName.includes("darnel")
  ) {
    return "Plástico: Envases y Bandejas de Plumavit (PS)";
  }
  // Bolsas Plásticas y Prepicados
  if (
    (lowerName.includes("bolsa") && !lowerName.includes("kraft") && !lowerName.includes("blanca") && !lowerName.includes("rinon")) ||
    lowerName.includes("fullpack") || 
    lowerName.includes("prepicado")
  ) {
    return "Plástico: Bolsas Plásticas y Prepicados";
  }
  // Vasos, Tapas y Domos Plásticos
  if (
    (lowerName.includes("vaso") && !lowerName.includes("polipapel") && !lowerName.includes("plumavit")) || 
    lowerName.includes("tapa capuchino") || 
    lowerName.includes("tapa plana") || 
    lowerName.includes("tapa plastica domo") || 
    lowerName.includes("inserto")
  ) {
    return "Plástico: Vasos, Tapas y Domos Plásticos";
  }
  // Películas y Films Plásticos
  if (lowerName.includes("film")) {
    return "Plástico: Películas y Films Plásticos";
  }
  // Utensilios y Bombillas Plásticas (Bombillas plásticas comunes)
  if (
    (lowerName.includes("bombilla") && !lowerName.includes("polipapel")) || 
    (lowerName.includes("revolvedor") && lowerName.includes("plastico")) ||
    (lowerName.includes("cubierto") && lowerName.includes("plastico")) ||
    (lowerName.includes("cuchara") && !lowerName.includes("madera")) ||
    (lowerName.includes("cuchillo") && !lowerName.includes("madera")) ||
    (lowerName.includes("tenedor") && !lowerName.includes("madera"))
  ) {
    return "Plástico: Utensilios y Bombillas Plásticas";
  }
  // Insumos de Protección e Higiene
  if (
    lowerName.includes("guante") || 
    lowerName.includes("gorro") || 
    lowerName.includes("cofia") ||
    lowerName.includes("cinta embalaje") ||
    lowerName.includes("borrador")
  ) {
    return "Plástico: Insumos de Protección e Higiene";
  }

  // Fallback para Envases y Potes de Plástico (PET/PP) (gelatineros, potes degustación, clamshells, bowls kraft con tapas plásticas, potes facetados)
  return "Plástico: Envases y Potes de Plástico (PET/PP)";
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
