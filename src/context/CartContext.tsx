import React, { createContext, useContext, useState } from 'react'
import { salesService } from '../services/sales'
import type { CartItem } from '../services/sales'
import type { Product } from '../services/inventory'
import { useAuth } from './AuthContext'
import { fraudService } from '../services/fraud'

interface CartContextType {
  cartItems: CartItem[]
  subtotal: number
  discount: number
  total: number
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setDiscount: (amount: number) => void
  clearCart: () => void
  checkoutCart: (
    cashierId: string,
    paymentMethod: string,
    amountPaid: number
  ) => Promise<{ transactionId: string; invoiceNumber: string }>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscountState] = useState(0)
  const [voidCount, setVoidCount] = useState(0)

  const trackVoid = async (productName: string) => {
    const nextCount = voidCount + 1
    setVoidCount(nextCount)
    if (nextCount > 3) {
      const cashierId = profile?.id || '00000000-0000-0000-0000-000000000002'
      await fraudService.logSuspiciousActivity({
        cashier_id: cashierId,
        type: 'excessive_voids',
        description: `Cashier triggered excessive cart item voids (${nextCount} item removals/reductions). Last voided product: "${productName}".`,
        severity: 'normal'
      })
    }
  }

  const addItem = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Cannot add ${product.name} - Product is out of stock!`)
      return
    }

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id)
      if (existing) {
        // Check if next quantity exceeds stock
        const nextQty = existing.quantity + 1
        if (nextQty > product.stock) {
          alert(`Cannot add more. Available stock for ${product.name} is ${product.stock}`)
          return prevItems
        }
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        )
      }
      return [...prevItems, { product, quantity: 1 }]
    })
  }

  const removeItem = (productId: string) => {
    const existing = cartItems.find((item) => item.product.id === productId)
    if (existing) {
      trackVoid(existing.product.name)
    }
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === productId)
      if (!existing) return prevItems

      if (quantity > existing.product.stock) {
        alert(`Cannot set quantity to ${quantity}. Available stock for ${existing.product.name} is ${existing.product.stock}`)
        return prevItems
      }

      // If quantity is reduced, that is also a void/reduction
      if (quantity < existing.quantity) {
        trackVoid(existing.product.name)
      }

      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    })
  }

  const setDiscount = (amount: number) => {
    setDiscountState(Math.max(0, amount))
  }

  const clearCart = () => {
    setCartItems([])
    setDiscountState(0)
    setVoidCount(0)
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  )

  const total = Math.max(0, subtotal - discount)

  const checkoutCart = async (
    cashierId: string,
    paymentMethod: string,
    amountPaid: number
  ) => {
    if (cartItems.length === 0) {
      throw new Error('Cannot checkout an empty cart')
    }
    if (amountPaid < total) {
      throw new Error('Insufficient payment amount')
    }

    try {
      const result = await salesService.checkout(
        cashierId,
        subtotal,
        discount,
        total,
        amountPaid,
        paymentMethod,
        cartItems
      )
      clearCart()
      return result
    } catch (error) {
      console.error('Checkout failed:', error)
      throw error
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        subtotal,
        discount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        setDiscount,
        clearCart,
        checkoutCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
