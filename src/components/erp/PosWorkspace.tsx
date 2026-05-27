"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { 
  Search, ShoppingCart, CreditCard, Banknote, Landmark, Smartphone, 
  Trash2, User, FileText, ShoppingBag, Plus, Minus, Send, Copy, Clipboard, Check, X 
} from "lucide-react";
import { submitPosSaleAction } from "@/app/actions/pos";
import TicketReceipt from "./TicketReceipt";
import type { ActionState } from "@/lib/types/erp";

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  stockQuantity: number;
  stockStatus: "normal" | "low" | "out_of_stock";
  imageUrl: string | null;
}

interface PosWorkspaceProps {
  products: Product[];
  branches: Array<{ id: string; name: string }>;
}

interface CartItem {
  product: Product;
  qty: number;
}

export default function PosWorkspace({ products: initialProducts, branches }: PosWorkspaceProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Datos cliente
  const [customerName, setCustomerName] = useState("Cliente General");
  const [customerRut, setCustomerRut] = useState("66.666.666-6");
  const [customerEmail, setCustomerEmail] = useState("");
  
  // Opciones de cobro
  const [dteType, setDteType] = useState<number>(39); // 39 = Boleta, 33 = Factura
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  
  // WhatsApp & Pedidos Web Panel
  const [whatsAppText, setWhatsAppText] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [parsedItemsMessage, setParsedItemsMessage] = useState("");
  const [orderQueue, setOrderQueue] = useState([
    {
      id: "WEB-9901",
      customer: "Juan Carlos Pérez",
      rut: "18.345.981-4",
      items: [
        { sku: "INS-0001-ROLLO-KRAFT-20-CMS", qty: 2 },
        { sku: "INS-0203-VASO-POLIPAPEL-BLAN", qty: 1 }
      ],
      total: 10037,
      source: "Web Online"
    },
    {
      id: "WSP-3829",
      customer: "Marta Gómez SpA",
      rut: "76.891.221-5",
      items: [
        { sku: "INS-0002-ROLLO-KRAFT-40-CMS", qty: 1 }
      ],
      total: 9900,
      source: "WhatsApp"
    }
  ]);

  // Transiciones y estados del DTE
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<ActionState>({ status: "idle", message: "" });
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCashPopup, setShowCashPopup] = useState(false);

  // Escáner de código de barras físico (Simulado por teclado a nivel global)
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  // Totales
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.qty * item.product.unitPrice, 0), [cart]);
  const tax = useMemo(() => Math.round(subtotal - subtotal / 1.19), [subtotal]); // 19% IVA
  const changeDue = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - subtotal);
  }, [amountPaid, subtotal]);

  // Montos rápidos de billetes inteligentes para cobros en efectivo
  const smartCashAmounts = useMemo(() => {
    if (subtotal <= 0) return [];
    
    const amounts = new Set<number>();
    
    // 1. Monto Exacto
    amounts.add(subtotal);
    
    // 2. Redondeo al billete más cercano mayor que el total (Pesos Chilenos)
    const bills = [1000, 2000, 5000, 10000, 20000];
    
    // Agregar el primer billete que cubre el subtotal
    const nextBill = bills.find((b) => b > subtotal);
    if (nextBill) {
      amounts.add(nextBill);
    }
    
    // Agregar el siguiente billete mayor
    if (nextBill) {
      const idx = bills.indexOf(nextBill);
      if (idx !== -1 && idx + 1 < bills.length) {
        amounts.add(bills[idx + 1]);
      }
    }
    
    // Redondeos prácticos a múltiplos de $500 o $1.000
    const rounded500 = Math.ceil(subtotal / 500) * 500;
    if (rounded500 > subtotal) {
      amounts.add(rounded500);
    }

    const rounded1000 = Math.ceil(subtotal / 1000) * 1000;
    if (rounded1000 > subtotal) {
      amounts.add(rounded1000);
    }

    // Convertir a array ordenado y limitar a un máximo de 4 botones rápidos
    return Array.from(amounts).sort((a, b) => a - b).slice(0, 4);
  }, [subtotal]);

  // Agregar al carrito
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) return;
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.qty + 1;
        if (nextQty > product.stockQuantity) return currentCart;
        return currentCart.map((item) =>
          item.product.id === product.id ? { ...item, qty: nextQty } : item
        );
      }
      return [...currentCart, { product, qty: 1 }];
    });
  };

  // Decrementar carrito
  const removeFromCart = (productId: string) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.product.id === productId);
      if (!existing) return currentCart;
      if (existing.qty === 1) {
        return currentCart.filter((item) => item.product.id !== productId);
      }
      return currentCart.map((item) =>
        item.product.id === productId ? { ...item, qty: item.qty - 1 } : item
      );
    });
  };

  // Actualizar cantidad directamente
  const updateCartQty = (productId: string, qty: number) => {
    setCart((currentCart) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return currentCart;
      
      if (qty <= 0) {
        return currentCart.filter((item) => item.product.id !== productId);
      }
      
      const clampedQty = Math.min(qty, product.stockQuantity);
      const existing = currentCart.find((item) => item.product.id === productId);
      
      if (existing) {
        return currentCart.map((item) =>
          item.product.id === productId ? { ...item, qty: clampedQty } : item
        );
      }
      
      return [...currentCart, { product, qty: clampedQty }];
    });
  };

  // Eliminar completamente de la línea
  const deleteLine = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.product.id !== productId));
  };

  // Lector de códigos de barra (Hook de teclado global)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      
      // Los scanners hardware ingresan caracteres rápido (< 40ms por tecla)
      if (now - lastKeyTime.current > 100) {
        barcodeBuffer.current = ""; // Reset si el usuario escribe lento
      }
      
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 2) {
          const barcode = barcodeBuffer.current.trim().toUpperCase();
          // Buscar SKU
          const matched = products.find(p => p.sku.toUpperCase() === barcode || p.sku.toUpperCase().includes(barcode));
          if (matched) {
            addToCart(matched);
            // Efecto de sonido corto simulado
            console.log(`[POS Scanner] Producto escaneado: ${matched.name}`);
          }
          barcodeBuffer.current = "";
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products]);

  // Cargar pedido externo (Web o WhatsApp) en el POS
  const loadOrder = (order: typeof orderQueue[0]) => {
    const loadedCart: CartItem[] = [];
    order.items.forEach((item) => {
      const product = products.find((p) => p.sku === item.sku);
      if (product) {
        loadedCart.push({ product, qty: item.qty });
      }
    });

    if (loadedCart.length > 0) {
      setCart(loadedCart);
      setCustomerName(order.customer);
      setCustomerRut(order.rut);
      setDteType(order.rut.startsWith("76") || order.rut.startsWith("77") ? 33 : 39); // Auto-detecta si es Factura
      setWhatsAppText("");
      setParsedItemsMessage(`Se cargó con éxito el pedido ${order.id}.`);
      setActiveTab("catalog");
    }
  };

  // Parsear texto del carrito de WhatsApp Business
  const handleParseWhatsApp = () => {
    if (!whatsAppText.trim()) return;

    // Patrón simple: busca líneas que contengan números seguidos de 'x' o 'und' y descripciones
    // Ejemplo: "*1x Rollo Kraft 20 cms*" o "2 unidades de Papel antigrasa"
    const lines = whatsAppText.split("\n");
    const matchedCart: CartItem[] = [];

    lines.forEach((line) => {
      const cleanLine = line.replace(/[*_~]/g, "").trim();
      const matchQty = cleanLine.match(/^(\d+)\s*(?:x|und|unidades|unds)?\s+(.+)$/i) || 
                       cleanLine.match(/^(.+?)\s+(\d+)\s*(?:x|und|unidades|unds)$/i);
      
      if (matchQty) {
        const qty = parseInt(matchQty[1] || matchQty[2]);
        const namePart = (matchQty[2] || matchQty[1]).trim().toLowerCase();

        // Buscar producto similar por nombre
        const matchedProduct = products.find((p) => 
          p.name.toLowerCase().includes(namePart) || namePart.includes(p.name.toLowerCase())
        );

        if (matchedProduct) {
          matchedCart.push({ product: matchedProduct, qty: Math.min(qty, matchedProduct.stockQuantity) });
        }
      }
    });

    if (matchedCart.length > 0) {
      setCart(matchedCart);
      setParsedItemsMessage(`¡Éxito! Se detectaron ${matchedCart.length} productos del texto de WhatsApp.`);
      setWhatsAppText("");
    } else {
      setParsedItemsMessage("No pudimos reconocer ningún producto del texto. Intenta copiarlo nuevamente.");
    }
  };

  // Procesar cobro real mediante Server Action
  const handleProcessSale = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  const executeProcessSale = () => {
    if (cart.length === 0) return;
    setShowConfirmModal(false);

    const fd = new FormData();
    fd.append("customerName", customerName);
    fd.append("customerRut", customerRut);
    fd.append("customerEmail", customerEmail);
    fd.append("dteType", String(dteType));
    fd.append("paymentMethod", paymentMethod);
    fd.append("amountPaid", amountPaid || String(subtotal));

    // Cart items a JSON
    const itemsJson = JSON.stringify(
      cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        qty: item.qty,
        unitPrice: item.product.unitPrice,
      }))
    );
    fd.append("itemsJson", itemsJson);

    startTransition(async () => {
      setFormState({ status: "idle", message: "" });
      const res = await submitPosSaleAction({ status: "idle", message: "" }, fd);
      
      setFormState(res);

      if (res.status === "success" && res.dteResult) {
        // Descontar stock localmente en UI
        setProducts((currentProducts) =>
          currentProducts.map((p) => {
            const cartItem = cart.find((item) => item.product.id === p.id);
            if (cartItem) {
              const newQty = p.stockQuantity - cartItem.qty;
              return {
                ...p,
                stockQuantity: newQty,
                stockStatus: newQty === 0 ? "out_of_stock" : newQty <= 10 ? "low" : "normal",
              };
            }
            return p;
          })
        );

        // Abrir previsualización de ticket
        setCompletedSale({
          folio: res.dteResult.folio,
          pdfUrl: res.dteResult.pdfUrl,
          total: res.dteResult.total,
          paymentMethod: res.dteResult.paymentMethod,
          change: res.dteResult.change,
        });

        // Limpiar carrito
        setCart([]);
        setAmountPaid("");
        setCustomerName("Cliente General");
        setCustomerRut("66.666.666-6");
        setCustomerEmail("");
      }
    });
  };

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    });
  }, [products, searchQuery]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      
      {/* PANEL IZQUIERDO: Catálogo de Productos y Cola Pedidos */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800">
        
        {/* Barra de búsqueda y Tab Control */}
        <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por SKU, Nombre o código de barra (F1)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium transition-all"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "catalog"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Catálogo de Venta
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Pedidos Externos</span>
              {orderQueue.length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-extrabold">
                  {orderQueue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* FEEDBACK MENSAJE DE PARSER */}
        {parsedItemsMessage && (
          <div className="mx-4 mt-3 bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between">
            <span>{parsedItemsMessage}</span>
            <button onClick={() => setParsedItemsMessage("")} className="text-primary hover:underline text-[10px] font-extrabold uppercase">Cerrar</button>
          </div>
        )}

        {/* CONTENIDO TAB */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === "catalog" ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {filteredProducts.map((p) => {
                const cartQty = cart.find((item) => item.product.id === p.id)?.qty || 0;
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col rounded-xl bg-white border p-2.5 shadow-sm hover:shadow-md transition-all dark:bg-slate-950 dark:border-slate-800 ${
                      p.stockQuantity <= 0 ? "opacity-50" : ""
                    }`}
                  >
                    {/* Contenido principal clickable */}
                    <div
                      onClick={() => p.stockQuantity > 0 && addToCart(p)}
                      className="cursor-pointer flex flex-col flex-1"
                    >
                      {/* Imagen de Catálogo */}
                      <div className="aspect-square w-full rounded-lg bg-slate-100 dark:bg-slate-900 mb-1.5 overflow-hidden relative">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                        
                        {/* Cantidad en Carrito (Badge) */}
                        {cartQty > 0 && (
                          <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[9px] font-extrabold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-md animate-scale-up">
                            {cartQty}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-[11px] leading-tight text-slate-800 dark:text-slate-250 line-clamp-2 h-7.5">
                        {p.name}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono pt-0.5">{p.sku.substring(0, 12)}...</p>

                      {/* Precio */}
                      <div className="pt-1.5 mt-auto">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-slate-150">
                          ${p.unitPrice.toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {/* Fila de Controles de Cantidad / Stock */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-150 dark:border-slate-800 mt-1.5 h-7">
                      {cartQty > 0 ? (
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(p.id);
                            }}
                            className="p-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          
                          <input
                            type="number"
                            value={cartQty}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              updateCartQty(p.id, val);
                            }}
                            className="w-8 text-center font-extrabold text-[10px] outline-none bg-transparent text-slate-800 dark:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className="p-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-[9px] text-slate-400 font-bold">
                            Stock: {p.stockQuantity}
                          </span>

                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold ${
                            p.stockQuantity === 0
                              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                              : p.stockQuantity <= 10
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                          }`}>
                            {p.stockQuantity === 0 ? "Agotado" : p.stockQuantity <= 10 ? "Bajo" : "Stock"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB: PEDIDOS EXTERNOS / WHATSAPP QUEUE */
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* WhatsApp Raw-Text Parser */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="text-green-500 w-5 h-5" />
                  <h3 className="font-bold text-sm">Copiar y Pegar Carrito de WhatsApp</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Pegá el texto recibido del cliente y nuestro motor de IA local relacionará los productos con tu catálogo Sabore.
                </p>
                <textarea
                  value={whatsAppText}
                  onChange={(e) => setWhatsAppText(e.target.value)}
                  placeholder="Ej: *1 x Rollo Kraft 20 cms - $5.000*&#10;*1 x Papel antigrasa 28x34 cm - $31.000*"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <button
                  onClick={handleParseWhatsApp}
                  disabled={!whatsAppText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Cargar Carrito de WhatsApp</span>
                </button>
              </div>

              {/* Cola de Pedidos en Espera */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-350">Pedidos Pendientes de Confirmación</h3>
                <div className="grid gap-3">
                  {orderQueue.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-primary">{order.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-350">
                            {order.source}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{order.customer}</p>
                        <p className="text-[10px] text-slate-400">RUT: {order.rut}</p>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-200">
                            ${order.total.toLocaleString("es-CL")}
                          </p>
                          <p className="text-[10px] text-slate-400">{order.items.length} items</p>
                        </div>
                        <button
                          onClick={() => loadOrder(order)}
                          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                          Cargar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Venta, Cliente y Barra de Pago */}
      <div className="w-[410px] bg-white dark:bg-slate-950 flex flex-col overflow-hidden shadow-xl z-10">
        
        {/* Barra Cabecera Carrito */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm">Resumen de Venta</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* LISTADO ITEMS CARRITO */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              <p className="text-xs font-semibold">El carrito está vacío</p>
              <p className="text-[10px] text-slate-500">Agrega productos o escanea un código de barra</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-2 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{item.product.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                    ${item.product.unitPrice.toLocaleString("es-CL")} x ud
                  </p>
                </div>

                {/* Controles cantidad */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 rounded-lg border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs w-4 text-center">{item.qty}</span>
                  <button
                    onClick={() => addToCart(item.product)}
                    className="p-1 rounded-lg border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="font-extrabold text-xs text-slate-900 dark:text-slate-200">
                    ${(item.qty * item.product.unitPrice).toLocaleString("es-CL")}
                  </p>
                  <button
                    onClick={() => deleteLine(item.product.id)}
                    className="text-[9px] font-bold text-red-500 hover:underline pt-0.5"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FORMULARIO CLIENTE & CONFIG DTE */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 space-y-3.5">
          
          {/* Selector de DTE */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => {
                setDteType(39);
                setCustomerName("Cliente General");
                setCustomerRut("66.666.666-6");
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                dteType === 39
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Boleta Electrónica (39)
            </button>
            <button
              onClick={() => {
                setDteType(33);
                if (customerRut === "66.666.666-6") {
                  setCustomerName("");
                  setCustomerRut("");
                }
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                dteType === 33
                  ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Factura Electrónica (33)
            </button>
          </div>

          {/* Campos del cliente */}
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-slate-500">RUT Cliente</label>
                <input
                  type="text"
                  value={customerRut}
                  onChange={(e) => setCustomerRut(e.target.value.toUpperCase())}
                  placeholder="12.345.678-K"
                  className="w-full rounded-lg border border-slate-250 dark:border-slate-700 px-3 py-1.8 bg-white dark:bg-slate-900 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Razón Social / Nombre</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Juan Carlos Gómez SpA"
                  className="w-full rounded-lg border border-slate-250 dark:border-slate-700 px-3 py-1.8 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            {dteType === 33 && (
              <div>
                <label className="block font-semibold mb-1 text-slate-500">Correo Tributario Receptor</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="facturas@empresa.cl"
                  className="w-full rounded-lg border border-slate-250 dark:border-slate-700 px-3 py-1.8 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
          </div>

        </div>

        {/* METODOS DE PAGO Y VUELTO */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4">
          
          {/* Totales */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal Neto</span>
              <span>${Math.round(subtotal / 1.19).toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>I.V.A (19%)</span>
              <span>${tax.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between font-extrabold text-base text-slate-900 dark:text-slate-100 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span>TOTAL A COBRAR</span>
              <span>${subtotal.toLocaleString("es-CL")}</span>
            </div>
          </div>

          {/* Grid de métodos de pago - Optimizado y Compacto */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Método de Pago</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "cash", label: "Efectivo", icon: Banknote },
                { id: "debit", label: "Débito", icon: CreditCard },
                { id: "credit", label: "Crédito", icon: CreditCard },
                { id: "transfer", label: "Transf.", icon: Landmark },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id === "cash") {
                        setShowCashPopup(true);
                      } else {
                        setAmountPaid("");
                      }
                    }}
                    className={`flex items-center justify-center py-2 px-1 rounded-xl border transition-all text-[10px] font-extrabold gap-1 ${
                      paymentMethod === method.id
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-450"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indicador compacto de pago en efectivo */}
          {paymentMethod === "cash" && amountPaid && cart.length > 0 && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold animate-fade-in">
              <div className="flex items-center gap-1.5 text-slate-650 dark:text-slate-350">
                <Banknote className="w-4 h-4 text-green-500" />
                <span>Paga con: <strong className="text-slate-855 dark:text-slate-100">${(parseFloat(amountPaid) || subtotal).toLocaleString("es-CL")}</strong></span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-450 block uppercase font-bold">Vuelto:</span>
                <span className="font-extrabold text-green-600 dark:text-green-400">${changeDue.toLocaleString("es-CL")}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCashPopup(true)} 
                className="ml-2 text-[10px] font-bold text-primary hover:underline"
              >
                Editar
              </button>
            </div>
          )}

          {paymentMethod === "cash" && !amountPaid && cart.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCashPopup(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-all animate-fade-in"
            >
              <Banknote className="w-4 h-4" />
              <span>Ingresar Monto Recibido</span>
            </button>
          )}

          {/* BOTÓN COBRAR Y CONFIRMAR VENTA */}
          {formState.status === "error" && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-2 text-xs font-semibold">
              {formState.message}
            </div>
          )}

          <button
            onClick={handleProcessSale}
            disabled={cart.length === 0 || isPending}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/95 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98]"
          >
            {isPending ? (
              <span>Emitiendo DTE Fiscal...</span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Confirmar Pago y Emitir DTE</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE PRE-VENTA INTERACTIVO */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
            
            {/* Cabecera del Modal */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <span>Confirmación de Venta</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verificá el detalle de la venta antes de emitir el documento tributario.
                </p>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Lista de productos (Columna Izquierda 3/5) */}
              <div className="md:col-span-3 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-350 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800/80">
                  Lista de Productos ({cart.length})
                </h4>
                <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div 
                      key={item.product.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                          SKU: {item.product.sku}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-slate-250">
                          ${(item.qty * item.product.unitPrice).toLocaleString("es-CL")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.qty} x ${item.product.unitPrice.toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalles y Totales (Columna Derecha 2/5) */}
              <div className="md:col-span-2 space-y-4">
                
                {/* Tipo de Documento */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento Tributario</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    dteType === 39 
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-350"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-350"
                  }`}>
                    <FileText className="w-3.5 h-3.5" />
                    <span>{dteType === 39 ? "Boleta Electrónica (39)" : "Factura Electrónica (33)"}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receptor / Cliente</span>
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">{customerName || "Cliente General"}</p>
                    <p className="font-mono text-slate-500 text-[10px]">RUT: {customerRut || "66.666.666-6"}</p>
                    {customerEmail && (
                      <p className="text-[10px] text-slate-400 truncate">Email: {customerEmail}</p>
                    )}
                  </div>
                </div>

                {/* Detalles de Pago */}
                <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Detalle del Pago</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-650 dark:text-slate-400">
                      <span>Método:</span>
                      <span className="font-extrabold flex items-center gap-1 capitalize">
                        {paymentMethod === "cash" && <Banknote className="w-3.5 h-3.5 text-green-500" />}
                        {(paymentMethod === "debit" || paymentMethod === "credit") && <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
                        {paymentMethod === "transfer" && <Landmark className="w-3.5 h-3.5 text-purple-500" />}
                        {paymentMethod === "cash" ? "Efectivo" : paymentMethod === "debit" ? "Débito" : paymentMethod === "credit" ? "Crédito" : "Transferencia"}
                      </span>
                    </div>
                    {paymentMethod === "cash" && (
                      <>
                        <div className="flex justify-between text-slate-650 dark:text-slate-400">
                          <span>Entregado:</span>
                          <span className="font-bold text-slate-850 dark:text-slate-200">
                            ${(parseFloat(amountPaid) || subtotal).toLocaleString("es-CL")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800 text-green-600 dark:text-green-400">
                          <span className="font-extrabold">Su Vuelto:</span>
                          <span className="font-extrabold text-sm">
                            ${changeDue.toLocaleString("es-CL")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Total Final */}
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-3.5 rounded-2xl space-y-1">
                  <span className="block text-[10px] font-extrabold text-primary uppercase tracking-wider text-center">Total a Cobrar</span>
                  <div className="text-center font-extrabold text-2xl text-primary tracking-tight">
                    ${subtotal.toLocaleString("es-CL")}
                  </div>
                </div>

              </div>

            </div>

            {/* Botones de Acción */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/20">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Volver
              </button>
              
              <button
                type="button"
                onClick={executeProcessSale}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-orange-600/10 active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Pago y Emitir DTE</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP DE COBRO EN EFECTIVO TRANSLÚCIDO (MODAL) */}
      {showCashPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up p-5 space-y-4">
            
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/85">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Cobro en Efectivo</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowCashPopup(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Caja de Total */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Total a Cobrar:</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                ${subtotal.toLocaleString("es-CL")}
              </span>
            </div>

            {/* Input de Monto Recibido */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500">Monto Entregado por el Cliente</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-extrabold text-base">$</span>
                <input
                  type="number"
                  value={amountPaid}
                  autoFocus
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`${subtotal}`}
                  className="w-full rounded-2xl border border-slate-250 dark:border-slate-700 pl-8 pr-4 py-3 bg-slate-50/50 dark:bg-slate-900/20 text-lg font-extrabold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-850 dark:text-slate-150"
                />
              </div>
            </div>

            {/* Billetes Rápidos */}
            {smartCashAmounts.length > 0 && (
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montos Rápidos (Billetes)</span>
                <div className="grid grid-cols-4 gap-2">
                  {smartCashAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountPaid(String(amt))}
                      className={`py-2 rounded-xl border text-xs font-extrabold text-center transition-all ${
                        Number(amountPaid) === amt
                          ? "bg-primary border-primary text-white shadow-md scale-[1.03]"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-750 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {amt === subtotal ? "Exacto" : `$${amt.toLocaleString("es-CL")}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caja de Vuelto */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Su Vuelto:</span>
              <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                ${changeDue.toLocaleString("es-CL")}
              </span>
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAmountPaid("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Limpiar
              </button>
              
              <button
                type="button"
                onClick={() => setShowCashPopup(false)}
                className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs transition-colors shadow-md shadow-green-600/10 active:scale-[0.98]"
              >
                Confirmar Monto
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE TICKET / DTE COMPLETADO */}
      {completedSale && (
        <TicketReceipt
          sale={completedSale}
          customer={{
            name: customerName,
            rut: customerRut,
            email: customerEmail,
          }}
          items={cart.map((item) => ({
            name: item.product.name,
            qty: item.qty,
            unitPrice: item.product.unitPrice,
          }))}
          dteType={dteType}
          onClose={() => setCompletedSale(null)}
        />
      )}

    </div>
  );
}
