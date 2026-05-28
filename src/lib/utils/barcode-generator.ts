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
  { id: '01', name: 'Papeles y Rollos Kraft', keywords: [] },
  { id: '02', name: 'Cajas y Porta Alimentos', keywords: [] },
  { id: '03', name: 'Vasos, Tapas y Accesorios', keywords: [] },
  { id: '04', name: 'Envases de Plumavit', keywords: [] },
  { id: '05', name: 'Bandejas', keywords: [] },
  { id: '06', name: 'Bolsas y Prepicados', keywords: [] },
  { id: '07', name: 'Higiene y Papel Tisú', keywords: [] },
  { id: '08', name: 'Envases de Plástico', keywords: [] },
  { id: '09', name: 'Cubiertos, Bombillas y Utensilios', keywords: [] },
  { id: '10', name: 'Aluminio y Metálicos', keywords: [] }
];

export function getProductCategory(name: string): string {
  const lowerName = name.toLowerCase();

  // 1. Aluminio y Metálicos (Prioridad máxima para evitar que tapas o bandejas de aluminio caigan en otras categorías)
  if (lowerName.includes("aluminio") || lowerName.includes("foil")) {
    return 'Aluminio y Metálicos';
  }

  // 2. Envases de Plumavit (Prioridad muy alta. Excluimos rollos térmicos y transbank que tienen la palabra 'termico')
  if (
    lowerName.includes("plumavit") || 
    (lowerName.includes("termico") && !lowerName.includes("rollo termico") && !lowerName.includes("transbank")) || 
    lowerName.includes("wabe") || 
    lowerName.includes("darnel")
  ) {
    return 'Envases de Plumavit';
  }

  // 3. Papeles y Rollos Kraft (Excluimos polipapel para que las bombillas/vasos polipapel fluyan a sus respectivas categorías)
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

  // 4. Cajas y Porta Alimentos (Para porta completo de cartón, canastas, canoas y orgánicos)
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

  // 6. Cubiertos, Bombillas y Utensilios (Bombilla polipapel entrará aquí tras saltarse la regla 3)
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

  // 7. Vasos, Tapas y Accesorios (Vaso polipapel entrará aquí tras saltarse la regla 3)
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

  // 9. Bandejas (Cualquier bandeja que no sea de plumavit, la cual ya cayó en la regla 2)
  if (lowerName.includes("bandeja")) {
    return 'Bandejas';
  }

  // 10. Envases de Plástico (Fallback natural para potes, bowls, clamshells, sushis, films plásticos, guantes, cofias, cintas, etc.)
  return 'Envases de Plástico';
}

export function getMajorCategory(name: string): 'Plásticos' | 'Papel' | 'Aluminio' {
  const text = name.toLowerCase();
  
  // 1. Aluminio
  if (text.includes("aluminio") || text.includes("foil")) {
    return "Aluminio";
  }

  // 2. Papel y Cartón (Incluyendo rollos térmicos, resmas, canastos, canoas y portacomidas orgánicos)
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
