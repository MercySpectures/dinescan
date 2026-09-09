import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 py-16 px-6 transition-colors duration-300">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Market Ready & ISO Standard
          </div>
          <h1 className="font-display text-4xl font-black text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Effective Date: September 7, 2026 | DineScan Platform Inc.</p>
        </div>

        <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" /> 1. Information We Collect
            </h2>
            <p>
              DineScan (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a multi-tenant digital QR menu, KOT kitchen display, mobile waiter POS, and restaurant operating SaaS system. We collect:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs">
              <li><strong>Restaurant Account Credentials:</strong> Owner name, business email, GSTIN number, phone number, and venue location.</li>
              <li><strong>Customer & Guest Information:</strong> Optional diner name and mobile phone number voluntarily provided during QR table ordering for digital WhatsApp receipt delivery.</li>
              <li><strong>Order Telemetry & Payment Logs:</strong> Table numbers, order item selections, payment modes (Cash, UPI QR, Online Gateway), and timestamp records.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. How We Use Data</h2>
            <p>
              Data collected through DineScan is strictly processed for legitimate restaurant service execution, including:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs">
              <li>Real-time Kitchen Order Ticket (KOT) chime notifications and mobile POS dispatch.</li>
              <li>Automated CGST (2.5%) + SGST (2.5%) invoice splitting and table settlement.</li>
              <li>Delivering 1-click digital receipts and promotional coupons via WhatsApp to opting-in diners.</li>
              <li>Razorpay SaaS subscription processing and tier management for venue owners.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Multi-Tenant Database Isolation & RLS</h2>
            <p>
              Our infrastructure utilizes PostgreSQL Row Level Security (RLS) policies. Each restaurant&apos;s data is cryptographically isolated. Restaurant A cannot view, modify, or export data belonging to Restaurant B under any circumstance.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Payment Gateway Security (Razorpay Integration)</h2>
            <p>
              All online transactions and SaaS subscription billing are securely processed through Razorpay using 256-bit SSL encryption. DineScan never stores raw credit card numbers or banking passwords on our servers.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Your Data Rights & Deletion</h2>
            <p>
              Restaurant owners and diners have the right to request full export or permanent deletion of their stored records. To exercise data deletion, contact <a href="mailto:privacy@dinescan.app" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">privacy@dinescan.app</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
