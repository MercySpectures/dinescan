"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Sparkles,
  Clock,
  ShieldCheck,
  Headphones
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    restaurantName: "",
    city: "",
    venueType: "Fine Dining",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.restaurantName || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
      toast.success("Message received! Our team will contact you shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 selection:bg-blue-500/20 selection:text-blue-500 font-sans transition-colors duration-300">
      {/* Top Navigation */}
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

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Left Column: Contact Info & Value Props */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" /> 24/7 Priority Support & Onboarding
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Let&apos;s Transform Your Restaurant Experience.
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Whether you run a bustling cafe, multi-floor fine dining venue, or high-volume QSR chain, our hospitality solutions team is ready to assist you.
              </p>
            </div>

            {/* Quick Contact Cards */}
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Email</p>
                  <a href="mailto:support@dinescan.app" className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-500 transition-colors">
                    support@dinescan.app
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Average response time: &lt; 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Hotline / WhatsApp</p>
                  <a href="tel:+919876543210" className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors">
                    +91 98765 43210
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Monday – Sunday, 9 AM – 10 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Headquarters</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Tech Park Square, Sector 5, Bangalore &amp; Indore
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Serving 450+ restaurants globally</p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> 99.9% Cloud Uptime</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" /> Fast Onboarding</span>
              <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-amber-500" /> Dedicated Account Manager</span>
            </div>
          </div>

          {/* Right Column: Contact & Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 sm:p-10 shadow-xl">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Thank You, {form.name.split(" ")[0]}!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Your demo request for <strong className="text-slate-900 dark:text-white">{form.restaurantName}</strong> has been received. Our team will contact you at <strong className="text-slate-900 dark:text-white">{form.phone}</strong> shortly.
                  </p>
                  <div className="pt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({
                          name: "",
                          email: "",
                          phone: "",
                          restaurantName: "",
                          city: "",
                          venueType: "Fine Dining",
                          message: ""
                        });
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Send Another Message
                    </button>
                    <Link
                      href="/menu/demo"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md"
                    >
                      Explore Live Demo Menu →
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request a Consultation or Demo</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Tell us about your restaurant and requirements. We will prepare a customized rollout plan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        Business Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@restaurant.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        Restaurant / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.restaurantName}
                        onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                        placeholder="Silsila Bistro & Bar"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        City / Location
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="Bengaluru, Delhi, Mumbai, etc."
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                        Venue Type
                      </label>
                      <select
                        value={form.venueType}
                        onChange={(e) => setForm({ ...form, venueType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Fine Dining">Fine Dining</option>
                        <option value="Cafe & Bakery">Cafe &amp; Bakery</option>
                        <option value="Quick Service (QSR)">Quick Service (QSR)</option>
                        <option value="Bar & Pub Lounge">Bar &amp; Pub Lounge</option>
                        <option value="Multi-Outlet Chain">Multi-Outlet Chain</option>
                        <option value="Food Truck / Cloud Kitchen">Food Truck / Cloud Kitchen</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                      How Can We Help? *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your table count, POS requirements, or any questions about KOT and GST billing..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Submitting Details...
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Request &amp; Schedule Demo
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    🔒 We respect your privacy. No spam or unsolicited calls guaranteed.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
