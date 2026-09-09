"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { 
  Flame, Smartphone, Grid, Users, QrCode, ShieldCheck, Zap, ArrowRight, 
  CheckCircle2, Star, HelpCircle, TrendingUp, Sparkles, Check, Globe, 
  Sun, Moon, ChevronDown, Share2, Search, ExternalLink, Sliders
} from "lucide-react";
import { LandingInteractivePreview } from "./interactive-preview";

const partnerBrands = [
  "Spice Garden Cafe", "Urban Bistro & Bar", "Royal Tandoor House", 
  "Tokyo Sushi Lounge", "Bella Italia Pizzeria", "Gourmet Burger Lab", 
  "Cafe Mocha & Co.", "Skyline Roof Lounge", "The Belgian Waffle", "Taco Fiesta"
];

const capabilityHighlights = [
  "⚡ 0.4s Ultra-Fast QR Load", "🛎️ Web Audio KOT Chime", "💳 Cash, UPI & Online Payments",
  "📑 CGST + SGST Split Billing", "📱 Mobile Waiter POS", "📦 WhatsApp Digital Receipts",
  "🏢 Multi-Branch Admin Portal", "🎨 Customizable QR Branding", "📍 Live Table Floor Operations"
];

const stackedFeatures = [
  {
    id: "kot",
    title: "Real-Time KOT Kitchen Screen",
    tagline: "Zero paper tickets, instant audio bell chime & elapsed timers.",
    description: "Orders placed by diners or waiters appear on kitchen displays in under 200ms with Web Audio bell alerts, color-coded timers, and 1-click thermal print support.",
    icon: Flame,
    color: "from-amber-500 to-orange-600",
    metrics: "99.9% Ticket Delivery • 0 Paper Waste"
  },
  {
    id: "pos",
    title: "Mobile Waiter POS & Tax Engine",
    tagline: "Take table orders from any smartphone with CGST/SGST splitting.",
    description: "Equip your waitstaff with a lightning-fast mobile POS interface. Supports item search, table selection, tax calculation, and instant kitchen dispatch.",
    icon: Smartphone,
    color: "from-emerald-500 to-teal-600",
    metrics: "12min Saved per Table • Auto GST Split"
  },
  {
    id: "tables",
    title: "Table Floor Operations Grid",
    tagline: "Live table map tracking Vacant, Occupied & Billing states.",
    description: "Visual floor map gives managers bird's-eye view of all dining tables, active order counts, running bill totals, and occupied duration.",
    icon: Grid,
    color: "from-indigo-500 to-blue-600",
    metrics: "Realtime Floor Map • 30% Faster Turnaround"
  },
  {
    id: "qr",
    title: "Dynamic QR Suite & PDF Cards",
    tagline: "High-resolution branded table QR cards with instant PDF export.",
    description: "Generate table QR codes matching your restaurant theme color. Download vector PDF cards or bulk export full table ZIP archives in 1 click.",
    icon: QrCode,
    color: "from-purple-500 to-pink-600",
    metrics: "4 Branding Palettes • HD PDF Download"
  },
  {
    id: "share",
    title: "OpenGraph Social Link Preview",
    tagline: "Rich WhatsApp & social media sharing card preview.",
    description: "Every restaurant gets a direct URL like dinescan.app/menu/yourcafe with full OpenGraph social cards for WhatsApp, Twitter, and iMessage sharing.",
    icon: Share2,
    color: "from-teal-500 to-emerald-600",
    metrics: "Instant WhatsApp Receipt • OpenGraph Cards"
  }
];

const featureCards = [
  {
    icon: Flame,
    title: "Real-Time KOT Kitchen Screen",
    description: "Digital kitchen display screen with Web Audio API bell chime alerts, wait timers, and 1-click thermal receipt printing."
  },
  {
    icon: Smartphone,
    title: "Mobile Waiter POS",
    description: "Take table orders directly from any smartphone or tablet with instant kitchen dispatch and payment mode logging."
  },
  {
    icon: ShieldCheck,
    title: "Automatic GST Tax Billing",
    description: "Configure your GSTIN and auto-calculate CGST (2.5%) + SGST (2.5%) tax breakdown on POS & customer table receipts."
  },
  {
    icon: Grid,
    title: "Table Floor Operations",
    description: "Live table floor map tracking Vacant, Occupied, Billing, and Reserved states in real-time."
  },
  {
    icon: Users,
    title: "Granular Staff Roles",
    description: "Assign specific roles for Owner, Manager, Kitchen display, Waitstaff, and Cashiers with privilege cards."
  },
  {
    icon: QrCode,
    title: "QR Code Generator Suite",
    description: "Generate and download custom high-resolution table QR codes with 4 branding themes and bulk ZIP export."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    description: "Ideal for small cafes, food trucks & QSRs",
    features: [
      "Up to 15 Tables & QR codes",
      "Digital Menu & Self-Ordering",
      "Real-Time KOT Kitchen Screen",
      "50 Menu Items Catalog",
      "Email & Chat Support"
    ],
    popular: false,
    cta: "Start Free Trial",
    href: "/auth/register"
  },
  {
    name: "Pro Business",
    price: "₹999",
    period: "/month",
    description: "For busy restaurants, fine dining & bars",
    features: [
      "Up to 50 Tables & QR codes",
      "Mobile POS for Waitstaff",
      "Automatic GST Tax Billing",
      "Table Operations Floor Plan",
      "Granular Staff Roles (Up to 5 staff)",
      "200 Menu Items & Analytics",
      "24/7 Priority Support"
    ],
    popular: true,
    cta: "Get Started Now",
    href: "/auth/register"
  },
  {
    name: "Enterprise Multi-Chain",
    price: "₹1,999",
    period: "/month",
    description: "For restaurant chains & large venues",
    features: [
      "Unlimited Tables & QR codes",
      "Multi-Branch Admin Portal",
      "Unlimited Staff & Cashiers",
      "Custom Branding & Domain",
      "Dedicated Account Manager",
      "SLA 99.9% Uptime Guarantee"
    ],
    popular: false,
    cta: "Contact Enterprise",
    href: "/auth/register"
  }
];

const faqsList = [
  {
    q: "How fast can I setup my restaurant digital QR menu?",
    a: "Setup takes under 60 seconds! Simply register your restaurant name, and DineScan will automatically seed default starter categories and items that you can customize immediately."
  },
  {
    q: "Does DineScan support GST billing and tax calculations?",
    a: "Yes! DineScan built-in POS automatically splits CGST and SGST rates on all table and counter invoices according to your custom tax settings."
  },
  {
    q: "Can I manage multiple staff members with different access levels?",
    a: "Absolutely. DineScan supports 5 granular staff roles: Owner, Manager, Kitchen Display, Waiter, and Cashier, ensuring everyone sees only what they need."
  },
  {
    q: "How do dedicated cafe links and social media previews work?",
    a: "Every restaurant gets a clean direct URL like dinescan.app/menu/mercy-cafe with full OpenGraph social cards for WhatsApp, Twitter, iMessage, and Facebook link sharing!"
  },
  {
    q: "What hardware or thermal printers are supported for KOT?",
    a: "DineScan works seamlessly on any browser-enabled device including iPads, Android tablets, smartphones, PCs, and standard 80mm thermal receipt printers!"
  },
  {
    q: "Can customers send order receipts directly to WhatsApp?",
    a: "Yes! Once an order is placed, diners can click the 1-click WhatsApp Receipt button to send a formatted digital breakdown of their order to WhatsApp."
  },
  {
    q: "Can I accept online payments like Razorpay and direct UPI QR?",
    a: "Yes! You can configure direct table UPI VPAs, Razorpay keys, and Cash on Table options in your restaurant settings."
  },
  {
    q: "Is there a free trial available?",
    a: "Yes, all new accounts come with a 14-day full feature trial with no credit card required!"
  }
];

const testimonials = [
  {
    quote: "The KOT display screen eliminated lost paper order tickets completely. Kitchen staff loves the Web Audio bell chime!",
    name: "Rajesh Kumar",
    role: "Owner, Spice Garden Cafe",
    city: "Mumbai",
    metric: "+35% Order Processing Speed"
  },
  {
    quote: "Waiters use the mobile POS on their phones. Table turnover is 30% faster during weekend peak dinner hours.",
    name: "Priya Sharma",
    role: "General Manager, Urban Bistro",
    city: "Bengaluru",
    metric: "12 Mins Saved per Table"
  },
  {
    quote: "Setting up GST tax billing took 2 minutes. Dynamic QR table generation makes downloading PDF cards super easy.",
    name: "Amit Mehta",
    role: "Operations Lead, Grand Tandoor",
    city: "Delhi NCR",
    metric: "100% Tax Compliant Invoices"
  },
  {
    quote: "Sending digital receipts via WhatsApp directly from the menu saved us thousands on paper roll expenses monthly.",
    name: "Sneha Patel",
    role: "Cafe Founder, Mocha & Co.",
    city: "Pune",
    metric: "₹18,000 Annual Paper Savings"
  },
  {
    quote: "Staff roles with PIN security gave our cashiers and waiters exact access without exposing financial settings.",
    name: "Vikram Reddy",
    role: "Restaurant Partner, Skyline Lounge",
    city: "Hyderabad",
    metric: "5 Staff Roles Configured"
  },
  {
    quote: "Our diners love scanning the table QR to add extra drinks mid-meal without waiting for a waiter to pass by.",
    name: "Karan Johar",
    role: "Managing Director, Tokyo Sushi",
    city: "Goa",
    metric: "+22% Upsell Revenue"
  }
];

export default function MarketingPage() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [tablesCount, setTablesCount] = useState<number>(20);
  const [avgCheck, setAvgCheck] = useState<number>(450);
  const [tableTurns, setTableTurns] = useState<number>(4);
  const [activeStackedId, setActiveStackedId] = useState<string>("kot");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState<string>("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("dinescan_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      if (nextTheme) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("dinescan_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("dinescan_theme", "light");
      }
      return nextTheme;
    });
  };

  const filteredFaqs = faqsList.filter(
    (f) =>
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const activeStackedFeature = stackedFeatures.find((s) => s.id === activeStackedId) || stackedFeatures[0];

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-400 relative overflow-hidden transition-colors duration-300">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white text-[11px] font-bold py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded-full uppercase text-[10px] tracking-wider">v2.4 Live</span>
        <span>🚀 Modern KOT Kitchen Screen, Mobile POS, GST Tax Billing & WhatsApp Receipts are active across 450+ restaurants!</span>
        <Link href="/auth/register" className="underline hover:text-emerald-200 ml-1 hidden sm:inline">
          Claim 14-Day Free Trial →
        </Link>
      </div>

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-500/30">
              <Image src="/logo.jpg" alt="DineScan Logo" width={36} height={36} className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              DineScan
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400 lg:flex">
            <a href="#demo" className="hover:text-emerald-500 transition-colors">Live Demo</a>
            <a href="#marquee" className="hover:text-emerald-500 transition-colors">Partners</a>
            <a href="#stacked" className="hover:text-emerald-500 transition-colors">Workflows</a>
            <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
            <a href="#roi" className="hover:text-emerald-500 transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-emerald-500 transition-colors">FAQ</a>
            <a href="#testimonials" className="hover:text-emerald-500 transition-colors">Reviews</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
              title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            <Link href="/auth/login" className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 backdrop-blur-sm mb-8">
          <Zap className="w-3.5 h-3.5" /> Next-Gen Restaurant Operating System & POS
        </div>

        <h1 className="font-display text-5xl font-black leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl max-w-4xl mx-auto">
          Modern Table Ordering, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500">KOT & Mobile POS.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400 leading-relaxed mx-auto">
          Replace paper menus with high-converting QR self-ordering, real-time KOT kitchen display screens, mobile waiter POS, automatic GST billing, and live table floor plans.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth/register" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25">
            Launch Your Menu Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/auth/login" className="px-8 py-4 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl text-base flex items-center justify-center transition-colors shadow-sm">
            1-Click Demo Login
          </Link>
          <Link href="/menu/demo" target="_blank" className="px-6 py-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-base flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-800">
            View Public Cafe <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Live Interactive Preview Component */}
        <div id="demo">
          <LandingInteractivePreview />
        </div>

        {/* Live Network Stats Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card p-6 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Restaurants</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">450+</p>
          </div>
          <div className="card p-6 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Menu Dishes</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">14,200+</p>
          </div>
          <div className="card p-6 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Table QR Scans</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">5,80,000+</p>
          </div>
        </div>
      </section>

      {/* Infinite Marquee Ticker Section */}
      <section id="marquee" className="py-12 border-y border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-[#070B14]/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Trusted by Top Restaurants & Fine Dining Cafes Across India
          </p>
        </div>

        {/* Marquee Row 1: Restaurant Brands */}
        <div className="relative w-full overflow-hidden py-3">
          <div className="animate-marquee flex items-center gap-8">
            {[...partnerBrands, ...partnerBrands, ...partnerBrands].map((brand, idx) => (
              <div
                key={idx}
                className="px-6 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0 shadow-sm flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {brand}
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 2: Capabilities & Stats */}
        <div className="relative w-full overflow-hidden py-3">
          <div className="animate-marquee flex items-center gap-6" style={{ animationDirection: "reverse" }}>
            {[...capabilityHighlights, ...capabilityHighlights, ...capabilityHighlights].map((item, idx) => (
              <div
                key={idx}
                className="px-5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold shrink-0"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How DineScan Works in 4 Steps */}
      <section className="mx-auto max-w-7xl px-6 py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20">
            <Zap className="w-3.5 h-3.5" /> Simple 4-Step Flow
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            How DineScan Works in Your Restaurant
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            From QR scan to kitchen ticket and WhatsApp digital receipt in under 30 seconds.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">1</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Scan Table QR</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Diners point their smartphone camera at the table QR card to instantly open your restaurant&apos;s digital menu without downloading any app.
            </p>
          </div>

          <div className="card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">2</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Browse & Order</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Diners select dishes with veg/non-veg tags, add special cooking instructions, select payment modes, and click Place Order.
            </p>
          </div>

          <div className="card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">3</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Kitchen KOT Bell</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Kitchen screens ring an audio bell chime and display the table number, items, and custom instructions with wait time timers.
            </p>
          </div>

          <div className="card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">4</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Receipt & Service</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Waitstaff delivers hot food to the table. Diners receive automated WhatsApp tax receipts and can call the waiter with 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* Stacked Feature Cards Showcase */}
      <section id="stacked" className="mx-auto max-w-7xl px-6 py-24 border-b border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
            <Sliders className="w-3.5 h-3.5" /> Interactive Workflow Inspector
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Stacked Feature Deep-Dive
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Click any workflow card below to inspect how DineScan synchronizes kitchen, waiters, cashiers, and diners in real time.
          </p>
        </div>

        {/* Stacked Cards Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {stackedFeatures.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveStackedId(f.id)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                activeStackedId === f.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xl scale-105"
                  : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500"
              }`}
            >
              <f.icon className="w-4 h-4 text-emerald-500" />
              {f.title}
            </button>
          ))}
        </div>

        {/* Active Stacked Card Display */}
        <div className="card p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 dark:from-[#0B0F19] dark:via-[#111827] dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-left">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${activeStackedFeature.color} shadow-md`}>
                <activeStackedFeature.icon className="w-4 h-4" />
                {activeStackedFeature.metrics}
              </span>

              <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {activeStackedFeature.title}
              </h3>

              <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {activeStackedFeature.tagline}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeStackedFeature.description}
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Try This Workflow Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/menu/demo"
                  target="_blank"
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                >
                  Open Live Demo <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Visual Mockup Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  DineScan Engine v2.4
                </span>
              </div>

              {activeStackedId === "kot" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-amber-500/30 space-y-2">
                    <div className="flex justify-between font-bold text-amber-400">
                      <span>TABLE 05 • KOT #1042</span>
                      <span>02m 14s elapsed</span>
                    </div>
                    <p className="text-white font-semibold">1x Paneer Butter Masala, 2x Garlic Naan</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">PREPARING</span>
                      <button className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs">Mark Ready</button>
                    </div>
                  </div>
                </div>
              )}

              {activeStackedId === "pos" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                    <p className="font-bold text-white">Waiter Mobile POS - Table 12</p>
                    <div className="flex justify-between text-slate-300"><span>Subtotal (3 Items)</span><span>₹850.00</span></div>
                    <div className="flex justify-between text-slate-400"><span>CGST (2.5%) + SGST (2.5%)</span><span>₹42.50</span></div>
                    <div className="flex justify-between font-bold text-emerald-400 text-sm border-t border-slate-800 pt-2">
                      <span>Grand Total</span><span>₹892.50</span>
                    </div>
                  </div>
                </div>
              )}

              {activeStackedId === "tables" && (
                <div className="grid grid-cols-3 gap-3 text-xs text-center font-bold">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <p>T-01</p>
                    <span className="text-[10px] font-normal">VACANT</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                    <p>T-02</p>
                    <span className="text-[10px] font-normal">OCCUPIED</span>
                  </div>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                    <p>T-03</p>
                    <span className="text-[10px] font-normal">BILLING</span>
                  </div>
                </div>
              )}

              {activeStackedId === "qr" && (
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">Table 01 Vector QR Card</p>
                    <p className="text-[10px] text-slate-400">Theme: Emerald Green Palette</p>
                  </div>
                  <button className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs">Download PDF</button>
                </div>
              )}

              {activeStackedId === "share" && (
                <div className="p-4 bg-[#005c4b] text-white rounded-2xl space-y-2 text-xs">
                  <p className="font-bold">WhatsApp Receipt Shared!</p>
                  <p className="text-[11px] text-slate-200">Receipt #DS-8841 sent to +91 98765 43210</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Built for 10x faster restaurant service
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Everything your waitstaff, kitchen cooks, cashiers, and managers need to operate seamlessly.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((f) => (
            <div key={f.title} className="card p-8 rounded-3xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue & Impact Section with Interactive ROI Calculator */}
      <section id="roi" className="mx-auto max-w-7xl px-6 py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="card p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 dark:from-[#0B0F19] dark:via-[#111827] dark:to-emerald-950/30 border border-slate-200 dark:border-slate-800 grid gap-8 md:grid-cols-2 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" /> Interactive ROI Growth Calculator
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Calculate Your Revenue Growth
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag the sliders below to see your estimated monthly savings and extra bill revenue by switching to DineScan self-ordering & mobile POS.
            </p>

            {/* Slider Inputs */}
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Number of Tables</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{tablesCount} Tables</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={tablesCount}
                  onChange={(e) => setTablesCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Average Check Size (₹)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">₹{avgCheck}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={avgCheck}
                  onChange={(e) => setAvgCheck(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Daily Table Turnover</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{tableTurns} Turns / Day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={tableTurns}
                  onChange={(e) => setTableTurns(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Est. Extra Monthly Sales</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  ₹{Math.round(tablesCount * tableTurns * avgCheck * 0.18 * 30).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Annual Paper & Menu Savings</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  ₹{(tablesCount * 2400).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 p-8 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> What You Get With DineScan
            </h3>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Direct link format (dinescan.app/menu/yourcafe)
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Rich OpenGraph social media card previews
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Instant Kitchen Ticket (KOT) chime notifications
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Mobile Waiter POS for Table & Takeaway orders
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Automatic CGST + SGST tax invoice splitting
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Responsive Light & Dark Mode interface
              </li>
            </ul>

            <Link href="/auth/register" className="mt-4 w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-500/20">
              Claim Your Cafe Link Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 border-b border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Affordable, transparent pricing
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Start free, upgrade as your table orders scale. No hidden transaction commissions.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between p-8 rounded-3xl border transition-all ${
                plan.popular
                  ? "bg-white dark:bg-[#111827] border-emerald-500 shadow-2xl relative"
                  : "bg-white dark:bg-[#111827]/60 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className={`mt-8 py-3.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all ${
                  plan.popular
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Accordion Section */}
      <section id="faq" className="mx-auto max-w-5xl px-6 py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
            <HelpCircle className="w-3.5 h-3.5" /> Interactive FAQ Accordion
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search or click questions below for complete answers.
          </p>

          {/* Search input for FAQs */}
          <div className="relative max-w-md mx-auto mt-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search questions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Accordion Items List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="card border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-500" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-6 py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Loved by restaurant managers</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div key={idx} className="card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {t.metric}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">&quot;{t.quote}&quot;</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {t.city}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Multi-Column Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070B14] pt-16 pb-12 transition-colors">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl overflow-hidden shadow-md border border-emerald-500/30">
                <Image src="/logo.jpg" alt="DineScan Logo" width={32} height={32} className="h-full w-full object-cover" />
              </div>
              <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">DineScan</span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              DineScan is an end-to-end digital QR menu, KOT kitchen display, mobile waiter POS, and multi-tenant restaurant management SaaS platform.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full w-fit border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational • 99.9% Uptime
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product</p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li><a href="#features" className="hover:text-emerald-500 transition-colors">KOT Kitchen Screen</a></li>
              <li><a href="#features" className="hover:text-emerald-500 transition-colors">Mobile Waiter POS</a></li>
              <li><a href="#stacked" className="hover:text-emerald-500 transition-colors">Table Operations Grid</a></li>
              <li><a href="#stacked" className="hover:text-emerald-500 transition-colors">Dynamic QR Suite</a></li>
              <li><a href="#roi" className="hover:text-emerald-500 transition-colors">Automatic GST Billing</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Solutions</p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li><Link href="/menu/demo" className="hover:text-emerald-500 transition-colors">Cafes & QSRs</Link></li>
              <li><Link href="/auth/register" className="hover:text-emerald-500 transition-colors">Fine Dining & Bars</Link></li>
              <li><Link href="/admin" className="hover:text-emerald-500 transition-colors">Multi-Chain Master Admin</Link></li>
              <li><Link href="/auth/login" className="hover:text-emerald-500 transition-colors">1-Click Demo Login</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Legal & Platform</p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li><Link href="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-500 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-emerald-500 transition-colors">Refund Policy</Link></li>
              <li><Link href="/admin" className="hover:text-indigo-500 transition-colors">Master Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DineScan SaaS Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> India / Global</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
