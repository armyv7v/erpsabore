import React from 'react';
import { PackageSearch, ShoppingCart, Search, Filter, ShoppingBag, Ban } from 'lucide-react';
import { mockCatalogProducts } from '@/data/catalog';
import Image from 'next/image';

export default function CatalogPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header specifically for Catalog (reusing some Layout spacing) */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="text-primary flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <PackageSearch className="w-6 h-6" />
          </div>
          <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Catálogo Digital</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative flex size-12 cursor-pointer items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">3</span>
          </button>
        </div>
      </div>

      <main className="flex-1 pb-24 md:p-8">
        {/* Search Bar */}
        <div className="px-4 py-4 md:px-0">
          <label className="flex flex-col w-full group">
            <div className="flex w-full items-stretch rounded-xl h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-primary transition-colors shadow-sm">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <Search className="w-5 h-5" />
              </div>
              <input 
                className="form-input flex w-full border-none bg-transparent focus:ring-0 px-3 text-base placeholder:text-slate-400 dark:text-slate-100 outline-none" 
                placeholder="Buscar por nombre o SKU..." 
                type="text"
              />
              <button className="px-4 text-primary font-medium flex items-center gap-1 hover:bg-primary/5 rounded-r-xl transition-colors">
                <Filter className="w-4 h-4 hidden sm:block" /> Filtrar
              </button>
            </div>
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-4 md:px-0 overflow-x-auto no-scrollbar pb-4">
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-full bg-primary text-white text-sm font-semibold shadow-md shadow-primary/20">Todos</button>
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-primary transition-colors">Electrónica</button>
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-primary transition-colors">Ferretería</button>
          <button className="flex h-9 shrink-0 items-center justify-center px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:border-primary transition-colors">Ofertas</button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 md:px-0">
          {mockCatalogProducts.map((product) => (
            <div 
              key={product.id} 
              className={`flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md ${product.stock === 0 ? 'grayscale opacity-60' : 'hover:border-primary/30'}`}
            >
              <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <Image 
                  src={product.imageUrl} 
                  alt={product.name} 
                  fill 
                  className="object-cover transition-transform hover:scale-105"
                  unoptimized
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm ${product.stock > 0 ? (product.stock < 10 ? 'bg-orange-500/90' : 'bg-green-500/90') : 'bg-red-500/90'}`}>
                  {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin Stock'}
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">{product.sku}</p>
                <h3 className="text-slate-900 dark:text-slate-100 text-sm font-bold leading-tight mt-1 mb-2 line-clamp-2" title={product.name}>
                  {product.name}
                </h3>
                <p className={`text-lg font-bold leading-none mt-auto ${product.stock > 0 ? 'text-primary' : 'text-slate-400'}`}>
                  \${product.price.toLocaleString('es-CL')} <span className="text-[10px] text-slate-400 font-normal">CLP</span>
                </p>
                
                <button 
                  className={`mt-3 w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    product.stock > 0 
                      ? 'bg-primary hover:bg-primary/90 text-white active:scale-95 shadow-sm shadow-primary/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  }`}
                  disabled={product.stock === 0}
                >
                  {product.stock > 0 ? (
                    <><ShoppingBag className="w-4 h-4" /> AÑADIR</>
                  ) : (
                    <><Ban className="w-4 h-4" /> AGOTADO</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}