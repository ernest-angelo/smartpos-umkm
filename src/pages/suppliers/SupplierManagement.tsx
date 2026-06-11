import React, { useEffect, useState } from 'react'
import { supplierService } from '../../services/suppliers'
import type { Supplier } from '../../services/suppliers'
import { inventoryService } from '../../services/inventory'
import type { Product } from '../../services/inventory'
import {
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  X,
  ArrowRight,
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
} from 'recharts'

export const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [uiError, setUiError] = useState<string | null>(null)

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    contact_info: '',
    typical_lead_time_days: 3,
    reliability_score: 95,
    avg_pricing_multiplier: 1.00,
  })

  // Comparison state
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [comparisonResults, setComparisonResults] = useState<{
    currentSupplier: Supplier | null
    alternativeSuppliers: Supplier[]
    recommendationReason: string | null
  } | null>(null)

  const loadData = async () => {
    setLoading(true)
    setUiError(null)
    try {
      const sups = await supplierService.getSuppliers()
      const prods = await inventoryService.getProducts()
      setSuppliers(sups)
      setProducts(prods)
      if (prods.length > 0) {
        setSelectedProductId(prods[0].id)
      }
    } catch (err: any) {
      setUiError(err?.message || 'Failed to load suppliers data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Update comparison results when product selection changes
  useEffect(() => {
    if (selectedProductId) {
      supplierService.compareSuppliers(selectedProductId).then((res) => {
        setComparisonResults(res)
      })
    } else {
      setComparisonResults(null)
    }
  }, [selectedProductId, suppliers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUiError(null)
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, {
          name: form.name,
          contact_info: form.contact_info || null,
          typical_lead_time_days: Number(form.typical_lead_time_days),
          reliability_score: Number(form.reliability_score),
          avg_pricing_multiplier: Number(form.avg_pricing_multiplier),
        })
      } else {
        await supplierService.createSupplier({
          name: form.name,
          contact_info: form.contact_info || null,
          typical_lead_time_days: Number(form.typical_lead_time_days),
          reliability_score: Number(form.reliability_score),
          avg_pricing_multiplier: Number(form.avg_pricing_multiplier),
        })
      }
      setModalOpen(false)
      loadData()
    } catch (err: any) {
      setUiError(err?.message || 'Operation failed.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier? Any linked products will have their supplier reference cleared.')) return
    try {
      await supplierService.deleteSupplier(id)
      loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete supplier.')
    }
  }

  const openAddModal = () => {
    setEditingSupplier(null)
    setForm({
      name: '',
      contact_info: '',
      typical_lead_time_days: 3,
      reliability_score: 95,
      avg_pricing_multiplier: 1.00,
    })
    setModalOpen(true)
  }

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s)
    setForm({
      name: s.name,
      contact_info: s.contact_info || '',
      typical_lead_time_days: s.typical_lead_time_days,
      reliability_score: s.reliability_score,
      avg_pricing_multiplier: s.avg_pricing_multiplier,
    })
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-purple-600"></div>
      </div>
    )
  }

  // Pre-configured custom chart colors
  const colors = ['#a78bfa', '#818cf8', '#c084fc', '#f472b6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Supplier Intelligence
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitor vendor reliability metrics and select the most optimal suppliers for your items.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-semibold tracking-wide cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-purple-600/10 w-fit"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Suppliers List (col-span-2) */}
        <div className="lg:col-span-2 glass border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Registered Suppliers</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Contact info and operational lead times</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-900 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Supplier Name</th>
                  <th className="py-4 px-6">Contact Details</th>
                  <th className="py-4 px-6 text-center">Avg Lead Time</th>
                  <th className="py-4 px-6 text-center">Price Multiplier</th>
                  <th className="py-4 px-6 text-center">Reliability</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-6 text-center text-zinc-500">
                      No suppliers registered. Add one to begin optimization.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-900/20 transition-all">
                      <td className="py-4 px-6 font-semibold text-white">
                        {s.name}
                      </td>
                      <td className="py-4 px-6 text-xs text-zinc-400 max-w-xs truncate">
                        {s.contact_info || <span className="text-zinc-600 italic">No info</span>}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-medium">
                        {s.typical_lead_time_days} days
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-zinc-400">
                        {s.avg_pricing_multiplier.toFixed(2)}x
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.reliability_score >= 95
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30'
                            : s.reliability_score >= 90
                              ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/30'
                              : 'bg-red-950/60 text-red-400 border border-red-800/30'
                        }`}>
                          {s.reliability_score}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-purple-400 hover:border-purple-600/30 transition-all cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-600/30 transition-all cursor-pointer"
                            title="Delete Supplier"
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

        {/* 2. Supplier Reliability Graph (col-span-1) */}
        <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-[380px]">
          <div>
            <h3 className="font-bold text-white text-base">Reliability Analytics</h3>
            <p className="text-xs text-zinc-400">Supplier delivery completion scores</p>
          </div>

          <div className="h-60 w-full text-xs mt-4">
            {suppliers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500 italic">
                Add suppliers to view charts
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={suppliers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" horizontal={true} vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tickFormatter={(v) => v.split(' ')[0]} />
                  <YAxis stroke="#71717a" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                    formatter={(v: any) => [`${v}%`, 'Reliability']}
                  />
                  <Bar dataKey="reliability_score" radius={[8, 8, 0, 0]}>
                    {suppliers.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Optimal Supplier Suggestion Engine */}
      <div className="glass border border-zinc-900 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-4">
          <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <h3 className="font-bold text-white text-lg tracking-tight">🔍 Procurement Recommender Core</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Product to Optimize</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="block w-full px-4 py-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="" disabled>Choose a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stock})
                </option>
              ))}
            </select>
            <div className="rounded-xl bg-zinc-950/50 p-4 border border-zinc-900/40 text-[11px] text-zinc-400 leading-relaxed">
              <span className="font-bold text-zinc-200 block mb-1">🤖 Recommendation Algorithm Details</span>
              Analyzes alternative suppliers linked to the product category. Prioritizes delivery times (speed) and historical delivery reliability scores to flag procurement improvements.
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            {comparisonResults ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Supplier Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-900 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Assigned Supplier</span>
                    <h5 className="font-bold text-white text-sm">
                      {comparisonResults.currentSupplier?.name || 'No Supplier Bound'}
                    </h5>
                    {comparisonResults.currentSupplier && (
                      <p className="text-[10px] text-zinc-400 font-mono truncate">
                        {comparisonResults.currentSupplier.contact_info}
                      </p>
                    )}
                  </div>

                  {comparisonResults.currentSupplier ? (
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-900/60 pt-3">
                      <div>
                        <span className="text-[9px] text-zinc-500 block">Lead Time</span>
                        <span className="font-bold text-zinc-300 font-mono">{comparisonResults.currentSupplier.typical_lead_time_days} Days</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block">Reliability</span>
                        <span className="font-bold text-emerald-400 font-mono">{comparisonResults.currentSupplier.reliability_score}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-600 italic">
                      Bind a supplier in the inventory sheet to compare.
                    </div>
                  )}
                </div>

                {/* Heuristic Action Result */}
                <div className="p-4 rounded-2xl bg-indigo-950/10 border border-indigo-950/30 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Decision Engine Advice</span>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-400" />
                      <h5 className="font-bold text-white text-sm">Optimization Status</h5>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                      {comparisonResults.recommendationReason || (
                        comparisonResults.currentSupplier
                          ? '✅ Your current supplier configuration represents the most optimal balance of lead time speed and reliability.'
                          : '⚠️ Bind a supplier to activate automated procurement analysis.'
                      )}
                    </p>
                  </div>

                  {comparisonResults.recommendationReason && (
                    <button
                      onClick={() => alert('Purchase Order Request Simulated!')}
                      className="flex items-center justify-center gap-1 text-[10px] font-bold bg-indigo-950/40 text-indigo-400 border border-indigo-850/30 px-3 py-1.5 rounded-lg hover:bg-indigo-900/30 transition-all cursor-pointer w-fit"
                    >
                      <span>Simulate PO Draft</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs italic">
                Select a product to view comparison analytics
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. CRUD MODAL DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>
          <div className="relative glass border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleUp z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                {editingSupplier ? 'Edit Supplier Metrics' : 'Add New Supplier'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {uiError && (
              <div className="rounded-xl bg-red-950/30 border border-red-900/50 p-3 mb-4 text-xs text-red-400">
                {uiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="e.g. PT Indofood Niaga"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Contact Details / Notes</label>
                <input
                  type="text"
                  value={form.contact_info}
                  onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder="e.g. sales@indofood.com | +62-21-555"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Avg Lead Time (Days)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.typical_lead_time_days}
                    onChange={(e) => setForm({ ...form, typical_lead_time_days: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Price Multiplier (x)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    required
                    value={form.avg_pricing_multiplier}
                    onChange={(e) => setForm({ ...form, avg_pricing_multiplier: Number(e.target.value) })}
                    className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Delivery Reliability Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={form.reliability_score}
                  onChange={(e) => setForm({ ...form, reliability_score: Number(e.target.value) })}
                  className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-purple-600/10"
                >
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
