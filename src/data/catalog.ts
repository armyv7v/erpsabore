import { mockProducts } from "@/data/inventory";

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
}

function detectCategory(name: string) {
  const text = name.toLowerCase();

  if (text.includes("plumavit") || text.includes("contenedor") || text.includes("marmita")) {
    return "Plumavit";
  }

  if (text.includes("plast") || text.includes("pet") || text.includes("bolsa")) {
    return "Plastico";
  }

  if (text.includes("aluminio") || text.includes("foil")) {
    return "Aluminio";
  }

  if (text.includes("papel") || text.includes("kraft") || text.includes("carton") || text.includes("servilleta")) {
    return "Papeleria y carton";
  }

  return "Insumos";
}

export const mockCatalogProducts: CatalogProduct[] = mockProducts.map((product) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  price: product.price,
  stock: product.quantity,
  imageUrl: product.imageUrl,
  category: detectCategory(product.name),
}));
