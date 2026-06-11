import { supabase } from '../config/supabase'
import type { Product, StockLog } from './inventory'
import { fraudService } from './fraud'

export interface Transaction {
  id: string
  invoice_number: string
  cashier_id: string | null
  subtotal: number
  discount: number
  total: number
  amount_paid: number
  payment_method: string
  status?: 'completed' | 'refunded' | 'voided'
  created_at: string
  // Joined relation
  profiles?: { full_name: string | null } | null
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string | null
  product_name_snapshot: string
  purchase_price_snapshot: number
  selling_price_snapshot: number
  quantity: number
  subtotal: number
}

export interface CartItem {
  product: Product
  quantity: number
}

const checkIsDemo = (): boolean => {
  return (
    import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
    localStorage.getItem('smartpos_demo_role') !== null
  )
}

const getStoredData = <T>(key: string, defaultData: T[]): T[] => {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : defaultData
}

const setStoredData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const salesService = {
  async checkout(
    cashierId: string,
    subtotal: number,
    discount: number,
    total: number,
    amountPaid: number,
    paymentMethod: string,
    items: CartItem[]
  ): Promise<{ transactionId: string; invoiceNumber: string }> {
    if (checkIsDemo()) {
      // 1. Fetch current local storage data
      const products = getStoredData<Product>('smartpos_products', [])
      const transactions = getStoredData<Transaction>('smartpos_transactions', [])
      const transactionItems = getStoredData<TransactionItem>('smartpos_transaction_items', [])
      const stockLogs = getStoredData<StockLog>('smartpos_stock_logs', [])

      const nextProducts = [...products]
      const nextLogs = [...stockLogs]

      // 2. Validate and adjust product stock levels
      const itemLogs: StockLog[] = []
      const orderItems: TransactionItem[] = []
      const transactionId = crypto.randomUUID()
      const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        100000 + Math.random() * 900000
      )}`

      for (const item of items) {
        const pIndex = nextProducts.findIndex((p) => p.id === item.product.id)
        if (pIndex === -1) {
          throw new Error(`Product ${item.product.name} not found in database`)
        }

        const currentStock = nextProducts[pIndex].stock
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${item.product.name}. Available: ${currentStock}, Requested: ${item.quantity}`
          )
        }

        // Decrement stock and update last sold timestamp
        nextProducts[pIndex].stock -= item.quantity
        nextProducts[pIndex].last_sold_at = new Date().toISOString()
        nextProducts[pIndex].updated_at = new Date().toISOString()

        // Create Stock Log
        const logId = crypto.randomUUID()
        itemLogs.push({
          id: logId,
          product_id: item.product.id,
          type: 'stock_out',
          quantity: -item.quantity,
          notes: `Sales transaction ${invoiceNumber}`,
          created_by: cashierId,
          created_at: new Date().toISOString(),
        })

        // Create transaction item
        orderItems.push({
          id: crypto.randomUUID(),
          transaction_id: transactionId,
          product_id: item.product.id,
          product_name_snapshot: item.product.name,
          purchase_price_snapshot: item.product.purchase_price,
          selling_price_snapshot: item.product.selling_price,
          quantity: item.quantity,
          subtotal: item.product.selling_price * item.quantity,
        })
      }

      // 3. Save adjustments to local storage
      setStoredData('smartpos_products', nextProducts)
      setStoredData('smartpos_stock_logs', [...nextLogs, ...itemLogs])
      setStoredData('smartpos_transaction_items', [...transactionItems, ...orderItems])

      const newTransaction: Transaction = {
        id: transactionId,
        invoice_number: invoiceNumber,
        cashier_id: cashierId,
        subtotal,
        discount,
        total,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        status: 'completed',
        created_at: new Date().toISOString(),
      }
      transactions.push(newTransaction)
      setStoredData('smartpos_transactions', transactions)

      // Trigger off-hours warning if sale occurs late/early
      if (fraudService.checkIsOffHours()) {
        await fraudService.logSuspiciousActivity({
          cashier_id: cashierId,
          type: 'off_hours_sale',
          description: `Transaction invoice #${invoiceNumber} completed at ${new Date().toLocaleTimeString('id-ID')} (outside standard operating hours).`,
          severity: 'warning',
        })
      }

      return { transactionId, invoiceNumber }
    }

    // Supabase Mode: Execute PostgreSQL RPC Checkout Function
    // Maps list of items to format expected by PostgreSQL process_checkout (product_id, quantity)
    const dbItems = items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }))

    const { data: transactionId, error } = await supabase.rpc('process_checkout', {
      p_cashier_id: cashierId,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_amount_paid: amountPaid,
      p_payment_method: paymentMethod,
      p_items: dbItems,
    })

    if (error) throw error

    // Fetch the generated invoice number from the newly created transaction
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('invoice_number')
      .eq('id', transactionId)
      .single()

    if (txError) throw txError

    // Trigger off-hours warning if sale occurs late/early
    if (fraudService.checkIsOffHours()) {
      await fraudService.logSuspiciousActivity({
        cashier_id: cashierId,
        type: 'off_hours_sale',
        description: `Transaction invoice #${txData.invoice_number} completed at ${new Date().toLocaleTimeString('id-ID')} (outside standard operating hours).`,
        severity: 'warning',
      })
    }

    return {
      transactionId: transactionId as string,
      invoiceNumber: txData.invoice_number as string,
    }
  },

  async getRecentTransactions(): Promise<Transaction[]> {
    if (checkIsDemo()) {
      const transactions = getStoredData<Transaction>('smartpos_transactions', [])
      // Sort latest first
      return [...transactions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data as Transaction[]
  },

  async getTransactionItems(transactionId: string): Promise<TransactionItem[]> {
    if (checkIsDemo()) {
      const items = getStoredData<TransactionItem>('smartpos_transaction_items', [])
      return items.filter((item) => item.transaction_id === transactionId)
    }

    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId)

    if (error) throw error
    return data as TransactionItem[]
  },

  async voidOrRefundTransaction(
    transactionId: string,
    action: 'voided' | 'refunded',
    performedById: string
  ): Promise<void> {
    if (checkIsDemo()) {
      const transactions = getStoredData<Transaction>('smartpos_transactions', [])
      const transactionItems = getStoredData<TransactionItem>('smartpos_transaction_items', [])
      const products = getStoredData<Product>('smartpos_products', [])
      const stockLogs = getStoredData<StockLog>('smartpos_stock_logs', [])

      const txIndex = transactions.findIndex((t) => t.id === transactionId)
      if (txIndex === -1) throw new Error('Transaction not found')
      
      const tx = transactions[txIndex]
      if (tx.status && tx.status !== 'completed') {
        throw new Error(`Transaction is already ${tx.status}`)
      }

      // 1. Update status
      transactions[txIndex].status = action
      setStoredData('smartpos_transactions', transactions)

      // 2. Restore stocks
      const txItems = transactionItems.filter((item) => item.transaction_id === transactionId)
      const nextProducts = [...products]
      const nextLogs = [...stockLogs]

      for (const item of txItems) {
        if (!item.product_id) continue
        const pIndex = nextProducts.findIndex((p) => p.id === item.product_id)
        if (pIndex !== -1) {
          nextProducts[pIndex].stock += item.quantity
          nextProducts[pIndex].updated_at = new Date().toISOString()

          nextLogs.push({
            id: crypto.randomUUID(),
            product_id: item.product_id,
            type: 'stock_in',
            quantity: item.quantity,
            notes: `${action === 'voided' ? 'Void' : 'Refund'} restore for invoice ${tx.invoice_number}`,
            created_by: performedById,
            created_at: new Date().toISOString(),
          })
        }
      }

      setStoredData('smartpos_products', nextProducts)
      setStoredData('smartpos_stock_logs', nextLogs)

      // 3. Log suspicious fraud event if total is high (> 200,000 IDR)
      if (tx.total > 200000) {
        await fraudService.logSuspiciousActivity({
          cashier_id: performedById,
          type: 'high_value_refund',
          description: `Transaction ${tx.invoice_number} with total Rp ${tx.total.toLocaleString('id-ID')} was ${action} by user.`,
          severity: 'critical'
        })
      }
      return
    }

    // Live Mode:
    // Update transactions status
    const { error: txError } = await supabase
      .from('transactions')
      .update({ status: action })
      .eq('id', transactionId)

    if (txError) throw txError

    // Fetch transaction items
    const { data: txItems, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId)

    if (itemsError) throw itemsError

    // Fetch transaction details
    const { data: tx, error: fetchTxError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchTxError) throw fetchTxError

    for (const item of txItems) {
      if (!item.product_id) continue
      // Get current stock
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()

      if (prod) {
        // Increment stock
        await supabase
          .from('products')
          .update({ stock: prod.stock + item.quantity })
          .eq('id', item.product_id)

        // Log stock movement
        await supabase.from('stock_logs').insert([
          {
            product_id: item.product_id,
            type: 'stock_in',
            quantity: item.quantity,
            notes: `${action === 'voided' ? 'Void' : 'Refund'} restore for invoice ${tx.invoice_number}`,
            created_by: performedById,
          },
        ])
      }
    }

    // High value check
    if (tx.total > 200000) {
      await fraudService.logSuspiciousActivity({
        cashier_id: performedById,
        type: 'high_value_refund',
        description: `Transaction ${tx.invoice_number} with total Rp ${tx.total.toLocaleString('id-ID')} was ${action} by user.`,
        severity: 'critical'
      })
    }
  },
}
