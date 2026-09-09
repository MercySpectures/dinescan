"use client";

import { useState } from "react";
import { Smartphone, Flame, Grid, ShieldCheck, CheckCircle, Clock, ShoppingCart, Plus, ChevronRight, Share2, Copy, MessageSquare, ExternalLink, Check } from "lucide-react";
import toast from "react-hot-toast";

export function LandingInteractivePreview() {
  const [activeTab, setActiveTab] = useState<"kot" | "pos" | "menu" | "share" | "admin">("kot");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://dinescan.app/menu/demo");
    setCopiedLink(true);
    toast.success("Demo URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="mt-14 max-w-5xl mx-auto">
      {/* Tab Switcher Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-xl mb-6">
        <button
          onClick={() => setActiveTab("kot")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "kot"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Flame className="w-4 h-4" /> Live KOT Screen
        </button>

        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pos"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Smartphone className="w-4 h-4" /> Mobile Waiter POS
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "menu"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Diner QR Menu
        </button>

        <button
          onClick={() => setActiveTab("share")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "share"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <Share2 className="w-4 h-4" /> WhatsApp Link Preview
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "admin"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Master Admin Portal
        </button>
      </div>

      {/* Tab Screen Display Mockup */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden text-left">
        {activeTab === "kot" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                  <Flame className="w-3.5 h-3.5" /> Realtime Kitchen Ticket Stream
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Active Kitchen Tickets (3 Pending)</h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                ● Audio Bell Alert Active
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 relative">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-amber-400">TABLE 04</span>
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> 2m ago</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-200 border-y border-slate-800 py-2">
                  <div className="flex justify-between font-semibold"><span>2x Paneer Tikka</span><span>₹480</span></div>
                  <div className="flex justify-between font-semibold"><span>1x Butter Naan</span><span>₹60</span></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">PREPARING</span>
                  <button className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400">Mark Ready</button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-indigo-400">TABLE 09</span>
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> 5m ago</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-200 border-y border-slate-800 py-2">
                  <div className="flex justify-between font-semibold"><span>1x Veg Biryani</span><span>₹280</span></div>
                  <div className="flex justify-between font-semibold"><span>2x Mango Lassi</span><span>₹220</span></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">READY</span>
                  <button className="px-3 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg">Served</button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-emerald-400">TABLE 12</span>
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> 8m ago</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-200 border-y border-slate-800 py-2">
                  <div className="flex justify-between font-semibold"><span>1x Hakka Noodles</span><span>₹210</span></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-bold">SERVED</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                  <Smartphone className="w-3.5 h-3.5" /> Mobile Waiter POS & Tax Billing
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Counter Order & Automatic GST Invoice</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                GSTIN: 27AAAAA0000A1Z5 (5%)
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Item Add</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Crispy Paneer</p>
                      <p className="text-[10px] text-emerald-400 font-bold">₹240</p>
                    </div>
                    <button className="p-1 bg-emerald-500 text-slate-950 rounded-lg"><Plus className="w-3.5 h-3.5"/></button>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Butter Chicken</p>
                      <p className="text-[10px] text-emerald-400 font-bold">₹360</p>
                    </div>
                    <button className="p-1 bg-emerald-500 text-slate-950 rounded-lg"><Plus className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
                <p className="font-bold text-white border-b border-slate-800 pb-2">Active Cart Summary (Table 04)</p>
                <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>₹600.00</span></div>
                <div className="flex justify-between text-slate-400"><span>CGST (2.5%)</span><span>₹15.00</span></div>
                <div className="flex justify-between text-slate-400"><span>SGST (2.5%)</span><span>₹15.00</span></div>
                <div className="flex justify-between font-bold text-emerald-400 text-sm border-t border-slate-800 pt-2">
                  <span>Grand Total</span><span>₹630.00</span>
                </div>
                <button className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-center shadow-lg shadow-emerald-500/20">
                  Send KOT & Print Bill
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/20">
                  <ShoppingCart className="w-3.5 h-3.5" /> High-Converting Customer Mobile Menu
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Diner Table Ordering View</h3>
              </div>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                dinescan.app/menu/demo
              </span>
            </div>

            <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-base">Royal Biryani Bistro</h4>
                  <p className="text-[11px] text-slate-400">Table 05 • Scanned via QR</p>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">LIVE MENU</span>
              </div>
              <div className="flex gap-2 text-xs border-b border-slate-800 pb-2 overflow-x-auto">
                <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-full">Starters</span>
                <span className="px-3 py-1 bg-slate-900 text-slate-300 rounded-full">Mains</span>
                <span className="px-3 py-1 bg-slate-900 text-slate-300 rounded-full">Drinks</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">🟢 Veg</span>
                    <p className="text-xs font-bold text-white">Crispy Paneer Tikka</p>
                    <p className="text-[10px] text-slate-400">₹240 • Grilled in Tandoor</p>
                  </div>
                  <button className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg">Add +</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "share" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-xs font-bold border border-teal-500/20">
                  <Share2 className="w-3.5 h-3.5" /> Social Media OpenGraph Card Simulator
                </span>
                <h3 className="text-xl font-bold text-white mt-2">WhatsApp & Instagram Link Preview</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* WhatsApp Chat Message Mockup */}
            <div className="max-w-md mx-auto bg-[#0b141a] p-4 rounded-2xl border border-slate-800 space-y-3 font-sans">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs text-slate-400">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp Message Preview</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tl-none max-w-sm space-y-2 text-xs shadow-md">
                <p className="text-slate-100">Check out our live digital menu & order online!</p>

                {/* OpenGraph Rich Card */}
                <div className="bg-[#0b141a]/90 rounded-xl overflow-hidden border border-emerald-500/30 text-left">
                  <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex flex-col justify-end relative">
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 text-[10px] font-bold rounded text-white backdrop-blur-sm">
                      dinescan.app
                    </span>
                    <h4 className="font-bold text-white text-sm">Mercy Cafe & Gourmet Bistro</h4>
                    <p className="text-[11px] text-emerald-100">Digital Menu • Table Ordering & Instant Receipt</p>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-[11px] space-y-1">
                    <p className="font-semibold text-slate-200">Scan QR at table or click to view menu</p>
                    <p className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> https://dinescan.app/menu/demo
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-200 text-right font-mono">10:42 AM ✓✓</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">
                  <Grid className="w-3.5 h-3.5" /> Multi-Tenant Master Admin Portal
                </span>
                <h3 className="text-xl font-bold text-white mt-2">Platform MRR & Subscription Tier Control</h3>
              </div>
              <span className="text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Superadmin View
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 uppercase font-bold text-[10px]">Total Platform MRR</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">₹1,45,900</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 uppercase font-bold text-[10px]">Active Restaurants</p>
                <p className="text-2xl font-bold text-white mt-1">1,048</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 uppercase font-bold text-[10px]">Pro & Enterprise</p>
                <p className="text-2xl font-bold text-indigo-400 mt-1">420</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-400 uppercase font-bold text-[10px]">Monthly Scans</p>
                <p className="text-2xl font-bold text-teal-400 mt-1">5,82,000</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Click tabs above to preview real platform interfaces</span>
          <a href="/auth/register" className="text-emerald-400 font-bold flex items-center gap-1 hover:underline">
            Test Interactive Features Live <ChevronRight className="w-4 h-4"/>
          </a>
        </div>
      </div>
    </div>
  );
}
