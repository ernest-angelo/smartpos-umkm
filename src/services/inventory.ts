import { supabase } from '../config/supabase'
import type { Supplier } from './suppliers'
import { fraudService } from './fraud'

export interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category_id: string | null
  supplier_id: string | null
  purchase_price: number
  selling_price: number
  stock: number
  minimum_stock: number
  lead_time_days: number
  safety_stock: number
  last_sold_at: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  // Joined relations
  categories?: { name: string } | null
  suppliers?: { name: string } | null
}

export interface StockLog {
  id: string
  product_id: string
  type: 'stock_in' | 'stock_out' | 'adjustment'
  quantity: number
  notes: string | null
  created_by: string | null
  created_at: string
  // Joined relations
  products?: { name: string } | null
  profiles?: { full_name: string | null } | null
}

// -------------------------------------------------------------
// LOCAL STORAGE MOCK DATABASE SEED FOR DEMO MODE
// -------------------------------------------------------------
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Sembako',
    description: 'Bahan pokok makanan sehari-hari seperti beras, minyak, gula.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Minuman',
    description: 'Minuman ringan, air mineral, teh, kopi kemasan.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Makanan Ringan',
    description: 'Snack, biskuit, mie instan, cokelat.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Kebutuhan Rumah Tangga',
    description: 'Sabun, pasta gigi, detergen, pewangi pakaian.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    sku: 'SKU-SEM-001',
    name: 'Minyak Goreng Filma 2L',
    category_id: '10000000-0000-0000-0000-000000000001',
    supplier_id: '50000000-0000-0000-0000-000000000002',
    purchase_price: 28000,
    selling_price: 34000,
    stock: 45,
    minimum_stock: 10,
    lead_time_days: 3,
    safety_stock: 5,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    sku: 'SKU-SEM-002',
    name: 'Beras Ramos 5kg',
    category_id: '10000000-0000-0000-0000-000000000001',
    supplier_id: '50000000-0000-0000-0000-000000000002',
    purchase_price: 58000,
    selling_price: 68000,
    stock: 30,
    minimum_stock: 8,
    lead_time_days: 5,
    safety_stock: 10,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(), // 6 days ago
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    sku: 'SKU-SEM-003',
    name: 'Gula Pasir Gulaku 1kg',
    category_id: '10000000-0000-0000-0000-000000000001',
    supplier_id: '50000000-0000-0000-0000-000000000002',
    purchase_price: 12500,
    selling_price: 16000,
    stock: 5,
    minimum_stock: 15,
    lead_time_days: 2,
    safety_stock: 8,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 18).toISOString(), // 18 days ago (Dead Stock)
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    sku: 'SKU-MIN-001',
    name: 'Aqua 600ml',
    category_id: '10000000-0000-0000-0000-000000000002',
    supplier_id: '50000000-0000-0000-0000-000000000003',
    purchase_price: 2000,
    selling_price: 3500,
    stock: 120,
    minimum_stock: 24,
    lead_time_days: 2,
    safety_stock: 15,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), // 1 day ago
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    sku: 'SKU-MIN-002',
    name: 'Teh Botol Sosro 350ml',
    category_id: '10000000-0000-0000-0000-000000000002',
    supplier_id: '50000000-0000-0000-0000-000000000003',
    purchase_price: 3000,
    selling_price: 4500,
    stock: 48,
    minimum_stock: 12,
    lead_time_days: 3,
    safety_stock: 10,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10 days ago
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    sku: 'SKU-MAC-001',
    name: 'Indomie Goreng Spesial',
    category_id: '10000000-0000-0000-0000-000000000003',
    supplier_id: '50000000-0000-0000-0000-000000000001',
    purchase_price: 2500,
    selling_price: 3100,
    stock: 150,
    minimum_stock: 40,
    lead_time_days: 4,
    safety_stock: 20,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 0.5).toISOString(), // 12 hours ago
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    sku: 'SKU-KEB-001',
    name: 'Sabun Lifebuoy Merah 85g',
    category_id: '10000000-0000-0000-0000-000000000004',
    supplier_id: '50000000-0000-0000-0000-000000000004',
    purchase_price: 3200,
    selling_price: 4200,
    stock: 8,
    minimum_stock: 10,
    lead_time_days: 5,
    safety_stock: 5,
    last_sold_at: null, // Never sold (Dead Stock)
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    sku: 'SKU-KEB-002',
    name: 'Rinso Anti Noda 800g',
    category_id: '10000000-0000-0000-0000-000000000004',
    supplier_id: '50000000-0000-0000-0000-000000000004',
    purchase_price: 18000,
    selling_price: 22500,
    stock: 14,
    minimum_stock: 5,
    lead_time_days: 3,
    safety_stock: 5,
    last_sold_at: new Date(Date.now() - 3600000 * 24 * 25).toISOString(), // 25 days ago (Dead Stock)
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEFAULT_STOCK_LOGS: StockLog[] = DEFAULT_PRODUCTS.map((p) => ({
  id: `30000000-0000-0000-0000-${p.id.slice(-12)}`,
  product_id: p.id,
  type: 'stock_in',
  quantity: p.stock,
  notes: 'Initial setup stock import',
  created_by: '00000000-0000-0000-0000-000000000003', // staff gudang
  created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(), // 30 days ago
}))

// Helper to determine if we are running in Demo Mode
const checkIsDemo = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
    localStorage.getItem('smartpos_demo_role') !== null
  )
}

const getStoredData = <T>(key: string, defaultData: T[]): T[] => {
  const data = localStorage.getItem(key)
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultData))
    return defaultData
  }
  return JSON.parse(data)
}

const setStoredData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data))
}

// -------------------------------------------------------------
// EXPORTED INVENTORY SERVICE METHODS
// -------------------------------------------------------------

export const inventoryService = {
  // 1. CATEGORY METHODS
  async getCategories(): Promise<Category[]> {
    if (checkIsDemo()) {
      return getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Category[]
  },

  async createCategory(name: string, description: string | null): Promise<Category> {
    if (checkIsDemo()) {
      const categories = getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
      const newCategory: Category = {
        id: crypto.randomUUID(),
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      categories.push(newCategory)
      setStoredData('smartpos_categories', categories)
      return newCategory
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description }])
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async updateCategory(id: string, name: string, description: string | null): Promise<Category> {
    if (checkIsDemo()) {
      const categories = getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
      const index = categories.findIndex((c) => c.id === id)
      if (index === -1) throw new Error('Category not found')
      
      const updatedCategory: Category = {
        ...categories[index],
        name,
        description,
        updated_at: new Date().toISOString(),
      }
      categories[index] = updatedCategory
      setStoredData('smartpos_categories', categories)
      return updatedCategory
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async deleteCategory(id: string): Promise<void> {
    if (checkIsDemo()) {
      const categories = getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
      const filtered = categories.filter((c) => c.id !== id)
      setStoredData('smartpos_categories', filtered)
      
      // Update any products referencing this category to null
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      const updatedProducts = products.map((p) =>
        p.category_id === id ? { ...p, category_id: null } : p
      )
      setStoredData('smartpos_products', updatedProducts)
      return
    }

    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  },

  // 2. PRODUCT METHODS
  async getProducts(): Promise<Product[]> {
    if (checkIsDemo()) {
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      const categories = getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
      const suppliers = getStoredData<Supplier>('smartpos_suppliers', [])
      
      // Auto-patch older mock data format to prevent undefined fields
      let needsWrite = false
      const validatedProducts = products.map((p) => {
        let modified = false
        if (p.lead_time_days === undefined) {
          p.lead_time_days = 3
          modified = true
        }
        if (p.safety_stock === undefined) {
          p.safety_stock = 5
          modified = true
        }
        if (p.last_sold_at === undefined) {
          p.last_sold_at = null
          modified = true
        }
        if (p.supplier_id === undefined) {
          p.supplier_id = null
          modified = true
        }
        if (modified) {
          needsWrite = true
        }
        return p
      })

      if (needsWrite) {
        setStoredData('smartpos_products', validatedProducts)
      }

      // Join category and supplier names for presentation
      return validatedProducts.map((p) => {
        const cat = categories.find((c) => c.id === p.category_id)
        const sup = suppliers.find((s) => s.id === p.supplier_id)
        return {
          ...p,
          categories: cat ? { name: cat.name } : null,
          suppliers: sup ? { name: sup.name } : null,
        }
      })
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name), suppliers(name)')
      .order('name')

    if (error) throw error
    return data as Product[]
  },

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'categories' | 'suppliers'>): Promise<Product> {
    if (checkIsDemo()) {
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      
      // Check SKU uniqueness
      if (products.some((p) => p.sku.toLowerCase() === productData.sku.toLowerCase())) {
        throw new Error(`Product SKU "${productData.sku}" already exists`)
      }

      const newProduct: Product = {
        ...productData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      products.push(newProduct)
      setStoredData('smartpos_products', products)

      // Also log initial stock as a stock_in log
      if (newProduct.stock > 0) {
        await this.logInitialStock(newProduct.id, newProduct.stock)
      }

      const categories = getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
      const suppliers = getStoredData<Supplier>('smartpos_suppliers', [])
      const cat = categories.find((c) => c.id === newProduct.category_id)
      const sup = suppliers.find((s) => s.id === newProduct.supplier_id)
      return {
        ...newProduct,
        categories: cat ? { name: cat.name } : null,
        suppliers: sup ? { name: sup.name } : null,
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*, categories(name), suppliers(name)')
      .single()

    if (error) throw error

    // Log initial stock in Supabase
    if (data.stock > 0) {
      const authUser = (await supabase.auth.getUser()).data.user
      await supabase.from('stock_logs').insert([
        {
          product_id: data.id,
          type: 'stock_in',
          quantity: data.stock,
          notes: 'Initial stock entry upon product creation',
          created_by: authUser?.id || null,
        },
      ])
    }

    return data as Product
  },

  async updateProduct(
    id: string,
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'stock' | 'categories' | 'suppliers'>
  ): Promise<Product> {
    if (checkIsDemo()) {
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      const index = products.findIndex((p) => p.id === id)
      if (index === -1) throw new Error('Product not found')

      // Check SKU uniqueness excluding itself
      if (
        products.some(
          (p) => p.id !== id && p.sku.toLowerCase() === productData.sku.toLowerCase()
        )
      ) {
        throw new Error(`Product SKU "${productData.sku}" already exists`)
      }

      const updatedProduct: Product = {
        ...products[index],
        ...productData,
        updated_at: new Date().toISOString(),
      }
      products[index] = updatedProduct
      setStoredData('smartpos_products', products)

      const categories = getStoredData<Category>('smartpos_categories', DEFAULT_CATEGORIES)
      const suppliers = getStoredData<Supplier>('smartpos_suppliers', [])
      const cat = categories.find((c) => c.id === updatedProduct.category_id)
      const sup = suppliers.find((s) => s.id === updatedProduct.supplier_id)
      return {
        ...updatedProduct,
        categories: cat ? { name: cat.name } : null,
        suppliers: sup ? { name: sup.name } : null,
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, categories(name), suppliers(name)')
      .single()

    if (error) throw error
    return data as Product
  },

  async deleteProduct(id: string): Promise<void> {
    if (checkIsDemo()) {
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      const filtered = products.filter((p) => p.id !== id)
      setStoredData('smartpos_products', filtered)
      return
    }

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  // 3. STOCK ADJUSTMENT METHODS
  async getStockLogs(): Promise<StockLog[]> {
    if (checkIsDemo()) {
      const logs = getStoredData<StockLog>('smartpos_stock_logs', DEFAULT_STOCK_LOGS)
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      
      // Sort descending (latest logs first)
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return sortedLogs.map((log) => {
        const prod = products.find((p) => p.id === log.product_id)
        return {
          ...log,
          products: prod ? { name: prod.name } : null,
          profiles: { full_name: 'Staff Gudang / Owner' },
        }
      })
    }

    const { data, error } = await supabase
      .from('stock_logs')
      .select('*, products(name), profiles(full_name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as unknown as StockLog[]
  },

  async adjustStock(
    productId: string,
    type: 'stock_in' | 'stock_out' | 'adjustment',
    quantity: number,
    notes: string | null
  ): Promise<StockLog> {
    // Determine sign: stock_out and adjustment (if negative) should reduce stock
    const changeAmount = type === 'stock_out' ? -Math.abs(quantity) : quantity

    if (checkIsDemo()) {
      const products = getStoredData<Product>('smartpos_products', DEFAULT_PRODUCTS)
      const pIndex = products.findIndex((p) => p.id === productId)
      if (pIndex === -1) throw new Error('Product not found')

      const currentStock = products[pIndex].stock
      const nextStock = currentStock + changeAmount

      if (nextStock < 0) {
        throw new Error(
          `Insufficient stock. Current: ${currentStock}, adjustment would result in ${nextStock}`
        )
      }

      // Update product stock
      products[pIndex].stock = nextStock
      products[pIndex].updated_at = new Date().toISOString()
      setStoredData('smartpos_products', products)

      // Insert stock log
      const logs = getStoredData<StockLog>('smartpos_stock_logs', DEFAULT_STOCK_LOGS)
      const newLog: StockLog = {
        id: crypto.randomUUID(),
        product_id: productId,
        type,
        quantity: changeAmount,
        notes,
        created_by: '00000000-0000-0000-0000-000000000003', // default staff
        created_at: new Date().toISOString(),
      }
      logs.push(newLog)
      setStoredData('smartpos_stock_logs', logs)

      // Trigger mismatch adjustment log if stock is adjusted down manually
      if (changeAmount < 0) {
        await fraudService.logSuspiciousActivity({
          cashier_id: '00000000-0000-0000-0000-000000000003',
          type: 'mismatch_adjustment',
          description: `Manual stock adjustment down by ${Math.abs(changeAmount)} units for product "${products[pIndex].name}" (Notes: "${notes || 'None'}").`,
          severity: 'warning'
        })
      }

      return {
        ...newLog,
        products: { name: products[pIndex].name },
        profiles: { full_name: 'Gudang Staff' },
      }
    }

    // Supabase Mode
    // 1. Fetch current stock to validate
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', productId)
      .single()

    if (pError) throw pError
    if (!product) throw new Error('Product not found')

    const nextStock = product.stock + changeAmount
    if (nextStock < 0) {
      throw new Error(`Insufficient stock for ${product.name}. Current: ${product.stock}`)
    }

    // 2. Perform updates
    const authUser = (await supabase.auth.getUser()).data.user
    
    // Insert Log
    const { data: logData, error: logError } = await supabase
      .from('stock_logs')
      .insert([
        {
          product_id: productId,
          type,
          quantity: changeAmount,
          notes,
          created_by: authUser?.id || null,
        },
      ])
      .select()
      .single()

    if (logError) throw logError

    // Update Product Stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: nextStock, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (updateError) throw updateError

    // Trigger mismatch adjustment log if stock is adjusted down manually
    if (changeAmount < 0) {
      await fraudService.logSuspiciousActivity({
        cashier_id: authUser?.id || null,
        type: 'mismatch_adjustment',
        description: `Manual stock adjustment down by ${Math.abs(changeAmount)} units for product "${product.name}" (Notes: "${notes || 'None'}").`,
        severity: 'warning'
      })
    }

    return {
      ...logData,
      products: { name: product.name },
      profiles: { full_name: authUser?.email || 'System User' },
    } as unknown as StockLog
  },

  // Private helper for initial mock seeding
  async logInitialStock(productId: string, quantity: number): Promise<void> {
    const logs = getStoredData<StockLog>('smartpos_stock_logs', DEFAULT_STOCK_LOGS)
    const newLog: StockLog = {
      id: crypto.randomUUID(),
      product_id: productId,
      type: 'stock_in',
      quantity,
      notes: 'Initial stock log on product creation',
      created_by: '00000000-0000-0000-0000-000000000003',
      created_at: new Date().toISOString(),
    }
    logs.push(newLog)
    setStoredData('smartpos_stock_logs', logs)
  },
}
