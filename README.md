# ⛳ GolfCharity — Full-Stack Platform

> **Digital Heroes — Full-Stack Trainee Selection Assignment**
> Built with Node.js · Express · Next.js (JavaScript) · Supabase · Stripe

---

## 📁 Project Structure

```
golf-charity-platform/
├── backend/                   # Express API (Node.js)
│   ├── src/
│   │   ├── controllers/       # Route logic
│   │   │   ├── scores.js      # Golf score CRUD
│   │   │   ├── charities.js   # Charity management
│   │   │   ├── subscriptions.js
│   │   │   ├── draws.js       # Draw engine (simulate + publish)
│   │   │   ├── winners.js     # Winner verification
│   │   │   ├── admin.js       # Admin analytics + user mgmt
│   │   │   └── webhook.js     # Stripe webhook handler
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT auth, admin guard, sub guard
│   │   ├── routes/
│   │   │   └── index.js       # All routes wired together
│   │   ├── utils/
│   │   │   ├── supabase.js    # Supabase clients (anon + admin)
│   │   │   ├── stripe.js      # Stripe helpers
│   │   │   ├── email.js       # Nodemailer email templates
│   │   │   └── drawEngine.js  # Random + algorithmic draw logic
│   │   └── index.js           # Express server entry point
│   ├── supabase/migrations/
│   │   └── 001_schema.sql     # Full database schema
│   ├── .env.example
│   └── package.json
│
└── frontend/                  # Next.js App Router (JavaScript)
    ├── src/
    │   ├── app/
    │   │   ├── page.js            # Public homepage
    │   │   ├── layout.js          # Root layout + AuthProvider
    │   │   ├── globals.css        # Tailwind + global styles
    │   │   ├── auth/
    │   │   │   ├── login/page.js
    │   │   │   └── register/page.js
    │   │   ├── subscribe/page.js  # Plan selection → Stripe
    │   │   ├── dashboard/
    │   │   │   ├── layout.js      # Sidebar nav
    │   │   │   ├── page.js        # Overview
    │   │   │   ├── scores/page.js
    │   │   │   ├── charity/page.js
    │   │   │   ├── draws/page.js
    │   │   │   └── winnings/page.js
    │   │   └── admin/
    │   │       ├── layout.js      # Admin sidebar
    │   │       ├── page.js        # Analytics
    │   │       ├── users/page.js
    │   │       ├── draws/page.js  # Draw manager
    │   │       ├── charities/page.js
    │   │       └── winners/page.js
    │   ├── components/
    │   │   └── AuthContext.js     # Global auth state
    │   ├── lib/
    │   │   ├── supabase.js        # Browser Supabase client
    │   │   ├── api.js             # All backend API calls
    │   │   └── utils.js           # cn(), formatCurrency, etc.
    │   └── middleware.js          # Route protection
    ├── .env.example
    └── package.json
```

---

## 🚀 Setup Guide

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → **New project** (use a fresh account per PRD)
2. Copy your **Project URL** and **anon key** from Settings → API
3. Copy the **service_role key** (keep secret!)
4. Go to **SQL Editor** → paste and run `backend/supabase/migrations/001_schema.sql`

### 2. Create Stripe Products
1. Go to [stripe.com](https://stripe.com) → Products → Add product
2. Create **GolfCharity Monthly** — £9.99/month recurring → copy Price ID
3. Create **GolfCharity Yearly** — £99.99/year recurring → copy Price ID
4. Copy your **Publishable key** and **Secret key** from Developers → API keys
5. Set up webhook (see step 5)

### 3. Configure Backend
```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
```

### 4. Configure Frontend
```bash
cd frontend
cp .env.example .env
# Fill in Supabase and Stripe public keys + API URL
npm install
```

### 5. Stripe Webhook (local dev)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5000/api/webhooks/stripe
# Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET in backend/.env
```

### 6. Run Both Apps
```bash
# From root:
npm install          # installs concurrently
npm run dev          # starts both backend (5000) and frontend (3000)

# Or separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

---

## 🌍 Deployment

### Backend → Render / Railway
1. Create account at [render.com](https://render.com) or [railway.app](https://railway.app)
2. New Web Service → connect GitHub repo → set root to `backend/`
3. Build: `npm install` · Start: `node src/index.js`
4. Add all env vars from `.env.example`

### Frontend → Vercel (NEW account as per PRD)
1. Create a **new Vercel account** at [vercel.com](https://vercel.com)
2. Import GitHub repo → set root to `frontend/`
3. Add all env vars from `.env.example`
4. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL

### Update Stripe Webhook
After deploying, add a new webhook endpoint in Stripe Dashboard:
- URL: `https://your-backend-url/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## 🧪 Test Credentials (after setup)

### Test Stripe Card
```
Card: 4242 4242 4242 4242
Exp:  Any future date
CVC:  Any 3 digits
```

### Create Admin User
1. Register a normal account
2. In Supabase Dashboard → Table Editor → profiles
3. Find your user → set `role` to `admin`
4. Visit `/admin` for the admin panel

---

## ✅ PRD Checklist

| Feature | Status |
|---|---|
| Monthly + Yearly subscription (Stripe) | ✅ |
| Score entry — rolling 5 (DB trigger) | ✅ |
| Stableford range validation (1–45) | ✅ |
| Monthly prize draw (random + algorithmic) | ✅ |
| Jackpot rollover if no 5-match | ✅ |
| 40% / 35% / 25% pool distribution | ✅ |
| Charity selection (min 10%) | ✅ |
| Independent charity donation | ✅ (DB + API) |
| Winner verification workflow | ✅ |
| Proof upload → admin approve/reject | ✅ |
| Payment status tracking | ✅ |
| User dashboard (all modules) | ✅ |
| Admin panel (users, draws, charities, winners) | ✅ |
| Analytics + charts | ✅ |
| Email notifications (Nodemailer) | ✅ |
| JWT auth via Supabase | ✅ |
| Row-level security (Supabase RLS) | ✅ |
| Mobile-responsive design | ✅ |
| Stripe webhook handler | ✅ |
| Simulation mode (pre-analysis) | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express.js |
| Frontend | Next.js 14 (App Router, JavaScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Payments | Stripe |
| Email | Nodemailer (SMTP) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Vercel (frontend) + Render/Railway (backend) |

---

Built by — *Digital Heroes Full-Stack Trainee Assignment*
