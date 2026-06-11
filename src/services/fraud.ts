import { supabase } from '../config/supabase'

export interface SuspiciousLog {
  id: string
  cashier_id: string | null
  cashier_name?: string
  type: 'excessive_voids' | 'high_value_refund' | 'mismatch_adjustment' | 'off_hours_sale'
  description: string
  severity: 'critical' | 'warning' | 'normal'
  created_at: string
}

const DEFAULT_LOGS: SuspiciousLog[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    cashier_id: '00000000-0000-0000-0000-000000000002',
    cashier_name: 'Siti (Cashier)',
    type: 'off_hours_sale',
    description: 'Transaction invoice #INV-20260610-004 completed at 23:45 (outside standard store operating hours).',
    severity: 'warning',
    created_at: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    cashier_id: '00000000-0000-0000-0000-000000000002',
    cashier_name: 'Siti (Cashier)',
    type: 'high_value_refund',
    description: 'Refund triggered for transaction #INV-20260609-012 with a total value of Rp 280,000.',
    severity: 'critical',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    cashier_id: '00000000-0000-0000-0000-000000000003',
    cashier_name: 'Anto (Gudang Staff)',
    type: 'mismatch_adjustment',
    description: 'Stock adjustment down by 50 units for product "Minyak Goreng Filma 2L" without matching sales records.',
    severity: 'warning',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    cashier_id: '00000000-0000-0000-0000-000000000002',
    cashier_name: 'Siti (Cashier)',
    type: 'excessive_voids',
    description: 'Cashier deleted items from cart 5 times during shift, exceeding the standard operational limit.',
    severity: 'normal',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
]

const checkIsDemo = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
    localStorage.getItem('smartpos_demo_role') !== null
  )
}

const getStoredLogs = (): SuspiciousLog[] => {
  const data = localStorage.getItem('smartpos_suspicious_logs')
  if (!data) {
    localStorage.setItem('smartpos_suspicious_logs', JSON.stringify(DEFAULT_LOGS))
    return DEFAULT_LOGS
  }
  return JSON.parse(data)
}

const setStoredLogs = (logs: SuspiciousLog[]): void => {
  localStorage.setItem('smartpos_suspicious_logs', JSON.stringify(logs))
}

export const fraudService = {
  async getSuspiciousLogs(): Promise<SuspiciousLog[]> {
    if (checkIsDemo()) {
      return getStoredLogs()
    }

    const { data, error } = await supabase
      .from('suspicious_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((d: any) => ({
      id: d.id,
      cashier_id: d.cashier_id,
      cashier_name: d.profiles?.full_name || 'System',
      type: d.type,
      description: d.description,
      severity: d.severity,
      created_at: d.created_at,
    })) as SuspiciousLog[]
  },

  async logSuspiciousActivity(logData: {
    cashier_id: string | null
    type: 'excessive_voids' | 'high_value_refund' | 'mismatch_adjustment' | 'off_hours_sale'
    description: string
    severity: 'critical' | 'warning' | 'normal'
  }): Promise<SuspiciousLog> {
    if (checkIsDemo()) {
      const logs = getStoredLogs()
      
      // Resolve cashier name
      let cashier_name = 'System'
      if (logData.cashier_id === '00000000-0000-0000-0000-000000000002') {
        cashier_name = 'Siti (Cashier)'
      } else if (logData.cashier_id === '00000000-0000-0000-0000-000000000003') {
        cashier_name = 'Anto (Gudang Staff)'
      } else if (logData.cashier_id === '00000000-0000-0000-0000-000000000001') {
        cashier_name = 'Pak Budi (Owner)'
      }

      const newLog: SuspiciousLog = {
        id: crypto.randomUUID(),
        ...logData,
        cashier_name,
        created_at: new Date().toISOString(),
      }
      logs.unshift(newLog)
      setStoredLogs(logs)
      return newLog
    }

    const { data, error } = await supabase
      .from('suspicious_logs')
      .insert([logData])
      .select('*, profiles(full_name)')
      .single()

    if (error) throw error

    return {
      id: data.id,
      cashier_id: data.cashier_id,
      cashier_name: data.profiles?.full_name || 'System',
      type: data.type,
      description: data.description,
      severity: data.severity,
      created_at: data.created_at,
    } as SuspiciousLog
  },

  checkIsOffHours(date: Date = new Date()): boolean {
    const hours = date.getHours()
    // Define off-hours as 22:00 (10 PM) to 06:00 (6 AM)
    return hours >= 22 || hours < 6
  }
}
