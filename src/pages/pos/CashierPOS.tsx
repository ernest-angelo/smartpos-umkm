import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { inventoryService } from '../../services/inventory'
import type { Product, Category } from '../../services/inventory'
import {
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Printer,
  Calculator,
  Receipt,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Package,
} from 'lucide-react'

export const CashierPOS: React.FC = () => {
  const { profile } = useAuth()
  const {
    cartItems,
    subtotal,
    discount,
    total,
    addItem,
    updateQuantity,
    removeItem,
    setDiscount,
    checkoutCart,
    clearCart,
  } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Checkout dialog states
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [cashReceived, setCashReceived] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  
  // Post-checkout success states (for receipt printing)
  const [completedOrder, setCompletedOrder] = useState<{
    invoiceNumber: string
    dateTime: string
    cashierName: string
    items: typeof cartItems
    subtotal: number
    discount: number
    total: number
    amountPaid: number
    change: number
    paymentMethod: string
  } | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  const printAreaRef = useRef<HTMLDivElement>(null)

  // Fetch products and categories
  const loadPOSData = async () => {
    setLoading(true)
    try {
      const p = await inventoryService.getProducts()
      const c = await inventoryService.getCategories()
      setProducts(p)
      setCategories(c)
    } catch (err) {
      console.error('Failed to load POS catalog:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPOSData()
  }, [])

  // Filter products based on search term & category selection
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Format currencies
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Pre-configured Quick Cash Buttons
  const getQuickCashSuggestions = () => {
    if (total <= 0) return []
    const suggestions = new Set<number>()
    // Exact amount
    suggestions.add(total)
    
    // Round to nearest 10k, 20k, 50k, 100k
    const denominations = [10000, 20000, 50000, 100000]
    denominations.forEach((denom) => {
      const rounded = Math.ceil(total / denom) * denom
      if (rounded > total) {
        suggestions.add(rounded)
      }
    })

    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 4)
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutError(null)

    const cashierId = profile?.id || '00000000-0000-0000-0000-000000000002'
    const finalAmountPaid = paymentMethod === 'cash' ? Number(cashReceived) : total

    if (paymentMethod === 'cash' && finalAmountPaid < total) {
      setCheckoutError('Cash received is less than total price')
      return
    }

    try {
      const checkoutSnapshot = [...cartItems] // Clone items for receipt snapshot
      const { invoiceNumber } = await checkoutCart(cashierId, paymentMethod, finalAmountPaid)
      
      // Save details for printing receipt
      setCompletedOrder({
        invoiceNumber,
        dateTime: new Date().toLocaleString('id-ID'),
        cashierName: profile?.full_name || 'Cashier Siti',
        items: checkoutSnapshot,
        subtotal,
        discount,
        total,
        amountPaid: finalAmountPaid,
        change: Math.max(0, finalAmountPaid - total),
        paymentMethod,
      })

      // Close checkout dialog and open receipt dialog
      setCheckoutOpen(false)
      setCashReceived('')
      setReceiptOpen(true)

      // Reload POS catalog to reflect updated stock levels
      loadPOSData()
    } catch (err: any) {
      setCheckoutError(err?.message || 'Failed to complete transaction checkout')
    }
  }

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML
    
    if (printContent) {
      // Simple inline iframe/window replacement for printing
      const printWindow = window.open('', '', 'height=600,width=400')
      if (printWindow) {
        printWindow.document.write('<html><head><title>Thermal Receipt</title>')
        printWindow.document.write('<style>')
        printWindow.document.write(`
          body { font-family: monospace; font-size: 12px; color: #000; padding: 20px; width: 300px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
          .flex { display: flex; justify-content: space-between; }
          .mb-1 { margin-bottom: 4px; }
        `)
        printWindow.document.write('</style></head><body>')
        printWindow.document.write(printContent)
        printWindow.document.write('</body></html>')
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* 1. LEFT PANEL: CATALOG & SEARCH (Flexible grid) */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/20">
        {/* Search & Category Pills */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search product name or scan SKU barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-900 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                selectedCategory === null
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-zinc-900 border-dashed rounded-3xl text-zinc-500">
              <Package className="h-10 w-10 mb-2 opacity-50" />
              <span>No products found matching filters.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0
                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => addItem(p)}
                    className={`glass text-left border rounded-2xl p-4 flex flex-col justify-between h-40 transition-all active:scale-[0.98] select-none ${
                      isOutOfStock
                        ? 'opacity-40 border-zinc-900 bg-zinc-900/10 cursor-not-allowed'
                        : 'border-zinc-900 hover:border-purple-600/50 hover:bg-zinc-900/10 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono font-semibold text-purple-400">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                            p.stock <= p.minimum_stock
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/20'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}
                        >
                          Stock: {p.stock}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-sm line-clamp-2 mt-1.5">
                        {p.name}
                      </h4>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-end">
                      <span className="text-sm font-extrabold text-white">
                        {formatPrice(p.selling_price)}
                      </span>
                      {isOutOfStock && (
                        <span className="text-[9px] font-bold text-red-500 bg-red-950/20 border border-red-900/30 px-1.5 py-0.5 rounded-lg">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: SHOPPING CART (Fixed width on desktop) */}
      <div className="w-full lg:w-96 glass border border-zinc-900 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
        {/* Background Visual Highlight */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-600/5 blur-[50px]"></div>

        <div>
          {/* Cart Header */}
          <div className="flex justify-between items-center pb-4 border-b border-zinc-900 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-400" />
              <span className="font-bold text-white">Checkout Cart</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-800/30 font-bold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          </div>

          {/* Cart Item Rows */}
          <div className="overflow-y-auto max-h-[calc(100vh-27rem)] space-y-3.5 pr-1 mb-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                <Receipt className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs font-semibold">Shopping cart is empty</span>
                <span className="text-[10px] text-zinc-600 mt-1 max-w-xs">
                  Click on catalog products to add them to checkout cart.
                </span>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 p-3 bg-zinc-900/40 border border-zinc-900/60 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-white text-xs truncate">
                      {item.product.name}
                    </h5>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">
                      {formatPrice(item.product.selling_price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Invoice Summary & Checkout Actions */}
        <div className="border-t border-zinc-900 pt-4 space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(subtotal)}</span>
            </div>

            {/* Discount Section */}
            <div className="flex justify-between items-center text-zinc-400">
              <span>Discount (Rp)</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="Flat Discount"
                className="w-24 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-right text-white font-mono"
              />
            </div>

            <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-900/60">
              <span>Total Price</span>
              <span className="text-purple-400 font-mono">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="py-2.5 border border-zinc-800 hover:border-red-900/30 bg-zinc-900/20 hover:bg-red-950/10 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Clear Cart
            </button>
            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={cartItems.length === 0}
              className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-purple-600/10 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS / OVERLAY LAYOUTS SECTION
      ------------------------------------------------------------- */}

      {/* 1. CHECKOUT MODAL: PAYMENT INPUT & CHANGE CALCULATOR */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-400" />
                <span>Process Payment Checkout</span>
              </h3>
              <button onClick={() => setCheckoutOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-3 mb-4 text-xs text-red-400">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              {/* Payment Methods selector */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center justify-center py-2 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-purple-500 bg-purple-950/20 text-purple-400'
                        : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`flex flex-col items-center justify-center py-2 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'qris'
                        ? 'border-purple-500 bg-purple-950/20 text-purple-400'
                        : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">QRIS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex flex-col items-center justify-center py-2 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-purple-500 bg-purple-950/20 text-purple-400'
                        : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-1" />
                    <span className="text-[10px] font-semibold">Transfer</span>
                  </button>
                </div>
              </div>

              {/* Total Due Indicator */}
              <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl flex justify-between items-center">
                <span className="text-zinc-400 text-xs font-semibold">Total Amount Due</span>
                <span className="text-xl font-extrabold text-purple-400 font-mono">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Cash payment amount inputs */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Cash Received (Rp)</label>
                    <input
                      type="number"
                      required
                      min={total}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                      className="block w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-lg text-right focus:outline-none focus:ring-1 focus:ring-purple-600"
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  {/* Cash Suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {getQuickCashSuggestions().map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setCashReceived(amount)}
                        className="px-3 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-mono cursor-pointer transition-all active:scale-[0.98]"
                      >
                        {formatPrice(amount)}
                      </button>
                    ))}
                  </div>

                  {/* Change returned calculator */}
                  {cashReceived !== '' && cashReceived >= total && (
                    <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-2xl flex justify-between items-center animate-pulse">
                      <span className="text-purple-300 text-xs font-bold">Change to Return</span>
                      <span className="text-xl font-extrabold text-emerald-400 font-mono">
                        {formatPrice(cashReceived - total)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="px-4 py-2.5 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-purple-600/10 transition-all active:scale-[0.98]"
                >
                  Complete Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. RECEIPT/INVOICE THERMAL PREVIEW MODAL */}
      {receiptOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setReceiptOpen(false)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scaleUp z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-purple-400" />
                <span>Transaction Checkout Success</span>
              </h3>
              <button onClick={() => setReceiptOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thermal Receipt Print Area */}
            <div
              ref={printAreaRef}
              className="p-5 bg-white text-black font-mono text-xs rounded-xl shadow-inner border border-zinc-300"
            >
              <div className="text-center">
                <span className="bold text-sm">SMARTPOS STORE</span><br />
                <span>UMKM Retail Shop</span><br />
                <span>Jakarta, Indonesia</span><br />
                <span className="divider flex">-----------------------------</span>
              </div>

              <div className="mb-1 flex">
                <span>Date:</span>
                <span>{completedOrder.dateTime}</span>
              </div>
              <div className="mb-1 flex">
                <span>Inv No:</span>
                <span className="bold">{completedOrder.invoiceNumber}</span>
              </div>
              <div className="mb-1 flex">
                <span>Cashier:</span>
                <span>{completedOrder.cashierName}</span>
              </div>
              <div className="divider flex">-----------------------------</div>

              {/* Item list */}
              <div className="space-y-1.5">
                {completedOrder.items.map((item) => (
                  <div key={item.product.id}>
                    <div className="bold">{item.product.name}</div>
                    <div className="flex">
                      <span>{item.quantity} x {formatPrice(item.product.selling_price)}</span>
                      <span>{formatPrice(item.product.selling_price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="divider flex">-----------------------------</div>

              <div className="flex mb-1">
                <span>Subtotal</span>
                <span>{formatPrice(completedOrder.subtotal)}</span>
              </div>
              <div className="flex mb-1">
                <span>Discount</span>
                <span>-{formatPrice(completedOrder.discount)}</span>
              </div>
              <div className="flex bold text-sm mb-1">
                <span>TOTAL</span>
                <span>{formatPrice(completedOrder.total)}</span>
              </div>
              <div className="divider flex">-----------------------------</div>

              <div className="flex mb-1">
                <span>Payment:</span>
                <span className="bold uppercase">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex mb-1">
                <span>Paid</span>
                <span>{formatPrice(completedOrder.amountPaid)}</span>
              </div>
              {completedOrder.paymentMethod === 'cash' && (
                <div className="flex bold mb-1">
                  <span>Change due</span>
                  <span>{formatPrice(completedOrder.change)}</span>
                </div>
              )}

              <div className="text-center mt-6">
                <span className="bold text-[10px]">Thank you for shopping!</span><br />
                <span className="text-[9px]">Powered by SmartPOS UMKM</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between gap-2 border-t border-zinc-900 mt-6">
              <button
                type="button"
                onClick={() => setReceiptOpen(false)}
                className="flex-1 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close View
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-purple-600/10 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
