import { analyticsService } from './analytics'
import type { Product } from './inventory'

export interface RecommendationAlert {
  id: string
  type: 'low_stock' | 'reorder' | 'sales_drop' | 'dead_stock' | 'peak_hour'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  metadata?: {
    productId?: string
    sku?: string
    currentStock?: number
    rop?: number
    roq?: number
    dropPercentage?: number
    peakHourLabel?: string
  }
}

export interface RestockPrediction {
  productId: string
  productName: string
  sku: string
  currentStock: number
  avgDailySales: number
  rop: number
  roq: number
  depletionDays: number | null
  safetyStock: number
  leadTimeDays: number
  status: 'critical' | 'reorder' | 'healthy'
}

export interface DeadStockAnalysis {
  productId: string
  productName: string
  sku: string
  categoryName: string
  stock: number
  lastSoldAt: string | null
  daysSinceLastSale: number | null
  totalSold30Days: number
  classification: 'Fast Moving' | 'Slow Moving' | 'Dead Stock'
}

export const recommendationService = {
  // Core generator for all recommendations and alerts
  async getDashboardInsights(): Promise<{
    alerts: RecommendationAlert[]
    restockPredictions: RestockPrediction[]
    deadStockAnalysis: DeadStockAnalysis[]
  }> {
    const { transactions, transactionItems, products, categories } = await analyticsService._getRawData()

    const alerts: RecommendationAlert[] = []
    const restockPredictions: RestockPrediction[] = []
    const deadStockAnalysis: DeadStockAnalysis[] = []

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 3600000 * 24 * 30)
    const sevenDaysAgo = new Date(now.getTime() - 3600000 * 24 * 7)
    const fourteenDaysAgo = new Date(now.getTime() - 3600000 * 24 * 14)

    // 1. Calculate quantities sold per product in past 30 days
    const tx30Days = transactions.filter((t) => new Date(t.created_at) >= thirtyDaysAgo)
    const tx30Ids = new Set(tx30Days.map((t) => t.id))
    const items30Days = transactionItems.filter((item) => tx30Ids.has(item.transaction_id))

    const qtySold30Days: Record<string, number> = {}
    items30Days.forEach((item) => {
      if (item.product_id) {
        qtySold30Days[item.product_id] = (qtySold30Days[item.product_id] || 0) + item.quantity
      }
    })

    // Group products by category to calculate averages
    const productsByCategory: Record<string, Product[]> = {}
    products.forEach((p) => {
      const catId = p.category_id || 'unassigned'
      if (!productsByCategory[catId]) {
        productsByCategory[catId] = []
      }
      productsByCategory[catId].push(p)
    })

    const categoryAverages30D: Record<string, number> = {}
    Object.entries(productsByCategory).forEach(([catId, prods]) => {
      let totalSoldInCat = 0
      prods.forEach((p) => {
        totalSoldInCat += qtySold30Days[p.id] || 0
      })
      categoryAverages30D[catId] = prods.length > 0 ? totalSoldInCat / prods.length : 0
    })

    // 2. Process products for Restock Predictions and Dead Stock Classifications
    products.forEach((p) => {
      const totalSold30 = qtySold30Days[p.id] || 0
      const avgDailySales = Number((totalSold30 / 30).toFixed(2))

      // ROP & ROQ calculations
      const safetyStock = p.safety_stock !== undefined ? p.safety_stock : 5
      const leadTimeDays = p.lead_time_days !== undefined ? p.lead_time_days : 3
      const rop = Math.round(avgDailySales * leadTimeDays + safetyStock)
      const depletionDays = avgDailySales > 0 ? Number((p.stock / avgDailySales).toFixed(1)) : null

      // Recommended Reorder Quantity (ROQ) - standard 30 day cycle replenishment
      const rawRoq = avgDailySales * 30 + safetyStock - p.stock
      const roq = Math.max(0, Math.round(rawRoq))

      let status: 'critical' | 'reorder' | 'healthy' = 'healthy'
      if (p.stock <= p.minimum_stock) {
        status = 'critical'
      } else if (p.stock <= rop) {
        status = 'reorder'
      }

      restockPredictions.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        currentStock: p.stock,
        avgDailySales,
        rop,
        roq,
        depletionDays,
        safetyStock,
        leadTimeDays,
        status,
      })

      // Dead Stock Analysis
      const lastSold = p.last_sold_at
      const daysSinceLastSale = lastSold
        ? Math.floor((now.getTime() - new Date(lastSold).getTime()) / (3600000 * 24))
        : null

      const catId = p.category_id || 'unassigned'
      const catName = categories.find((c) => c.id === p.category_id)?.name || 'Unassigned'
      const catAvg = categoryAverages30D[catId] || 0

      let classification: 'Fast Moving' | 'Slow Moving' | 'Dead Stock' = 'Slow Moving'
      if (lastSold === null || (daysSinceLastSale !== null && daysSinceLastSale > 15)) {
        classification = 'Dead Stock'
      } else if (daysSinceLastSale !== null && daysSinceLastSale <= 7 && totalSold30 >= catAvg) {
        classification = 'Fast Moving'
      }

      deadStockAnalysis.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        categoryName: catName,
        stock: p.stock,
        lastSoldAt: lastSold,
        daysSinceLastSale,
        totalSold30Days: totalSold30,
        classification,
      })

      // Generate stock alerts
      if (status === 'critical') {
        alerts.push({
          id: `alert-lowstock-${p.id}`,
          type: 'low_stock',
          title: `Critical Low Stock: ${p.name}`,
          description: `Stock is at ${p.stock} units (Minimum required: ${p.minimum_stock}). Restock immediately.`,
          priority: 'high',
          metadata: { productId: p.id, sku: p.sku, currentStock: p.stock, roq },
        })
      } else if (status === 'reorder') {
        alerts.push({
          id: `alert-rop-${p.id}`,
          type: 'reorder',
          title: `Reorder Warning: ${p.name}`,
          description: `Stock level (${p.stock}) is below Reorder Point (${rop}). Suggested order quantity: ${roq} units.`,
          priority: 'medium',
          metadata: { productId: p.id, sku: p.sku, currentStock: p.stock, rop, roq },
        })
      }

      if (classification === 'Dead Stock') {
        const desc = lastSold
          ? `Product has not sold in the past ${daysSinceLastSale} days. Consider offering discount clearance to free up capital.`
          : 'Product has no transaction sales history. Consider running promotional bundling or repositioning layout.'
        alerts.push({
          id: `alert-dead-${p.id}`,
          type: 'dead_stock',
          title: `Dead Stock Alert: ${p.name}`,
          description: desc,
          priority: 'low',
          metadata: { productId: p.id, sku: p.sku, currentStock: p.stock },
        })
      }
    })

    // 3. Abnormal Sales Drop Alert (High Priority)
    const revenueThisWeek = transactions
      .filter((t) => new Date(t.created_at) >= sevenDaysAgo)
      .reduce((sum, t) => sum + Number(t.total), 0)

    const revenuePrecedingWeek = transactions
      .filter((t) => {
        const tDate = new Date(t.created_at)
        return tDate >= fourteenDaysAgo && tDate < sevenDaysAgo
      })
      .reduce((sum, t) => sum + Number(t.total), 0)

    if (revenuePrecedingWeek > 0) {
      const dropPercentage = ((revenuePrecedingWeek - revenueThisWeek) / revenuePrecedingWeek) * 100
      if (dropPercentage >= 15) {
        alerts.push({
          id: 'alert-salesdrop',
          type: 'sales_drop',
          title: 'Abnormal Weekly Sales Drop Detected',
          description: `Weekly revenue dropped by ${dropPercentage.toFixed(1)}% compared to the previous week (Rp ${revenuePrecedingWeek.toLocaleString('id-ID')} vs Rp ${revenueThisWeek.toLocaleString('id-ID')}). Check pricing or promotion.`,
          priority: 'high',
          metadata: { dropPercentage },
        })
      }
    }

    // 4. Peak Hour Alert (Low Priority)
    const hourCounts: Record<number, number> = {}
    transactions.forEach((t) => {
      const hour = new Date(t.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    let peakHour = -1
    let maxTxCount = 0
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxTxCount) {
        maxTxCount = count
        peakHour = Number(hour)
      }
    })

    if (peakHour !== -1 && maxTxCount > 1) {
      const currentHour = now.getHours()
      const diff = Math.abs(currentHour - peakHour)
      if (diff <= 1) {
        const label = `${peakHour.toString().padStart(2, '0')}:00`
        alerts.push({
          id: 'alert-peakhour',
          type: 'peak_hour',
          title: 'Peak Hour Period Approaching',
          description: `Current time is close to historical peak sales hour (${label}). Ensure cashier staffing and checkout processes are optimized.`,
          priority: 'low',
          metadata: { peakHourLabel: label },
        })
      }
    }

    // Sort alerts: high priority first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return {
      alerts,
      restockPredictions,
      deadStockAnalysis,
    }
  },
}
