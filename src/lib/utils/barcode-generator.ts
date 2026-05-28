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

export function getProductCategory(name: string): string {
  const lowerName = name.toLowerCase();
  for (const cat of PRODUCT_CATEGORIES) {
    if (cat.keywords.length === 0) continue;
    if (cat.keywords.some(keyword => lowerName.includes(keyword))) {
      return cat.name;
    }
  }
  return 'Otros';
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
