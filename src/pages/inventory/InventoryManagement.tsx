import React, { useEffect, useState } from 'react'
import { inventoryService } from '../../services/inventory'
import type { Product, Category, StockLog } from '../../services/inventory'
import { supplierService } from '../../services/suppliers'
import type { Supplier } from '../../services/suppliers'
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  FolderPlus,
  Search,
  Package,
  Layers,
  Settings,
  X,
} from 'lucide-react'

type TabType = 'products' | 'categories' | 'stock_logs'

export const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stockLogs, setStockLogs] = useState<StockLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setCategory] = useState<Category | null>(null)

  const [adjustModalOpen, setAdjustModalOpen] = useState(false)

  // Form states
  const [prodForm, setProdForm] = useState({
    sku: '',
    name: '',
    category_id: '',
    supplier_id: '',
    purchase_price: 0,
    selling_price: 0,
    stock: 0,
    minimum_stock: 5,
    lead_time_days: 3,
    safety_stock: 5,
  })

  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
  })

  const [adjForm, setAdjForm] = useState({
    product_id: '',
    type: 'stock_in' as 'stock_in' | 'stock_out' | 'adjustment',
    quantity: 1,
    notes: '',
  })

  const [uiError, setUiError] = useState<string | null>(null)

  // Fetch initial data
  const loadData = async () => {
    setLoading(true)
    setUiError(null)
    try {
      const p = await inventoryService.getProducts()
      const c = await inventoryService.getCategories()
      const sups = await supplierService.getSuppliers()
      const s = await inventoryService.getStockLogs()
      setProducts(p)
      setCategories(c)
      setSuppliers(sups)
      setStockLogs(s)
    } catch (err: any) {
      setUiError(err?.message || 'Failed to fetch inventory data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Product CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUiError(null)

    // Form validations
    if (prodForm.selling_price < prodForm.purchase_price) {
      setUiError('Selling price cannot be less than purchase price')
      return
    }

    try {
      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct.id, {
          sku: prodForm.sku,
          name: prodForm.name,
          category_id: prodForm.category_id || null,
          supplier_id: prodForm.supplier_id || null,
          purchase_price: Number(prodForm.purchase_price),
          selling_price: Number(prodForm.selling_price),
          minimum_stock: Number(prodForm.minimum_stock),
          lead_time_days: Number(prodForm.lead_time_days),
          safety_stock: Number(prodForm.safety_stock),
          last_sold_at: editingProduct.last_sold_at,
          image_url: null,
        })
      } else {
        await inventoryService.createProduct({
          sku: prodForm.sku,
          name: prodForm.name,
          category_id: prodForm.category_id || null,
          supplier_id: prodForm.supplier_id || null,
          purchase_price: Number(prodForm.purchase_price),
          selling_price: Number(prodForm.selling_price),
          stock: Number(prodForm.stock),
          minimum_stock: Number(prodForm.minimum_stock),
          lead_time_days: Number(prodForm.lead_time_days),
          safety_stock: Number(prodForm.safety_stock),
          last_sold_at: null,
          image_url: null,
        })
      }
      setProductModalOpen(false)
      loadData()
    } catch (err: any) {
      setUiError(err?.message || 'Product operation failed.')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await inventoryService.deleteProduct(id)
      loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product')
    }
  }

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product)
    setProdForm({
      sku: product.sku,
      name: product.name,
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || '',
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock: product.stock, // stock is read-only during edit (adjusted via stock log!)
      minimum_stock: product.minimum_stock,
      lead_time_days: product.lead_time_days !== undefined ? product.lead_time_days : 3,
      safety_stock: product.safety_stock !== undefined ? product.safety_stock : 5,
    })
    setProductModalOpen(true)
  }

  const openAddProductModal = () => {
    setEditingProduct(null)
    setProdForm({
      sku: '',
      name: '',
      category_id: categories[0]?.id || '',
      supplier_id: '',
      purchase_price: 0,
      selling_price: 0,
      stock: 0,
      minimum_stock: 10,
      lead_time_days: 3,
      safety_stock: 5,
    })
    setProductModalOpen(true)
  }

  // Handle Category CRUD
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUiError(null)

    try {
      if (editingCategory) {
        await inventoryService.updateCategory(editingCategory.id, catForm.name, catForm.description || null)
      } else {
        await inventoryService.createCategory(catForm.name, catForm.description || null)
      }
      setCategoryModalOpen(false)
      loadData()
    } catch (err: any) {
      setUiError(err?.message || 'Category operation failed.')
    }
  }

  const openEditCategoryModal = (cat: Category) => {
    setCategory(cat)
    setCatForm({
      name: cat.name,
      description: cat.description || '',
    })
    setCategoryModalOpen(true)
  }

  const openAddCategoryModal = () => {
    setCategory(null)
    setCatForm({
      name: '',
      description: '',
    })
    setCategoryModalOpen(true)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Deleting this category will set affected products categories to unassigned. Proceed?')) return
    try {
      await inventoryService.deleteCategory(id)
      loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category')
    }
  }

  // Handle Stock Adjustment
  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUiError(null)

    if (!adjForm.product_id) {
      setUiError('Please select a product')
      return
    }

    try {
      await inventoryService.adjustStock(
        adjForm.product_id,
        adjForm.type,
        Number(adjForm.quantity),
        adjForm.notes || null
      )
      setAdjustModalOpen(false)
      loadData()
    } catch (err: any) {
      setUiError(err?.message || 'Stock adjustment failed.')
    }
  }

  const openAdjustModal = (prodId?: string) => {
    setAdjForm({
      product_id: prodId || products[0]?.id || '',
      type: 'stock_in',
      quantity: 1,
      notes: '',
    })
    setAdjustModalOpen(true)
  }

  // Filter products by search term
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Audit store products, organize category items, and record stock sheets.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'products' && (
            <>
              <button
                onClick={() => openAdjustModal()}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98]"
              >
                <Settings className="h-4 w-4" />
                <span>Adjust Stock</span>
              </button>
              <button
                onClick={openAddProductModal}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-purple-600/10"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={openAddCategoryModal}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-purple-600/10"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-4">
        {/* Navigation Tabs */}
        <div className="flex p-1 rounded-xl bg-zinc-950 border border-zinc-900/65 w-fit">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Products</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'categories' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => setActiveTab('stock_logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stock_logs' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Stock Ledger</span>
          </button>
        </div>

        {/* Live Search Bar */}
        {activeTab === 'products' && (
          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search product SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-zinc-900 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-transparent text-xs"
            />
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: PRODUCTS TABLE */}
          {activeTab === 'products' && (
            <div className="glass border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">SKU</th>
                      <th className="py-4 px-6">Product Name</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6">Supplier</th>
                      <th className="py-4 px-6 text-right">Purchase Price</th>
                      <th className="py-4 px-6 text-right">Selling Price</th>
                      <th className="py-4 px-6 text-center">Stock</th>
                      <th className="py-4 px-6 text-center">Min Stock</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 px-6 text-center text-zinc-500">
                          No products found. Add a product to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isLowStock = p.stock <= p.minimum_stock
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-zinc-900/20 transition-all ${
                              isLowStock ? 'bg-amber-950/5 hover:bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="py-4 px-6 font-mono text-xs font-semibold text-purple-400">
                              {p.sku}
                            </td>
                            <td className="py-4 px-6 font-medium text-white">
                              {p.name}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800/80 text-zinc-400">
                                {p.categories?.name || 'Unassigned'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-zinc-400">
                              {p.suppliers?.name || <span className="text-zinc-600 italic text-[10px]">Unassigned</span>}
                            </td>
                            <td className="py-4 px-6 text-right text-zinc-400">
                              {formatPrice(p.purchase_price)}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-white">
                              {formatPrice(p.selling_price)}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                    isLowStock
                                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/30'
                                      : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/20'
                                  }`}
                                >
                                  {p.stock}
                                </span>
                                {isLowStock && (
                                  <span title="Low Stock Warning!">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center text-zinc-500 font-mono text-xs">
                              {p.minimum_stock}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:border-purple-600/30 transition-all cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => openAdjustModal(p.id)}
                                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-indigo-600/30 transition-all cursor-pointer"
                                  title="Adjust Stock"
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-600/30 transition-all cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES LIST */}
          {activeTab === 'categories' && (
            <div className="glass border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Category Name</th>
                      <th className="py-4 px-6">Description</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 px-6 text-center text-zinc-500">
                          No categories found. Add one to start organizing products.
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-900/20 transition-all">
                          <td className="py-4 px-6 font-semibold text-white">
                            {c.name}
                          </td>
                          <td className="py-4 px-6 text-zinc-400 max-w-sm truncate">
                            {c.description || <span className="text-zinc-600 italic">No description</span>}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditCategoryModal(c)}
                                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:border-purple-600/30 transition-all cursor-pointer"
                                title="Edit Category"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(c.id)}
                                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-600/30 transition-all cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STOCK LEDGER */}
          {activeTab === 'stock_logs' && (
            <div className="glass border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Product</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-center">Quantity</th>
                      <th className="py-4 px-6">Notes</th>
                      <th className="py-4 px-6">Handled By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                    {stockLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-6 text-center text-zinc-500">
                          No stock entries recorded in ledger.
                        </td>
                      </tr>
                    ) : (
                      stockLogs.map((log) => {
                        const isStockIn = log.type === 'stock_in'
                        const isAdjustment = log.type === 'adjustment'
                        return (
                          <tr key={log.id} className="hover:bg-zinc-900/20 transition-all">
                            <td className="py-4 px-6 font-mono text-xs text-zinc-500">
                              {new Date(log.created_at).toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 font-medium text-white">
                              {log.products?.name || <span className="text-zinc-600 italic">Deleted Product</span>}
                            </td>
                            <td className="py-4 px-6">
                              {isStockIn ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/30">
                                  <ArrowUpCircle className="h-3.5 w-3.5" />
                                  <span>Stock In</span>
                                </span>
                              ) : isAdjustment ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-400 border border-purple-800/30">
                                  <Settings className="h-3.5 w-3.5" />
                                  <span>Adjustment</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-950/60 text-red-400 border border-red-800/30">
                                  <ArrowDownCircle className="h-3.5 w-3.5" />
                                  <span>Stock Out</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-bold">
                              <span className={log.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-zinc-400 max-w-xs truncate">
                              {log.notes || '-'}
                            </td>
                            <td className="py-4 px-6 text-xs text-zinc-500">
                              {log.profiles?.full_name || 'System'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          MODALS / FORM DIALOGS SECTION
      ------------------------------------------------------------- */}

      {/* 1. PRODUCT CREATION / EDITING DIALOG */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProductModalOpen(false)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {uiError && (
              <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-3 mb-4 text-xs text-red-400">
                {uiError}
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                    placeholder="SKU-XXX-001"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Category</label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Primary Supplier</label>
                <select
                  value={prodForm.supplier_id}
                  onChange={(e) => setProdForm({ ...prodForm, supplier_id: e.target.value })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="">No Supplier Assigned</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="Beras Ramos 5kg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Purchase Cost (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.purchase_price}
                    onChange={(e) => setProdForm({ ...prodForm, purchase_price: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono"
                    placeholder="12000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Selling Price (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.selling_price}
                    onChange={(e) => setProdForm({ ...prodForm, selling_price: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono"
                    placeholder="15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Minimum Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.minimum_stock}
                    onChange={(e) => setProdForm({ ...prodForm, minimum_stock: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={prodForm.stock}
                      onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                      className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Supplier Lead Time (Days)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.lead_time_days}
                    onChange={(e) => setProdForm({ ...prodForm, lead_time_days: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Safety Stock Buffer</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodForm.safety_stock}
                    onChange={(e) => setProdForm({ ...prodForm, safety_stock: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-purple-600/10"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CATEGORY CREATION / EDITING DIALOG */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCategoryModalOpen(false)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {uiError && (
              <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-3 mb-4 text-xs text-red-400">
                {uiError}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="Sembako"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Description</label>
                <textarea
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  rows={3}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none"
                  placeholder="Category description here..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-purple-600/10"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. STOCK ADJUSTMENT DIALOG */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAdjustModalOpen(false)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Perform Stock Adjustment</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {uiError && (
              <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-3 mb-4 text-xs text-red-400">
                {uiError}
              </div>
            )}

            <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Select Product</label>
                <select
                  value={adjForm.product_id}
                  onChange={(e) => setAdjForm({ ...adjForm, product_id: e.target.value })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Adjustment Type</label>
                  <select
                    value={adjForm.type}
                    onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value as any })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="stock_in">Stock In (Add)</option>
                    <option value="stock_out">Stock Out (Reduce)</option>
                    <option value="adjustment">Manual Correction (+/-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Notes / Rationale</label>
                <textarea
                  value={adjForm.notes}
                  onChange={(e) => setAdjForm({ ...adjForm, notes: e.target.value })}
                  rows={2}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none"
                  placeholder="e.g. Received shipment, audit stock correction, damaged goods..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-purple-600/10"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
