/**
 * Utility to generate standard-compliant EAN-13 SVG barcode representations
 */

const L_CODE = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011'
];

const G_CODE = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111'
];

const R_CODE = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100'
];

const PARITY_TABLE: Record<string, string[]> = {
  '0': ['L', 'L', 'L', 'L', 'L', 'L'],
  '1': ['L', 'L', 'G', 'L', 'G', 'G'],
  '2': ['L', 'L', 'G', 'G', 'L', 'G'],
  '3': ['L', 'L', 'G', 'G', 'G', 'L'],
  '4': ['L', 'G', 'L', 'L', 'G', 'G'],
  '5': ['L', 'G', 'G', 'L', 'L', 'G'],
  '6': ['L', 'G', 'G', 'G', 'L', 'L'],
  '7': ['L', 'G', 'L', 'G', 'L', 'G'],
  '8': ['L', 'G', 'L', 'G', 'G', 'L'],
  '9': ['L', 'G', 'G', 'L', 'G', 'L']
};

export const PRODUCT_CATEGORIES = [
  { id: '01', name: 'Papel: Papeles, Resmas y Kraft', keywords: [] },
  { id: '02', name: 'Papel: Cajas y Contenedores de Cartón', keywords: [] },
  { id: '03', name: 'Papel: Bolsas y Vasos de Papel', keywords: [] },
  { id: '04', name: 'Papel: Higiene y Papel Tisú', keywords: [] },
  { id: '05', name: 'Papel: Rollos Térmicos y Oficina', keywords: [] },
  { id: '06', name: 'Papel: Utensilios de Madera y Pulpa', keywords: [] },
  { id: '07', name: 'Plástico: Bolsas Plásticas y Prepicados', keywords: [] },
  { id: '08', name: 'Plástico: Vasos, Tapas y Domos Plásticos', keywords: [] },
  { id: '09', name: 'Plástico: Envases y Potes de Plástico (PET/PP)', keywords: [] },
  { id: '10', name: 'Plástico: Envases y Bandejas de Plumavit (PS)', keywords: [] },
  { id: '11', name: 'Plástico: Películas y Films Plásticos', keywords: [] },
  { id: '12', name: 'Plástico: Utensilios y Bombillas Plásticas', keywords: [] },
  { id: '13', name: 'Plástico: Insumos de Protección e Higiene', keywords: [] },
  { id: '14', name: 'Aluminio: Envases de Aluminio', keywords: [] },
  { id: '15', name: 'Aluminio: Rollos y Hojas de Aluminio', keywords: [] }
];

export function getProductCategory(name: string): string {
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
    return "Papel: Rollos Térmicos y Oficina";
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

export function getMajorCategory(name: string): 'Plásticos' | 'Papel' | 'Aluminio' {
  const text = name.toLowerCase();
  
  // 1. Aluminio
  if (text.includes("aluminio") || text.includes("foil")) {
    return "Aluminio";
  }

  // 2. Papel y Cartón (Incluyendo madera y pulpa de cartón)
  const isPaper = 
    text.includes("kraft") || 
    text.includes("mantequilla") || 
    text.includes("antigrasa") || 
    text.includes("papel") || 
    text.includes("carton") || 
    text.includes("caja") || 
    text.includes("completo") || // porta completo, completo carton
    text.includes("toalla") || 
    text.includes("servilleta") || 
    text.includes("confort") || 
    text.includes("resma") || 
    text.includes("rollo termico") || 
    text.includes("transbank") || // rollo termico transbank
    text.includes("borrador") || 
    text.includes("madera") || // revolvedores, cubiertos de madera
    text.includes("chinos") || // palos chinos
    text.includes("mondadientes") ||
    text.includes("organico") || // porta comida organico (bagazo)
    text.includes("porta vaso") || // porta vasos (pulpa de carton)
    text.includes("porta vasos") ||
    text.includes("corrugado") ||
    text.includes("canasto") ||
    text.includes("canoa");

  // Las bandejas de plumavit y bolsas de plástico son Plásticos.
  if (text.includes("bandeja")) {
    if (text.includes("plumavit")) {
      return "Plásticos";
    }
    return "Papel";
  }

  if (text.includes("bolsa")) {
    if (text.includes("kraft") || text.includes("blanca")) {
      return "Papel";
    }
    return "Plásticos";
  }

  if (isPaper) {
    return "Papel";
  }

  // 3. Plásticos (por defecto, guantes, cofias, vasos plásticos, potes, films plásticos y plumavit son Plásticos)
  return "Plásticos";
}

/**
 * Generates an SVG string representation of an EAN-13 barcode
 * @param barcode 13-digit EAN-13 string
 * @returns SVG raw path data or binary array of bars
 */
export function getEan13Binary(barcode: string): string | null {
  if (!barcode || barcode.length !== 13 || !/^\d+$/.test(barcode)) {
    return null;
  }

  const firstDigit = barcode[0];
  const firstSix = barcode.slice(1, 7);
  const lastSix = barcode.slice(7, 13);

  const parities = PARITY_TABLE[firstDigit];
  if (!parities) return null;

  let binary = '';

  // Left guard: 101
  binary += '101';

  // First group of 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(firstSix[i], 10);
    const type = parities[i];
    if (type === 'L') {
      binary += L_CODE[digit];
    } else {
      binary += G_CODE[digit];
    }
  }

  // Center guard: 01010
  binary += '01010';

  // Last group of 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(lastSix[i], 10);
    binary += R_CODE[digit];
  }

  // Right guard: 101
  binary += '101';

  return binary;
}
