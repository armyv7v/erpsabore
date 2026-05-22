"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  AlertCircle,
  Check,
  Users,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CustomerRecord } from "@/lib/types/erp";
import { submitCreateCustomerAction } from "@/app/actions/crm";
import ProductDetailsModal from "@/components/erp/ProductDetailsModal";
import { createDraftInvoiceAction } from "@/app/actions/invoices";

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

interface Props {
  products: CatalogProduct[];
  customers: CustomerRecord[];
}

export default function CatalogClient({ products, customers = [] }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Estados de Clientes
  const [localCustomers, setLocalCustomers] = useState<CustomerRecord[]>(customers);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // Estados de Procesamiento
  const [isPendingOrder, startTransitionOrder] = useTransition();
  const [isPendingCustomer, startTransitionCustomer] = useTransition();
  const [orderState, setOrderState] = useState<{ status: string; message: string }>({ status: "idle", message: "" });
  const [customerError, setCustomerError] = useState("");

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

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

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  }, [filteredProducts, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, itemsPerPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) {
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return localCustomers;
    const query = customerSearch.toLowerCase().trim();
    return localCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.rut.toLowerCase().includes(query)
    );
  }, [localCustomers, customerSearch]);

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

  function handleManualQuantityChange(productId: string, value: string) {
    const cleanValue = value.replace(/[^0-9]/g, ""); // solo números enteros
    setCartItems((current) =>
      current.map((item) => {
        if (item.id === productId) {
          const qty = cleanValue === "" ? 0 : parseInt(cleanValue, 10);
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  }

  function handleQuantityBlur(productId: string, currentQty: number) {
    if (currentQty <= 0) {
      setCartItems((current) => current.filter((item) => item.id !== productId));
    }
  }

  function clearCart() {
    setCartItems([]);
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }

  // Confirmación Directa a Base de Datos como Borrador (Draft)
  function handleConfirmOrder() {
    if (!selectedCustomer) return;
    if (cartItems.length === 0) return;

    setOrderState({ status: "idle", message: "" });

    startTransitionOrder(async () => {
      try {
        const formData = new FormData();
        formData.append("customerName", selectedCustomer.name);
        formData.append("customerRut", selectedCustomer.rut);
        if (selectedCustomer.email) {
          formData.append("customerEmail", selectedCustomer.email);
        }

        const today = new Date().toISOString().split("T")[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        formData.append("issueDate", today);
        formData.append("dueDate", nextWeek);
        formData.append("currency", "CLP");
        formData.append("taxRate", "0.19");
        formData.append("notes", "Pedido borrador generado directamente desde el catálogo digital.");

        const items = cartItems.map((item) => ({
          productId: item.id,
          description: item.name,
          qty: item.quantity,
          unitPrice: item.price,
        }));
        formData.append("lineItemsJson", JSON.stringify(items));

        const res = await createDraftInvoiceAction({ status: "idle", message: "" }, formData);

        if (res.status === "success") {
          setOrderState({ status: "success", message: "¡Pedido registrado como borrador con éxito en administración!" });
          clearCart();
          setSelectedCustomer(null);
          setCustomerSearch("");
          // Cerrar modal automáticamente después de 2.5 segundos
          setTimeout(() => {
            setOrderState({ status: "idle", message: "" });
            setIsCartOpen(false);
          }, 2500);
        } else {
          setOrderState({ status: "error", message: res.message });
        }
      } catch (err) {
        console.error("Error al registrar pedido:", err);
        setOrderState({ status: "error", message: "No se pudo comunicar con el servidor." });
      }
    });
  }

  // Registro Express de Cliente desde Carrito
  async function handleCreateCustomerExpress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCustomerError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const rut = String(formData.get("rut") ?? "").trim().toUpperCase();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!fullName || !rut) {
      setCustomerError("Nombre y RUT son obligatorios.");
      return;
    }

    startTransitionCustomer(async () => {
      try {
        const res = await submitCreateCustomerAction(formData);

        if (res.status === "success") {
          const newCustomer: CustomerRecord = {
            id: `temp-${crypto.randomUUID()}`,
            tenantId: "",
            name: fullName,
            rut,
            email: email || null,
            phone: phone || null,
            notes: "Creado desde catálogo digital",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setLocalCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
          setSelectedCustomer(newCustomer);
          setIsNewCustomerModalOpen(false);
          setCustomerSearch("");
        } else {
          setCustomerError(res.message);
        }
      } catch (err) {
        console.error("Error express customer creation:", err);
        setCustomerError("No se pudo registrar el cliente.");
      }
    });
  }

  const stockBadgeClass = (qty: number) =>
    qty > 0
      ? qty < 10
        ? "bg-orange-500/90"
        : "bg-green-500/90"
      : "bg-red-500/90";

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
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
            paginatedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setDetailsProduct(product)}
                className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer select-none ${
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
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
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

        {/* Paginación */}
        {filteredProducts.length > 0 && (
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200/60 dark:border-slate-800/60 pt-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}</span> al <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-bold text-slate-900 dark:text-slate-100">{filteredProducts.length}</span> productos
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Selector de ítems por página */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "all") {
                      setItemsPerPage(filteredProducts.length);
                    } else {
                      setItemsPerPage(Number(value));
                    }
                  }}
                  className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer text-slate-750 dark:text-slate-200"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value="all">Todos</option>
                </select>
              </div>

              {/* Botonera de navegación */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
                    title="Primera Página"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
                    title="Página Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPageNumbers().map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === p
                          ? "bg-primary text-white shadow-sm shadow-primary/20"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
                    title="Siguiente Página"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed cursor-pointer"
                    title="Última Página"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Cart drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Carrito de compra</h2>
                  <p className="text-xs text-slate-500">Selecciona el cliente y confirma el pedido directo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notification of order status */}
              {orderState.status === "success" && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-xs font-semibold animate-in zoom-in duration-200">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  {orderState.message}
                </div>
              )}

              {orderState.status === "error" && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold animate-in zoom-in duration-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {orderState.message}
                </div>
              )}

              {/* Cart Items list */}
              {cartItems.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 text-center">
                  El carrito está vacío.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.sku}</p>
                          <p className="font-semibold text-xs leading-tight mt-0.5">{item.name}</p>
                        </div>
                        <p className="font-bold text-xs text-primary">
                          ${(item.price * item.quantity).toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="rounded-lg border border-slate-200 p-1.5 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => handleManualQuantityChange(item.id, e.target.value)}
                            onBlur={() => handleQuantityBlur(item.id, item.quantity)}
                            className="w-12 h-8 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="rounded-lg border border-slate-200 p-1.5 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Client Selection Section */}
              {cartItems.length > 0 && (
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Cliente Destinatario</h3>
                  </div>

                  {selectedCustomer ? (
                    <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 dark:bg-slate-900 border border-primary/20 animate-in fade-in duration-200">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{selectedCustomer.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{selectedCustomer.rut}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearch("");
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors px-2.5 py-1 rounded-lg bg-red-500/10 cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-400"
                            placeholder="Buscar cliente por nombre o RUT..."
                            value={customerSearch}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value);
                              setIsCustomerDropdownOpen(true);
                            }}
                            onFocus={() => setIsCustomerDropdownOpen(true)}
                          />
                          {customerSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerSearch("");
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsNewCustomerModalOpen(true)}
                          className="px-3 py-2 text-xs font-bold bg-primary/10 hover:bg-primary/15 text-primary rounded-xl flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nuevo</span>
                        </button>
                      </div>

                      {/* Dropdown list */}
                      {isCustomerDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto z-50 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl shadow-xl animate-in slide-in-from-top-1 duration-150">
                          {filteredCustomers.length === 0 ? (
                            <div className="p-4 text-xs text-slate-500 text-center leading-normal">
                              No se encontró el cliente.<br />
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomerDropdownOpen(false);
                                  setIsNewCustomerModalOpen(true);
                                }}
                                className="text-primary font-bold mt-1.5 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" /> Crear "{customerSearch}"
                              </button>
                            </div>
                          ) : (
                            filteredCustomers.map((cust) => (
                              <button
                                key={cust.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(cust);
                                  setIsCustomerDropdownOpen(false);
                                  setCustomerSearch("");
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs hover:bg-primary/5 transition-colors border-b last:border-none border-slate-100 dark:border-slate-900 flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-bold text-slate-950 dark:text-slate-100">{cust.name}</p>
                                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{cust.rut}</p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom summary and action buttons */}
            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Productos seleccionados</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{cartCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                  <span>Monto Total</span>
                  <span className="text-primary text-base">${cartTotal.toLocaleString("es-CL")} CLP</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cartItems.length === 0 || isPendingOrder}
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 py-2.5 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={cartItems.length === 0 || !selectedCustomer || isPendingOrder}
                  className="flex-[2] rounded-xl bg-primary hover:bg-primary/95 py-2.5 font-bold text-xs text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
                >
                  {isPendingOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando pedido...</span>
                    </>
                  ) : (
                    "Confirmar Pedido"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Express de Creación de Cliente */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Registrar Cliente Nuevo</h2>
              </div>
              <button
                onClick={() => {
                  setIsNewCustomerModalOpen(false);
                  setCustomerError("");
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {customerError && (
              <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {customerError}
              </div>
            )}

            <form onSubmit={handleCreateCustomerExpress} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nombre Completo / Razón Social
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={customerSearch}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/25 outline-none placeholder:text-slate-400"
                  placeholder="Ej. Comercializadora Santiago SpA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">RUT</label>
                <input
                  type="text"
                  name="rut"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/25 outline-none uppercase placeholder:text-slate-400"
                  placeholder="Ej. 76.123.456-7"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/25 outline-none placeholder:text-slate-400"
                    placeholder="Ej. +56912345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/25 outline-none placeholder:text-slate-400"
                    placeholder="Ej. compras@empresa.cl"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomerModalOpen(false);
                    setCustomerError("");
                  }}
                  disabled={isPendingCustomer}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPendingCustomer}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPendingCustomer ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    "Guardar Cliente"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Detalles de Producto */}
      {detailsProduct && (
        <ProductDetailsModal
          product={{
            id: detailsProduct.id,
            name: detailsProduct.name,
            sku: detailsProduct.sku,
            unitPrice: detailsProduct.unitPrice,
            stockQuantity: detailsProduct.stockQuantity,
            imageUrl: detailsProduct.imageUrl,
            category: detailsProduct.category,
            description: null,
          }}
          onClose={() => setDetailsProduct(null)}
          onAddToCart={() => addToCart(detailsProduct)}
        />
      )}
    </div>
  );
}
