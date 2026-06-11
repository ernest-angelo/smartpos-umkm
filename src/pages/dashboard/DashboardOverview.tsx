import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { analyticsService } from '../../services/analytics'
import type { AnalyticsSummary, ChartDataPoint } from '../../services/analytics'
import { recommendationService } from '../../services/recommendations'
import type { RecommendationAlert, RestockPrediction, DeadStockAnalysis } from '../../services/recommendations'
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  Clock,
  Coins,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export const DashboardOverview: React.FC = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [weeklyTrend, setWeeklyTrend] = useState<ChartDataPoint[]>([])
  const [insights, setInsights] = useState<{
    alerts: RecommendationAlert[]
    restockPredictions: RestockPrediction[]
    deadStockAnalysis: DeadStockAnalysis[]
  } | null>(null)
  const [decisionTab, setDecisionTab] = useState<'restock' | 'deadstock'>('restock')
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const sumData = await analyticsService.getAnalyticsSummary()
      const trendData = await analyticsService.getRevenueTrend(7) // Fetch 7 days for weekly trend
      const insightData = await recommendationService.getDashboardInsights()

      setSummary(sumData)
      setWeeklyTrend(trendData)
      setInsights(insightData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Welcome back, {profile?.full_name || 'Smart Employee'}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Here is what is happening at your retail store today.
          </p>
        </div>
        
        {/* Quick Cashier Action for Cashier/Owner */}
        {(profile?.role === 'owner' || profile?.role === 'cashier') && (
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-purple-600/10 w-fit"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Open Cashier POS</span>
          </button>
        )}
      </div>

      {/* Overview KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Revenue Card */}
          <div className="glass border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Revenue</span>
                <h3 className="text-3xl font-extrabold text-white">{formatPrice(summary.todayRevenue)}</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className={`mt-4 flex items-center text-xs gap-1 font-semibold ${
              summary.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {summary.growthRate >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{Math.abs(summary.growthRate).toFixed(1)}% compared to yesterday</span>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="glass border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Orders</span>
                <h3 className="text-3xl font-extrabold text-white">{summary.todayTransactions} Transactions</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-400 gap-1 font-semibold">
              <span>Avg basket: {formatPrice(summary.averageCartValue)}</span>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className="glass border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Low Stock Alerts</span>
                <h3 className="text-3xl font-extrabold text-white">{summary.lowStockCount} Products</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-amber-400 gap-1 font-semibold">
              <span>{summary.lowStockCount > 0 ? 'Needs restock adjustments' : 'All stock levels healthy'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts: Weekly Sales Trend & Low Stock Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Weekly Sales Trend Chart */}
        <div className="lg:col-span-2 glass border border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Weekly Revenue Trend</h3>
              <p className="text-xs text-zinc-400">Daily gross revenue share for the last 7 days</p>
            </div>
            {profile?.role === 'owner' && (
              <button
                onClick={() => navigate('/analytics')}
                className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Full Analytics</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeeklyRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                  formatter={(value: any) => [formatPrice(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorWeeklyRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Store Alert Feed & Action Center */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Store Alert Feed</h3>
              <p className="text-xs text-zinc-400">Real-time operational recommendations</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-all hover:bg-zinc-950 cursor-pointer"
              title="Refresh Insights"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!insights || insights.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center py-12">
                <PackageCheck className="h-8 w-8 mb-2 text-emerald-400/80" />
                <span className="text-xs font-semibold text-white">All Operations Healthy!</span>
                <span className="text-[10px] text-zinc-500 mt-1">
                  No critical stockouts or abnormal sales drops detected.
                </span>
              </div>
            ) : (
              insights.alerts.map((alert) => {
                let icon = <AlertTriangle className="h-4 w-4 text-zinc-400" />
                let borderClass = 'border-zinc-800 bg-zinc-900/25'
                let textClass = 'text-zinc-300'
                let badgeClass = 'bg-zinc-950 text-zinc-400 border-zinc-800'
                
                if (alert.type === 'low_stock') {
                  borderClass = 'border-red-950/40 bg-red-950/10'
                  textClass = 'text-red-200'
                  badgeClass = 'bg-red-950/40 text-red-450 border-red-800/30'
                } else if (alert.type === 'reorder') {
                  borderClass = 'border-amber-950/40 bg-amber-950/10'
                  textClass = 'text-amber-200'
                  badgeClass = 'bg-amber-950/40 text-amber-450 border-amber-800/30'
                } else if (alert.type === 'sales_drop') {
                  borderClass = 'border-rose-950/40 bg-rose-950/10'
                  textClass = 'text-rose-200'
                  icon = <TrendingDown className="h-4 w-4 text-rose-450" />
                  badgeClass = 'bg-rose-950/40 text-rose-455 border-rose-800/30'
                } else if (alert.type === 'peak_hour') {
                  borderClass = 'border-indigo-950/40 bg-indigo-950/10'
                  textClass = 'text-indigo-200'
                  icon = <Clock className="h-4 w-4 text-indigo-450" />
                  badgeClass = 'bg-indigo-950/40 text-indigo-455 border-indigo-800/30'
                } else if (alert.type === 'dead_stock') {
                  borderClass = 'border-zinc-900 bg-zinc-900/10'
                  textClass = 'text-zinc-300'
                  icon = <Coins className="h-4 w-4 text-zinc-400" />
                  badgeClass = 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }

                return (
                  <div
                    key={alert.id}
                    className={`p-3 border rounded-xl flex flex-col gap-2 transition-all ${borderClass}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        {icon}
                        <span>{alert.title}</span>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${badgeClass} uppercase tracking-wider`}>
                        {alert.priority}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${textClass}`}>
                      {alert.description}
                    </p>
                    
                    <div className="flex justify-end mt-1">
                      {alert.type === 'low_stock' && (
                        <button
                          onClick={() => navigate('/inventory')}
                          className="text-[9px] font-bold bg-red-950/40 text-red-400 border border-red-800/30 px-2.5 py-1 rounded-lg hover:bg-red-900/30 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Restock Inventory</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      {alert.type === 'reorder' && (
                        <button
                          onClick={() => navigate('/inventory')}
                          className="text-[9px] font-bold bg-amber-950/40 text-amber-400 border border-amber-800/30 px-2.5 py-1 rounded-lg hover:bg-amber-900/30 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Place Supplier Order</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      {alert.type === 'dead_stock' && (
                        <button
                          onClick={() => navigate('/pos')}
                          className="text-[9px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded-lg hover:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Bundle in POS</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      {alert.type === 'sales_drop' && (
                        <button
                          onClick={() => navigate('/analytics')}
                          className="text-[9px] font-bold bg-rose-950/40 text-rose-400 border border-rose-800/30 px-2.5 py-1 rounded-lg hover:bg-rose-900/30 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Check Weekly Performance</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. UMKM Decision Support Board */}
      {profile?.role === 'owner' && insights && (
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                <h3 className="font-bold text-white text-lg tracking-tight">🔮 Intelligent Decision Support Console</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Rule-based predictive analysis and inventory optimization for small retail.
              </p>
            </div>
            
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-fit self-start">
              <button
                onClick={() => setDecisionTab('restock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  decisionTab === 'restock'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Restock Predictor (ROP/ROQ)
              </button>
              <button
                onClick={() => setDecisionTab('deadstock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  decisionTab === 'deadstock'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Clearance & Dead Stock
              </button>
            </div>
          </div>

          {decisionTab === 'restock' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/60 p-4 border border-zinc-900/60 rounded-2xl text-[11px] text-zinc-400 leading-relaxed">
                <div>
                  <span className="font-bold text-zinc-200 block mb-1">📈 Average Daily Sales (ADS)</span>
                  Calculated based on sum of product items sold over the past 30 days divided by 30 days. Used to estimate stock velocity.
                </div>
                <div>
                  <span className="font-bold text-zinc-200 block mb-1">🚨 Reorder Point (ROP)</span>
                  Formula: <code className="text-purple-400 font-mono font-bold">(ADS × Lead Time) + Safety Stock</code>. Trigger alert when current stock falls below ROP.
                </div>
                <div>
                  <span className="font-bold text-zinc-200 block mb-1">📦 Reorder Quantity (ROQ)</span>
                  Formula: <code className="text-purple-400 font-mono font-bold">(ADS × 30) + Safety Stock - Current Stock</code>. Recommended purchase order sizing.
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-900">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/90 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-center">Current Stock</th>
                      <th className="py-3 px-4 text-center">Avg Daily Sales</th>
                      <th className="py-3 px-4 text-center">ROP Threshold</th>
                      <th className="py-3 px-4 text-center">Safety Stock</th>
                      <th className="py-3 px-4 text-center">Days to Stockout</th>
                      <th className="py-3 px-4 text-center">Suggested ROQ</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                    {insights.restockPredictions.map((pred) => {
                      const isCritical = pred.status === 'critical'
                      const isReorder = pred.status === 'reorder'
                      
                      let statusBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/30">
                          Healthy
                        </span>
                      )
                      if (isCritical) {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/60 text-red-400 border border-red-800/30 animate-pulse">
                            Critical
                          </span>
                        )
                      } else if (isReorder) {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/30">
                            Reorder Level
                          </span>
                        )
                      }

                      return (
                        <tr key={pred.productId} className="hover:bg-zinc-900/20 transition-all">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{pred.productName}</div>
                            <div className="text-[9px] font-mono text-zinc-500 font-normal mt-0.5">SKU: {pred.sku}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">{pred.currentStock}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-400">{pred.avgDailySales.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-400">{pred.rop}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-500">{pred.safetyStock}</td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {pred.depletionDays !== null ? (
                              <span className={pred.depletionDays <= 5 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                                {pred.depletionDays} days
                              </span>
                            ) : (
                              <span className="text-zinc-600 italic">No sales</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                            {pred.roq > 0 ? `+${pred.roq}` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-center">{statusBadge}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/60 p-4 border border-zinc-900/60 rounded-2xl text-[11px] text-zinc-400 leading-relaxed">
                <div>
                  <span className="font-bold text-zinc-200 block mb-1">⏱️ Dead Stock Rule</span>
                  Any item with no sales transaction history in the past 15 days or zero lifetime history is classified as dead stock, tying up store capital.
                </div>
                <div>
                  <span className="font-bold text-zinc-200 block mb-1">💡 Smart Mitigation Recommendations</span>
                  Rule-based clearing tactics: If stock is high, recommend discount clearances or promotional catalog placement. If stock is low, recommend product catalog replacement.
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-900">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/90 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Available Stock</th>
                      <th className="py-3 px-4 text-center">Last Sold At</th>
                      <th className="py-3 px-4 text-center">Days Idle</th>
                      <th className="py-3 px-4 text-center">Classification</th>
                      <th className="py-3 px-4">Recommended Clearance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
                    {insights.deadStockAnalysis.map((item) => {
                      const isDead = item.classification === 'Dead Stock'
                      const isFast = item.classification === 'Fast Moving'
                      
                      let classBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                          Slow Moving
                        </span>
                      )
                      if (isDead) {
                        classBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                            Dead Stock
                          </span>
                        )
                      } else if (isFast) {
                        classBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-950 text-purple-400 border border-purple-800/30">
                            Fast Moving
                          </span>
                        )
                      }

                      let recommendation = '-'
                      if (isDead) {
                        if (item.stock > 20) {
                          recommendation = '⚠️ Run a 20% discount clearance or buy-one-get-one promo bundle.'
                        } else if (item.stock > 0) {
                          recommendation = '💡 Bundle with a Fast Moving item or reposition on front display counter.'
                        } else {
                          recommendation = '🛑 Stock empty. Discontinue or replace with higher demand alternative.'
                        }
                      } else if (item.classification === 'Slow Moving') {
                        recommendation = '⚡ Include in active loyalty program reward points multiplier.'
                      } else {
                        recommendation = '✅ Healthy movement. Keep normal replenishment active.'
                      }

                      return (
                        <tr key={item.productId} className="hover:bg-zinc-900/20 transition-all">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{item.productName}</div>
                            <div className="text-[9px] font-mono text-zinc-500 font-normal mt-0.5">SKU: {item.sku}</div>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400">{item.categoryName}</td>
                          <td className="py-3.5 px-4 text-center font-mono">{item.stock}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-500">
                            {item.lastSoldAt ? new Date(item.lastSoldAt).toLocaleDateString('id-ID') : 'Never'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {item.daysSinceLastSale !== null ? (
                              <span className={item.daysSinceLastSale > 15 ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                                {item.daysSinceLastSale} days
                              </span>
                            ) : (
                              <span className="text-red-400 font-bold">Never</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">{classBadge}</td>
                          <td className="py-3.5 px-4 text-zinc-300 text-[11px] font-medium">{recommendation}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
