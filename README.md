# DineScan 🚀
The Premium QR-Based Digital Menu & Instant Ordering SaaS Platform

Welcome to DineScan, a high-performance web application tailored for restaurant owners to digitize their menus and boost customer experiences. Built with a stunning mobile-first glassmorphic aesthetic, DineScan simplifies modern table ordering.

## ✨ Key Capabilities

1. **Stunning Public Menu:** An immersive, dynamic menu specifically designed for mobile experiences, giving diners a high-end feel while browsing and ordering directly from their tables. Includes "Chef's Picks" and dietary markers.
2. **Instant Ordering System:** Guests build a bill at their table and shoot their order straight to the kitchen dashboard (or optionally print/WhatsApp). 
3. **Powerful Analytics Dashboard:** Restaurant managers are presented with a real-time dashboard loaded with actionable data, total revenue, and real-time page scans.
4. **QR Generation:** A specialized interface to dynamically print unique QR codes mapped to table numbers, giving every table its own tracked session.
5. **Role-based Authentication:** Secure dashboard zones powered by Supabase Auth and Row Level Security (RLS) guaranteeing data privacy between distinct restaurant owners.

## 🛠️ Technology Stack

- **Core & Routing:** [Next.js 14](https://nextjs.org/) (App Directory)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Interactions:** [Framer Motion](https://www.framer.com/motion/) for buttery page transitions and responsive animations
- **Database & Auth:** [Supabase](https://supabase.com/) PostgreSQL + Row Level Security
- **Type Checking:** [TypeScript](https://www.typescriptlang.org/) for ironclad deployments
- **Icons:** [Lucide React](https://lucide.dev/)

## 🎨 Visual Identity

The interface of DineScan leverages a **"Glassmorphism Premium"** style intended to look and feel like an enterprise, multi-million dollar venture.
This is achieved by applying variables for deep semi-transparent blurring (`backdrop-blur-3xl`, `bg-white/80`), elegant layout animations in standard navigation and route swaps, and clean spacing protocols. It deliberately avoids harsh lines and instead relies on soft shadows and card layering.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (Version 18+)
- A Supabase Project configured with the DineScan schema

### 2. Environment Variables
Create a `.env.local` file in the root of your project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the outcome.

## 🌐 Project Architecture

- `/src/app/(marketing)` - The public-facing landing page, engineered for high conversions.
- `/src/app/auth` - Secure sign-in and sign-up flows.
- `/src/app/dashboard` - The central hub for restaurant owners to manage their `orders`, `menus`, `settings`, and `qr` codes. Utilizes specialized Next.js loading skeletons for instantaneous perceived navigation speed.
- `/src/app/menu` - The end-user entry spot (using `[slug]`) for ordering from the tables.

## 📄 License
This project is proprietary and confidential. Unauthorized copying of this file, via any medium is strictly prohibited.
