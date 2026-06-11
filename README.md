# SmartPOS UMKM — Intelligent Retail Operating System

SmartPOS UMKM is a responsive, production-quality web-based Point of Sale (POS) and inventory decision support system designed specifically for Small and Medium Enterprises (UMKM). It evolves traditional POS systems by integrating rule-based operational intelligence, supplier optimization analytics, and transactional fraud audit tools.

This repository is built using **React**, **Vite**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**. It includes a local sandbox demo mode allowing exploration with seeded datasets out-of-the-box.

---

## 🚀 Key Features

### 1. Point of Sales (POS) Cashier Interface
* **Catalog Browser**: Search and filter products by categories. Out-of-stock items are automatically disabled.
* **Smart Cart**: Automatic discount calculations, live change returned calculator, and thermal receipt print layout.
* **Safe Checkouts**: Cashier transactions are completed locally in Sandbox mode or routed via a database RPC transaction (`process_checkout`) utilizing row-level database locks to prevent stock race conditions.

### 2. Intelligent Decision Support Dashboard
* **Dynamic Restock Predictor**: Calculates Average Daily Sales (ADS), Reorder Points (ROP), and depletion time forecasts.
* **Dead Stock Analyzer**: Segregates inventory into *Fast Moving*, *Slow Moving*, and *Dead Stock* categories using rolling 30-day velocity stats.
* **Store Alert Feed**: Real-time notifications detailing operational alerts (critical low stock, abnormal weekly sales drops, cashier scheduling tips, supplier delays).

### 3. Supplier Intelligence Module
* **Supplier CRM**: Manage supplier profiles, delivery lead times, reliability scores, and purchase price multipliers.
* **Procurement Heuristics**: Automatically scans and highlights alternative suppliers when stock drops below thresholds, recommending vendors based on speed and reliability.

### 4. Fraud & Transaction Anomaly Audit Console
* **Owner-Only Guard**: Secure audit screens displaying Recharts cashier charts, categories, and events.
* **Cashier Heuristics**: Logs suspicious logs in the background:
  * *Excessive Voids*: More than 3 cart line items removed/decreased during a cashier session.
  * *High-Value Refunds*: Canceled or refunded transactions exceeding Rp 200,000.
  * *Off-Hours Sales*: Transactions checked out between 10:00 PM and 6:00 AM.
  * *Mismatch Adjustments*: Downward manual adjustments of stock levels without matching sales invoices.

### 5. Promotion Recommendation Engine
* **Clearance Discount Suggester**: Recommends 15%-25% markdowns to liquidate slow-moving or dead stock.
* **Smart Combos**: Pairs high-demand (fast) goods with low-demand (slow) goods into bundling campaigns at a 10% discount.
* **Active Campaign Manager**: Interactive controls to play, pause, or end promotions, persisting in local storage.

---

## 🛠 Tech Stack & Architecture

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React (Icons).
* **Charts**: Recharts (Interactive Area, Bar, and Pie charts).
* **Database & Auth**: PostgreSQL on Supabase (RLS security policies, atomic checkout transactions, profile sync triggers).
* **Demo Sandbox**: Seamless fallback to local storage database when Supabase credentials are not provided.

---

## 📂 Project Structure

```
src/
├── components/          # Reusable shared components (Role guards, loaders)
├── config/              # Supabase API clients configurations
├── context/             # Global states (AuthContext, CartContext)
├── layouts/             # Collapsible layout panels (DashboardLayout)
├── pages/               # Main application modules:
│   ├── analytics/       # Recharts Executive Dashboards
│   ├── auth/            # Auth forms & Demo selector
│   ├── dashboard/       # Action alert feeds and ROP forecast panels
│   ├── fraud/           # Cashier anomaly audit ledger (restricted)
│   ├── inventory/       # Category CRUD & stock ledger corrections
│   ├── pos/             # Cashier cart, calculators, and receipts
│   ├── promotions/      # Bundles & markdown activation engine
│   ├── reports/         # Date filter lists, CSV exports, PDF printouts
│   └── suppliers/       # Procurement optimizer & vendor metrics
└── services/            # Service layers (Parity gates for Live/Demo modes):
    ├── analytics.ts
    ├── fraud.ts
    ├── inventory.ts
    ├── promotions.ts
    ├── recommendations.ts
    ├── sales.ts
    └── suppliers.ts
```

---

## 🧑‍💻 Quick Start & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Demo Sandbox Mode
If `.env` is unconfigured (or uses default placeholders), the app will boot in **Demo Sandbox Mode**, storing all modifications inside browser local storage.
```bash
npm run dev
```

### 3. Demo Credentials
Select one of the following mock profiles on the login screen to explore the application:
* **Store Owner**: `owner@smartpos.com` (password: `password123`) — *Full Executive Rights (Fraud Console & Promo Engine visible)*
* **Staff Gudang**: `gudang@smartpos.com` (password: `password123`) — *Inventory & Supplier management access*
* **Cashier**: `cashier@smartpos.com` (password: `password123`) — *POS terminal access only*

### 4. Deploy Live Database & Frontend
Please read the comprehensive setup guide in [DEPLOYMENT.md](file:///e:/ProjectJosJis/DEPLOYMENT.md) for step-by-step procedures to provision Supabase database migrations and host the client on Vercel.
