# DineScan — Production & Vercel Deployment Guide

This guide walks you through deploying **DineScan** to production on **Vercel** with **Supabase**, dynamic routing, and Razorpay payment integration.

---

## 1. Prerequisites
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account
- Your live [Supabase](https://supabase.com) project credentials

---

## 2. Push Code to GitHub

Open PowerShell or terminal in `f:/dineScan/dinescan` and push your repository:

```bash
git init
git add .
git commit -m "feat: production ready DineScan with custom branding, dynamic routing, and KOT engine"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

*(Note: `.gitignore` is already configured so `.env.local` and `.next/` will not be committed).*

---

## 3. Import Project to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Select your GitHub repository (`dinescan`).
3. Under **Framework Preset**, Vercel will automatically detect **Next.js**.
4. In **Root Directory**, keep `./` (or leave default if repository root is the project root).
5. Open the **Environment Variables** section.

---

## 4. Configure Environment Variables in Vercel

Add the following environment variables under **Project Settings → Environment Variables**:

| Variable Name | Recommended Production Value | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://your-dinescan-domain.vercel.app` | Production domain used for OpenGraph meta and QR URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | Supabase service role secret (kept secure on server) |
| `NEXT_PUBLIC_DEMO_EMAIL` | `demo@dinescan.app` | Quick demo owner email for onboarding testing |
| `NEXT_PUBLIC_DEMO_PASSWORD` | `<secure-demo-password>` | Quick demo owner password |
| `ADMIN_EMAILS` | `admin@dinescan.app` | Comma-separated master superadmin emails |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` (or test key) | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | `<your-razorpay-secret>` | Razorpay secret key |

> [!IMPORTANT]
> Make sure `NEXT_PUBLIC_SITE_URL` matches your actual production Vercel URL (e.g., `https://dinescan.vercel.app` or custom domain `https://dinescan.com`) without a trailing slash.

---

## 5. Configure Supabase Auth & CORS Settings

To ensure authentication and redirects work properly in production:

1. Open your **Supabase Project Dashboard** → **Authentication** → **URL Configuration**.
2. Set **Site URL** to:
   ```
   https://your-dinescan-domain.vercel.app
   ```
3. In **Redirect URLs**, add:
   ```
   https://your-dinescan-domain.vercel.app/**
   https://your-dinescan-domain.vercel.app/auth/callback
   http://localhost:3000/**
   http://localhost:3001/**
   ```
4. Save changes.

---

## 6. Deploy & Verify

1. In Vercel, click **Deploy**.
2. Wait 60–90 seconds for Next.js build compilation.
3. Once finished, test the following critical flows on your live URL:
   - **Homepage & Brand**: Inspect `/` for custom logo and theme toggle.
   - **Authentication**: Test login at `/auth/login` and account registration at `/auth/register`.
   - **Dynamic Restaurant Dashboard**: Verify `/<restaurant-slug>/dashboard` (e.g., `/silsila/dashboard` or `/rutba/dashboard`).
   - **Live Kitchen Display (KOT)**: Verify `/<restaurant-slug>/dashboard/kot` plays audio chime when new orders arrive.
   - **Mobile Waiter POS**: Verify item selection, table selection, CGST/SGST breakdown, and 1-click dispatch.
   - **Table QR Generation**: Test `/dashboard/qr` and download/print customized table tents.
   - **Public QR Menu**: Scan or open `/menu/<restaurant-slug>` from your phone.
   - **Superadmin Portal**: Log in as `admin@dinescan.app` at `/admin`.

---

## 7. Custom Domain (Optional)

1. In Vercel, go to **Settings** → **Domains**.
2. Enter your custom domain (e.g. `dinescan.com` or `app.yourdomain.com`).
3. Add the recommended `CNAME` or `A` record in your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.).
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel to use your custom domain!
