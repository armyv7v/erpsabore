"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Filter,
  Minus,
  PackageSearch,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  stockQuantity: number;
  imageUrl: string | null;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

const CART_STORAGE_KEY = "erpSabore:catalogCart";
const CART_TRANSFER_KEY = "erpSabore:catalogCartTransfer";

interface Props {
  products: CatalogProduct[];
}

export default function CatalogClient({ products }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return;
    try {
      setCartItems(JSON.parse(raw) as CartItem[]);
    } catch {
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const categories = useMemo(() => {
    const unique = [
      ...new Set(products.map((p) => p.category).filter(Boolean) as string[]),
    ].sort();
    return ["Todos", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "Todos" || product.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product: CatalogProduct) {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.unitPrice,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCartItems((current) =>
      current
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function clearCart() {
    setCartItems([]);
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }

  function sendCartToSales() {
    if (cartItems.length === 0) return;
    const description = cartItems.map((item) => `${item.quantity} x ${item.name}`).join(" | ");
    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    window.localStorage.setItem(
      CART_TRANSFER_KEY,
      JSON.stringify({
        lineDescription: description,
        lineQty: String(totalQty),
        lineUnitPrice: String(totalPrice),
        catalogLines: cartItems.map((item) => ({
          description: item.name,
          qty: item.quantity,
          unitPrice: item.price,
        })),
        notes: `Borrador generado desde catálogo con ${cartItems.length} productos.`,
      }),
    );

    setIsCartOpen(false);
    clearCart();
    router.push("/ventas");
  }

  const stockBadgeClass = (qty: number) =>
    qty > 0
      ? qty < 10
        ? "bg-orange-500/90"
        : "bg-green-500/90"
      : "bg-red-500/90";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:px-8">
        <div className="flex items-center gap-3">
          <div className="text-primary flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h1 className="text-slate-900 text-xl font-bold leading-tight tracking-tight dark:text-slate-100">
            Catálogo Digital
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex size-12 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="bg-primary absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
            {cartCount}
          </span>
        </button>
      </div>

      <main className="flex-1 pb-24 md:p-8">
        {/* Search */}
        <div className="px-4 py-4 md:px-0">
          <label className="group flex w-full flex-col">
            <div className="flex h-12 w-full items-stretch rounded-xl border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-primary dark:border-slate-700 dark:bg-slate-800">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="form-input w-full border-none bg-transparent px-3 text-base placeholder:text-slate-400 outline-none focus:ring-0 dark:text-slate-100"
                placeholder="Buscar por nombre o SKU..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button
                type="button"
                className="text-primary hover:bg-primary/5 flex items-center gap-1 rounded-r-xl px-4 font-medium transition-colors"
              >
                <Filter className="hidden w-4 h-4 sm:block" /> Filtrar
              </button>
            </div>
          </label>
        </div>

        {/* Category chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4 md:px-0">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-primary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-4 px-4 md:px-0 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              {products.length === 0
                ? "No hay productos en el catálogo todavía."
                : "No se encontraron productos para los filtros actuales."}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${
                  product.stockQuantity === 0
                    ? "grayscale opacity-60"
                    : "hover:border-primary/30"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-300 dark:text-slate-600 font-bold">
                      {product.name.charAt(0)}
                    </div>
                  )}
                  <div
                    className={`absolute top-2 right-2 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm ${stockBadgeClass(product.stockQuantity)}`}
                  >
                    {product.stockQuantity > 0 ? `Stock: ${product.stockQuantity}` : "Sin stock"}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest dark:text-slate-400">
                    {product.sku}
                  </p>
                  <h3
                    className="text-slate-900 mt-1 mb-2 line-clamp-2 text-sm font-bold leading-tight dark:text-slate-100"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="text-slate-500 mb-2 text-[10px] font-semibold uppercase tracking-wide dark:text-slate-400">
                      {product.category}
                    </p>
                  )}
                  <p
                    className={`mt-auto text-lg font-bold leading-none ${
                      product.stockQuantity > 0 ? "text-primary" : "text-slate-400"
                    }`}
                  >
                    ${product.unitPrice.toLocaleString("es-CL")}
                    <span className="text-slate-400 text-[10px] font-normal"> CLP</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      product.stockQuantity > 0
                        ? "bg-primary text-white active:scale-95 shadow-sm shadow-primary/20 hover:bg-primary/90"
                        : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                    disabled={product.stockQuantity === 0}
                  >
                    {product.stockQuantity > 0 ? (
                      <>
                        <ShoppingBag className="w-4 h-4" /> AÑADIR
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4" /> AGOTADO
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Cart drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Carrito de compra</h2>
                <p className="text-xs text-slate-500">Selecciona productos y envíalos a Ventas.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                El carrito está vacío.
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <p className="text-xs text-slate-500">{item.sku}</p>
                    <p className="font-semibold">{item.name}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-primary">
                        ${(item.price * item.quantity).toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span>${cartTotal.toLocaleString("es-CL")}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-bold dark:border-slate-700"
              >
                <Trash2 className="mr-2 inline w-4 h-4" />
                Limpiar
              </button>
              <button
                type="button"
                onClick={sendCartToSales}
                disabled={cartItems.length === 0}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 font-bold text-white disabled:opacity-60"
              >
                Enviar a Ventas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
