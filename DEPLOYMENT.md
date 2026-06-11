# SmartPOS UMKM Live Deployment Guide

This document outlines the step-by-step procedure to push the SmartPOS UMKM codebase to a GitHub repository, host the database backend on Supabase Cloud, and deploy the React frontend on Vercel.

---

## Part 1: Push Codebase to GitHub

Run these commands inside your project root (`e:\ProjectJosJis`) to initialize version control and push the project to your GitHub account:

1. **Initialize Git Repository:**
   ```bash
   git init
   ```

2. **Add Files to Staging:**
   ```bash
   git add .
   ```

3. **Commit Code:**
   ```bash
   git commit -m "feat: complete smartpos intelligent retail operating system with supplier intelligence, fraud audit, and promo recommendations"
   ```

4. **Connect to Remote GitHub Repository:**
   Create a new blank repository on [GitHub](https://github.com/new) named `smartpos-umkm` (do NOT initialize it with README or gitignore), then run:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/smartpos-umkm.git
   git branch -M main
   git push -u origin main
   ```

---

## Part 2: Setup Supabase Database & Auth

Supabase acts as your live PostgreSQL database, authentication provider, and image storage host.

1. **Create Supabase Project:**
   - Log in to the [Supabase Dashboard](https://database.new) and click **New Project**.
   - Pick a project name (e.g., `SmartPOS UMKM`), choose a strong database password, and choose a region close to your target users (e.g., Singapore/East Asia).

2. **Get API Credentials (Keep these for Vercel):**
   - Once the project initializes, navigate to **Project Settings** -> **API**.
   - Copy the **Project URL** (`https://xxx.supabase.co`) and the **Public API Key** (`anon public`).

3. **Deploy Database Schema & Triggers:**
   - In the left sidebar of Supabase, click on **SQL Editor**.
   - Click **New Query**.
   - Copy the entire SQL contents from your first migration file [init_schema.sql](file:///e:/ProjectJosJis/supabase/migrations/20260611000000_init_schema.sql), paste it into the editor, and click **Run** to set up the core tables and security.
   - Click **New Query** again, copy the entire SQL contents from the second migration file [add_recommendation_fields.sql](file:///e:/ProjectJosJis/supabase/migrations/20260611000001_add_recommendation_fields.sql), paste it into the editor, and click **Run** to set up the decision support columns and triggers.
   - Click **New Query** again, copy the entire SQL contents from the third migration file [add_advanced_features.sql](file:///e:/ProjectJosJis/supabase/migrations/20260611000002_add_advanced_features.sql), paste it into the editor, and click **Run** to deploy the suppliers, transaction status alterations, and suspicious activity logs.

4. **(Optional) Seed Demonstration Data:**
   - Create a **New Query** in the SQL Editor.
   - Copy the contents from your local seed file:
     [seed.sql](file:///e:/ProjectJosJis/supabase/seed.sql)
   - Paste it into the editor and click **Run**. This seeds mock employee accounts, categories, products (pre-configured with decision support values), and 30 days of sales history.

5. **Disable Auth Email Confirmations (For Dev Ease):**
   - Navigate to **Authentication** -> **Providers** -> **Email**.
   - Turn off **Confirm email** so cashiers and store owners can log in immediately upon registration without needing to verify their emails first.

---

## Part 3: Deploy Frontend on Vercel

Vercel hosts the compiled single-page React client application and automatically redeploys it whenever you push code changes to GitHub.

1. **Import GitHub Repository:**
   - Log in to the [Vercel Dashboard](https://vercel.com/dashboard) (log in using your GitHub account for ease of integration).
   - Click **Add New** -> **Project**.
   - Find your `smartpos-umkm` repository from the list and click **Import**.

2. **Configure Build Settings:**
   - **Framework Preset**: Pick `Vite` (Vercel usually autodetects this).
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Map Environment Variables:**
   - Under **Environment Variables**, add the Supabase keys you copied in Part 2:
     - Name: `VITE_SUPABASE_URL`
       - Value: `https://your-project-id.supabase.co`
     - Name: `VITE_SUPABASE_ANON_KEY`
       - Value: `your-public-anon-key`
   - Click **Add for both**.

4. **Click Deploy:**
   - Vercel will clone the repo, install node modules, and compile the code.
   - Within 1–2 minutes, your site will be live on a subdomain like `https://smartpos-umkm.vercel.app`!

---

## Part 4: Enable Image Uploads (Supabase Storage)

To support uploading custom product images:

1. In the Supabase Dashboard, click on **Storage** in the left menu.
2. Click **New Bucket** and name it exactly `product-images`.
3. Set the bucket privacy toggle to **Public** (so Vercel can pull image URLs directly).
4. Under **Policies**, add a policy allowing `Authenticated` users to perform `Insert`, `Update`, and `Delete` operations on the bucket.
