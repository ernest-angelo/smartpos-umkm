import React, { useEffect, useState } from 'react'
import { salesService } from '../../services/sales'
import type { Transaction } from '../../services/sales'
import { useAuth } from '../../context/AuthContext'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ArrowRight,
} from 'lucide-react'

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom'

export const ReportsPage: React.FC = () => {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>('daily')

  const handleVoidOrRefund = async (txId: string, action: 'voided' | 'refunded') => {
    if (!window.confirm(`Are you sure you want to mark this transaction as ${action}? This will return items back to product stock.`)) return
    
    const userId = profile?.id || '00000000-0000-0000-0000-000000000001'
    try {
      await salesService.voidOrRefundTransaction(txId, action, userId)
      alert(`Transaction successfully marked as ${action}.`)
      loadTransactions()
    } catch (err: any) {
      alert(err?.message || 'Failed to update transaction status.')
    }
  }
  
  // Date filter states
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10))

  // Fetch transactions based on filter ranges
  const loadTransactions = async () => {
    setLoading(true)
    try {
      const allTx = await salesService.getRecentTransactions()
      
      // Determine date boundary
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      // Filter local lists
      const filtered = allTx.filter((tx) => {
        const txDate = new Date(tx.created_at)
        return txDate >= start && txDate <= end
      })

      setTransactions(filtered)
    } catch (err) {
      console.error('Failed to load transaction report records:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle preset period switching
  const handlePeriodChange = (selected: ReportPeriod) => {
    setPeriod(selected)
    const today = new Date()

    if (selected === 'daily') {
      const todayStr = today.toISOString().slice(0, 10)
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (selected === 'weekly') {
      // Start of current week (Monday)
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(today.setDate(diff))
      setStartDate(monday.toISOString().slice(0, 10))
      setEndDate(new Date().toISOString().slice(0, 10))
    } else if (selected === 'monthly') {
      // Start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(startOfMonth.toISOString().slice(0, 10))
      setEndDate(new Date().toISOString().slice(0, 10))
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [startDate, endDate])

  // Calculation summaries
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.total), 0)
  const totalDiscount = transactions.reduce((sum, tx) => sum + Number(tx.discount), 0)
  const totalOrders = transactions.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // 1. EXPORT TO CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No data available to export')
      return
    }

    const headers = [
      'Invoice Number',
      'Date & Time',
      'Cashier',
      'Subtotal (Rp)',
      'Discount (Rp)',
      'Total Paid (Rp)',
      'Payment Method',
    ]

    const csvRows = [headers.join(',')]

    transactions.forEach((tx) => {
      const row = [
        tx.invoice_number,
        `"${new Date(tx.created_at).toLocaleString('id-ID')}"`,
        `"${tx.profiles?.full_name || 'System Cashier'}"`,
        tx.subtotal,
        tx.discount,
        tx.total,
        tx.payment_method.toUpperCase(),
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    
    const filename = `Sales_Report_${startDate}_to_${endDate}.csv`
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. EXPORT TO PDF (Standard Browser Print layout triggers)
  const handlePrintReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:bg-white print:text-black">
      {/* Page Header (Hidden when printing report list) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Ledger & Period Reports
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Generate transactional summaries and export files to CSV or PDF formats.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintReport}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-purple-600/10 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Printer className="h-4 w-4" />
            <span>Export PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Date Filters Controls (Hidden when printing report list) */}
      <div className="glass border border-zinc-900 rounded-3xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        {/* Quick Period Buttons */}
        <div className="flex p-1 rounded-xl bg-zinc-950 border border-zinc-900/60 w-fit">
          <button
            onClick={() => handlePeriodChange('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              period === 'daily' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handlePeriodChange('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              period === 'weekly' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handlePeriodChange('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              period === 'monthly' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              period === 'custom' ? 'bg-zinc-900 text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Calendar className="h-4 w-4 text-purple-400" />
          <input
            type="date"
            disabled={period !== 'custom'}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white disabled:opacity-50"
          />
          <ArrowRight className="h-4 w-4 opacity-50" />
          <input
            type="date"
            disabled={period !== 'custom'}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white disabled:opacity-50"
          />
        </div>
      </div>

      {/* Printable Report Header Block (Only visible when printing) */}
      <div className="hidden print:block text-black text-center space-y-2 mb-6">
        <h2 className="text-xl font-bold">SMARTPOS UMKM SALES REPORT</h2>
        <p className="text-sm">
          Period: <span className="font-semibold">{startDate}</span> to <span className="font-semibold">{endDate}</span>
        </p>
        <p className="text-xs text-zinc-500">Report generated on {new Date().toLocaleString('id-ID')}</p>
        <div className="border-b border-black pt-4"></div>
      </div>

      {/* KPI Stats Period Card Summaries */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 print:text-black">
        {/* Total Revenue */}
        <div className="glass border border-zinc-900 rounded-2xl p-5 print:border-zinc-300 print:bg-transparent">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider print:text-zinc-600">Total Net Revenue</span>
              <h4 className="text-xl font-extrabold text-white print:text-black">{formatPrice(totalRevenue)}</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400 print:hidden">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass border border-zinc-900 rounded-2xl p-5 print:border-zinc-300 print:bg-transparent">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider print:text-zinc-600">Total Transactions</span>
              <h4 className="text-xl font-extrabold text-white print:text-black">{totalOrders} Orders</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400 print:hidden">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Total Discount */}
        <div className="glass border border-zinc-900 rounded-2xl p-5 print:border-zinc-300 print:bg-transparent">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider print:text-zinc-600">Discounts Deducted</span>
              <h4 className="text-xl font-extrabold text-white print:text-black">{formatPrice(totalDiscount)}</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-400 print:hidden">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="glass border border-zinc-900 rounded-2xl p-5 print:border-zinc-300 print:bg-transparent">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider print:text-zinc-600">Average Cart Value</span>
              <h4 className="text-xl font-extrabold text-white print:text-black">{formatPrice(averageOrderValue)}</h4>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400 print:hidden">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Transaction Log Table */}
      <div className="glass border border-zinc-900 rounded-3xl overflow-hidden shadow-xl print:border-zinc-300 print:shadow-none">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider print:bg-zinc-100 print:text-black print:border-zinc-300">
                  <th className="py-4 px-6">Invoice Number</th>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Cashier</th>
                  <th className="py-4 px-6 text-right">Subtotal</th>
                  <th className="py-4 px-6 text-right">Discount</th>
                  <th className="py-4 px-6 text-right">Net Total</th>
                  <th className="py-4 px-6 text-center">Payment</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300 print:text-black print:divide-zinc-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 px-6 text-center text-zinc-500 print:text-zinc-400">
                      No transactions found for this date range.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-900/20 transition-all print:hover:bg-transparent">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-purple-400 print:text-black">
                        {tx.invoice_number}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-zinc-500 print:text-zinc-600">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-6 font-semibold text-white print:text-black">
                        {tx.profiles?.full_name || 'System Cashier'}
                      </td>
                      <td className="py-4 px-6 text-right text-zinc-400 print:text-zinc-600 font-mono text-xs">
                        {formatPrice(tx.subtotal)}
                      </td>
                      <td className="py-4 px-6 text-right text-zinc-400 print:text-zinc-600 font-mono text-xs">
                        {tx.discount > 0 ? `-${formatPrice(tx.discount)}` : 'Rp 0'}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-white print:text-black font-mono text-xs">
                        {formatPrice(tx.total)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 print:border-zinc-300 print:text-black print:bg-zinc-100">
                          {tx.payment_method}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          tx.status === 'refunded'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/30'
                            : tx.status === 'voided'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/30'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30'
                        }`}>
                          {tx.status || 'completed'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center print:hidden">
                        {(!tx.status || tx.status === 'completed') && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleVoidOrRefund(tx.id, 'voided')}
                              className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 hover:border-amber-600/30 hover:text-amber-400 px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              Void
                            </button>
                            <button
                              onClick={() => handleVoidOrRefund(tx.id, 'refunded')}
                              className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 hover:border-rose-600/30 hover:text-rose-400 px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              Refund
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printing Custom media query additions */}
      <style>{`
        @media print {
          /* Hide everything except print-specific modules */
          body {
            background-color: white !important;
            color: black !important;
            font-family: Arial, sans-serif;
          }
          aside, header, nav, button, input, select {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .glass {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          table {
            border: 1px solid #ccc !important;
          }
          th, td {
            border-bottom: 1px solid #ccc !important;
            padding: 8px !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
