import React, { useEffect, useState } from 'react'
import { analyticsService } from '../../services/analytics'
import type {
  AnalyticsSummary,
  ChartDataPoint,
  PeakHourPoint,
  PeakDayPoint,
  CategoryPerformancePoint,
} from '../../services/analytics'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  Lightbulb,
} from 'lucide-react'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1']

export const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [revenueTrend, setRevenueTrend] = useState<ChartDataPoint[]>([])
  const [peakHours, setPeakHours] = useState<PeakHourPoint[]>([])
  const [peakDays, setPeakDays] = useState<PeakDayPoint[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformancePoint[]>([])
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const sumData = await analyticsService.getAnalyticsSummary()
      const trendData = await analyticsService.getRevenueTrend(30)
      const hoursData = await analyticsService.getPeakHours()
      const daysData = await analyticsService.getPeakDays()
      const catData = await analyticsService.getCategoryPerformance()

      setSummary(sumData)
      setRevenueTrend(trendData)
      setPeakHours(hoursData)
      setPeakDays(daysData)
      setCategoryPerformance(catData)
    } catch (err) {
      console.error('Failed to load analytics dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Generate Automated Business Decision Support Recommendations
  const getBusinessInsights = () => {
    if (peakHours.length === 0 || peakDays.length === 0) return []

    const insights = []
    
    // Find busiest hour
    const busiestHourObj = [...peakHours].sort((a, b) => b.count - a.count)[0]
    const busiestHour = busiestHourObj ? busiestHourObj.label : '17:00'
    insights.push({
      title: 'Optimize Employee Schedules',
      desc: `Your peak transaction density occurs around ${busiestHour}. Ensure you have maximum staff coverage and all checkouts open during this hour to reduce wait times.`,
      icon: Clock,
      color: 'text-purple-400 border-purple-900 bg-purple-950/20',
    })

    // Find busiest day
    const busiestDayObj = [...peakDays].sort((a, b) => b.count - a.count)[0]
    const busiestDayName = busiestDayObj ? busiestDayObj.label : 'Saturday'
    insights.push({
      title: 'Weekend Logistics Planning',
      desc: `Sales frequencies peak significantly on ${busiestDayName}s. We recommend carrying out warehouse stock-ins on Thursdays or Fridays so that shelves are fully replenished before peak demand.`,
      icon: Calendar,
      color: 'text-indigo-400 border-indigo-900 bg-indigo-950/20',
    })

    // Find slow day for promotions
    const slowestDayObj = [...peakDays].sort((a, b) => a.count - b.count)[0]
    const slowestDayName = slowestDayObj ? slowestDayObj.label : 'Tuesday'
    insights.push({
      title: 'Midweek Promotional Boost',
      desc: `Transaction volumes are lowest on ${slowestDayName}s. Consider launching targeted "Happy Hour" discounts or bundling offers on these days to stimulate midweek customer traffic.`,
      icon: Lightbulb,
      color: 'text-amber-400 border-amber-900 bg-amber-950/20',
    })

    return insights
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
      </div>
    )
  }

  const insightsList = getBusinessInsights()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Business Decision Support & Analytics
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Monitor revenue growth patterns, detect peak shopping hours, and access stocking suggestions.
        </p>
      </div>

      {/* KPI Overview Grid */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <div className="glass border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Today's Revenue</span>
                <h3 className="text-2xl font-extrabold text-white">{formatPrice(summary.todayRevenue)}</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-4 flex items-center text-xs gap-1 font-semibold ${
              summary.growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {summary.growthRate >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{Math.abs(summary.growthRate).toFixed(1)}% compared to yesterday</span>
            </div>
          </div>

          {/* Transactions */}
          <div className="glass border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Today's Orders</span>
                <h3 className="text-2xl font-extrabold text-white">{summary.todayTransactions} Transactions</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-zinc-400 gap-1 font-semibold">
              <span>Avg Basket: {formatPrice(summary.averageCartValue)}</span>
            </div>
          </div>

          {/* Low Stock alerts */}
          <div className="glass border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Low Stock Warnings</span>
                <h3 className="text-2xl font-extrabold text-white">{summary.lowStockCount} Items</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-amber-400 gap-1 font-semibold">
              <span>Immediate restock actions recommended</span>
            </div>
          </div>

          {/* Top Selling */}
          <div className="glass border border-zinc-900 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-2 max-w-[80%]">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">30D Best Seller</span>
                <h3 className="text-sm font-extrabold text-white truncate mt-1">
                  {summary.bestSellingProduct.split('(')[0]}
                </h3>
                <span className="text-xs text-purple-400 font-bold block">
                  {summary.bestSellingProduct.includes('(') ? `(${summary.bestSellingProduct.split('(')[1]}` : ''}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 30-Day Sales Trend Area Chart */}
      <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-white text-base">30-Day Revenue Trend</h3>
            <p className="text-xs text-zinc-400">Accumulated daily gross sales logs</p>
          </div>
          <span className="text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-800/30 px-3 py-1 rounded-lg">
            Gross Sales History
          </span>
        </div>

        <div className="h-80 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
              <XAxis dataKey="date" stroke="#71717a" />
              <YAxis stroke="#71717a" tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                formatter={(value: any) => [formatPrice(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Double Column: Peak Hours & Peak Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              <span>Peak Hourly Activity</span>
            </h3>
            <p className="text-xs text-zinc-400">Transaction volume distribution across 24-hour cycle</p>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" />
                <YAxis stroke="#71717a" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  formatter={(value: any) => [value, 'Transactions']}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Days */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <span>Peak Weekly Frequency</span>
            </h3>
            <p className="text-xs text-zinc-400">Order frequency distribution across days of the week</p>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" />
                <YAxis stroke="#71717a" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                  formatter={(value: any) => [value, 'Transactions']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Double Column: Category Breakdown & Business Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (Pie Chart) */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-1">
              <PieIcon className="h-5 w-5 text-emerald-400" />
              <span>Category Share</span>
            </h3>
            <p className="text-xs text-zinc-400">Product category revenue contribution</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="revenue"
                >
                  {categoryPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '10px' }}
                  formatter={(value: any) => [formatPrice(value), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary Label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Categories</span>
              <span className="text-sm font-extrabold text-white">{categoryPerformance.length} Active</span>
            </div>
          </div>

          {/* Mini Legend List */}
          <div className="mt-4 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {categoryPerformance.map((point, index) => (
              <div key={point.name} className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-zinc-300 font-semibold truncate">{point.name}</span>
                </div>
                <span className="font-mono text-zinc-400">{formatPrice(point.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Business Decision Support Insights panel */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              <span>Smart Business Recommendations</span>
            </h3>
            <p className="text-xs text-zinc-400">Automated scheduling and logistics recommendations for store owners</p>
          </div>

          <div className="space-y-3.5">
            {insightsList.map((insight, idx) => {
              const Icon = insight.icon
              return (
                <div
                  key={idx}
                  className={`flex gap-4 p-4 border rounded-2xl ${insight.color}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-sm text-white">{insight.title}</h5>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">{insight.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
