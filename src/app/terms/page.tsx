import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 py-16 px-6 transition-colors duration-300">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
            <Scale className="w-3.5 h-3.5" /> Market Ready SaaS Contract
          </div>
          <h1 className="font-display text-4xl font-black text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Effective Date: September 7, 2026 | DineScan SaaS Platform Inc.</p>
        </div>

        <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By registering an account, creating a digital menu, or subscribing to DineScan (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you are accepting on behalf of a restaurant entity, you represent that you have authority to bind that entity.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. SaaS Subscriptions & Billing</h2>
            <p>
              DineScan offers subscription tiers (Starter at ₹499/mo, Pro Business at ₹999/mo, Enterprise at ₹1,999/mo). Payments are securely processed via Razorpay. Subscriptions automatically renew monthly unless cancelled prior to the billing cycle date.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Responsibilities of Venue Owners</h2>
            <p>
              Restaurant owners are solely responsible for ensuring accurate menu pricing, food descriptions, allergen disclosures, and GSTIN tax rates (CGST 2.5% + SGST 2.5%). Owners must maintain security over staff kiosk PIN codes.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Customer Data Ownership</h2>
            <p>
              Restaurant owners retain 100% ownership of customer directory contacts (diner names and mobile phone numbers) collected through their venue&apos;s table QR codes. DineScan does not sell or rent customer data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Service Level & 99.9% Uptime SLA</h2>
            <p>
              DineScan commits to a 99.9% monthly uptime SLA. In the event of temporary network degradation, local offline caching ensures KOT kitchen screens and POS order takers continue operating smoothly.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
