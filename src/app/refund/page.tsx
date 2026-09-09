import Link from "next/link";
import { ArrowLeft, RefreshCw, CreditCard } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 py-16 px-6 transition-colors duration-300">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
            <RefreshCw className="w-3.5 h-3.5" /> Razorpay Compliant Refund Standard
          </div>
          <h1 className="font-display text-4xl font-black text-slate-900 dark:text-white">Refund & Cancellation Policy</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Effective Date: September 7, 2026 | DineScan SaaS Platform Inc.</p>
        </div>

        <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" /> 1. 14-Day Money-Back Guarantee
            </h2>
            <p>
              We want you to be 100% satisfied with DineScan. If you subscribe to any of our paid plans (Starter, Pro Business, or Enterprise) and decide the platform does not suit your restaurant operations within 14 days of initial payment, you are eligible for a full 100% refund.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Subscription Cancellation</h2>
            <p>
              You may cancel your DineScan subscription at any time directly from your restaurant dashboard settings (`/dashboard/settings`). Upon cancellation, your access will remain active until the end of your current paid billing cycle. No further recurring charges will be processed.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Refund Processing Timeline</h2>
            <p>
              Approved refunds are initiated via our payment gateway (Razorpay) within 24 to 48 business hours. Funds will be credited back to your original payment method (UPI account, Credit/Debit card, or NetBanking bank account) within 5 to 7 business days as per banking partner timelines.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Contacting Billing Support</h2>
            <p>
              To request a subscription refund or clarify a billing charge, please send an email with your registered restaurant name and Razorpay payment ID to <a href="mailto:billing@dinescan.app" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">billing@dinescan.app</a>. Our support team responds within 4 hours.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
