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
  MapPin,
  ArrowUpDown,
  Printer,
  BookOpen,
} from "lucide-react";

const MOCK_BRANCHES = ["Todos", "Almacén Central", "Sucursal Providencia", "Sucursal Las Condes"];
const SORT_OPTIONS = [
  { value: "name-asc", label: "A-Z" },
  { value: "name-desc", label: "Z-A" },
  { value: "price-asc", label: "Precio: Menor a Mayor" },
  { value: "price-desc", label: "Precio: Mayor a Menor" },
];

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { CustomerRecord } from "@/lib/types/erp";
import { submitCreateCustomerAction } from "@/app/actions/crm";
import ProductDetailsModal from "@/components/erp/ProductDetailsModal";
import { createDraftInvoiceAction, submitGuestOrderAction } from "@/app/actions/invoices";
import BarcodeSvg from "@/components/erp/BarcodeSvg";
import { getMajorCategory, getProductCategory } from "@/lib/utils/barcode-generator";

function getShortSubcategory(name: string): string {
  const sub = getProductCategory(name);
  if (sub === 'Papeles y Rollos Kraft') return 'Papel y Kraft';
  if (sub === 'Cajas y Porta Alimentos') return 'Cajas y Embalaje';
  if (sub === 'Vasos, Tapas y Accesorios') return 'Vasos y Tapas';
  if (sub === 'Envases de Plumavit') return 'Envases de Plumavit';
  if (sub === 'Bandejas') return 'Bandejas';
  if (sub === 'Bolsas y Prepicados') return 'Bolsas y Prepicados';
  if (sub === 'Higiene y Papel Tisú') return 'Higiene y Tisú';
  if (sub === 'Envases de Plástico') return 'Envases de Plástico';
  if (sub === 'Cubiertos, Bombillas y Utensilios') return 'Utensilios';
  if (sub === 'Protección e Higiene Personal') return 'Protección';
  if (sub === 'Librería, Embalaje y Oficina') return 'Oficina y Embalaje';
  if (sub === 'Aluminio y Metálicos') return 'Aluminio';
  return sub;
}

function getSubcatId(subcat: string): string {
  return `subcat-${subcat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
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
  user?: any | null;
}

export default function CatalogClient({ products, customers = [], user = null }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [printMode, setPrintMode] = useState<"book" | "simple">("book");

  const handlePrint = (mode: "book" | "simple") => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };
  
  // Agrupar y paginar productos para el PDF Libro imprimible
  // Agrupados rígidamente por las 3 categorías principales y divididos por subcategoría/tipo de producto
  const printPages = useMemo(() => {
    // groups: Record<MajorCategory, Record<Subcategory, CatalogProduct[]>>
    const groups: Record<string, Record<string, CatalogProduct[]>> = {
      "Plásticos": {},
      "Papel": {},
      "Aluminio": {}
    };

    products.forEach(p => {
      const majorCat = getMajorCategory(p.name);
      const subcat = getProductCategory(p.name);
      
      if (!groups[majorCat][subcat]) {
        groups[majorCat][subcat] = [];
      }
      groups[majorCat][subcat].push(p);
    });

    const itemsPerPage = printMode === "book" ? 16 : 8;
    const pages: { category: string; subcategory: string; products: CatalogProduct[] }[] = [];
    const categoriesOrder = ["Plásticos", "Papel", "Aluminio"];
    
    categoriesOrder.forEach(cat => {
      const subcatsMap = groups[cat];
      
      // Ordenar las subcategorías de esta categoría alfabéticamente
      const sortedSubcats = Object.keys(subcatsMap).sort((a, b) => a.localeCompare(b));
      
      sortedSubcats.forEach(subcat => {
        const subcatProducts = subcatsMap[subcat];
        // Ordenar productos alfabéticamente por nombre
        subcatProducts.sort((a, b) => a.name.localeCompare(b.name));
        
        // Paginar los productos de esta subcategoría de forma exclusiva
        for (let i = 0; i < subcatProducts.length; i += itemsPerPage) {
          pages.push({
            category: cat,
            subcategory: subcat,
            products: subcatProducts.slice(i, i + itemsPerPage)
          });
        }
      });
    });

    return pages;
  }, [products, printMode]);

  const tableOfContents = useMemo(() => {
    const toc: { category: string; subcategory: string; pageNumber: number }[] = [];
    const seenSubcategories = new Set<string>();

    printPages.forEach((page, pageIdx) => {
      if (!seenSubcategories.has(page.subcategory)) {
        seenSubcategories.add(page.subcategory);
        toc.push({
          category: page.category,
          subcategory: page.subcategory,
          pageNumber: pageIdx + 3, // Pág 1: Portada, Pág 2: Índice, Grillas inician en 3
        });
      }
    });

    return toc;
  }, [printPages]);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [detailsProduct, setDetailsProduct] = useState<CatalogProduct | null>(null);

  // Estados de Filtros Avanzados
  const [stockFilter, setStockFilter] = useState<"all" | "critical" | "out_of_stock">("all");
  const [activeBranch, setActiveBranch] = useState("Todos");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

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
  const [guestDetails, setGuestDetails] = useState({
    fullName: "",
    rut: "",
    email: "",
    phone: "",
    address: "",
    docType: "boleta",
  });
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    number: string;
    customerName: string;
    docType: string;
    address?: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  } | null>(null);

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  useEffect(() => {
    if (user && user.role === "cliente" && user.customerId && localCustomers.length > 0) {
      const match = localCustomers.find((c) => c.id === user.customerId);
      if (match) {
        setSelectedCustomer(match);
      }
    }
  }, [user, localCustomers]);

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
      // 1. Category Filter
      const matchesCategory =
        activeCategory === "Todos" || product.category === activeCategory;
      
      // 2. Search Filter
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);
      
      // 3. Stock Filter
      let matchesStock = true;
      if (stockFilter === "critical") {
        matchesStock = product.stockQuantity > 0 && product.stockQuantity < 10;
      } else if (stockFilter === "out_of_stock") {
        matchesStock = product.stockQuantity === 0;
      }

      return matchesCategory && matchesSearch && matchesStock;
    });
  }, [products, activeCategory, searchQuery, stockFilter]);

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    if (sortBy === "name-asc") {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "name-desc") {
      return items.sort((a, b) => b.name.localeCompare(a.name));
    }
    if (sortBy === "price-asc") {
      return items.sort((a, b) => a.unitPrice - b.unitPrice);
    }
    if (sortBy === "price-desc") {
      return items.sort((a, b) => b.unitPrice - a.unitPrice);
    }
    return items;
  }, [filteredProducts, sortBy]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  }, [filteredProducts, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, itemsPerPage, stockFilter]);

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
    if (cartItems.length === 0) return;

    setOrderState({ status: "idle", message: "" });

    // Si es un invitado (no logueado)
    if (!user) {
      if (!guestDetails.fullName || !guestDetails.rut || !guestDetails.email || !guestDetails.address) {
        setOrderState({ status: "error", message: "Nombre, RUT, correo y dirección son obligatorios para realizar la compra." });
        return;
      }

      startTransitionOrder(async () => {
        try {
          const formData = new FormData();
          formData.append("fullName", guestDetails.fullName);
          formData.append("rut", guestDetails.rut);
          formData.append("email", guestDetails.email);
          formData.append("phone", guestDetails.phone);
          formData.append("address", guestDetails.address);
          formData.append("docType", guestDetails.docType);
          formData.append("lineItemsJson", JSON.stringify(cartItems.map(item => ({
            productId: item.id,
            description: item.name,
            qty: item.quantity,
            unitPrice: item.price,
          }))));

          const res = await submitGuestOrderAction({ status: "idle", message: "" }, formData);

          if (res.status === "success") {
            setOrderState({ status: "success", message: res.message });
            setCompletedOrder({
              id: res.data.id,
              number: res.data.number,
              customerName: res.data.customerName,
              docType: res.data.docType,
              address: res.data.address,
              items: cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              total: res.data.total,
            });
            clearCart();
            setGuestDetails({
              fullName: "",
              rut: "",
              email: "",
              phone: "",
              address: "",
              docType: "boleta",
            });
            setIsCartOpen(false);
            setOrderState({ status: "idle", message: "" });
          } else {
            setOrderState({ status: "error", message: res.message });
          }
        } catch (err) {
          console.error("Error al registrar pedido de invitado:", err);
          setOrderState({ status: "error", message: "No se pudo comunicar con el servidor." });
        }
      });
      return;
    }

    // Si es un cliente/usuario logueado
    if (!selectedCustomer) return;

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
          setCompletedOrder({
            id: res.data.id,
            number: res.data.number,
            customerName: selectedCustomer.name,
            docType: "Pedido ERP",
            items: cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total: cartTotal,
          });
          clearCart();
          if (user.role !== "cliente") {
            setSelectedCustomer(null);
            setCustomerSearch("");
          }
          setIsCartOpen(false);
          setOrderState({ status: "idle", message: "" });
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
    e.stopPropagation();
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
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 bg-watermark">
      {/* Interfaz Web Interactiva — Se oculta por completo durante la impresión */}
      <div className="no-print flex flex-col w-full min-h-screen">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePrint("simple")}
            className="flex items-center gap-2 px-3 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
            title="Exportar catálogo simple para clientes (sin códigos de barra, fotos más grandes)"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">PDF Cliente (Simple)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePrint("book")}
            className="flex items-center gap-2 px-3 h-12 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-extrabold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm shadow-primary/5"
            title="Exportar catálogo completo a formato PDF Libro (A4) con portada, índice y códigos de barra"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">PDF Catálogo (Completo)</span>
          </button>
          
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
      </div>

      <main className="no-print flex-1 pb-24 md:p-8">
        {/* Banner de Bienvenida Corporativo */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8C19D] to-[#BC7A3A] px-6 py-8 text-[#221610] shadow-sm mb-6 mx-4 md:mx-0 border border-[#BC7A3A]/30">
          {/* Fondo decorativo con marcas de agua */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-contain bg-right bg-no-repeat" style={{ backgroundImage: 'url("/brand/logo_negro_sin_fondo.png")' }}></div>
          <div className="relative z-10 max-w-2xl text-left">
            <span className="bg-[#221610]/10 text-[#221610] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#221610]/20">
              Saboré Insumos y Suministros
            </span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight text-[#221610]">Catálogo Digital Oficial</h2>
          </div>
        </div>

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

        {/* Pestañas de Stock */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-4 px-4 md:px-0 flex gap-6">
          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              stockFilter === "all"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
            }`}
          >
            Todos los Productos
          </button>
          <button
            type="button"
            onClick={() => setStockFilter("critical")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              stockFilter === "critical"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
            }`}
          >
            Stock Crítico
          </button>
          <button
            type="button"
            onClick={() => setStockFilter("out_of_stock")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              stockFilter === "out_of_stock"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-250"
            }`}
          >
            Agotados
          </button>
        </div>

        {/* Dropdowns de Filtrado y Ordenamiento */}
        <div className="flex flex-wrap items-center gap-3 px-4 md:px-0 mb-6">
          {/* Dropdown Categoría */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                setIsBranchDropdownOpen(false);
                setIsSortDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 hover:border-primary transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Categoría: <strong>{activeCategory}</strong></span>
            </button>
            {isCategoryDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-20 animate-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        activeCategory === cat
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dropdown Almacén */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsBranchDropdownOpen(!isBranchDropdownOpen);
                setIsCategoryDropdownOpen(false);
                setIsSortDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 hover:border-primary transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Almacén: <strong>{activeBranch}</strong></span>
            </button>
            {isBranchDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsBranchDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-20 animate-in slide-in-from-top-1 duration-150">
                  {MOCK_BRANCHES.map((branchName) => (
                    <button
                      key={branchName}
                      type="button"
                      onClick={() => {
                        setActiveBranch(branchName);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        activeBranch === branchName
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                      }`}
                    >
                      {branchName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dropdown Ordenar por */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSortDropdownOpen(!isSortDropdownOpen);
                setIsCategoryDropdownOpen(false);
                setIsBranchDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 hover:border-primary transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Ordenar por: <strong>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</strong></span>
            </button>
            {isSortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-20 animate-in slide-in-from-top-1 duration-150">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        sortBy === opt.value
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
                    <div className="flex h-full w-full items-center justify-center relative bg-slate-50 dark:bg-slate-900/50 p-6">
                      <picture className="block w-16 h-16 opacity-15 dark:opacity-25 select-none pointer-events-none transition-transform hover:scale-105">
                        <source srcSet="/brand/logo_blanco_sin_fondo.png" media="(prefers-color-scheme: dark)" />
                        <img 
                          src="/brand/logo_camel_sin_fondo.png" 
                          alt="Saboré Insumos Placeholder" 
                          className="w-16 h-16 object-contain"
                        />
                      </picture>
                      <span className="absolute bottom-2 text-[9px] font-black text-slate-300 dark:text-slate-700 tracking-widest uppercase">
                        Sin Imagen
                      </span>
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
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                        {product.category}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[8px] font-bold uppercase tracking-wider">
                        • {getShortSubcategory(product.name)}
                      </span>
                    </div>
                  )}
                  <p
                    className={`mt-auto text-lg font-bold leading-none ${
                      product.stockQuantity > 0 ? "text-primary" : "text-slate-400"
                    }`}
                  >
                    ${product.unitPrice.toLocaleString("es-CL")}
                    <span className="text-slate-400 text-[10px] font-normal"> CLP</span>
                  </p>
                  {(() => {
                    const cartItem = cartItems.find((item) => item.id === product.id);
                    if (cartItem && cartItem.quantity > 0) {
                      return (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 h-[38px] transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 active:scale-90 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <input
                            type="text"
                            value={cartItem.quantity}
                            onChange={(e) => handleManualQuantityChange(product.id, e.target.value)}
                            onBlur={() => handleQuantityBlur(product.id, cartItem.quantity)}
                            className="w-12 text-center bg-transparent border-0 font-extrabold text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-0 p-0"
                          />

                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            disabled={cartItem.quantity >= product.stockQuantity}
                            className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all h-[38px] ${
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
                    );
                  })()}
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
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="font-bold text-xs text-primary">
                            ${(item.price * item.quantity).toLocaleString("es-CL")}
                          </p>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -item.quantity)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              {cartItems.length > 0 && user && user.role !== "cliente" && (
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

              {/* Guest Checkout Form */}
              {cartItems.length > 0 && !user && (
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 mb-1">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Datos de Envío y Despacho</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Nombre Completo / Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Juan Pérez"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-400 dark:text-white"
                        value={guestDetails.fullName}
                        onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          RUT / DNI *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: 12.345.678-9"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-400 dark:text-white"
                          value={guestDetails.rut}
                          onChange={(e) => setGuestDetails({ ...guestDetails, rut: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: +56 9 1234 5678"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-400 dark:text-white"
                          value={guestDetails.phone}
                          onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-400 dark:text-white"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Dirección de Despacho *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Calle, Número, Comuna"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-slate-400 dark:text-white"
                        value={guestDetails.address}
                        onChange={(e) => setGuestDetails({ ...guestDetails, address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Tipo de Documento
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="guestDocType"
                            value="boleta"
                            checked={guestDetails.docType === "boleta"}
                            onChange={() => setGuestDetails({ ...guestDetails, docType: "boleta" })}
                            className="text-primary focus:ring-primary h-3.5 w-3.5 border-slate-300 dark:border-slate-700 bg-transparent"
                          />
                          Boleta
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="guestDocType"
                            value="factura"
                            checked={guestDetails.docType === "factura"}
                            onChange={() => setGuestDetails({ ...guestDetails, docType: "factura" })}
                            className="text-primary focus:ring-primary h-3.5 w-3.5 border-slate-300 dark:border-slate-700 bg-transparent"
                          />
                          Factura
                        </label>
                      </div>
                    </div>
                  </div>
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
                  disabled={cartItems.length === 0 || (user && !selectedCustomer) || isPendingOrder}
                  className="flex-[2] rounded-xl bg-primary hover:bg-primary/95 py-2.5 font-bold text-xs text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
                >
                  {isPendingOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    user ? "Confirmar Pedido" : "Confirmar Compra"
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
          showCostPrice={user && ["admin", "finanzas", "bodega"].includes(user.role)}
        />
      )}

      {/* Modal de Confirmación de Pedido */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#221610] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                ¡Pedido Confirmado!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Su orden ha sido recibida y se encuentra en proceso de despacho
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* ID / Tracking */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">ID del Pedido:</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 select-all font-mono text-[11px]">
                    {completedOrder.id}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className="font-semibold text-slate-500">Folio / Número:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {completedOrder.number}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className="font-semibold text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {completedOrder.customerName}
                  </span>
                </div>
                {completedOrder.address && (
                  <div className="flex justify-between items-start text-xs mt-2 gap-4">
                    <span className="font-semibold text-slate-500 shrink-0">Despacho:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                      {completedOrder.address}
                    </span>
                  </div>
                )}
              </div>

              {/* Detalle Items */}
              <div>
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-405 mb-2">
                  Detalle de la Compra
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800/65 rounded-xl overflow-hidden bg-white dark:bg-transparent">
                  {completedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 text-xs">
                      <div className="max-w-[70%]">
                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {item.quantity} x {item.price.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                        {(item.quantity * item.price).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/30">
                    <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Total
                    </span>
                    <span className="text-base font-black text-primary font-mono">
                      {completedOrder.total.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-750 dark:text-blue-300 font-semibold leading-relaxed">
                  Conserve el <strong>ID del Pedido</strong>. Le servirá próximamente para realizar el seguimiento en línea del despacho de su paquete.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-primary dark:hover:bg-primary/95 text-white font-bold text-xs shadow-lg transition-all hover:scale-[1.01] active:scale-95 cursor-pointer text-center"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Área Imprimible - Oculta en pantalla, visible al imprimir */}
      <div id="catalog-print-area" className="hidden print:block bg-white text-black font-sans">
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: A4 portrait;
            margin: 0;
          }

          @media print {
            /* ====== PASO 1: Matar TODO lo que no es el área de impresión ====== */
            .no-print,
            aside,
            nav,
            header,
            footer,
            button,
            form,
            .sidebar,
            .navbar,
            .mobile-nav,
            div.h-16.md\\:hidden {
              display: none !important;
              visibility: hidden !important;
            }

            /* Matar la marca de agua del fondo web */
            .bg-watermark::before {
              display: none !important;
              content: none !important;
            }

            /* ====== PASO 2: Liberar ancestros de altura fija y scroll ====== */
            html,
            body,
            html > body > div,
            div.flex.h-screen,
            main,
            div.flex-1 {
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              display: block !important;
              position: static !important;
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }

            /* ====== PASO 3: Área de impresión ocupa todo ====== */
            #catalog-print-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              background: white !important;
              color: black !important;
              z-index: 999999 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            /* ====== PASO 4: Páginas individuales ====== */
            .print-page {
              width: 210mm;
              height: 297mm;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
              background: white !important;
              color: black !important;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-cover-page {
              width: 210mm;
              height: 297mm;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}} />
        
        {/* ========== PORTADA ========== */}
        <div
          className="print-cover-page flex flex-col justify-between items-center text-center relative"
          style={{ backgroundColor: '#221610', color: '#f8fafc', padding: '25mm 20mm' }}
        >
          {/* Marco decorativo */}
          <div style={{ position: 'absolute', inset: '15mm', border: '1px solid rgba(188, 122, 58, 0.3)', pointerEvents: 'none' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', zIndex: 10 }}>
            <img src="/brand/logo_blanco_sin_fondo.png" alt="Saboré Insumos" style={{ height: '64px', width: 'auto', marginBottom: '24px', objectFit: 'contain' }} />
            <p style={{ color: '#BC7A3A', fontSize: '11px', fontWeight: 700, letterSpacing: '6px', textTransform: 'uppercase' }}>INSUMOS Y SUMINISTROS</p>
          </div>
          
          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, padding: '0 24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>CATÁLOGO DE PRODUCTOS</h2>
            <div style={{ height: '2px', width: '48px', backgroundColor: '#BC7A3A', borderRadius: '2px', marginBottom: '20px' }}></div>
            <p style={{ color: '#94a3b8', fontSize: '10px', maxWidth: '320px', lineHeight: '1.6' }}>
              {printMode === "book" 
                ? "Catálogo oficial de productos con códigos de barra EAN-13 para control de inventarios."
                : "Catálogo de productos e insumos seleccionados para nuestros clientes."}
            </p>
          </div>

          <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, zIndex: 10, textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>erpsabore.vercel.app</p>
            <p style={{ marginBottom: '2px' }}>Generado: {new Date().toLocaleDateString("es-CL", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style={{ marginBottom: '4px' }}>Total de Productos: {products.length}</p>
            <p style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>La Serena, Chile</p>
          </div>
        </div>

        {/* ========== ÍNDICE (Solo modo libro) ========== */}
        {printMode === "book" && (
          <div className="print-page" style={{ padding: '20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '32px' }}>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1px', color: '#BC7A3A', textTransform: 'uppercase' }}>SABORÉ INSUMOS</span>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.5px', margin: '4px 0 0 0' }}>Índice de Contenidos</h2>
                  </div>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>GUÍA DE REFERENCIA</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                  {["Plásticos", "Papel", "Aluminio"].map((majorCat) => {
                    const items = tableOfContents.filter(item => item.category === majorCat);
                    if (items.length === 0) return null;
                    return (
                      <div key={majorCat}>
                        <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#BC7A3A', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', margin: '0 0 10px 0' }}>
                          {majorCat}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                          {items.map((item) => (
                            <a 
                              key={item.subcategory}
                              href={"#" + getSubcatId(item.subcategory)}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'flex-end', 
                                justifyContent: 'space-between', 
                                fontSize: '10px', 
                                color: '#334155',
                                textDecoration: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ fontWeight: 600, flexShrink: 0, paddingRight: '8px' }}>{item.subcategory}</span>
                              <div style={{ flex: 1, borderBottom: '1px dotted #cbd5e1', margin: '0 8px 3px 8px' }}></div>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#BC7A3A', flexShrink: 0, paddingLeft: '8px' }}>Pág. {item.pageNumber}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '7px', fontWeight: 700, color: '#94a3b8' }}>
                <span>Generado por erpsabore.vercel.app</span>
                <span>Página 2 de {printPages.length + 2}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========== PÁGINAS DE PRODUCTOS (4 columnas x filas) ========== */}
        {printPages.map((page, pageIdx) => {
          const pageCategory = page.category;
          const pageProducts = page.products;

          return (
            <div 
              key={pageIdx} 
              className="print-page" 
              id={tableOfContents.find(t => t.subcategory === page.subcategory)?.pageNumber === (pageIdx + (printMode === "book" ? 3 : 2)) ? getSubcatId(page.subcategory) : undefined}
              style={{ 
                padding: printMode === "book" ? "12mm 12mm" : "10mm 6mm", 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between' 
              }}
            >
              <div>
                {/* Encabezado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '1px', color: '#BC7A3A', textTransform: 'uppercase' }}>SABORÉ INSUMOS</span>
                    <h3 style={{ fontSize: '10px', fontWeight: 800, color: '#334155', margin: '2px 0 0 0' }}>{page.subcategory}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '8px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                      {pageCategory}
                    </span>
                  </div>
                </div>

                {/* Grilla de Productos - 4 columnas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: printMode === "book" ? '8px' : '6px' }}>
                  {pageProducts.map((prod, idx) => {
                    return (
                      <div key={prod.id} style={{ display: 'contents' }}>
                        {printMode === "book" ? (
                          /* DISEÑO COMPLETO/ADMIN CON BARCODE (44mm de alto) */
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', height: '44mm', overflow: 'hidden', backgroundColor: 'white', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            {/* Imagen */}
                            <div style={{ width: '44px', height: '44px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, marginBottom: '4px' }}>
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 900 }}>{prod.name.charAt(0)}</span>
                              )}
                            </div>

                            {/* Nombre */}
                            <h4 style={{ fontSize: '7px', fontWeight: 800, color: '#0f172a', lineHeight: '1.2', textAlign: 'center', maxHeight: '18px', overflow: 'hidden', width: '100%', margin: '0 0 2px 0', letterSpacing: '-0.2px' }}>
                              {prod.name}
                            </h4>

                            {/* SKU */}
                            <span style={{ fontFamily: 'monospace', fontSize: '6px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                              {prod.sku}
                            </span>

                            {/* Precio */}
                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#BC7A3A', margin: '0 0 3px 0' }}>
                              ${prod.unitPrice.toLocaleString("es-CL")}
                              <span style={{ color: '#94a3b8', fontSize: '6px', fontWeight: 400 }}> CLP</span>
                            </p>

                            {/* Código de barras */}
                            {prod.barcode ? (
                              <BarcodeSvg
                                barcode={prod.barcode}
                                width={85}
                                height={18}
                                showText={true}
                                className="scale-95 origin-bottom"
                              />
                            ) : (
                              <span style={{ fontSize: '6px', color: '#ef4444', fontWeight: 700 }}>Sin Código</span>
                            )}
                          </div>
                        ) : (
                          /* DISEÑO SIMPLE/CLIENTE MÁS ESPACIOSO Y SIN BARCODE (74mm de alto) */
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', textAlign: 'center', height: '74mm', overflow: 'hidden', backgroundColor: 'white', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            {/* Imagen de lado a lado (edge-to-edge) ocupando 45mm de alto */}
                            <div style={{ width: '100%', height: '45mm', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ color: '#cbd5e1', fontSize: '28px', fontWeight: 900 }}>{prod.name.charAt(0)}</span>
                              )}
                            </div>

                            {/* Contenedor del texto con padding y alineación centrada para eliminar vacíos */}
                            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, width: '100%', boxSizing: 'border-box' }}>
                              {/* Nombre con mejor legibilidad */}
                              <h4 style={{ fontSize: '9.5px', fontWeight: 800, color: '#0f172a', lineHeight: '1.25', textAlign: 'center', maxHeight: '24px', overflow: 'hidden', width: '100%', margin: '0 0 3px 0', letterSpacing: '-0.1px' }}>
                                {prod.name}
                              </h4>

                              {/* SKU con distancia de 3mm */}
                              <span style={{ fontFamily: 'monospace', fontSize: '7.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', margin: '0 0 3px 0' }}>
                                {prod.sku}
                              </span>

                              {/* Precio destacado y bien pegado */}
                              <p style={{ fontSize: '13.5px', fontWeight: 900, color: '#BC7A3A', margin: '0' }}>
                                ${prod.unitPrice.toLocaleString("es-CL")}
                                <span style={{ color: '#94a3b8', fontSize: '7.5px', fontWeight: 400 }}> CLP</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pie de Página */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '7px', fontWeight: 700, color: '#94a3b8', marginTop: '6px' }}>
                <span>erpsabore.vercel.app</span>
                <span>
                  {printMode === "book" 
                    ? "Página " + (pageIdx + 3) + " de " + (printPages.length + 2) 
                    : "Página " + (pageIdx + 2) + " de " + (printPages.length + 1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
