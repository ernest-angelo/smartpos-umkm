import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fraudService } from '../../services/fraud'
import type { SuspiciousLog } from '../../services/fraud'
import {
  ShieldAlert,
  Users,
  Clock,
  AlertTriangle,
  Search,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

export const FraudDetectionConsole: React.FC = () => {
  const { role } = useAuth()
  const [logs, setLogs] = useState<SuspiciousLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')

  // Detailed view modal
  const [selectedLog, setSelectedLog] = useState<SuspiciousLog | null>(null)

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fraudService.getSuspiciousLogs()
      setLogs(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load suspicious logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'owner') {
      loadLogs()
    } else {
      setLoading(false)
    }
  }, [role])

  if (role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-[calc(100vh-12rem)] max-w-lg mx-auto text-center space-y-6">
        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-full text-red-500 animate-pulse">
          <Lock className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Access Denied: Owner Role Required</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            The Fraud & Transaction Anomaly Detection Console contains sensitive store operation logs and is restricted exclusively to store owners.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
      </div>
    )
  }

  // Filter calculations
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.cashier_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' ? true : log.type === selectedType
    const matchesSeverity = selectedSeverity === 'all' ? true : log.severity === selectedSeverity

    return matchesSearch && matchesType && matchesSeverity
  })

  // KPI Calculations
  const totalAlerts = logs.length
  const criticalAlerts = logs.filter((l) => l.severity === 'critical').length
  const warningAlerts = logs.filter((l) => l.severity === 'warning').length
  const offHoursAlerts = logs.filter((l) => l.type === 'off_hours_sale').length

  // Aggregates for Charting
  // 1. Logs by Cashier
  const cashierCountsMap: Record<string, number> = {}
  logs.forEach((log) => {
    const name = log.cashier_name || 'System'
    cashierCountsMap[name] = (cashierCountsMap[name] || 0) + 1
  })
  const cashierChartData = Object.entries(cashierCountsMap).map(([name, count]) => ({
    name,
    count,
  }))

  // 2. Logs by Type
  const typeCountsMap: Record<string, number> = {
    excessive_voids: 0,
    high_value_refund: 0,
    mismatch_adjustment: 0,
    off_hours_sale: 0,
  }
  logs.forEach((log) => {
    if (log.type in typeCountsMap) {
      typeCountsMap[log.type]++
    }
  })
  
  const typeLabels: Record<string, string> = {
    excessive_voids: 'Excessive Voids',
    high_value_refund: 'High-Value Refunds',
    mismatch_adjustment: 'Mismatch Adjustments',
    off_hours_sale: 'Off-Hours Sales',
  }

  const typeChartData = Object.entries(typeCountsMap).map(([type, count]) => ({
    name: typeLabels[type] || type,
    value: count,
  }))

  const colors = ['#f43f5e', '#fb923c', '#a78bfa', '#38bdf8']
  const chartColors = ['#a78bfa', '#f472b6', '#38bdf8', '#fb7185']

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950/60 text-rose-400 border border-rose-800/30'
      case 'warning':
        return 'bg-amber-950/60 text-amber-400 border border-amber-800/30'
      default:
        return 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/30'
    }
  }

  const getTypeLabel = (type: string) => {
    return typeLabels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-rose-500" />
            <span>Fraud & Anomaly Detection</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitor transaction voids, high-value refunds, off-hours sales, and manual inventory adjustments.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98]"
        >
          Refresh Logs
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-950/40 border border-rose-900/50 p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Anomalies */}
        <div className="glass border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Anomalies</span>
              <h4 className="text-xl font-extrabold text-white">{totalAlerts} Alert{totalAlerts !== 1 && 's'}</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Critical Severity</span>
              <h4 className="text-xl font-extrabold text-rose-500">{criticalAlerts} Flagged</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-400 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Warning Alerts */}
        <div className="glass border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Warning Severity</span>
              <h4 className="text-xl font-extrabold text-amber-500">{warningAlerts} Flags</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Off-hours Sales */}
        <div className="glass border border-zinc-900 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Off-Hours Transactions</span>
              <h4 className="text-xl font-extrabold text-purple-400">{offHoursAlerts} Logged</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/20 border border-purple-900/30 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomalies by Cashier */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-white text-base">Cashier Anomaly Distribution</h3>
            <p className="text-xs text-zinc-400">Suspicious triggers attributed to each user profile</p>
          </div>
          <div className="h-60 w-full text-xs mt-4">
            {cashierChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500 italic">
                No anomaly logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashierChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={true} vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" />
                  <YAxis stroke="#71717a" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                    formatter={(v: any) => [v, 'Alerts']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {cashierChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Anomalies by Type */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-white text-base">Anomaly Types Share</h3>
            <p className="text-xs text-zinc-400">Segmentation of triggered audit logs</p>
          </div>
          <div className="h-60 w-full text-xs mt-4 flex items-center justify-center">
            {logs.length === 0 ? (
              <div className="text-zinc-500 italic">No anomaly logs recorded yet.</div>
            ) : (
              <div className="relative w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Pie
                      data={typeChartData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend overlay */}
                <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-900/60 text-[10px]">
                  {typeChartData.map((d, index) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-zinc-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index] }}></span>
                      <span>{d.name}: <strong>{d.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table with Filters */}
      <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-bold text-white text-base">Suspicious Activity Ledger</h3>
          <p className="text-xs text-zinc-400">Chronological history of system-flagged anomalies</p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by Cashier or description details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-white text-xs w-full focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="excessive_voids">Excessive Voids</option>
              <option value="high_value_refund">High-Value Refunds</option>
              <option value="mismatch_adjustment">Mismatch Adjustments</option>
              <option value="off_hours_sale">Off-Hours Sales</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Cashier Name</th>
                <th className="py-4 px-6">Anomaly Category</th>
                <th className="py-4 px-6 text-center">Severity</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-zinc-500 italic">
                    No suspicious events logged matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/15 transition-all">
                    <td className="py-4 px-6 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {log.cashier_name || 'System / Auto'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-zinc-200">
                        {getTypeLabel(log.type)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getSeverityBadgeClass(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-zinc-400 max-w-sm truncate">
                      {log.description}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-zinc-800"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedLog(null)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp z-10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <span>Log Detail: {getTypeLabel(selectedLog.type)}</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Timestamp</span>
                  <span className="font-mono text-zinc-300">{new Date(selectedLog.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Severity</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${getSeverityBadgeClass(selectedLog.severity)}`}>
                    {selectedLog.severity}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-semibold block uppercase">Triggered By</span>
                <span className="text-zinc-200 font-semibold">{selectedLog.cashier_name || 'System / Auto'}</span>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-500 font-semibold block uppercase">Detailed Description</span>
                <p className="text-zinc-300 leading-relaxed font-mono text-[11px]">{selectedLog.description}</p>
              </div>

              <div className="rounded-xl bg-purple-950/10 border border-purple-900/20 p-3 text-[10.5px] text-purple-300 leading-relaxed flex items-start gap-1.5">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-purple-400" />
                <span>
                  <strong>Management Audit Tip:</strong> Review store schedule records or CCTV logs corresponding to this timestamp. Instruct cashiers to keep void receipts signed by store managers.
                </span>
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-zinc-900">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
