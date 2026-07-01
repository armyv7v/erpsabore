"use client";

import React, { useState, useMemo, useEffect, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  MapPin,
  ArrowUpDown,
  Edit,
  MoreVertical,
  Plus,
  Search,
  X,
  Package,
  CheckCircle,
  AlertCircle,
  Trash2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { ProductRecord, ProductStockSummary } from "@/lib/repositories/product-repository";
import { createProductAction, updateProductAction, updateProductStockAction, deleteProductAction } from "@/app/actions/inventory";
import type { ActionState } from "@/lib/types/erp";
import ProductImageUploader from "@/components/erp/ProductImageUploader";
import ProductDetailsModal from "@/components/erp/ProductDetailsModal";

interface Props {
  products: ProductRecord[];
  summary: ProductStockSummary;
}

function formatCLP(value: number) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function stockLevelPercent(product: ProductRecord) {
  if (product.stockMinQuantity === 0) return product.stockQuantity > 0 ? 100 : 0;
  const max = product.stockMinQuantity * 5;
  return Math.min(100, Math.round((product.stockQuantity / max) * 100));
}

const INITIAL_STATE: ActionState = { status: "idle", message: "" };

export default function InventoryClient({ products, summary }: Props) {
  const router = useRouter();
  const [localProducts, setLocalProducts] = useState<ProductRecord[]>(products);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(createProductAction, INITIAL_STATE);
  const [editState, editFormAction, isEditPending] = useActionState(updateProductAction, INITIAL_STATE);
  const [stockState, stockFormAction, isStockPending] = useActionState(updateProductStockAction, INITIAL_STATE);
  const [isDeletePending, startDeleteTransition] = useTransition();

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [editStockQty, setEditStockQty] = useState<number>(0);
  const [adjustingProduct, setAdjustingProduct] = useState<ProductRecord | null>(null);
  const [detailsProduct, setDetailsProduct] = useState<ProductRecord | null>(null);

  // Estados para filtros avanzados
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<"category" | "warehouse" | "sort" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("name-asc");

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Utilidad para detectar categoría
  const detectCategory = (name: string) => {
    const text = name.toLowerCase();
    if (text.includes("plumavit") || text.includes("contenedor") || text.includes("marmita")) {
      return "Plumavit";
    }
    if (text.includes("plast") || text.includes("pet") || text.includes("bolsa")) {
      return "Plástico";
    }
    if (text.includes("aluminio") || text.includes("foil")) {
      return "Aluminio";
    }
    if (text.includes("papel") || text.includes("kraft") || text.includes("carton") || text.includes("servilleta")) {
      return "Papelería y cartón";
    }
    return "Insumos";
  };

  // Bodegas estáticas
  const warehouses = ["all", "Sucursal Central", "Sucursal Providencia", "Sucursal Norte", "Sucursal Sur"];

  // Deducir bodega de forma determinista y estable
  const getProductWarehouse = (product: ProductRecord) => {
    const charCodeSum = product.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const index = (charCodeSum + parseInt(product.id.replace(/\D/g, "") || "0")) % (warehouses.length - 1);
    return warehouses[index + 1];
  };

  // Obtener categorías únicas dinámicamente
  const categories = useMemo(() => {
    const list = new Set<string>();
    localProducts.forEach((p) => {
      list.add(detectCategory(p.name));
    });
    return ["all", ...Array.from(list).sort()];
  }, [localProducts]);

  // Cargar pestaña inicial desde los parámetros de búsqueda de la URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "low" || tab === "out" || tab === "all") {
        setActiveTab(tab);
      }
    }
  }, []);

  // Sincronizar stockQuantity al editar un producto
  useEffect(() => {
    if (editingProduct) {
      setEditStockQty(editingProduct.stockQuantity);
    }
  }, [editingProduct]);

  // Cerrar modal automáticamente al éxito
  useEffect(() => {
    if (state.status === "success") {
      setIsModalOpen(false);
    }
  }, [state]);

  useEffect(() => {
    if (editState.status === "success") {
      setEditingProduct(null);
    }
  }, [editState]);

  useEffect(() => {
    if (stockState.status === "success") {
      setAdjustingProduct(null);
    }
  }, [stockState]);

  const filteredProducts = useMemo(() => {
    let result = localProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "low"
            ? product.stockStatus === "low"
            : activeTab === "out"
              ? product.stockStatus === "out_of_stock"
              : activeTab === "alerts"
                ? product.stockStatus === "low" || product.stockStatus === "out_of_stock"
                : true;

      const matchesCategory =
        selectedCategory === "all" || detectCategory(product.name) === selectedCategory;

      const matchesWarehouse =
        selectedWarehouse === "all" || getProductWarehouse(product) === selectedWarehouse;

      return matchesSearch && matchesTab && matchesCategory && matchesWarehouse;
    });

    return [...result].sort((a, b) => {
      if (selectedSort === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (selectedSort === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (selectedSort === "stock-asc") {
        return a.stockQuantity - b.stockQuantity;
      }
      if (selectedSort === "stock-desc") {
        return b.stockQuantity - a.stockQuantity;
      }
      if (selectedSort === "price-asc") {
        return a.unitPrice - b.unitPrice;
      }
      if (selectedSort === "price-desc") {
        return b.unitPrice - a.unitPrice;
      }
      return 0;
    });
  }, [localProducts, searchQuery, activeTab, selectedCategory, selectedWarehouse, selectedSort]);

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
  }, [searchQuery, activeTab, selectedCategory, selectedWarehouse, selectedSort, itemsPerPage]);

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

  return (
    <div className="p-4 md:p-8 space-y-6 relative">
      {activeDropdownId && (
        <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdownId(null)} />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario Central</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestión y control de stock
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Añadir Producto
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
            activeTab === "all"
              ? "bg-primary/5 border-primary shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xs"
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            Total SKU
          </p>
          <p className="text-2xl font-bold mt-1">
            {summary.skuCount.toLocaleString("es-CL")}
          </p>
        </div>
        <div 
          onClick={() => {
            setActiveTab("low");
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
            activeTab === "low"
              ? "bg-orange-500/5 border-orange-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-950/50 hover:shadow-xs"
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            Stock Bajo
          </p>
          <p className="text-2xl font-bold mt-1 text-orange-500">
            {summary.lowStockCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            Valor Total
          </p>
          <p className="text-2xl font-bold mt-1">
            {formatCLP(summary.totalInventoryValue)}
          </p>
        </div>
        <div 
          onClick={() => {
            setActiveTab("alerts");
            setCurrentPage(1);
          }}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
            activeTab === "alerts"
              ? "bg-red-500/5 border-red-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-500/50 dark:hover:border-red-950/50 hover:shadow-xs"
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            Alertas
          </p>
          <p className={`text-2xl font-bold mt-1 ${summary.stockAlertCount > 0 ? "text-red-500" : "text-green-500"}`}>
            {summary.stockAlertCount}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar producto por nombre o SKU..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {(
            [
              { key: "all", label: "Todos los Productos" },
              { key: "low", label: "Stock Crítico" },
              { key: "out", label: "Agotados" },
              ...(activeTab === "alerts" ? [{ key: "alerts", label: "Alertas (Bajo/Agotado)" } as const] : []),
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                activeTab === key
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 relative">
          {activeFilterDropdown && (
            <div
              className="fixed inset-0 z-20"
              onClick={() => setActiveFilterDropdown(null)}
            />
          )}

          {/* Filtro: Categoría */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterDropdown(activeFilterDropdown === "category" ? null : "category")}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-all z-30 relative ${
                selectedCategory !== "all"
                  ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Categoría:</span>
              <span className="font-bold">
                {selectedCategory === "all" ? "Todas" : selectedCategory}
              </span>
            </button>

            {activeFilterDropdown === "category" && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-30 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-100">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveFilterDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary/10 text-primary"
                        : "text-slate-750 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {cat === "all" ? "Todas las categorías" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro: Almacén */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterDropdown(activeFilterDropdown === "warehouse" ? null : "warehouse")}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-all z-30 relative ${
                selectedWarehouse !== "all"
                  ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Almacén:</span>
              <span className="font-bold">
                {selectedWarehouse === "all" ? "Todos" : selectedWarehouse.replace("Sucursal ", "")}
              </span>
            </button>

            {activeFilterDropdown === "warehouse" && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-30 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-100">
                {warehouses.map((wh) => (
                  <button
                    key={wh}
                    onClick={() => {
                      setSelectedWarehouse(wh);
                      setActiveFilterDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedWarehouse === wh
                        ? "bg-primary/10 text-primary"
                        : "text-slate-750 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {wh === "all" ? "Todos los almacenes" : wh}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ordenar por */}
          <div className="relative">
            <button
              onClick={() => setActiveFilterDropdown(activeFilterDropdown === "sort" ? null : "sort")}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-all z-30 relative ${
                selectedSort !== "name-asc"
                  ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200"
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Ordenar por:</span>
              <span className="font-bold">
                {(
                  [
                    { key: "name-asc", label: "A-Z" },
                    { key: "name-desc", label: "Z-A" },
                    { key: "stock-desc", label: "Stock ↓" },
                    { key: "stock-asc", label: "Stock ↑" },
                    { key: "price-desc", label: "Precio ↓" },
                    { key: "price-asc", label: "Precio ↑" },
                  ] as const
                ).find((s) => s.key === selectedSort)?.label || selectedSort}
              </span>
            </button>

            {activeFilterDropdown === "sort" && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-30 p-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-100">
                {(
                  [
                    { key: "name-asc", label: "Nombre (A-Z)" },
                    { key: "name-desc", label: "Nombre (Z-A)" },
                    { key: "stock-desc", label: "Stock (Mayor a Menor)" },
                    { key: "stock-asc", label: "Stock (Menor a Mayor)" },
                    { key: "price-desc", label: "Precio (Mayor a Menor)" },
                    { key: "price-asc", label: "Precio (Menor a Mayor)" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedSort(key);
                      setActiveFilterDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSort === key
                        ? "bg-primary/10 text-primary"
                        : "text-slate-750 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-visible">
        <div className="hidden md:grid grid-cols-6 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
          <div className="col-span-2">Producto / SKU</div>
          <div>Precio Unit.</div>
          <div>Estado Stock</div>
          <div>Cantidad</div>
          <div className="text-right">Acciones</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {localProducts.length === 0
                ? "No hay productos cargados. Agregue el primer producto."
                : "No se encontraron productos con esos filtros."}
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const levelPercent = stockLevelPercent(product);
              const isOutOfStock = product.stockStatus === "out_of_stock";
              const outOfStockClass = isOutOfStock ? "grayscale opacity-75" : "";
              
              return (
                <div
                  key={product.id}
                  onDoubleClick={() => setDetailsProduct(product)}
                  className={`p-4 flex flex-col md:grid md:grid-cols-6 md:items-center gap-4 cursor-pointer select-none transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850/20 ${
                    product.stockStatus === "low"
                      ? "bg-orange-50/30 dark:bg-primary/5"
                      : isOutOfStock
                        ? "bg-slate-50 dark:bg-slate-900/50"
                        : ""
                  }`}
                >
                  <div className={`col-span-2 flex items-center gap-4 ${outOfStockClass}`}>
                    {product.imageUrl ? (
                      <div
                        className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${product.imageUrl}')` }}
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          SKU: {product.sku}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                          {detectCategory(product.name)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                          {getProductWarehouse(product)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex justify-between md:block ${outOfStockClass}`}>
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold">Precio:</span>
                    <span className="text-sm font-medium">{formatCLP(product.unitPrice)}</span>
                  </div>

                  <div className={`space-y-2 ${outOfStockClass}`}>
                    <div
                      className={`flex justify-between text-[10px] font-bold uppercase ${
                        product.stockStatus === "low"
                          ? "text-orange-600"
                          : isOutOfStock
                            ? "text-red-600"
                            : "text-slate-500"
                      }`}
                    >
                      <span>
                        {product.stockStatus === "low"
                          ? "Bajo Stock"
                          : isOutOfStock
                            ? "Agotado"
                            : "Nivel de Stock"}
                      </span>
                      <span>{levelPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          product.stockStatus === "low"
                            ? "bg-orange-500"
                            : isOutOfStock
                              ? "bg-red-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${levelPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className={`flex justify-between md:block ${outOfStockClass}`}>
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold">Cant:</span>
                    <span
                      className={`text-sm ${
                        product.stockStatus !== "normal"
                          ? "font-bold " +
                            (product.stockStatus === "low" ? "text-orange-600" : "text-red-600")
                          : ""
                      }`}
                    >
                      {product.stockQuantity} uds
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 relative">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-primary transition-colors animate-in fade-in"
                      title="Editar Producto"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const btn = e.currentTarget as HTMLElement;
                          const rect = btn.getBoundingClientRect();
                          const newId = activeDropdownId === product.id ? null : product.id;
                          if (newId) {
                            setDropdownPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          }
                          setActiveDropdownId(newId);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeDropdownId === product.id && dropdownPosition && (
                        <div data-dropdown-menu="true" style={{ position: 'fixed', top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }} className="w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-100">
                          <button
                            onClick={() => {
                              setDetailsProduct(product);
                              setActiveDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            Ver Detalles
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setActiveDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                          >
                            <Edit className="w-4 h-4 text-slate-400" />
                            Editar Producto
                          </button>
                          
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setActiveDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                          >
                            <Sliders className="w-4 h-4 text-slate-400" />
                            Ajustar Stock
                          </button>

                          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                          <button
                            onClick={() => {
                              setProductToDelete(product);
                              setActiveDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-55 dark:hover:bg-red-950/30 transition-colors text-left"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Paginación */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60 dark:border-slate-800/60 pt-6">
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
                className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer text-slate-750 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
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

      {/* FAB Mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal — Añadir Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <h2 className="text-lg font-bold">Añadir Nuevo Producto</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback de error de la action */}
            {state.status === "error" && (
              <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.message}
              </div>
            )}

            <form action={formAction} encType="multipart/form-data" className="flex flex-col flex-grow overflow-hidden">
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <ProductImageUploader name="image" />
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ej. Rollo Kraft 20 cms"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      SKU <span className="text-xs text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      name="sku"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                      placeholder="vacío para autogenerar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Cantidad Inicial
                    </label>
                    <input
                      type="number"
                      name="stockQuantity"
                      required
                      min="0"
                      defaultValue="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Código de Barras (Opcional)
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Ej. 7801234567890 (vacío para autogenerar)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Precio Unitario (CLP)
                    </label>
                    <input
                      type="number"
                      name="unitPrice"
                      required
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Mín. Stock
                    </label>
                    <input
                      type="number"
                      name="stockMinQuantity"
                      min="0"
                      defaultValue="10"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Guardar Producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal — Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Editar Producto</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback de error de la action */}
            {editState.status === "error" && (
              <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-55 dark:bg-red-950/30 text-red-655 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {editState.message}
              </div>
            )}

            <form action={editFormAction} encType="multipart/form-data" className="flex flex-col flex-grow overflow-hidden">
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <input type="hidden" name="productId" value={editingProduct.id} />
                <ProductImageUploader name="image" currentImageUrl={editingProduct.imageUrl} />
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-350">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingProduct.name}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-150"
                    placeholder="Ej. Rollo Kraft 20 cms"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-350">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      required
                      defaultValue={editingProduct.sku}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none uppercase text-slate-800 dark:text-slate-150"
                      placeholder="INS-0001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-350">
                      Mín. Stock
                    </label>
                    <input
                      type="number"
                      name="stockMinQuantity"
                      min="0"
                      defaultValue={editingProduct.stockMinQuantity}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-150"
                    />
                  </div>
                </div>
                
                {/* Control interactivo de Stock Actual */}
                <div className="bg-slate-50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stock Actual en Inventario
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditStockQty((q) => Math.max(0, q - 1))}
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-all font-bold text-lg select-none active:scale-95 cursor-pointer shadow-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={editStockQty}
                      onChange={(e) => setEditStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 text-center px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-150 font-extrabold text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setEditStockQty((q) => q + 1)}
                      className="flex size-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-all font-bold text-lg select-none active:scale-95 cursor-pointer shadow-sm"
                    >
                      +
                    </button>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Ajustá las unidades de stock sumando o restando de forma rápida.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-350">
                    Código de Barras (Opcional)
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    defaultValue={editingProduct.barcode || ""}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-150"
                    placeholder="Ej. 7801234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-350">
                    Precio Unitario (CLP)
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    required
                    min="0"
                    defaultValue={editingProduct.unitPrice}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-150"
                    placeholder="25000"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={isEditPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 text-slate-750 dark:text-slate-350"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isEditPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Ajustar Stock Rápido */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Ajustar Stock</h2>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback de error de la action */}
            {stockState.status === "error" && (
              <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-55 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {stockState.message}
              </div>
            )}

            <form action={stockFormAction} className="p-4 space-y-4">
              <input type="hidden" name="productId" value={adjustingProduct.id} />
              
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800">
                <p className="text-xs text-slate-400 uppercase font-bold">Producto</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{adjustingProduct.name}</p>
                <p className="text-xs text-slate-550 mt-0.5">SKU: {adjustingProduct.sku}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-350">
                  Cantidad Actual en Inventario
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  required
                  min="0"
                  defaultValue={adjustingProduct.stockQuantity}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-150 text-lg font-bold"
                  placeholder="0"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  disabled={isStockPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 text-slate-750 dark:text-slate-350"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isStockPending}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isStockPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Ajustando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Guardar Ajuste
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Detalles del Producto */}
      {detailsProduct && (
        <ProductDetailsModal
          product={{
            id: detailsProduct.id,
            name: detailsProduct.name,
            sku: detailsProduct.sku,
            barcode: detailsProduct.barcode,
            unitPrice: detailsProduct.unitPrice,
            stockQuantity: detailsProduct.stockQuantity,
            stockMinQuantity: detailsProduct.stockMinQuantity,
            stockStatus: detailsProduct.stockStatus,
            imageUrl: detailsProduct.imageUrl,
            description: detailsProduct.description,
            category: null,
          }}
          onClose={() => setDetailsProduct(null)}
          onEdit={() => setEditingProduct(detailsProduct)}
        />
      )}

      {/* Modal — Confirmación de Eliminación */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Producto?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ¿Estás seguro de que deseas eliminar{" "}
                  <strong className="text-slate-700 dark:text-slate-200 font-semibold truncate block max-w-full">
                    {productToDelete.name}
                  </strong>
                  ? Esta acción no se puede deshacer y el producto desaparecerá de tu listado.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                disabled={isDeletePending}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = productToDelete.id;
                  // Optimistic UI update: remove item immediately from local state
                  setLocalProducts((prev) => prev.filter((p) => p.id !== targetId));
                  setProductToDelete(null);
                  startDeleteTransition(async () => {
                    const res = await deleteProductAction(targetId);
                    if (res.status === "error") {
                      alert(`Error al eliminar: ${res.message}`);
                      setLocalProducts(products); // Rollback if error
                    } else {
                      router.refresh();
                    }
                  });
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-98 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-red-600/10 flex items-center gap-1.5"
                disabled={isDeletePending}
              >
                {isDeletePending ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
