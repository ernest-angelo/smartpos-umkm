import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../context/AuthContext'
import { LogIn, Key, Mail, Sparkles, UserCheck, X } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

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
        setIsLoginModalOpen(false)
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
    setIsLoginModalOpen(false)
    navigate(from, { replace: true })
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-md overflow-x-hidden selection:bg-primary/30 min-h-screen relative">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-40 bg-[#131315]/80 backdrop-blur-md border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <span className="font-headline-h2 text-headline-h2 tracking-tight text-white">SmartPOS <span className="text-primary font-bold">UMKM</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">Fitur</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#pricing">Harga</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#testimoni">Testimoni</a>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="primary-gradient-btn px-6 py-2.5 rounded-full font-label-md text-label-md text-white cursor-pointer"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-32">
        {/* Hero Section */}
        <section className="px-6 md:px-12 mb-32 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Baru: Integrasi AI Generative</span>
            </div>
            <h1 className="font-display-lg text-display-lg md:text-[72px] leading-[1.1] mb-6 gradient-text">
              Transformasi Digital Retail UMKM dengan Kecerdasan AI
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
              Sistem POS, Inventaris, dan Analitik tercanggih untuk memajukan bisnis Anda ke level eksekutif dengan data real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="primary-gradient-btn w-full sm:w-auto px-10 py-4 rounded-xl font-label-md text-headline-h3 text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                Mulai Uji Coba Gratis <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="glass-card w-full sm:w-auto px-10 py-4 rounded-xl font-label-md text-headline-h3 text-on-surface border border-white/10 cursor-pointer"
              >
                Lihat Demo Video
              </button>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-tertiary/30 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative glass-card rounded-2xl overflow-hidden border border-white/10">
                <img 
                  alt="SmartPOS Dashboard Preview" 
                  className="w-full aspect-video object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA87EEvdWdlTsB9zmDIGraLwnzGsiT7CWQqDOybU1EGDoQhcVr38DdTZRmNMnGn6tXZpqWSTvGi2ijSagfvRWytZkIa9JjPC9aZmyKJuO2OMZyitxxSM9jKJaS8VO66rZU7RftQ1PmjdCLo6ecKIW21SW-bChzoDKNu0CgzhprI5ssUkNri2QaPjObjf_Tvs1-eMY_Pv-Zo6CAwC2EK38iASvLEL7DPJE3mHfdqHPqlSraDmN3VtMZMianhMQGyzAZfKPKVcYV_WetI"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section id="features" className="px-6 md:px-12 py-24 mb-24 bg-surface-container-lowest relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
              <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                <span className="material-symbols-outlined text-primary text-3xl">bolt</span>
              </div>
              <h3 className="font-headline-h2 text-headline-h2 mb-4 text-white">Kasir Cepat</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Proses transaksi kurang dari 2 detik dengan antarmuka yang dioptimalkan untuk kecepatan tinggi dan integrasi hardware lengkap.
              </p>
            </div>
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group border-primary/20 bg-surface-container-low/40">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl group-hover:bg-tertiary/20 transition-colors"></div>
              <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                <span className="material-symbols-outlined text-tertiary text-3xl">smart_toy</span>
              </div>
              <h3 className="font-headline-h2 text-headline-h2 mb-4 text-white">Inventaris Pintar</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Prediksi stok otomatis menggunakan AI. Jangan pernah kehilangan penjualan karena stok habis dengan pengingat restock cerdas.
              </p>
            </div>
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-colors"></div>
              <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                <span className="material-symbols-outlined text-secondary text-3xl">analytics</span>
              </div>
              <h3 className="font-headline-h2 text-headline-h2 mb-4 text-white">Analitik Eksekutif</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Laporan mendalam tentang margin keuntungan, performa produk, dan loyalitas pelanggan dalam satu dashboard elegan.
              </p>
            </div>
          </div>
        </section>

        {/* Why SmartPOS Section */}
        <section className="px-6 md:px-12 py-24 mb-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-h1 text-headline-h1 mb-4 text-white">Kenapa SmartPOS?</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">Dirancang khusus untuk ekosistem UMKM Indonesia dengan fitur lokal yang lengkap.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 glass-card p-8 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <span className="material-symbols-outlined text-primary">qr_code_2</span>
                    </div>
                    <span className="font-headline-h3 text-headline-h3 text-white">Pembayaran QRIS</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">Terintegrasi langsung dengan semua penyedia QRIS nasional. Terima pembayaran dari dompet digital apa pun secara instan.</p>
                </div>
                <div className="mt-12 flex justify-end">
                  <span className="material-symbols-outlined text-6xl text-white/5">account_balance_wallet</span>
                </div>
              </div>
              <div className="glass-card p-8 rounded-3xl">
                <div className="p-3 bg-tertiary/10 rounded-xl w-fit mb-6">
                  <span className="material-symbols-outlined text-tertiary">language</span>
                </div>
                <h4 className="font-headline-h3 text-headline-h3 mb-3 text-white">100% Bahasa</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Antarmuka sepenuhnya dalam Bahasa Indonesia, mudah dipahami oleh seluruh tim Anda tanpa kendala bahasa.</p>
              </div>
              <div className="glass-card p-8 rounded-3xl">
                <div className="p-3 bg-secondary/10 rounded-xl w-fit mb-6">
                  <span className="material-symbols-outlined text-secondary">payments</span>
                </div>
                <h4 className="font-headline-h3 text-headline-h3 mb-3 text-white">Format Rupiah</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Penghitungan pajak (PPN), diskon, dan pembulatan kasir sesuai standar ritel Indonesia yang umum digunakan.</p>
              </div>
              <div className="glass-card p-8 rounded-3xl">
                <div className="p-3 bg-error/10 rounded-xl w-fit mb-6">
                  <span className="material-symbols-outlined text-error">cloud_sync</span>
                </div>
                <h4 className="font-headline-h3 text-headline-h3 mb-3 text-white">Sync Offline</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Internet mati? Tidak masalah. Terus jualan secara offline dan data akan sinkron otomatis saat koneksi kembali.</p>
              </div>
              <div className="md:col-span-3 glass-card p-8 rounded-3xl flex items-center gap-8">
                <div className="flex-1">
                  <h4 className="font-headline-h3 text-headline-h3 mb-3 text-white">Akses Multi-Outlet</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">Kelola 10 atau 100 cabang sekaligus dari satu aplikasi. Pantau performa semua cabang secara real-time dari mana saja.</p>
                </div>
                <div className="hidden md:block w-48 h-32 bg-surface-container-high rounded-xl border border-white/5 p-4">
                  <div className="flex flex-col gap-2">
                    <div className="h-2 w-full bg-white/10 rounded"></div>
                    <div className="h-2 w-3/4 bg-white/10 rounded"></div>
                    <div className="h-2 w-1/2 bg-primary/40 rounded mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Recommendations Console Preview Section */}
        <section id="testimoni" className="px-6 md:px-12 py-32 bg-surface-container-low relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline-h1 text-headline-h1 mb-8 text-white">Konsol Keputusan Cerdas</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">auto_graph</span>
                  </div>
                  <div>
                    <h4 className="font-headline-h3 text-headline-h3 mb-2 text-white">Restock Predictive AI</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">Sistem kami mempelajari pola pembelian pelanggan Anda dan memberitahu Anda kapan tepatnya harus memesan barang ke supplier.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-tertiary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary">campaign</span>
                  </div>
                  <div>
                    <h4 className="font-headline-h3 text-headline-h3 mb-2 text-white">Promo Engine Otomatis</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">Gunakan AI untuk membuat kampanye promo yang paling efektif berdasarkan stok yang lambat bergerak (slow-moving items).</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">shield_person</span>
                  </div>
                  <div>
                    <h4 className="font-headline-h3 text-headline-h3 mb-2 text-white">Audit Fraud Real-time</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">Deteksi aktivitas mencurigakan secara instan untuk mencegah kebocoran pendapatan di kasir.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="glass-card p-6 rounded-[2rem] border-white/10 shadow-2xl relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-label-md text-label-md text-white">Rekomendasi Stok</span>
                  <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full">AI Suggested</span>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">📦</div>
                      <div>
                        <div className="font-label-md text-label-md text-white">Susu Ultra 1L</div>
                        <div className="text-xs text-on-surface-variant">Sisa 5 pcs (Habis dlm 2 hari)</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">🍞</div>
                      <div>
                        <div className="font-label-md text-label-md text-white">Roti Tawar</div>
                        <div className="text-xs text-on-surface-variant">Sisa 12 pcs (Normal)</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  </div>
                  <div className="mt-6 p-4 border-t border-white/5">
                    <div className="text-xs text-on-surface-variant mb-2">PROMO SUGGESTION</div>
                    <div className="text-sm font-medium text-white">Beli 2 Gratis 1 "Kopi Kenangan" untuk menghabiskan stok sebelum kedaluwarsa.</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-full h-full border border-white/5 rounded-[2rem] -z-10"></div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-6 md:px-12 py-32">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="font-headline-h1 text-headline-h1 mb-4 text-white">Pilih Paket Kesuksesan Anda</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Investasi cerdas untuk pertumbuhan bisnis jangka panjang.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between">
              <div>
                <span className="text-on-surface-variant text-sm font-bold tracking-widest uppercase mb-4 block">Starter</span>
                <div className="flex items-baseline gap-1 mb-4 text-white">
                  <span className="text-3xl font-bold">Rp</span>
                  <span className="text-5xl font-bold tracking-tighter">199k</span>
                  <span className="text-on-surface-variant">/bln</span>
                </div>
                <p className="text-on-surface-variant text-sm mb-6">Cocok untuk UMKM baru.</p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> 1 Outlet</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Unlimited Transaksi</li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-lg">remove_circle</span> Laporan AI Lanjutan</li>
                  <li className="flex items-center gap-3 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-lg">remove_circle</span> Promo Engine</li>
                </ul>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-4 rounded-2xl border border-white/10 font-label-md text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Pilih Starter
              </button>
            </div>
            <div className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between border-primary/40 relative scale-105 shadow-2xl shadow-primary/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold">PALING POPULER</div>
              <div>
                <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block">Professional</span>
                <div className="flex items-baseline gap-1 mb-4 text-white">
                  <span className="text-3xl font-bold">Rp</span>
                  <span className="text-5xl font-bold tracking-tighter">499k</span>
                  <span className="text-on-surface-variant">/bln</span>
                </div>
                <p className="text-on-surface-variant text-sm mb-6">Optimasi penuh untuk retail modern.</p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Hingga 5 Outlet</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Inventaris Predictive AI</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Dashboard Multi-Admin</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> WhatsApp Reporting</li>
                </ul>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-4 rounded-2xl primary-gradient-btn font-label-md text-white cursor-pointer"
              >
                Mulai Pro Sekarang
              </button>
            </div>
            <div className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between">
              <div>
                <span className="text-on-surface-variant text-sm font-bold tracking-widest uppercase mb-4 block">Enterprise</span>
                <div className="flex items-baseline gap-1 mb-4 text-white">
                  <span className="text-4xl font-bold tracking-tighter">Custom</span>
                </div>
                <p className="text-on-surface-variant text-sm mb-6">Untuk jaringan ritel nasional.</p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Outlet Tak Terbatas</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Integrasi API Khusus</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Account Manager Pribadi</li>
                  <li className="flex items-center gap-3 text-sm text-white"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> On-premise Database</li>
                </ul>
              </div>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full py-4 rounded-2xl border border-white/10 font-label-md text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Hubungi Sales
              </button>
            </div>
          </div>
        </section>

        {/* Siap Naik Level Section */}
        <section className="px-6 md:px-12 py-32">
          <div className="max-w-4xl mx-auto glass-card p-12 rounded-[3rem] text-center border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"></div>
            <h2 className="font-headline-h1 text-headline-h1 mb-6 relative z-10 text-white">Siap Naik Level Bersama AI?</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 relative z-10">Gabung dengan ribuan UMKM yang telah beralih ke masa depan retail. Gratis coba selama 14 hari.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <input 
                className="w-full sm:w-80 bg-zinc-900 border-zinc-800 text-white rounded-xl py-4 px-6 focus:ring-primary focus:border-primary outline-none" 
                placeholder="Email bisnis Anda" 
                type="email"
              />
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 primary-gradient-btn rounded-xl font-bold text-white cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-20 bg-[#0e0e10] border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <span className="font-headline-h3 text-headline-h3 text-white">SmartPOS</span>
            </div>
            <p className="text-on-surface-variant text-sm max-w-xs mb-8">
              Solusi point of sale masa depan untuk memberdayakan pengusaha kecil di seluruh Indonesia dengan teknologi AI kelas dunia.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors" href="#">
                <span className="material-symbols-outlined text-sm text-white">public</span>
              </a>
              <a className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors" href="#">
                <span className="material-symbols-outlined text-sm text-white">share</span>
              </a>
            </div>
          </div>
          <div>
            <h5 className="font-label-md text-label-md mb-6 uppercase tracking-wider text-white">Produk</h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Fitur Utama</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Hardware</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Update AI</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Mobile App</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-md text-label-md mb-6 uppercase tracking-wider text-white">Sumber Daya</h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Blog Ritel</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Panduan UMKM</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Bantuan</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-label-md text-label-md mb-6 uppercase tracking-wider text-white">Perusahaan</h5>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Tentang Kami</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Karir</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Privasi</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Syarat &amp; Ketentuan</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant">© 2026 SmartPOS UMKM. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-on-surface-variant">Made with 💜 for Indonesia</span>
          </div>
        </div>
      </footer>

      {/* Interactive Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 transition-all duration-300">
          <div className="w-full max-w-md bg-[#1c1b1d] border border-white/10 rounded-3xl p-8 shadow-2xl relative animate-fade-in">
            {/* Close Button */}
            <button 
              onClick={() => {
                setIsLoginModalOpen(false)
                setError(null)
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Logo + Heading */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
                SmartPOS <span className="text-primary">UMKM</span>
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Sistem Keputusan Cerdas & Kasir Retail UMKM
              </p>
            </div>

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="rounded-xl bg-red-950/40 border border-red-900/50 p-4 text-sm text-red-400 animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Alamat Email
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
                      className="block w-full pl-10 pr-4 py-3 bg-[#131315]/80 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
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
                      className="block w-full pl-10 pr-4 py-3 bg-[#131315]/80 border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-primary-container to-secondary-container px-4 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Masuk...
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
            <div className="mt-8 border-t border-white/5 pt-6">
              <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>Atau Masuk dengan Akun Demo</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickDemo('owner')}
                  className="flex flex-col items-center justify-center py-2.5 px-2 bg-[#131315]/60 hover:bg-[#131315]/90 border border-white/5 hover:border-primary/50 rounded-xl text-xs font-medium text-primary-fixed-dim hover:text-white transition-all cursor-pointer"
                >
                  <span className="font-bold text-[10px] uppercase opacity-70">Owner</span>
                  <span className="text-[9px] mt-1 text-zinc-500">Full Access</span>
                </button>

                <button
                  onClick={() => handleQuickDemo('cashier')}
                  className="flex flex-col items-center justify-center py-2.5 px-2 bg-[#131315]/60 hover:bg-[#131315]/90 border border-white/5 hover:border-secondary-container/50 rounded-xl text-xs font-medium text-secondary hover:text-white transition-all cursor-pointer"
                >
                  <span className="font-bold text-[10px] uppercase opacity-70">Kasir</span>
                  <span className="text-[9px] mt-1 text-zinc-500">Checkout Only</span>
                </button>

                <button
                  onClick={() => handleQuickDemo('staff_gudang')}
                  className="flex flex-col items-center justify-center py-2.5 px-2 bg-[#131315]/60 hover:bg-[#131315]/90 border border-white/5 hover:border-tertiary-fixed-dim/50 rounded-xl text-xs font-medium text-tertiary hover:text-white transition-all cursor-pointer"
                >
                  <span className="font-bold text-[10px] uppercase opacity-70">Gudang</span>
                  <span className="text-[9px] mt-1 text-zinc-500">Stock Only</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
