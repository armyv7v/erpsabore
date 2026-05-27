export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockLevel: number;
  quantity: number;
  imageUrl: string;
  status: "normal" | "low" | "out_of_stock";
}

interface ProductSeed {
  name: string;
  price: number;
}

const CATALOG_PAGES: Array<{ products: number; images: string[] }> = [
  {
    products: 12,
    images: [
      "/catalogo_webp/page-01-img-01-0001.webp",
      "/catalogo_webp/page-01-img-02-0002.webp",
      "/catalogo_webp/page-01-img-03-0003.webp",
      "/catalogo_webp/page-01-img-04-0004.webp",
      "/catalogo_webp/page-01-img-05-0005.webp",
      "/catalogo_webp/page-01-img-06-0006.webp",
      "/catalogo_webp/page-01-img-07-0007.webp",
      "/catalogo_webp/page-01-img-08-0008.webp",
    ],
  },
  {
    products: 11,
    images: [
      "/catalogo_webp/page-02-img-01-0009.webp",
      "/catalogo_webp/page-02-img-02-0010.webp",
      "/catalogo_webp/page-02-img-03-0011.webp",
      "/catalogo_webp/page-02-img-04-0012.webp",
      "/catalogo_webp/page-02-img-05-0013.webp",
      "/catalogo_webp/page-02-img-06-0014.webp",
      "/catalogo_webp/page-02-img-07-0015.webp",
      "/catalogo_webp/page-02-img-08-0016.webp",
      "/catalogo_webp/page-02-img-09-0017.webp",
    ],
  },
  {
    products: 22,
    images: [
      "/catalogo_webp/page-03-img-01-0018.webp",
      "/catalogo_webp/page-03-img-02-0019.webp",
      "/catalogo_webp/page-03-img-03-0020.webp",
    ],
  },
  {
    products: 18,
    images: [
      "/catalogo_webp/page-04-img-01-0021.webp",
      "/catalogo_webp/page-04-img-02-0022.webp",
      "/catalogo_webp/page-04-img-03-0023.webp",
      "/catalogo_webp/page-04-img-04-0024.webp",
      "/catalogo_webp/page-04-img-05-0025.webp",
      "/catalogo_webp/page-04-img-06-0026.webp",
      "/catalogo_webp/page-04-img-07-0027.webp",
      "/catalogo_webp/page-04-img-08-0028.webp",
    ],
  },
  {
    products: 12,
    images: [
      "/catalogo_webp/page-05-img-01-0029.webp",
      "/catalogo_webp/page-05-img-02-0030.webp",
      "/catalogo_webp/page-05-img-03-0031.webp",
      "/catalogo_webp/page-05-img-04-0032.webp",
      "/catalogo_webp/page-05-img-05-0033.webp",
      "/catalogo_webp/page-05-img-06-0034.webp",
      "/catalogo_webp/page-05-img-07-0035.webp",
      "/catalogo_webp/page-05-img-08-0036.webp",
      "/catalogo_webp/page-05-img-09-0037.webp",
      "/catalogo_webp/page-05-img-10-0038.webp",
    ],
  },
  {
    products: 15,
    images: [
      "/catalogo_webp/page-06-img-01-0039.webp",
      "/catalogo_webp/page-06-img-02-0040.webp",
      "/catalogo_webp/page-06-img-03-0041.webp",
      "/catalogo_webp/page-06-img-04-0042.webp",
      "/catalogo_webp/page-06-img-05-0043.webp",
      "/catalogo_webp/page-06-img-06-0044.webp",
    ],
  },
  {
    products: 14,
    images: [
      "/catalogo_webp/page-07-img-01-0045.webp",
      "/catalogo_webp/page-07-img-02-0046.webp",
      "/catalogo_webp/page-07-img-03-0047.webp",
      "/catalogo_webp/page-07-img-04-0048.webp",
      "/catalogo_webp/page-07-img-05-0049.webp",
      "/catalogo_webp/page-07-img-06-0050.webp",
    ],
  },
  {
    products: 18,
    images: [
      "/catalogo_webp/page-08-img-01-0051.webp",
      "/catalogo_webp/page-08-img-02-0052.webp",
      "/catalogo_webp/page-08-img-03-0053.webp",
      "/catalogo_webp/page-08-img-04-0054.webp",
      "/catalogo_webp/page-08-img-05-0055.webp",
      "/catalogo_webp/page-08-img-06-0056.webp",
      "/catalogo_webp/page-08-img-07-0057.webp",
    ],
  },
  {
    products: 13,
    images: [
      "/catalogo_webp/page-09-img-01-0058.webp",
      "/catalogo_webp/page-09-img-02-0059.webp",
      "/catalogo_webp/page-09-img-03-0060.webp",
      "/catalogo_webp/page-09-img-04-0061.webp",
      "/catalogo_webp/page-09-img-05-0062.webp",
      "/catalogo_webp/page-09-img-06-0063.webp",
      "/catalogo_webp/page-09-img-07-0064.webp",
      "/catalogo_webp/page-09-img-08-0065.webp",
    ],
  },
  {
    products: 11,
    images: [
      "/catalogo_webp/page-10-img-01-0066.webp",
      "/catalogo_webp/page-10-img-02-0067.webp",
      "/catalogo_webp/page-10-img-03-0068.webp",
      "/catalogo_webp/page-10-img-04-0069.webp",
      "/catalogo_webp/page-10-img-05-0070.webp",
      "/catalogo_webp/page-10-img-06-0071.webp",
      "/catalogo_webp/page-10-img-07-0072.webp",
    ],
  },
  {
    products: 10,
    images: [
      "/catalogo_webp/page-11-img-01-0073.webp",
      "/catalogo_webp/page-11-img-02-0074.webp",
      "/catalogo_webp/page-11-img-03-0075.webp",
      "/catalogo_webp/page-11-img-04-0076.webp",
      "/catalogo_webp/page-11-img-05-0077.webp",
      "/catalogo_webp/page-11-img-06-0078.webp",
      "/catalogo_webp/page-11-img-07-0079.webp",
      "/catalogo_webp/page-11-img-08-0080.webp",
    ],
  },
  {
    products: 10,
    images: [
      "/catalogo_webp/page-12-img-01-0081.webp",
      "/catalogo_webp/page-12-img-02-0082.webp",
      "/catalogo_webp/page-12-img-03-0083.webp",
      "/catalogo_webp/page-12-img-04-0084.webp",
      "/catalogo_webp/page-12-img-05-0085.webp",
      "/catalogo_webp/page-12-img-06-0086.webp",
      "/catalogo_webp/page-12-img-07-0087.webp",
      "/catalogo_webp/page-12-img-08-0088.webp",
    ],
  },
  {
    products: 12,
    images: [
      "/catalogo_webp/page-13-img-01-0089.webp",
      "/catalogo_webp/page-13-img-02-0090.webp",
      "/catalogo_webp/page-13-img-03-0091.webp",
      "/catalogo_webp/page-13-img-04-0092.webp",
      "/catalogo_webp/page-13-img-05-0093.webp",
      "/catalogo_webp/page-13-img-06-0094.webp",
      "/catalogo_webp/page-13-img-07-0095.webp",
    ],
  },
  {
    products: 10,
    images: [
      "/catalogo_webp/page-14-img-01-0096.webp",
      "/catalogo_webp/page-14-img-02-0097.webp",
      "/catalogo_webp/page-14-img-03-0098.webp",
      "/catalogo_webp/page-14-img-04-0099.webp",
      "/catalogo_webp/page-14-img-05-0100.webp",
    ],
  },
];

const productSeed: ProductSeed[] = [
  { name: "Rollo Kraft 20 cms", price: 5000 },
  { name: "Rollo Kraft 40 cms", price: 9900 },
  { name: "Rollo Kraft 57 cms", price: 13600 },
  { name: "Papel antigrasa 28x34 cm x 100 und", price: 31000 },
  { name: "Porta completo B1 x 100 und", price: 5100 },
  { name: "Porta completo carton B2 x 100 und", price: 5600 },
  { name: "Caja para pollo de carton 100 und", price: 20700 },
  { name: "Caja papa carton #3 100 und", price: 12500 },
  { name: "Caja torta mediana 35x35x10,5 50 und", price: 580 },
  { name: "Caja torta grande 39x39x14 50 und", price: 700 },
  { name: "Papel mantequilla resma 100x80 x 500 und", price: 64000 },
  { name: "Papel Kraft resma 80x100 400 und", price: 31000 },
  { name: "Vaso polipapel blanco 6 oz x 50 und", price: 37 },
  { name: "Vaso polipapel blanco 8 oz x 50 und", price: 49 },
  { name: "Vaso polipapel blanco 12 oz x 50 und", price: 68 },
  { name: "Vaso corrugado negro 8 oz (240 cc) 25 und", price: 2200 },
  { name: "Cubre vaso 8/10 oz Kraft", price: 34 },
  { name: "Porta vasos 4 cavidades x 75 und", price: 155 },
  { name: "Toalla interfoliada x 200 und", price: 1900 },
  { name: "Servilleta x 300 und", price: 1200 },
  { name: "Servilleta lunch x 500 und", price: 1600 },
  { name: "Servilleta tipo coctel interfoliada x 200 und", price: 1000 },
  { name: "Bandeja redonda de carton N7 30,8 cm 100 und", price: 262 },
  { name: "Bandeja rectangular N°2 200 und 16x9 cm", price: 22 },
  { name: "Bandeja rectangular N°3 200 und 17x10 cm", price: 31 },
  { name: "Bandeja rectangular N°4 200 und 19x11 cm", price: 38 },
  { name: "Bandeja rectangular N°5 200 und 19x13 cm", price: 51 },
  { name: "Bandeja rectangular N°6 200 und 21x15 cm", price: 55 },
  { name: "Bandeja rectangular N°7 200 und 23x16 cm", price: 70 },
  { name: "Bandeja rectangular N°8 200 und 24x17 cm", price: 89 },
  { name: "Bandeja rectangular N°10 200 und", price: 120 },
  { name: "Bandeja rectangular N°12 100 und 32x24 cm", price: 230 },
  { name: "Bandeja rectangular N°14 100 und", price: 446 },
  { name: "Bolsa Kraft blanca 0,125 kl (1.000 und)", price: 9200 },
  { name: "Bolsa Kraft blanca 0,25 kl (1.000 und)", price: 10600 },
  { name: "Bolsa Kraft blanca 0,5 kl (1.000 und)", price: 12200 },
  { name: "Bolsa Kraft 0,75 kl (1.000 und)", price: 10000 },
  { name: "Bolsa Kraft 1 kl (1.000 und)", price: 11700 },
  { name: "Bolsa Kraft 2 kl (1.000 und)", price: 18200 },
  { name: "Bolsa Kraft 3 kl (1.000 und)", price: 20000 },
  { name: "Bolsa Kraft 4 kl (500 und)", price: 15500 },
  { name: "Bolsa Kraft 5 kl (500 und)", price: 15800 },
  { name: "Bolsa Kraft 6 kl (500 und)", price: 17000 },
  { name: "Bolsa Kraft 7 kl (500 und)", price: 29000 },
  { name: "Bolsa Kraft 8 kl (500 und)", price: 32800 },
  { name: "Toalla prepicada o continua 2 x 180 mts", price: 5600 },
  { name: "Toalla continua 2 x 250 mts", price: 7500 },
  { name: "Confort industrial 6 x 180 mts", price: 7200 },
  { name: "Caja de pizza chica 25x25 50 und", price: 230 },
  { name: "Caja de pizza mediana 33x33 50 und", price: 390 },
  { name: "Caja de pizza grande 38x38 50 und", price: 450 },
  { name: "Bolsa Kraft rinon chica 28x15x28", price: 120 },
  { name: "Bolsa Kraft rinon mediana 28x15x36", price: 130 },
  { name: "Bolsa Kraft rinon grande 28x15x41", price: 140 },
  { name: "Bolsa Kraft rinon extra grande 32x32x18", price: 150 },
  { name: "Bombilla polipapel 8 mm 200 und", price: 6400 },
  { name: "Bombilla polipapel 6 mm 100 und", price: 1900 },
  { name: "Bowl Kraft 500 cc con tapa 50 und", price: 145 },
  { name: "Bowl Kraft 750 cc con tapa 25 und", price: 155 },
  { name: "Bowl Kraft 1.000 cc con tapa 50 und", price: 165 },
  { name: "Bowl Kraft 1.300 cc con tapa 50 und", price: 210 },
  { name: "Porta comida organico 950 ml con division 50 und", price: 98 },
  { name: "Palos chinos 100 und", price: 2500 },
  { name: "Revolvedor madera grande 170 mm 1.000 und", price: 4600 },
  { name: "Mondadientes 25 paq de 100 und", price: 5000 },
  { name: "Cuchara, cuchillo o tenedor madera 160 mm 100 und", price: 1800 },
  { name: "Canoa chica carton 100 und", price: 26 },
  { name: "Canoa grande carton 100 und", price: 34 },
  { name: "Canasto 00 de carton 100 und", price: 31 },
  { name: "Canasto de carton 01", price: 44 },
  { name: "Canasto 1 de carton 200 und", price: 65 },
  { name: "Rollo termico Transbank 10 und", price: 360 },
  { name: "Rollo termico 80x80", price: 1800 },
  { name: "Resma carta", price: 5000 },
  { name: "Borrador garzon", price: 320 },
  { name: "Envase de aluminio C20 x 20 und", price: 150 },
  { name: "Envase aluminio C20 tapa plastica x 100 und", price: 185 },
  { name: "Envase de aluminio C25/2 x 20 und", price: 200 },
  { name: "Envase de aluminio C10 x 20 und", price: 80 },
  { name: "Foil aluminio 100 mts x 30 cm con estuche", price: 7700 },
  { name: "Cuchara, cuchillo o tenedor x 100 und", price: 1100 },
  { name: "Bombilla plastica 10x195 mm x 50 und", price: 900 },
  { name: "Bombillas plasticas x 100 und", price: 700 },
  { name: "Bolsa camiseta 28x35 (100 und)", price: 900 },
  { name: "Bolsa camiseta 35x40 y 35x45 (100 und)", price: 1000 },
  { name: "Bolsa camiseta 40x50 (100 und)", price: 1500 },
  { name: "Bolsa camiseta 50x60 (100 und)", price: 2400 },
  { name: "Bolsa camiseta 60x70 (100 und)", price: 3600 },
  { name: "Bolsa camiseta negra 35x40 (100 und)", price: 1000 },
  { name: "Bolsa botillera 40x50 (100 und)", price: 2400 },
  { name: "FullPack 7 35x50 700 und", price: 6300 },
  { name: "Prepicado 70x90 x kilo", price: 3300 },
  { name: "Prepicado 40x60 x kilo", price: 3300 },
  { name: "Prepicado 30x40 x kilo y lamina", price: 3300 },
  { name: "Prepicado 20x30 x kilo", price: 3300 },
  { name: "Prepicado 15x25 x kilo", price: 3300 },
  { name: "Bolsa baja densidad 15x30 100 und", price: 1200 },
  { name: "Bolsa baja densidad 20x30 100 und", price: 1400 },
  { name: "Bolsa baja densidad 25x35 100 und", price: 2000 },
  { name: "Bolsa baja densidad 30x40 100 und", price: 2300 },
  { name: "Bolsa celofan o polipropileno 12x20 500 und", price: 4000 },
  { name: "Bolsa celofan o polipropileno 20x30 100 und", price: 2100 },
  { name: "Bolsa taco 20x30 (100 und)", price: 700 },
  { name: "Bolsa BD/PA vacio 20x30x0,8 natural 100 und", price: 83 },
  { name: "Bolsa BD/PA vacio 30x40x0,8 natural 100 und", price: 165 },
  { name: "Bolsa de basura 50x70 0.5 (10 und)", price: 850 },
  { name: "Bolsa de basura 70x90 0.5 (10 und)", price: 1500 },
  { name: "Bolsa de basura 80x110 0.5 (10 und)", price: 2100 },
  { name: "Bolsa de basura 90x120 0.3 (10 und)", price: 1200 },
  { name: "Bolsa de basura 110x130 0.7 (10 und)", price: 4800 },
  { name: "Bolsa de basura rollo 50x70 10 und", price: 400 },
  { name: "Bolsa de basura rollo 70x90 10 und", price: 800 },
  { name: "Bolsa de basura rollo 80x110 10 und", price: 1300 },
  { name: "Films rollo 38x1.400 mts", price: 26000 },
  { name: "Films rollo 45x1.400 mts", price: 35000 },
  { name: "Film camiplast 300 mts con estuche y cortadora", price: 6100 },
  { name: "Films 300x100 mts rollo CPack", price: 2000 },
  { name: "Films paletizador", price: 5000 },
  { name: "Films paletizador negro", price: 5900 },
  { name: "Vaso plastico 300 cc x 50 und", price: 30 },
  { name: "Vaso plastico 16 onzas", price: 45 },
  { name: "Vaso plastico esp PET 12 oz (350 cc) 50 und", price: 72 },
  { name: "Vaso plastico esp PET 16 oz (500 cc) 50 und", price: 78 },
  { name: "Vaso plastico especial PET 9 oz (250 cc) 50 und", price: 58 },
  { name: "Inserto vaso 12 oz 100 und", price: 44 },
  { name: "Tapa plastica domo cupula sin hoyo 9/12 oz (100 und)", price: 34 },
  { name: "Tapa plastica domo cupula sin hoyo 16 oz (100 und)", price: 36 },
  { name: "Tapa plana 92 mm", price: 26 },
  { name: "Envase plastico con tapa 24 oz (750 cc) 50 und", price: 190 },
  { name: "Pote facetado 200 cc 50 und con tapa", price: 118 },
  { name: "Pote facetado 250 cc 50 und con tapa", price: 120 },
  { name: "Tapa plastica vaso plumavit 8 oz (100 und)", price: 49 },
  { name: "Tapa plastica vaso plumavit 10 oz (100 und)", price: 57 },
  { name: "Tapa capuchino negra 6 oz (100 und)", price: 25 },
  { name: "Tapa capuchino negra 8 oz (100 und)", price: 28 },
  { name: "Tapa capuchino negra 12 oz (50 und)", price: 40 },
  { name: "Guantes de polietileno x 100 und", price: 500 },
  { name: "Envase redondo con bisagra 40-8 domo, semi domo y plana", price: 70 },
  { name: "Envase redondo con bisagra 40-12 domo y plana", price: 75 },
  { name: "Envase redondo con bisagra 40-16 domo", price: 85 },
  { name: "Envase 401 AA 50 und", price: 236 },
  { name: "Envase 401 A", price: 236 },
  { name: "Envase 7190 100 und", price: 130 },
  { name: "Envase 247", price: 175 },
  { name: "Envase triangular 7187 B 100 und", price: 106 },
  { name: "Envase triangular 7187 A 100 und", price: 106 },
  { name: "Envase triangular 11x5 y 11x7 Darnel", price: 151 },
  { name: "Envase rectangular 7189 100 und", price: 107 },
  { name: "Clamshell kilo falso 440 UxC con hoyo", price: 170 },
  { name: "Clamshell medio falso 400 UxC con hoyo", price: 150 },
  { name: "Clamshell 5050 no ventilado 6 oz", price: 130 },
  { name: "Clamshell 200 gr 3535-160", price: 110 },
  { name: "Sushi 3 roll", price: 180 },
  { name: "Sushi 2 roll", price: 130 },
  { name: "Plato ovalado con tapa microondeable 50 und", price: 10800 },
  { name: "Envase rectangular GA 70", price: 2000 },
  { name: "Cupula torta 98-45", price: 400 },
  { name: "Pote degustacion 0,75 oz con tapa 100 und", price: 15 },
  { name: "Pote degustacion 1 oz con tapa 100 und", price: 17 },
  { name: "Pote degustacion 1,5 oz con tapa", price: 22 },
  { name: "Pote degustacion 2 oz con tapa", price: 26 },
  { name: "Pote degustacion 5,5 oz con tapa 100 und", price: 46 },
  { name: "Gelatinero con tapa 4 oz 50 und", price: 56 },
  { name: "Guantes nitrilo negro talla S/M/L/XL", price: 4700 },
  { name: "Guantes nitrilo azul talla S/M/L", price: 4600 },
  { name: "Guante latex talla M", price: 4100 },
  { name: "Guante vinilo talla L", price: 2800 },
  { name: "Gorro clip blanco (cofia) x 100 und", price: 2500 },
  { name: "Gorro clip negro (cofia) x 100 und", price: 2500 },
  { name: "Cinta embalaje 100 mts Fixo pack 6 und", price: 5990 },
  { name: "Contenedor termico hot dog x und", price: 100 },
  { name: "Contenedor termico completo grande x und", price: 160 },
  { name: "Contenedor termico Ct1 x 25 und Pamolsa", price: 5100 },
  { name: "Contenedor termico T1 Darnel", price: 248 },
  { name: "Contenedor termico Ct2 x 50 und Pamolsa", price: 8500 },
  { name: "Contenedor termico Ct3 x 50 und Pamolsa", price: 8300 },
  { name: "Contenedor termico Ct5 con o sin division x 50 und", price: 5100 },
  { name: "Contenedor termico J1L", price: 100 },
  { name: "Contenedor termico J1M", price: 107 },
  { name: "Contenedor termico hamburguesero", price: 90 },
  { name: "Portacomidas wabe B-1 CT6 x und", price: 75 },
  { name: "Marmita Darnel 25 und", price: 125 },
  { name: "Bandeja plumavit S1", price: 40 },
  { name: "Bandeja plumavit S2", price: 62 },
  { name: "Bandeja plumavit S4", price: 92 },
  { name: "Bandeja plumavit S8", price: 132 },
  { name: "Vaso plumavit dart 8 oz 240 cc (25 und)", price: 52 },
  { name: "Vaso plumavit dart 10 oz 300 cc (25 und)", price: 56 },
];

function buildSku(name: string, index: number) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 18);

  return `INS-${String(index + 1).padStart(4, "0")}-${normalized}`;
}

function buildStock(index: number) {
  if ((index + 1) % 23 === 0) {
    return { status: "out_of_stock" as const, quantity: 0, stockLevel: 0 };
  }

  if ((index + 1) % 11 === 0) {
    return { status: "low" as const, quantity: 12, stockLevel: 22 };
  }

  return { status: "normal" as const, quantity: 120, stockLevel: 78 };
}

function resolveImageUrlByCatalogOrder(productIndex: number) {
  // Exact mapping for the 189 products in the seed
  const exactImages: string[] = [
    // Page 1 (12 products)
    "/catalogo_webp/rollo_kraf.webp", // Rollo Kraft 20 cms
    "/catalogo_webp/rollo_kraf.webp", // Rollo Kraft 40 cms
    "/catalogo_webp/rollo_kraf.webp", // Rollo Kraft 57 cms
    "/catalogo_webp/papel_antigrasa.webp", // Papel antigrasa 28x34 cm x 100 und
    "/catalogo_webp/porta_comlpeto01.webp", // Porta completo B1 x 100 und
    "/catalogo_webp/porta_completo02.webp", // Porta completo carton B2 x 100 und
    "/catalogo_webp/page-01-img-05-0005.webp", // Caja para pollo de carton 100 und
    "/catalogo_webp/page-01-img-05-0005.webp", // Caja papa carton #3 100 und
    "/catalogo_webp/page-01-img-06-0006.webp", // Caja torta mediana 35x35x10,5 50 und
    "/catalogo_webp/page-01-img-06-0006.webp", // Caja torta grande 39x39x14 50 und
    "/catalogo_webp/page-01-img-07-0007.webp", // Papel mantequilla resma 100x80 x 500 und
    "/catalogo_webp/page-01-img-08-0008.webp", // Papel Kraft resma 80x100 400 und

    // Page 2 (11 products)
    "/catalogo_webp/page-02-img-01-0009.webp", // Vaso polipapel blanco 6 oz x 50 und
    "/catalogo_webp/page-02-img-01-0009.webp", // Vaso polipapel blanco 8 oz x 50 und
    "/catalogo_webp/page-02-img-01-0009.webp", // Vaso polipapel blanco 12 oz x 50 und
    "/catalogo_webp/page-02-img-02-0010.webp", // Vaso corrugado negro 8 oz (240 cc) 25 und
    "/catalogo_webp/page-02-img-03-0011.webp", // Cubre vaso 8/10 oz Kraft
    "/catalogo_webp/page-02-img-04-0012.webp", // Porta vasos 4 cavidades x 75 und
    "/catalogo_webp/page-02-img-05-0013.webp", // Toalla interfoliada x 200 und
    "/catalogo_webp/page-02-img-06-0014.webp", // Servilleta x 300 und
    "/catalogo_webp/page-02-img-07-0015.webp", // Servilleta lunch x 500 und
    "/catalogo_webp/page-02-img-08-0016.webp", // Servilleta tipo coctel interfoliada x 200 und
    "/catalogo_webp/page-02-img-09-0017.webp", // Bandeja redonda de carton N7 30,8 cm 100 und

    // Page 3 (22 products)
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°2 200 und 16x9 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°3 200 und 17x10 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°4 200 und 19x11 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°5 200 und 19x13 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°6 200 und 21x15 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°7 200 und 23x16 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°8 200 und 24x17 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°10 200 und
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°12 100 und 32x24 cm
    "/catalogo_webp/page-03-img-01-0018.webp", // Bandeja rectangular N°14 100 und
    "/catalogo_webp/page-03-img-02-0019.webp", // Bolsa Kraft blanca 0,125 kl (1.000 und)
    "/catalogo_webp/page-03-img-02-0019.webp", // Bolsa Kraft blanca 0,25 kl (1.000 und)
    "/catalogo_webp/page-03-img-02-0019.webp", // Bolsa Kraft blanca 0,5 kl (1.000 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 0,75 kl (1.000 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 1 kl (1.000 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 2 kl (1.000 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 3 kl (1.000 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 4 kl (500 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 5 kl (500 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 6 kl (500 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 7 kl (500 und)
    "/catalogo_webp/page-03-img-03-0020.webp", // Bolsa Kraft 8 kl (500 und)

    // Page 4 (18 products)
    "/catalogo_webp/page-04-img-01-0021.webp", // Toalla prepicada o continua 2 x 180 mts
    "/catalogo_webp/page-04-img-01-0021.webp", // Toalla continua 2 x 250 mts
    "/catalogo_webp/page-04-img-02-0022.webp", // Confort industrial 6 x 180 mts
    "/catalogo_webp/page-04-img-03-0023.webp", // Caja de pizza chica 25x25 50 und
    "/catalogo_webp/page-04-img-03-0023.webp", // Caja de pizza mediana 33x33 50 und
    "/catalogo_webp/page-04-img-03-0023.webp", // Caja de pizza grande 38x38 50 und
    "/catalogo_webp/page-04-img-04-0024.webp", // Bolsa Kraft rinon chica 28x15x28
    "/catalogo_webp/page-04-img-04-0024.webp", // Bolsa Kraft rinon mediana 28x15x36
    "/catalogo_webp/page-04-img-04-0024.webp", // Bolsa Kraft rinon grande 28x15x41
    "/catalogo_webp/page-04-img-04-0024.webp", // Bolsa Kraft rinon extra grande 32x32x18
    "/catalogo_webp/page-04-img-05-0025.webp", // Bombilla polipapel 8 mm 200 und
    "/catalogo_webp/page-04-img-05-0025.webp", // Bombilla polipapel 6 mm 100 und
    "/catalogo_webp/page-04-img-06-0026.webp", // Bowl Kraft 500 cc con tapa 50 und
    "/catalogo_webp/page-04-img-06-0026.webp", // Bowl Kraft 750 cc con tapa 25 und
    "/catalogo_webp/page-04-img-06-0026.webp", // Bowl Kraft 1.000 cc con tapa 50 und
    "/catalogo_webp/page-04-img-06-0026.webp", // Bowl Kraft 1.300 cc con tapa 50 und
    "/catalogo_webp/page-04-img-07-0027.webp", // Porta comida organico 950 ml con division 50 und
    "/catalogo_webp/page-04-img-08-0028.webp", // Palos chinos 100 und

    // Page 5 (12 products)
    "/catalogo_webp/page-05-img-01-0029.webp", // Revolvedor madera grande 170 mm 1.000 und
    "/catalogo_webp/page-05-img-02-0030.webp", // Mondadientes 25 paq de 100 und
    "/catalogo_webp/page-05-img-03-0031.webp", // Cuchara, cuchillo o tenedor madera 160 mm 100 und
    "/catalogo_webp/page-05-img-04-0032.webp", // Canoa chica carton 100 und
    "/catalogo_webp/page-05-img-05-0033.webp", // Canoa grande carton 100 und
    "/catalogo_webp/page-05-img-06-0034.webp", // Canasto 00 de carton 100 und
    "/catalogo_webp/page-05-img-06-0034.webp", // Canasto de carton 01
    "/catalogo_webp/page-05-img-06-0034.webp", // Canasto 1 de carton 200 und
    "/catalogo_webp/page-05-img-07-0035.webp", // Rollo termico Transbank 10 und
    "/catalogo_webp/page-05-img-08-0036.webp", // Rollo termico 80x80
    "/catalogo_webp/page-05-img-09-0037.webp", // Resma carta
    "/catalogo_webp/page-05-img-10-0038.webp", // Borrador garzon

    // Page 6 (15 products)
    "/catalogo_webp/page-06-img-01-0039.webp", // Envase de aluminio C20 x 20 und
    "/catalogo_webp/page-06-img-01-0039.webp", // Envase aluminio C20 tapa plastica x 100 und
    "/catalogo_webp/page-06-img-01-0039.webp", // Envase de aluminio C25/2 x 20 und
    "/catalogo_webp/page-06-img-01-0039.webp", // Envase de aluminio C10 x 20 und
    "/catalogo_webp/page-06-img-02-0040.webp", // Foil aluminio 100 mts x 30 cm con estuche
    "/catalogo_webp/page-06-img-03-0041.webp", // Cuchara, cuchillo o tenedor x 100 und
    "/catalogo_webp/page-06-img-04-0042.webp", // Bombilla plastica 10x195 mm x 50 und
    "/catalogo_webp/page-06-img-04-0042.webp", // Bombillas plasticas x 100 und
    "/catalogo_webp/page-06-img-05-0043.webp", // Bolsa camiseta 28x35 (100 und)
    "/catalogo_webp/page-06-img-05-0043.webp", // Bolsa camiseta 35x40 y 35x45 (100 und)
    "/catalogo_webp/page-06-img-05-0043.webp", // Bolsa camiseta 40x50 (100 und)
    "/catalogo_webp/page-06-img-05-0043.webp", // Bolsa camiseta 50x60 (100 und)
    "/catalogo_webp/page-06-img-05-0043.webp", // Bolsa camiseta 60x70 (100 und)
    "/catalogo_webp/page-06-img-06-0044.webp", // Bolsa camiseta negra 35x40 (100 und)
    "/catalogo_webp/page-06-img-06-0044.webp", // Bolsa botillera 40x50 (100 und)

    // Page 7 (15 products)
    "/catalogo_webp/page-07-img-01-0045.webp", // FullPack 7 35x50 700 und
    "/catalogo_webp/page-07-img-02-0046.webp", // Prepicado 70x90 x kilo
    "/catalogo_webp/page-07-img-02-0046.webp", // Prepicado 40x60 x kilo
    "/catalogo_webp/page-07-img-02-0046.webp", // Prepicado 30x40 x kilo y lamina
    "/catalogo_webp/page-07-img-02-0046.webp", // Prepicado 20x30 x kilo
    "/catalogo_webp/page-07-img-02-0046.webp", // Prepicado 15x25 x kilo
    "/catalogo_webp/page-07-img-03-0047.webp", // Bolsa baja densidad 15x30 100 und
    "/catalogo_webp/page-07-img-03-0047.webp", // Bolsa baja densidad 20x30 100 und
    "/catalogo_webp/page-07-img-03-0047.webp", // Bolsa baja densidad 25x35 100 und
    "/catalogo_webp/page-07-img-03-0047.webp", // Bolsa baja densidad 30x40 100 und
    "/catalogo_webp/page-07-img-04-0048.webp", // Bolsa celofan o polipropileno 12x20 500 und
    "/catalogo_webp/page-07-img-04-0048.webp", // Bolsa celofan o polipropileno 20x30 100 und
    "/catalogo_webp/page-07-img-05-0049.webp", // Bolsa taco 20x30 (100 und)
    "/catalogo_webp/page-07-img-06-0050.webp", // Bolsa BD/PA vacio 20x30x0,8 natural 100 und
    "/catalogo_webp/page-07-img-06-0050.webp", // Bolsa BD/PA vacio 30x40x0,8 natural 100 und

    // Page 8 (18 products)
    "/catalogo_webp/page-08-img-01-0051.webp", // Bolsa de basura 50x70 0.5 (10 und)
    "/catalogo_webp/page-08-img-01-0051.webp", // Bolsa de basura 70x90 0.5 (10 und)
    "/catalogo_webp/page-08-img-01-0051.webp", // Bolsa de basura 80x110 0.5 (10 und)
    "/catalogo_webp/page-08-img-01-0051.webp", // Bolsa de basura 90x120 0.3 (10 und)
    "/catalogo_webp/page-08-img-01-0051.webp", // Bolsa de basura 110x130 0.7 (10 und)
    "/catalogo_webp/page-08-img-02-0052.webp", // Bolsa de basura rollo 50x70 10 und
    "/catalogo_webp/page-08-img-02-0052.webp", // Bolsa de basura rollo 70x90 10 und
    "/catalogo_webp/page-08-img-02-0052.webp", // Bolsa de basura rollo 80x110 10 und
    "/catalogo_webp/page-08-img-03-0053.webp", // Films rollo 38x1.400 mts
    "/catalogo_webp/page-08-img-03-0053.webp", // Films rollo 45x1.400 mts
    "/catalogo_webp/page-08-img-04-0054.webp", // Film camiplast 300 mts con estuche y cortadora
    "/catalogo_webp/page-08-img-05-0055.webp", // Films 300x100 mts rollo CPack
    "/catalogo_webp/page-08-img-05-0055.webp", // Films paletizador
    "/catalogo_webp/page-08-img-05-0055.webp", // Films paletizador negro
    "/catalogo_webp/page-08-img-06-0056.webp", // Vaso plastico 300 cc x 50 und
    "/catalogo_webp/page-08-img-06-0056.webp", // Vaso plastico 16 onzas
    "/catalogo_webp/page-08-img-07-0057.webp", // Vaso plastico esp PET 12 oz (350 cc) 50 und
    "/catalogo_webp/page-08-img-07-0057.webp", // Vaso plastico esp PET 16 oz (500 cc) 50 und

    // Page 9 (13 products)
    "/catalogo_webp/page-09-img-01-0058.webp", // Vaso plastico especial PET 9 oz (250 cc) 50 und
    "/catalogo_webp/page-09-img-02-0059.webp", // Inserto vaso 12 oz 100 und
    "/catalogo_webp/page-09-img-03-0060.webp", // Tapa plastica domo cupula sin hoyo 9/12 oz (100 und)
    "/catalogo_webp/page-09-img-03-0060.webp", // Tapa plastica domo cupula sin hoyo 16 oz (100 und)
    "/catalogo_webp/page-09-img-04-0061.webp", // Tapa plana 92 mm
    "/catalogo_webp/page-09-img-05-0062.webp", // Envase plastico con tapa 24 oz (750 cc) 50 und
    "/catalogo_webp/page-09-img-06-0063.webp", // Pote facetado 200 cc 50 und con tapa
    "/catalogo_webp/page-09-img-06-0063.webp", // Pote facetado 250 cc 50 und con tapa
    "/catalogo_webp/page-09-img-07-0064.webp", // Tapa plastica vaso plumavit 8 oz (100 und)
    "/catalogo_webp/page-09-img-07-0064.webp", // Tapa plastica vaso plumavit 10 oz (100 und)
    "/catalogo_webp/page-09-img-08-0065.webp", // Tapa capuchino negra 6 oz (100 und)
    "/catalogo_webp/page-09-img-08-0065.webp", // Tapa capuchino negra 8 oz (100 und)
    "/catalogo_webp/page-09-img-08-0065.webp", // Tapa capuchino negra 12 oz (50 und)

    // Page 10 (11 products)
    "/catalogo_webp/page-10-img-01-0066.webp", // Guantes de polietileno x 100 und
    "/catalogo_webp/page-10-img-02-0067.webp", // Envase redondo con bisagra 40-8 domo, semi domo y plana
    "/catalogo_webp/page-10-img-02-0067.webp", // Envase redondo con bisagra 40-12 domo y plana
    "/catalogo_webp/page-10-img-02-0067.webp", // Envase redondo con bisagra 40-16 domo
    "/catalogo_webp/page-10-img-03-0068.webp", // Envase 401 AA 50 und
    "/catalogo_webp/page-10-img-04-0069.webp", // Envase 401 A
    "/catalogo_webp/page-10-img-05-0070.webp", // Envase 7190 100 und
    "/catalogo_webp/page-10-img-06-0071.webp", // Envase 247
    "/catalogo_webp/page-10-img-07-0072.webp", // Envase triangular 7187 B 100 und
    "/catalogo_webp/page-10-img-07-0072.webp", // Envase triangular 7187 A 100 und
    "/catalogo_webp/page-10-img-07-0072.webp", // Envase triangular 11x5 y 11x7 Darnel

    // Page 11 (10 products)
    "/catalogo_webp/page-11-img-01-0073.webp", // Envase rectangular 7189 100 und
    "/catalogo_webp/page-11-img-02-0074.webp", // Clamshell kilo falso 440 UxC con hoyo
    "/catalogo_webp/page-11-img-03-0075.webp", // Clamshell medio falso 400 UxC con hoyo
    "/catalogo_webp/page-11-img-04-0076.webp", // Clamshell 5050 no ventilado 6 oz
    "/catalogo_webp/page-11-img-04-0076.webp", // Clamshell 200 gr 3535-160
    "/catalogo_webp/page-11-img-05-0077.webp", // Sushi 3 roll
    "/catalogo_webp/page-11-img-05-0077.webp", // Sushi 2 roll
    "/catalogo_webp/page-11-img-06-0078.webp", // Plato ovalado con tapa microondeable 50 und
    "/catalogo_webp/page-11-img-07-0079.webp", // Envase rectangular GA 70
    "/catalogo_webp/page-11-img-08-0080.webp", // Cupula torta 98-45

    // Page 12 (10 products)
    "/catalogo_webp/page-12-img-01-0081.webp", // Pote degustacion 0,75 oz con tapa 100 und
    "/catalogo_webp/page-12-img-01-0081.webp", // Pote degustacion 1 oz con tapa 100 und
    "/catalogo_webp/page-12-img-01-0081.webp", // Pote degustacion 1,5 oz con tapa
    "/catalogo_webp/page-12-img-01-0081.webp", // Pote degustacion 2 oz con tapa
    "/catalogo_webp/page-12-img-02-0082.webp", // Pote degustacion 5,5 oz con tapa 100 und
    "/catalogo_webp/page-12-img-03-0083.webp", // Gelatinero con tapa 4 oz 50 und
    "/catalogo_webp/page-12-img-04-0084.webp", // Guantes nitrilo negro talla S/M/L/XL
    "/catalogo_webp/page-12-img-05-0085.webp", // Guantes nitrilo azul talla S/M/L
    "/catalogo_webp/page-12-img-06-0086.webp", // Guante latex talla M
    "/catalogo_webp/page-12-img-08-0088.webp", // Guante vinilo talla L

    // Page 13 (12 products)
    "/catalogo_webp/page-13-img-01-0089.webp", // Gorro clip blanco (cofia) x 100 und
    "/catalogo_webp/page-13-img-02-0090.webp", // Gorro clip negro (cofia) x 100 und
    "/catalogo_webp/page-13-img-03-0091.webp", // Cinta embalaje 100 mts Fixo pack 6 und
    "/catalogo_webp/page-13-img-04-0092.webp", // Contenedor termico hot dog x und
    "/catalogo_webp/page-13-img-05-0093.webp", // Contenedor termico completo grande x und
    "/catalogo_webp/page-13-img-06-0094.webp", // Contenedor termico Ct1 x 25 und Pamolsa
    "/catalogo_webp/page-13-img-06-0094.webp", // Contenedor termico T1 Darnel
    "/catalogo_webp/page-13-img-06-0094.webp", // Contenedor termico Ct2 x 50 und Pamolsa
    "/catalogo_webp/page-13-img-06-0094.webp", // Contenedor termico Ct3 x 50 und Pamolsa
    "/catalogo_webp/page-13-img-06-0094.webp", // Contenedor termico Ct5 con o sin division x 50 und
    "/catalogo_webp/page-13-img-07-0095.webp", // Contenedor termico J1L
    "/catalogo_webp/page-13-img-07-0095.webp", // Contenedor termico J1M

    // Page 14 (9 products)
    "/catalogo_webp/page-14-img-01-0096.webp", // Contenedor termico hamburguesero
    "/catalogo_webp/page-14-img-02-0097.webp", // Portacomidas wabe B-1 CT6 x und
    "/catalogo_webp/page-14-img-03-0098.webp", // Marmita Darnel 25 und
    "/catalogo_webp/page-14-img-04-0099.webp", // Bandeja plumavit S1
    "/catalogo_webp/page-14-img-04-0099.webp", // Bandeja plumavit S2
    "/catalogo_webp/page-14-img-04-0099.webp", // Bandeja plumavit S4
    "/catalogo_webp/page-14-img-04-0099.webp", // Bandeja plumavit S8
    "/catalogo_webp/page-14-img-05-0100.webp", // Vaso plumavit dart 8 oz 240 cc (25 und)
    "/catalogo_webp/page-14-img-05-0100.webp"  // Vaso plumavit dart 10 oz 300 cc (25 und)
  ];

  if (productIndex >= 0 && productIndex < exactImages.length) {
    return exactImages[productIndex];
  }
  return "/catalogo_webp/page-14-img-05-0100.webp";
}

export const mockProducts: Product[] = productSeed.map((product, index) => {
  const stock = buildStock(index);

  return {
    id: String(index + 1),
    name: product.name,
    sku: buildSku(product.name, index),
    price: product.price,
    quantity: stock.quantity,
    stockLevel: stock.stockLevel,
    status: stock.status,
    imageUrl: resolveImageUrlByCatalogOrder(index),
  };
});
