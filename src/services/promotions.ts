import { recommendationService } from './recommendations'
import { inventoryService } from './inventory'

export interface PromotionSuggestion {
  id: string
  type: 'clearance' | 'bundle'
  title: string
  description: string
  potentialRevenue: number
  ruleName: string
  suggestedDiscountPercent: number
  // For clearance:
  productId?: string
  originalPrice?: number
  promoPrice?: number
  // For bundles:
  bundleItems?: { productId: string; name: string; originalPrice: number }[]
  bundlePrice?: number
  savings?: number
}

export const promotionsService = {
  async getPromotionSuggestions(): Promise<PromotionSuggestion[]> {
    const { deadStockAnalysis } = await recommendationService.getDashboardInsights()
    const products = await inventoryService.getProducts()
    
    const suggestions: PromotionSuggestion[] = []

    // 1. Generate Clearance Suggestions for Dead Stock
    const deadStocks = deadStockAnalysis.filter((d) => d.classification === 'Dead Stock' && d.stock > 0)
    deadStocks.forEach((ds) => {
      const prod = products.find((p) => p.id === ds.productId)
      if (!prod) return
      
      const suggestedDiscountPercent = ds.daysSinceLastSale && ds.daysSinceLastSale > 30 ? 25 : 15
      const promoPrice = Math.round(prod.selling_price * (1 - suggestedDiscountPercent / 100))
      
      suggestions.push({
        id: `promo-clearance-${prod.id}`,
        type: 'clearance',
        title: `Clearance Markdown: ${prod.name}`,
        description: `Liquidate ${prod.stock} units of dead stock. Last sold ${ds.daysSinceLastSale !== null ? `${ds.daysSinceLastSale} days ago` : 'never'}.`,
        potentialRevenue: prod.stock * promoPrice,
        ruleName: 'Dead Stock Liquidation Rule',
        suggestedDiscountPercent,
        productId: prod.id,
        originalPrice: prod.selling_price,
        promoPrice,
      })
    })

    // 2. Generate Bundling suggestions
    const fastMoving = deadStockAnalysis.filter((d) => d.classification === 'Fast Moving')
    const slowOrDead = deadStockAnalysis.filter((d) => d.classification !== 'Fast Moving' && d.stock > 0)

    // Pair fast moving with slow/dead items
    const maxBundles = Math.min(fastMoving.length, slowOrDead.length, 3) // suggest top 3 bundles
    for (let i = 0; i < maxBundles; i++) {
      const fastItem = products.find((p) => p.id === fastMoving[i].productId)
      const slowItem = products.find((p) => p.id === slowOrDead[i].productId)
      
      if (fastItem && slowItem) {
        const totalOriginal = fastItem.selling_price + slowItem.selling_price
        const suggestedDiscountPercent = 10
        const bundlePrice = Math.round(totalOriginal * 0.90)
        
        suggestions.push({
          id: `promo-bundle-${fastItem.id}-${slowItem.id}`,
          type: 'bundle',
          title: `Smart Bundle Combo`,
          description: `Drive sales of slow-moving "${slowItem.name}" by bundling it with high-demand "${fastItem.name}" at a 10% discount.`,
          potentialRevenue: Math.round(slowItem.stock * bundlePrice),
          ruleName: 'Fast & Slow Cross-Sell Rule',
          suggestedDiscountPercent,
          bundleItems: [
            { productId: fastItem.id, name: fastItem.name, originalPrice: fastItem.selling_price },
            { productId: slowItem.id, name: slowItem.name, originalPrice: slowItem.selling_price },
          ],
          bundlePrice,
          savings: totalOriginal - bundlePrice,
        })
      }
    }

    return suggestions
  }
}
