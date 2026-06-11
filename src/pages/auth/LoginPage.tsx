import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../context/AuthContext'
import { LogIn, Key, Mail, Sparkles, UserCheck } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { signIn, enableDemoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where to redirect after login (default is dashboard root)
  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message || 'Authentication failed. Please check credentials.')
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = (role: UserRole) => {
    enableDemoMode(role)
    navigate(from, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background visual decorative blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-purple-600/10 blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[150px]"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            SmartPOS <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">UMKM</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-xs">
            A Smart Decision Support POS & Inventory System for Small Retail Shops
          </p>
        </div>

        {/* Main Glassmorphic Card */}
        <div className="glass border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl bg-red-950/40 border border-red-900/50 p-4 text-sm text-red-400 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="owner@smartpos.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-950 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    Sign In
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Section */}
          <div className="mt-8 border-t border-zinc-800/80 pt-6">
            <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <UserCheck className="h-4 w-4 text-purple-400" />
              <span>Or Login with Demo Roles</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickDemo('owner')}
                className="flex flex-col items-center justify-center py-2.5 px-2 bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-800/80 hover:border-purple-600/50 rounded-xl text-xs font-medium text-purple-300 hover:text-white transition-all cursor-pointer"
              >
                <span className="font-bold text-[10px] uppercase opacity-70">Owner</span>
                <span className="text-[9px] mt-1 text-zinc-500">Full Access</span>
              </button>

              <button
                onClick={() => handleQuickDemo('cashier')}
                className="flex flex-col items-center justify-center py-2.5 px-2 bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-800/80 hover:border-indigo-600/50 rounded-xl text-xs font-medium text-indigo-300 hover:text-white transition-all cursor-pointer"
              >
                <span className="font-bold text-[10px] uppercase opacity-70">Cashier</span>
                <span className="text-[9px] mt-1 text-zinc-500">Checkout Only</span>
              </button>

              <button
                onClick={() => handleQuickDemo('staff_gudang')}
                className="flex flex-col items-center justify-center py-2.5 px-2 bg-zinc-900/40 hover:bg-zinc-800/50 border border-zinc-800/80 hover:border-emerald-600/50 rounded-xl text-xs font-medium text-emerald-300 hover:text-white transition-all cursor-pointer"
              >
                <span className="font-bold text-[10px] uppercase opacity-70">Gudang</span>
                <span className="text-[9px] mt-1 text-zinc-500">Stock Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
