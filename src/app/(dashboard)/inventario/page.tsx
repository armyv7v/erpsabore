"use client";
import React, { useState, useMemo } from 'react';
import { Filter, MapPin, ArrowUpDown, Edit, MoreVertical, Plus, Search, X } from 'lucide-react';
import { mockProducts, Product } from '@/data/inventory';

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', quantity: '' });

  // Filter products based on search and tabs
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTab = activeTab === 'all' ? true : 
                         activeTab === 'low' ? product.status === 'low' : 
                         activeTab === 'out' ? product.status === 'out_of_stock' : true;

      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Simulando agregar: ${newProduct.name}`);
    setIsModalOpen(false);
    setNewProduct({ name: '', sku: '', price: '', quantity: '' }); // reset
  };

  return (
    <div className="p-4 md:p-8 space-y-6 relative">
      {/* Header handled by Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario Central</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestión y control de stock</p>
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
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Todos los Productos
          </button>
          <button 
            onClick={() => setActiveTab('low')}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'low' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Stock Crítico
          </button>
          <button 
            onClick={() => setActiveTab('out')}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeTab === 'out' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Agotados
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" /> Categoría
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <MapPin className="w-4 h-4" /> Almacén
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No se encontraron productos con esos filtros.</div>
          ) : (
            filteredProducts.map((product) => (
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
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal - Añadir Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold">Añadir Nuevo Producto</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre del Producto</label>
                <input 
                  type="text" required
                  value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ej. Taladro Percutor 20V"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">SKU</label>
                  <input 
                    type="text" required
                    value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                    placeholder="HERR-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Cantidad Inicial</label>
                  <input 
                    type="number" required min="0"
                    value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Precio Unitario (CLP)</label>
                <input 
                  type="number" required min="0"
                  value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="25000"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}