import React, { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  ShieldAlert,
  Sparkles,
  Truck,
} from 'lucide-react'

export const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { profile, signOut, isDemo } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Define sidebar links and their access control
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['owner', 'staff_gudang', 'cashier'],
    },
    {
      name: 'POS (Cashier)',
      path: '/pos',
      icon: ShoppingCart,
      roles: ['owner', 'cashier'],
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: Boxes,
      roles: ['owner', 'staff_gudang'],
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      icon: Truck,
      roles: ['owner', 'staff_gudang'],
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      roles: ['owner'],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: FileText,
      roles: ['owner'],
    },
    {
      name: 'Fraud Audit',
      path: '/fraud',
      icon: ShieldAlert,
      roles: ['owner'],
    },
    {
      name: 'Promo Engine',
      path: '/promotions',
      icon: Sparkles,
      roles: ['owner'],
    },
  ]

  // Filter navigation items based on current user role
  const userRole = profile?.role || 'cashier'
  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: 'Owner', color: 'bg-purple-950/60 text-purple-400 border-purple-800/50' },
    cashier: { label: 'Cashier', color: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50' },
    staff_gudang: { label: 'Staff Gudang', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50' },
  }

  const currentRoleInfo = roleLabels[userRole] || { label: 'Cashier', color: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50' }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              SmartPOS <span className="text-purple-400 font-medium">UMKM</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/10'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-purple-400 transition-colors'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Account Info Footer */}
          <div className="p-4 border-t border-zinc-900">
            {isDemo && (
              <div className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-amber-950/20 border border-amber-900/40 py-1.5 text-[10px] font-medium text-amber-400">
                <ShieldAlert className="h-3 w-3" />
                <span>DEMO SANDBOX MODE</span>
              </div>
            )}
            
            <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-zinc-900/20 border border-zinc-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {profile?.full_name || 'Smart Employee'}
                </p>
                <div className="mt-1 flex">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${currentRoleInfo.color}`}>
                    {currentRoleInfo.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900/50 hover:bg-red-950/20 border border-zinc-900 hover:border-red-900/30 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Responsive Mobile Sidebar / Drawer */}
      <div className="md:hidden">
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between px-6 h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-white">SmartPOS</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Backdrop overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}

        {/* Sidebar Drawer */}
        <div
          className={`fixed inset-y-0 right-0 max-w-xs w-full bg-zinc-950 border-l border-zinc-900 p-6 z-40 transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <span className="text-lg font-bold text-white">Menu Navigation</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="space-y-1 mb-8">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-zinc-900 pt-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/20 border border-zinc-900 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {profile?.full_name || 'Smart Employee'}
                </p>
                <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold border ${currentRoleInfo.color}`}>
                  {currentRoleInfo.label}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900/50 hover:bg-red-950/20 border border-zinc-900 hover:border-red-900/30 px-4 py-3 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 to-zinc-950">
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
