"use client";

import React, { useState } from "react";
import { X, Package, ShoppingCart, Sliders, Maximize2, Info } from "lucide-react";
import ImageZoomLightbox from "./ImageZoomLightbox";

interface GeneralProduct {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  stockQuantity: number;
  stockMinQuantity?: number;
  stockStatus?: "normal" | "low" | "out_of_stock";
  imageUrl: string | null;
  description?: string | null;
  category?: string | null;
}

interface Props {
  product: GeneralProduct;
  onClose: () => void;
  onAddToCart?: () => void; // Si se provee, muestra botón de añadir (Catálogo)
  onEdit?: () => void; // Si se provee, muestra botón de editar (Inventario)
}

function formatCLP(value: number) {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function getStockStatusDetails(product: GeneralProduct) {
  const stock = product.stockQuantity;
  const min = product.stockMinQuantity ?? 10;
  
  if (stock === 0) {
    return { label: "Agotado", colorClass: "text-red-500 bg-red-500/10 border-red-500/20", levelPercent: 0 };
  }
  if (stock <= min) {
    return { label: "Stock Crítico", colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20", levelPercent: Math.min(100, Math.round((stock / (min * 5)) * 100)) };
  }
  return { label: "Normal", colorClass: "text-green-500 bg-green-500/10 border-green-500/20", levelPercent: Math.min(100, Math.round((stock / (min * 5)) * 100)) };
}

export default function ProductDetailsModal({ product, onClose, onAddToCart, onEdit }: Props) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { label: stockLabel, colorClass: stockBadgeClass, levelPercent } = getStockStatusDetails(product);

  const displayDescription = product.description || product.category || "Sin descripción disponible.";

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
          
          {/* Lado Izquierdo: Imagen */}
          <div className="md:w-1/2 aspect-square md:aspect-auto bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative cursor-zoom-in group overflow-hidden border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80">
            {product.imageUrl ? (
              <>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay de zoom en hover */}
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-bold gap-2"
                >
                  <div className="size-11 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-500">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs tracking-wider uppercase">Ver foto ampliada</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16">
                <Package className="w-16 h-16 text-slate-350 dark:text-slate-600" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sin foto cargada</span>
              </div>
            )}
          </div>

          {/* Lado Derecho: Detalles */}
          <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-6 relative">
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              {/* SKU Badge */}
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-650 dark:text-slate-350">
                  {product.sku}
                </span>
                <span className={`border rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${stockBadgeClass}`}>
                  {stockLabel}
                </span>
              </div>

              {/* Título */}
              <h2 className="text-xl font-extrabold leading-tight text-slate-900 dark:text-white pr-6">
                {product.name}
              </h2>

              {/* Precio */}
              <div className="py-2.5 border-y border-slate-100 dark:border-slate-800/80">
                <p className="text-xs text-slate-450 uppercase font-bold tracking-wider">Precio Unitario</p>
                <p className="text-2xl font-black text-primary mt-1">
                  {formatCLP(product.unitPrice)}
                  <span className="text-xs text-slate-400 font-bold uppercase"> CLP</span>
                </p>
              </div>

              {/* Stock info */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Stock Disponible</span>
                  <span className={product.stockQuantity === 0 ? "text-red-500 font-extrabold" : "text-slate-850 dark:text-slate-200"}>
                    {product.stockQuantity} uds
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      product.stockQuantity === 0
                        ? "bg-red-500"
                        : product.stockQuantity <= (product.stockMinQuantity ?? 10)
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${levelPercent}%` }}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-450 uppercase font-bold tracking-wider">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Descripción / Info</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 max-h-32 overflow-y-auto">
                  {displayDescription}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/85">
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart();
                    onClose();
                  }}
                  disabled={product.stockQuantity === 0}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>AÑADIR AL CARRITO</span>
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700/60"
                >
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>EDITAR PRODUCTO</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox para zoom */}
      {isLightboxOpen && product.imageUrl && (
        <ImageZoomLightbox imageUrl={product.imageUrl} onClose={() => setIsLightboxOpen(false)} />
      )}
    </>
  );
}
