import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardOverview } from './pages/dashboard/DashboardOverview'
import { CashierPOS } from './pages/pos/CashierPOS'
import { InventoryManagement } from './pages/inventory/InventoryManagement'
import { AnalyticsDashboard } from './pages/analytics/AnalyticsDashboard'
import { ReportsPage } from './pages/reports/ReportsPage'
import { SupplierManagement } from './pages/suppliers/SupplierManagement'
import { FraudDetectionConsole } from './pages/fraud/FraudDetectionConsole'
import { PromotionConsole } from './pages/promotions/PromotionConsole'

import { CartProvider } from './context/CartContext'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
        <Routes>
          {/* Guest/Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Secure/Guarded Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Overview - Dashboard (Accessible to all authenticated users) */}
            <Route index element={<DashboardOverview />} />

            {/* POS Cashier - Accessible to Owner and Cashier */}
            <Route
              path="pos"
              element={
                <ProtectedRoute allowedRoles={['owner', 'cashier']}>
                  <CashierPOS />
                </ProtectedRoute>
              }
            />

            {/* Inventory Stock - Accessible to Owner and Staff Gudang */}
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['owner', 'staff_gudang']}>
                  <InventoryManagement />
                </ProtectedRoute>
              }
            />

            {/* Supplier Intelligence - Accessible to Owner and Staff Gudang */}
            <Route
              path="suppliers"
              element={
                <ProtectedRoute allowedRoles={['owner', 'staff_gudang']}>
                  <SupplierManagement />
                </ProtectedRoute>
              }
            />

            {/* Decision Support Analytics - Owner Only */}
            <Route
              path="analytics"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Transaction Reports - Owner Only */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Fraud & Anomaly Detection - Owner Only */}
            <Route
              path="fraud"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <FraudDetectionConsole />
                </ProtectedRoute>
              }
            />

            {/* Promotion Recommendations - Owner Only */}
            <Route
              path="promotions"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <PromotionConsole />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Catch-All Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
