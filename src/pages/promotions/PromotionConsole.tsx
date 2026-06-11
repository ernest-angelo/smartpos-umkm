import React, { useEffect, useState } from 'react'
import { promotionsService } from '../../services/promotions'
import type { PromotionSuggestion } from '../../services/promotions'
import {
  Sparkles,
  Tag,
  BadgePercent,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface ActiveCampaign {
  id: string
  title: string
  type: 'clearance' | 'bundle'
  description: string
  discountPercent: number
  status: 'active' | 'paused'
  startDate: string
}

const DEFAULT_CAMPAIGNS: ActiveCampaign[] = [
  {
    id: 'campaign-seeded-1',
    title: 'Sembako Hemat Combo',
    type: 'bundle',
    description: 'Minyak Goreng Filma 2L + Indomie Goreng bundle promo.',
    discountPercent: 10,
    status: 'active',
    startDate: new Date(Date.now() - 3600000 * 24 * 5).toLocaleDateString('id-ID'),
  },
  {
    id: 'campaign-seeded-2',
    title: 'Teh Botol Sosro Clearance',
    type: 'clearance',
    description: '15% Markdown to clear slow-moving beverage stocks.',
    discountPercent: 15,
    status: 'paused',
    startDate: new Date(Date.now() - 3600000 * 24 * 2).toLocaleDateString('id-ID'),
  }
]

export const PromotionConsole: React.FC = () => {
  const [suggestions, setSuggestions] = useState<PromotionSuggestion[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadPromotions = async () => {
    setLoading(true)
    try {
      const sug = await promotionsService.getPromotionSuggestions()
      setSuggestions(sug)
      
      // Load active campaigns from local storage
      const stored = localStorage.getItem('smartpos_active_campaigns')
      if (stored) {
        setActiveCampaigns(JSON.parse(stored))
      } else {
        localStorage.setItem('smartpos_active_campaigns', JSON.stringify(DEFAULT_CAMPAIGNS))
        setActiveCampaigns(DEFAULT_CAMPAIGNS)
      }
    } catch (err) {
      console.error('Failed to load promotions engine recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  const saveCampaigns = (campaigns: ActiveCampaign[]) => {
    setActiveCampaigns(campaigns)
    localStorage.setItem('smartpos_active_campaigns', JSON.stringify(campaigns))
  }

  const handleActivate = (sug: PromotionSuggestion) => {
    const newCampaign: ActiveCampaign = {
      id: `campaign-${Date.now()}`,
      title: sug.title,
      type: sug.type,
      description: sug.description,
      discountPercent: sug.suggestedDiscountPercent,
      status: 'active',
      startDate: new Date().toLocaleDateString('id-ID'),
    }

    saveCampaigns([newCampaign, ...activeCampaigns])
    setSuccessMessage(`Success: "${sug.title}" campaign has been activated!`)
    
    // Auto clear success message
    setTimeout(() => {
      setSuccessMessage(null)
    }, 4000)
  }

  const handleToggleStatus = (id: string) => {
    const updated: ActiveCampaign[] = activeCampaigns.map((c) => {
      if (c.id === id) {
        const nextStatus: 'active' | 'paused' = c.status === 'active' ? 'paused' : 'active'
        return { ...c, status: nextStatus }
      }
      return c
    })
    saveCampaigns(updated)
  }

  const handleDeleteCampaign = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional campaign?')) return
    const filtered = activeCampaigns.filter((c) => c.id !== id)
    saveCampaigns(filtered)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-pink-500" />
          <span>Intelligent Promotion Engine</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Automate clearance markdowns and cross-selling bundles using rule-based inventory analytics.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-2xl bg-emerald-950/40 border border-emerald-900/50 p-4 text-xs text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: Left: Suggestions, Right: Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Suggestions (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Tag className="h-5 w-5 text-pink-400" />
              <h3 className="font-bold text-white text-base">Clearance & Bundling Suggestions</h3>
            </div>

            {suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-zinc-900 border-dashed rounded-2xl text-zinc-500 text-sm">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <span>All inventory items are moving fast! No suggestions available.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((sug) => {
                  const isClearance = sug.type === 'clearance'
                  return (
                    <div
                      key={sug.id}
                      className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide ${
                            isClearance
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/30'
                              : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/30'
                          }`}>
                            {isClearance ? 'Clearance Sale' : 'Bundle Pack'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {sug.ruleName}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm line-clamp-2">
                          {sug.title}
                        </h4>
                        
                        <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                          {sug.description}
                        </p>

                        {/* Prices/Details list */}
                        {isClearance ? (
                          <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 p-2.5 rounded-xl text-xs border border-zinc-900">
                            <div>
                              <span className="text-[8px] text-zinc-500 block">Original</span>
                              <span className="font-mono text-zinc-400 line-through">{formatPrice(sug.originalPrice || 0)}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-rose-400 block">Promo Price</span>
                              <span className="font-mono font-bold text-rose-400">{formatPrice(sug.promoPrice || 0)}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-500 block">Discount</span>
                              <span className="font-mono font-bold text-emerald-400">{sug.suggestedDiscountPercent}% Off</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 bg-zinc-950/80 p-2.5 rounded-xl text-xs border border-zinc-900">
                            <span className="text-[8px] text-zinc-500 block">Includes items:</span>
                            {sug.bundleItems?.map((bi) => (
                              <div key={bi.productId} className="flex justify-between text-[10.5px]">
                                <span className="text-zinc-400 truncate max-w-[130px]">{bi.name}</span>
                                <span className="text-zinc-500 line-through font-mono">{formatPrice(bi.originalPrice)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-zinc-900 pt-1.5 font-bold text-[10.5px]">
                              <span className="text-indigo-400">Bundle Price:</span>
                              <span className="font-mono text-white">{formatPrice(sug.bundlePrice || 0)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 text-[10.5px]">
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">Est. Revenue Boost</span>
                          <span className="font-bold text-emerald-400 font-mono">{formatPrice(sug.potentialRevenue)}</span>
                        </div>
                        <button
                          onClick={() => handleActivate(sug)}
                          className="flex items-center gap-1 bg-pink-600 hover:bg-pink-500 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-pink-600/10"
                        >
                          Activate
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Active Campaigns (col-span-1) */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Running Campaigns</h3>
            </div>
            <span className="text-xs bg-indigo-950/40 text-indigo-400 border border-indigo-800/30 px-2 py-0.5 rounded-lg font-bold">
              {activeCampaigns.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeCampaigns.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 italic text-xs">
                No active promotional campaigns. Choose a suggestion to activate.
              </div>
            ) : (
              activeCampaigns.map((c) => {
                const isActive = c.status === 'active'
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                      isActive
                        ? 'bg-zinc-900/30 border-zinc-800/80'
                        : 'bg-zinc-950/20 border-zinc-900/40 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 max-w-[170px]">
                        <h5 className="font-semibold text-white text-xs truncate">
                          {c.title}
                        </h5>
                        <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">
                          {c.description}
                        </p>
                      </div>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/20'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900/50 pt-2.5">
                      <span className="text-[9px] text-zinc-500">
                        Started: {c.startDate}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(c.id)}
                          className={`p-1 rounded border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer hover:border-zinc-700 ${
                            isActive ? 'hover:text-amber-400' : 'hover:text-emerald-400'
                          }`}
                          title={isActive ? 'Pause Campaign' : 'Activate Campaign'}
                        >
                          {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c.id)}
                          className="p-1 rounded border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/30 cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="rounded-xl bg-zinc-950 border border-zinc-900 p-3.5 space-y-1.5">
            <h6 className="text-[10.5px] font-bold text-zinc-300 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Promotion Yield Analytics</span>
            </h6>
            <p className="text-[9.5px] text-zinc-400 leading-relaxed">
              Bundles pair slow-selling stock with highly demanded grocery staples. Clearance discount suggestions target capital locks.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
