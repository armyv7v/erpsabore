import React from 'react';
import { Filter, MapPin, ArrowUpDown, Edit, MoreVertical, Plus } from 'lucide-react';
import { mockProducts } from '@/data/inventory';

export default function InventoryPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header handled by Layout */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Inventario Central</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gestión y control de stock</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total SKU</p>
          <p className="text-2xl font-bold mt-1">1,284</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Stock Bajo</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">12</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Valor Total</p>
          <p className="text-2xl font-bold mt-1">$45.2k</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Almacenes</p>
          <p className="text-2xl font-bold mt-1">3</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button className="px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary whitespace-nowrap">Todos los Productos</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap">Stock Crítico</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap">Por Recibir</button>
          <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap">Descatalogados</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
            <Filter className="w-4 h-4" /> Categoría
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
            <MapPin className="w-4 h-4" /> Almacén
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
            <ArrowUpDown className="w-4 h-4" /> Ordenar por
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="hidden md:grid grid-cols-6 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 tracking-wider">
          <div className="col-span-2">Producto / SKU</div>
          <div>Precio Unit.</div>
          <div>Estado Stock</div>
          <div>Cantidad</div>
          <div className="text-right">Acciones</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockProducts.map((product) => (
            <div 
              key={product.id} 
              className={`p-4 flex flex-col md:grid md:grid-cols-6 md:items-center gap-4 ${
                product.status === 'low' ? 'bg-orange-50/30 dark:bg-primary/5' : 
                product.status === 'out_of_stock' ? 'bg-slate-50 dark:bg-slate-900/50 grayscale opacity-80' : ''
              }`}
            >
              <div className="col-span-2 flex items-center gap-4">
                <div 
                  className="size-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 bg-cover bg-center" 
                  style={{ backgroundImage: `url('${product.imageUrl}')` }}
                ></div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                </div>
              </div>

              <div className="flex justify-between md:block">
                <span className="md:hidden text-xs text-slate-500 uppercase font-bold">Precio:</span>
                <span className="text-sm font-medium">${product.price.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <div className={`flex justify-between text-[10px] font-bold uppercase ${
                  product.status === 'low' ? 'text-orange-600' : 
                  product.status === 'out_of_stock' ? 'text-red-600' : 'text-slate-500'
                }`}>
                  <span>{product.status === 'low' ? 'Bajo Stock' : product.status === 'out_of_stock' ? 'Agotado' : 'Nivel de Stock'}</span>
                  <span>{product.stockLevel}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      product.status === 'low' ? 'bg-orange-500' : 
                      product.status === 'out_of_stock' ? 'bg-red-500' : 'bg-green-500'
                    }`} 
                    style={{ width: `${product.stockLevel}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between md:block">
                <span className="md:hidden text-xs text-slate-500 uppercase font-bold">Cant:</span>
                <span className={`text-sm ${product.status !== 'normal' ? 'font-bold ' + (product.status === 'low' ? 'text-orange-600' : 'text-red-600') : ''}`}>
                  {product.quantity} uds
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-primary transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button className="md:hidden fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}