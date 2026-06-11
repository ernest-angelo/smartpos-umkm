import { supabase } from '../config/supabase'

export interface Supplier {
  id: string
  name: string
  contact_info: string | null
  typical_lead_time_days: number
  reliability_score: number
  avg_pricing_multiplier: number
  created_at: string
  updated_at: string
}

// -------------------------------------------------------------
// LOCAL STORAGE MOCK DATABASE SEED FOR SUPPLIERS
// -------------------------------------------------------------
const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    name: 'PT Indofood Niaga',
    contact_info: 'sales@indofood.co.id | +62-21-555-1234',
    typical_lead_time_days: 2,
    reliability_score: 98,
    avg_pricing_multiplier: 1.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    name: 'CV Sembako Jaya Utama',
    contact_info: 'budi.jaya@sembakomart.com | +62-812-3456-789',
    typical_lead_time_days: 4,
    reliability_score: 92,
    avg_pricing_multiplier: 0.98,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '50000000-0000-0000-0000-000000000003',
    name: 'Distributor Aqua Nusantara',
    contact_info: 'jakarta@aquacare.co.id | +62-21-888-0099',
    typical_lead_time_days: 1,
    reliability_score: 99,
    avg_pricing_multiplier: 1.03,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '50000000-0000-0000-0000-000000000004',
    name: 'Unilever Retail Indonesia',
    contact_info: 'orders@unilever-retail.id | +62-21-999-5566',
    typical_lead_time_days: 3,
    reliability_score: 95,
    avg_pricing_multiplier: 1.02,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

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

export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    if (checkIsDemo()) {
      return getStoredData<Supplier>('smartpos_suppliers', DEFAULT_SUPPLIERS)
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Supplier[]
  },

  async createSupplier(supplierData: {
    name: string
    contact_info: string | null
    typical_lead_time_days: number
    reliability_score: number
    avg_pricing_multiplier: number
  }): Promise<Supplier> {
    if (checkIsDemo()) {
      const suppliers = getStoredData<Supplier>('smartpos_suppliers', DEFAULT_SUPPLIERS)
      const newSupplier: Supplier = {
        id: crypto.randomUUID(),
        ...supplierData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      suppliers.push(newSupplier)
      setStoredData('smartpos_suppliers', suppliers)
      return newSupplier
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },

  async updateSupplier(
    id: string,
    supplierData: {
      name: string
      contact_info: string | null
      typical_lead_time_days: number
      reliability_score: number
      avg_pricing_multiplier: number
    }
  ): Promise<Supplier> {
    if (checkIsDemo()) {
      const suppliers = getStoredData<Supplier>('smartpos_suppliers', DEFAULT_SUPPLIERS)
      const index = suppliers.findIndex((s) => s.id === id)
      if (index === -1) throw new Error('Supplier not found')

      const updatedSupplier: Supplier = {
        ...suppliers[index],
        ...supplierData,
        updated_at: new Date().toISOString(),
      }
      suppliers[index] = updatedSupplier
      setStoredData('smartpos_suppliers', suppliers)
      return updatedSupplier
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...supplierData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },

  async deleteSupplier(id: string): Promise<void> {
    if (checkIsDemo()) {
      const suppliers = getStoredData<Supplier>('smartpos_suppliers', DEFAULT_SUPPLIERS)
      const filtered = suppliers.filter((s) => s.id !== id)
      setStoredData('smartpos_suppliers', filtered)
      return
    }

    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) throw error
  },

  // Helper to compare suppliers for a specific category or product
  async compareSuppliers(productId: string): Promise<{
    currentSupplier: Supplier | null
    alternativeSuppliers: Supplier[]
    recommendationReason: string | null
  }> {
    const suppliers = await this.getSuppliers()
    const { data: product, error } = await supabase
      .from('products')
      .select('supplier_id')
      .eq('id', productId)
      .single()

    const currentSupplierId = error ? null : product?.supplier_id
    const current = suppliers.find((s) => s.id === currentSupplierId) || null
    const alternatives = suppliers.filter((s) => s.id !== currentSupplierId)

    // Rule-based selector recommendation
    let bestAlternative = alternatives[0]
    alternatives.forEach((s) => {
      // Prefer lower lead time first, higher reliability second
      if (
        s.typical_lead_time_days < bestAlternative.typical_lead_time_days ||
        (s.typical_lead_time_days === bestAlternative.typical_lead_time_days &&
          s.reliability_score > bestAlternative.reliability_score)
      ) {
        bestAlternative = s
      }
    })

    let reason = null
    if (bestAlternative && current) {
      if (bestAlternative.typical_lead_time_days < current.typical_lead_time_days) {
        reason = `Alternative supplier "${bestAlternative.name}" has faster delivery lead time (${bestAlternative.typical_lead_time_days} days) than your current supplier "${current.name}" (${current.typical_lead_time_days} days).`
      } else if (bestAlternative.reliability_score > current.reliability_score + 5) {
        reason = `Alternative supplier "${bestAlternative.name}" has significantly higher delivery reliability (${bestAlternative.reliability_score}%) compared to "${current.name}" (${current.reliability_score}%).`
      }
    }

    return {
      currentSupplier: current,
      alternativeSuppliers: alternatives,
      recommendationReason: reason,
    }
  },
}
