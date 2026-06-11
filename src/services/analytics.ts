import { supabase } from '../config/supabase'
import type { Product, Category } from './inventory'
import type { Transaction, TransactionItem } from './sales'

export interface AnalyticsSummary {
  todayRevenue: number
  todayTransactions: number
  lowStockCount: number
  bestSellingProduct: string
  averageCartValue: number
  growthRate: number // compare today to yesterday
}

export interface ChartDataPoint {
  date: string
  revenue: number
  transactions: number
}

export interface PeakHourPoint {
  hour: string
  label: string
  count: number
}

export interface PeakDayPoint {
  day: string
  label: string
  count: number
}

export interface CategoryPerformancePoint {
  name: string
  revenue: number
  count: number
}

const checkIsDemo = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
    localStorage.getItem('smartpos_demo_role') !== null
  )
}

const getStoredData = <T>(key: string, defaultData: T[]): T[] => {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : defaultData
}

export const analyticsService = {
  // Fetch raw transactions and join transaction items for analysis
  async _getRawData(): Promise<{
    transactions: Transaction[]
    transactionItems: TransactionItem[]
    products: Product[]
    categories: Category[]
  }> {
    if (checkIsDemo()) {
      const transactions = getStoredData<Transaction>('smartpos_transactions', [])
      const transactionItems = getStoredData<TransactionItem>('smartpos_transaction_items', [])
      const products = getStoredData<Product>('smartpos_products', [])
      const categories = getStoredData<Category>('smartpos_categories', [])
      return { transactions, transactionItems, products, categories }
    }

    // Supabase Mode
    const { data: tx, error: txErr } = await supabase.from('transactions').select('*')
    if (txErr) throw txErr

    const { data: items, error: itemsErr } = await supabase.from('transaction_items').select('*')
    if (itemsErr) throw itemsErr

    const { data: prod, error: prodErr } = await supabase.from('products').select('*')
    if (prodErr) throw prodErr

    const { data: cat, error: catErr } = await supabase.from('categories').select('*')
    if (catErr) throw catErr

    return {
      transactions: tx as Transaction[],
      transactionItems: items as TransactionItem[],
      products: prod as Product[],
      categories: cat as Category[],
    }
  },

  // 1. KPI SUMMARY DATA
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const { transactions, transactionItems, products } = await this._getRawData()

    const todayStr = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 3600000 * 24)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    // Today's transactions
    const todayTransactions = transactions.filter(
      (t) => new Date(t.created_at).toISOString().slice(0, 10) === todayStr
    )

    // Yesterday's transactions
    const yesterdayTransactions = transactions.filter(
      (t) => new Date(t.created_at).toISOString().slice(0, 10) === yesterdayStr
    )

    const todayRevenue = todayTransactions.reduce((sum, t) => sum + Number(t.total), 0)
    const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + Number(t.total), 0)

    // Calculate growth compared to yesterday
    let growthRate = 0
    if (yesterdayRevenue > 0) {
      growthRate = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    } else if (todayRevenue > 0) {
      growthRate = 100
    }

    // Low stock count
    const lowStockCount = products.filter((p) => p.stock <= p.minimum_stock).length

    // Average order value today
    const averageCartValue =
      todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0

    // Best selling product in the last 30 days
    const productQuantities: Record<string, number> = {}
    transactionItems.forEach((item) => {
      if (item.product_name_snapshot) {
        productQuantities[item.product_name_snapshot] =
          (productQuantities[item.product_name_snapshot] || 0) + item.quantity
      }
    })

    let bestSellingProduct = 'None'
    let maxQty = 0
    Object.entries(productQuantities).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty
        bestSellingProduct = name
      }
    })

    return {
      todayRevenue,
      todayTransactions: todayTransactions.length,
      lowStockCount,
      bestSellingProduct: bestSellingProduct !== 'None' ? `${bestSellingProduct} (${maxQty} items)` : 'No sales yet',
      averageCartValue,
      growthRate,
    }
  },

  // 2. REVENUE TREND (For Line Charts)
  async getRevenueTrend(daysCount: number = 30): Promise<ChartDataPoint[]> {
    const { transactions } = await this._getRawData()
    const result: ChartDataPoint[] = []

    // Prepopulate array for the past N days
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(Date.now() - 3600000 * 24 * i)
      const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      const ISOStr = date.toISOString().slice(0, 10)

      // Filter tx for this day
      const dayTxs = transactions.filter(
        (t) => new Date(t.created_at).toISOString().slice(0, 10) === ISOStr
      )

      const revenue = dayTxs.reduce((sum, t) => sum + Number(t.total), 0)
      result.push({
        date: dateStr,
        revenue,
        transactions: dayTxs.length,
      })
    }

    return result
  },

  // 3. PEAK HOURS (For Bar Charts)
  async getPeakHours(): Promise<PeakHourPoint[]> {
    const { transactions } = await this._getRawData()

    // Initialize 24 hours
    const hourCounts: Record<number, number> = {}
    for (let h = 0; h < 24; h++) {
      hourCounts[h] = 0
    }

    // Aggregate transactions by hour
    transactions.forEach((t) => {
      const hour = new Date(t.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    // Map to chart array
    return Object.entries(hourCounts)
      .map(([hour, count]) => {
        const hVal = Number(hour)
        const label = `${hVal.toString().padStart(2, '0')}:00`
        return {
          hour: hour,
          label,
          count,
        }
      })
      .sort((a, b) => Number(a.hour) - Number(b.hour))
  },

  // 4. PEAK DAYS (For Bar Charts)
  async getPeakDays(): Promise<PeakDayPoint[]> {
    const { transactions } = await this._getRawData()

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }

    transactions.forEach((t) => {
      const day = new Date(t.created_at).getDay() // 0 is Sunday
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })

    // Map starting from Monday (1) to Sunday (0)
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.map((dayNum) => ({
      day: dayNum.toString(),
      label: dayLabels[dayNum],
      count: dayCounts[dayNum],
    }))
  },

  // 5. PRODUCT CATEGORY PERFORMANCE (For Pie Charts)
  async getCategoryPerformance(): Promise<CategoryPerformancePoint[]> {
    const { transactionItems, products, categories } = await this._getRawData()

    const categoryRevenue: Record<string, { revenue: number; count: number }> = {}

    // Initialize categories
    categories.forEach((c) => {
      categoryRevenue[c.name] = { revenue: 0, count: 0 }
    })
    categoryRevenue['Unassigned'] = { revenue: 0, count: 0 }

    // Map product IDs to category name
    const productCategoryMap: Record<string, string> = {}
    products.forEach((p) => {
      const cat = categories.find((c) => c.id === p.category_id)
      productCategoryMap[p.id] = cat ? cat.name : 'Unassigned'
    })

    // Aggregate revenues
    transactionItems.forEach((item) => {
      const prodId = item.product_id || ''
      const catName = productCategoryMap[prodId] || 'Unassigned'
      
      const rev = Number(item.subtotal)
      const qty = item.quantity

      if (!categoryRevenue[catName]) {
        categoryRevenue[catName] = { revenue: 0, count: 0 }
      }

      categoryRevenue[catName].revenue += rev
      categoryRevenue[catName].count += qty
    })

    return Object.entries(categoryRevenue)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        count: data.count,
      }))
      .filter((point) => point.revenue > 0) // only show categories with sales
  },
}
