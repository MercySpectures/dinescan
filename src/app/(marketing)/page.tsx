import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "Smart Menu Builder",
    description: "Manage categories, images, availability, and featured picks in one flow."
  },
  {
    title: "QR Experience",
    description: "Generate brand-ready QR codes with multiple sizes and style presets."
  },
  {
    title: "Live Analytics",
    description: "Track scans, recent devices, and performance trends from your dashboard."
  },
  {
    title: "Team Ready",
    description: "Role scaffold for owner, manager, and viewer workflows."
  },
  {
    title: "Mobile First Menu",
    description: "Card-based menu with categories, search, and optional notes for each item."
  },
  {
    title: "Fast Operations",
    description: "Optimized actions, loading states, and responsive UI for real-world traffic."
  }
];

const marqueeWords = [
  "Instant QR Menus",
  "Restaurant Analytics",
  "Live Menu Updates",
  "Mobile First Ordering",
  "Premium Design System",
  "Faster Service Flow"
];

export default async function MarketingPage() {
  const supabase = await createServerSupabaseClient();
  const [restaurantCount, menuItemCount, scanCount] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("is_available", true),
    supabase.from("scan_events").select("*", { count: "exact", head: true })
  ]);

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-multiply opacity-70 animate-float" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-300/20 rounded-full blur-[150px] -z-10 mix-blend-multiply opacity-50 block md:hidden" />
      
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center font-bold text-white text-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform">D</div>
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">
              DineScan
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 md:flex">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden md:block btn-ghost">
              Login
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-40">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up z-10" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Built for modern dining.
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
              Digital dining, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">elevated.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-500 leading-relaxed md:text-xl">
              Launch a beautiful digital menu, update dishes instantly, and monitor real-time customer analytics with a stunning, secure platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register" className="btn-primary flex items-center justify-center py-4 text-base shadow-[0_0_40px_-5px_rgba(79,70,229,0.5)]">
                Start for free
              </Link>
              <Link href="/menu/demo" className="btn-outline flex items-center justify-center py-4 text-base hover:bg-slate-50">
                View Live Demo
              </Link>
            </div>
          </div>
          
          <div className="relative animate-fade-up z-10" style={{ animationDelay: "300ms" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-indigo-400/10 rounded-[2.5rem] blur-2xl transform -rotate-3"></div>
            <div className="card border-white/50 bg-white/50 backdrop-blur-2xl p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
              <p className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Live Network Activity
              </p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-slate-400">Active Places</p>
                  <p className="mt-2 font-display text-3xl font-bold text-primary">{restaurantCount.count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-slate-400">Menu Items</p>
                  <p className="mt-2 font-display text-3xl font-bold text-primary">{menuItemCount.count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-slate-400">Total Scans</p>
                  <p className="mt-2 font-display text-3xl font-bold text-primary">{scanCount.count ?? 0}</p>
                </div>
              </div>
              <div className="mt-8 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm font-medium text-primary text-center">
                Uncompromising speed and clarity in one secure view.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-slate-200/50 bg-white py-5">
        <div className="animate-[marquee_25s_linear_infinite] whitespace-nowrap flex items-center">
          {marqueeWords.concat(marqueeWords).map((word, index) => (
            <span key={`${word}-${index}`} className="mx-8 text-sm font-bold tracking-widest uppercase text-slate-300 flex items-center gap-8">
              {word}
              <span className="w-2 h-2 rounded-full bg-slate-200 block"></span>
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32 relative">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">The complete ecosystem.</h2>
          <p className="mt-4 text-lg text-slate-500">
            DineScan unifies menu operations, high-converting QR workflows, and precision analytics.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="card p-8 group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="w-4 h-4 bg-primary rounded-full"></span>
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">{card.title}</h3>
              <p className="mt-3 text-slate-500 leading-relaxed">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0A0F1C] to-[#0A0F1C] py-32 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Trusted by leading teams.</h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              "Our operations are 40% faster. Edits reflect instantly and without errors.",
              "The design is gorgeous. Customers compliment the menu experience daily.",
              "Security and analytics tracking give us peace of mind at scale."
            ].map((quote, idx) => (
              <blockquote key={idx} className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center md:text-left transition-transform hover:scale-105">
                <p className="text-slate-300 leading-relaxed text-lg">&quot;{quote}&quot;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-400"></div>
                  <div>
                    <p className="font-semibold text-sm">Restaurant Owner</p>
                    <p className="text-xs text-slate-400">Verified User</p>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-32">
        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-16 flex flex-col justify-center">
              <h3 className="font-display text-4xl font-bold text-slate-900">Simple pricing.<br/><span className="text-primary">Limitless value.</span></h3>
              <p className="mt-4 text-lg text-slate-500">
                No complex tiers or hidden fees. Adopt a premium platform and streamline your workflow today.
              </p>
              <ul className="mt-8 space-y-4">
                 {['Unlimited Scans & Menus', 'Advanced Analytics Dashboard', 'Premium Technical Support'].map(benefit => (
                    <li key={benefit} className="flex items-center gap-3 text-slate-700 font-medium">
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      {benefit}
                    </li>
                 ))}
              </ul>
            </div>
            <div className="bg-slate-50 p-10 md:p-16 flex flex-col items-center justify-center text-center border-l border-slate-100">
              <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Pro Plan</p>
              <div className="mt-4 flex items-baseline gap-1 text-slate-900 font-display font-bold">
                <span className="text-6xl tracking-tight">₹999</span>
                <span className="text-xl text-slate-500">/mo</span>
              </div>
              <p className="mt-4 text-sm text-slate-500">Billed securely via Stripe</p>
              <Link href="/auth/register" className="btn-primary w-full mt-8 py-4 text-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-32 text-center">
        <h4 className="font-display text-4xl font-bold tracking-tight text-slate-900">Ready to transform your service?</h4>
        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">Join the millions in the next generation of hospitality software. Zero setup fees. Instant deployment.</p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth/register" className="btn-primary py-4 px-8 text-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="font-display text-2xl font-bold text-slate-900 inline-flex items-center gap-2">
              <div className="h-6 w-6 rounded flex items-center justify-center bg-primary text-white text-xs">D</div>
              DineScan
            </Link>
            <p className="mt-4 text-sm text-slate-500 pr-4">Crafting the benchmark for digital dining and performance hospitality.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Platform</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              <li><Link href="#features" className="hover:text-primary transition-colors">Menu Builder</Link></li>
              <li><Link href="#features" className="hover:text-primary transition-colors">QR Generation</Link></li>
              <li><Link href="#features" className="hover:text-primary transition-colors">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Legal</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-6 text-center text-sm font-medium text-slate-400">
          © {new Date().getFullYear()} DineScan Technologies. All rights reserved.
        </div>
      </footer>
    </main>
  );
}


