"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Smartphone, Share2, Globe, Copy, ExternalLink, Check, MessageSquare } from "lucide-react";
import { SubscriptionCheckoutCard } from "./subscription-card";

interface SettingsForm {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  themeColor: string;
  gstNumber: string;
  gstRate: string;
  enableGst: boolean;
  upiId: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  acceptCash: boolean;
  acceptUpi: boolean;
  acceptOnline: boolean;
  razorpayKey: string;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    slug: "",
    description: "",
    address: "",
    phone: "",
    themeColor: "#10B981",
    gstNumber: "",
    gstRate: "5",
    enableGst: true,
    upiId: "",
    accountNumber: "",
    ifscCode: "",
    accountHolder: "",
    acceptCash: true,
    acceptUpi: true,
    acceptOnline: false,
    razorpayKey: ""
  });
  const [savedSlug, setSavedSlug] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Simulator State
  const [previewMode, setPreviewMode] = useState<"mobile" | "social" | "specs">("mobile");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // 0. Extract candidate slug from URL pathname first (e.g. /silsila/dashboard/settings)
      const pathParts = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean) : [];
      const urlSlug = pathParts[0] && !["dashboard", "admin", "auth", "api", "onboarding"].includes(pathParts[0]) ? pathParts[0] : null;

      let restaurant: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        address: string | null;
        phone: string | null;
        theme_color: string | null;
        logo_url: string | null;
        is_published: boolean;
      } | null = null;

      if (urlSlug) {
        const { data: bySlug } = await supabase
          .from("restaurants")
          .select("id, name, slug, description, address, phone, theme_color, logo_url, is_published")
          .eq("slug", urlSlug)
          .maybeSingle();
        if (bySlug) {
          restaurant = bySlug;
          localStorage.setItem("dinescan_active_restaurant_id", bySlug.id);
        }
      }

      const activeId = !restaurant ? localStorage.getItem("dinescan_active_restaurant_id") : null;

      if (!restaurant && activeId) {
        const { data: pref } = await supabase
          .from("restaurants")
          .select("id, name, slug, description, address, phone, theme_color, logo_url, is_published")
          .eq("id", activeId)
          .maybeSingle();
        if (pref) restaurant = pref;
      }

      if (!restaurant) {
        const { data: ownerRests } = await supabase
          .from("restaurants")
          .select("id, name, slug, description, address, phone, theme_color, logo_url, is_published")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (ownerRests && ownerRests.length > 0) {
          restaurant = ownerRests[0];
          localStorage.setItem("dinescan_active_restaurant_id", restaurant.id);
        }
      }

      if (!restaurant) {
        const { data: firstRest } = await supabase
          .from("restaurants")
          .select("id, name, slug, description, address, phone, theme_color, logo_url, is_published")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        restaurant = firstRest;
      }

      if (!restaurant) {
        setIsLoading(false);
        return;
      }
      setRestaurantId(restaurant.id);
      setSavedSlug(restaurant.slug);
      setLogoUrl(restaurant.logo_url ?? "");
      setIsPublished(restaurant.is_published);
      setForm((prev) => ({
        ...prev,
        name: restaurant?.name || "",
        slug: restaurant?.slug || "",
        description: restaurant?.description || "",
        address: restaurant?.address || "",
        phone: restaurant?.phone || "",
        themeColor: restaurant?.theme_color || "#10B981"
      }));
      setIsLoading(false);
    };
    void load();
  }, [supabase]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        address: form.address || null,
        phone: form.phone || null,
        theme_color: form.themeColor,
        logo_url: logoUrl || null,
        is_published: isPublished
      })
      .eq("id", restaurantId);
    if (error) {
      toast.error(error.message);
      setIsSaving(false);
      return;
    }
    setSavedSlug(form.slug);
    setIsSaving(false);
    toast.success("Settings saved successfully!");
  };

  const handleCopyShareLink = () => {
    const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "");
    const shareUrl = `${baseUrl}/menu/${savedSlug || form.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Public cafe URL copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareToWhatsApp = () => {
    const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "");
    const shareUrl = `${baseUrl}/menu/${savedSlug || form.slug}`;
    const text = encodeURIComponent(`Explore ${form.name || "our restaurant"} digital menu & order online directly from your table: ${shareUrl}`);
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="page-title">Restaurant settings</h1>
        <div className="card p-6 text-sm text-slate-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Restaurant settings & Cafe Link</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure property details, GST tax rates, payment gateways, and real-time social link preview.
          </p>
        </div>

        {savedSlug && (
          <div className="flex flex-wrap items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2.5 px-3.5 rounded-2xl border border-emerald-500/20 text-xs font-bold max-w-full">
            <span className="shrink-0">Direct Cafe Link:</span>
            <code className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 max-w-[160px] sm:max-w-[240px] md:max-w-[320px] truncate inline-block align-middle">
              /menu/{savedSlug}
            </code>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
              <a
                href={`/menu/${savedSlug}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form Settings */}
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-900 dark:text-white">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Restaurant Name
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value, slug: slugify(event.target.value) }))
                  }
                  placeholder="Mercy Cafe & Gourmet Bistro"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Public URL Slug
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 select-none">
                    dinescan.app/menu/
                  </span>
                  <input
                    className="input font-mono text-sm flex-1 min-w-0"
                    value={form.slug}
                    onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                    placeholder="mercy-cafe"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Property Description
                </label>
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Artisanal coffee, freshly baked wood-fired pizzas & gourmet pastries. Scan QR at table to order!"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-900 dark:text-white">
              Contact & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Phone Number
                </label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                  Address
                </label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Plot 42, Bandra West, Mumbai"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-900 dark:text-white">
              Automatic GST Tax & Billing
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">Enable Automatic GST Billing</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Calculates CGST + SGST tax breakdown on POS & table receipts.</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.enableGst}
                  onChange={(e) => setForm((prev) => ({ ...prev, enableGst: e.target.checked }))}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">GSTIN Number</label>
                  <input
                    className="input font-mono text-sm"
                    value={form.gstNumber}
                    onChange={(event) => setForm((prev) => ({ ...prev, gstNumber: event.target.value }))}
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">GST Tax Rate (%)</label>
                  <select
                    className="input text-sm bg-white dark:bg-slate-900"
                    value={form.gstRate}
                    onChange={(event) => setForm((prev) => ({ ...prev, gstRate: event.target.value }))}
                  >
                    <option value="5">5% (Restaurant Service - 2.5% CGST + 2.5% SGST)</option>
                    <option value="12">12% Standard Rate</option>
                    <option value="18">18% Full Tax Rate</option>
                    <option value="0">0% Exempt</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between text-slate-900 dark:text-white">
              <span>Payment Methods & Bank Details</span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Active</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptCash}
                    onChange={(e) => setForm((prev) => ({ ...prev, acceptCash: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Cash on Table</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptUpi}
                    onChange={(e) => setForm((prev) => ({ ...prev, acceptUpi: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Direct UPI QR</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptOnline}
                    onChange={(e) => setForm((prev) => ({ ...prev, acceptOnline: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Razorpay / Online</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">UPI VPA / ID</label>
                  <input
                    className="input font-mono text-xs"
                    value={form.upiId}
                    onChange={(e) => setForm((prev) => ({ ...prev, upiId: e.target.value }))}
                    placeholder="mercycafe@upi"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Razorpay Key ID</label>
                  <input
                    className="input font-mono text-xs"
                    value={form.razorpayKey}
                    onChange={(e) => setForm((prev) => ({ ...prev, razorpayKey: e.target.value }))}
                    placeholder="rzp_live_xxxxxxxx"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-900 dark:text-white">
              Branding & Status
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Logo Image</label>
                  <label className="btn-outline inline-flex cursor-pointer text-xs mt-1">
                    Upload new logo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file || !restaurantId) return;
                        const toastId = toast.loading("Uploading logo...");
                        const path = `${restaurantId}/logo-${Date.now()}`;
                        const { error: uploadError } = await supabase.storage
                          .from("menu-images")
                          .upload(path, file, { upsert: true });
                        if (uploadError) {
                          toast.error(uploadError.message, { id: toastId });
                          return;
                        }
                        const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
                        setLogoUrl(data.publicUrl);
                        toast.success("Logo uploaded successfully!", { id: toastId });
                      }}
                    />
                  </label>
                </div>
                {logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="Current logo"
                    width={80}
                    height={80}
                    className="rounded-2xl border-4 border-slate-50 shadow-sm object-cover"
                  />
                )}
              </div>


              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">Publish Menu to Public</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle whether diners can access your menu URL.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Razorpay Subscription Checkout Component */}
          <SubscriptionCheckoutCard restaurantId={restaurantId} restaurantName={form.name || "My Cafe"} />

          <button className="btn-primary w-full py-4 text-base shadow-lg shadow-emerald-500/20" type="submit" disabled={isSaving}>
            {isSaving ? "Synchronizing Changes..." : "Save All Restaurant Settings"}
          </button>
        </form>

        {/* Right Column: Upgraded Interactive Link Preview Simulator */}
        <div className="sticky top-4 flex flex-col items-center justify-start w-full">
          {/* View Mode Selector Tabs - Sticky at top */}
          <div className="sticky top-0 z-30 w-full max-w-[360px] bg-[#0A0F1D]/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-1 mb-4 shrink-0 shadow-lg">
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                previewMode === "mobile"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile View
            </button>

            <button
              type="button"
              onClick={() => setPreviewMode("social")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                previewMode === "social"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" /> Social Card
            </button>

            <button
              type="button"
              onClick={() => setPreviewMode("specs")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                previewMode === "specs"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> URL Specs
            </button>
          </div>

          {/* Mode 1: Live Mobile App Frame Simulator (Realistic Phone Size) */}
          {previewMode === "mobile" && (
            <div
              style={{ width: "100%", maxWidth: 360, height: 680, minHeight: 680 }}
              className="relative shrink-0 bg-[#0b0f19] rounded-[2.75rem] p-[8px] shadow-2xl border-[3px] border-slate-700/80 mx-auto flex flex-col ring-4 ring-slate-900/40 select-none"
            >
              {/* Hardware Side Buttons */}
              <div className="absolute top-28 -left-[5px] w-[4px] h-8 bg-slate-700 rounded-l-md" />
              <div className="absolute top-40 -left-[5px] w-[4px] h-12 bg-slate-700 rounded-l-md" />
              <div className="absolute top-56 -left-[5px] w-[4px] h-12 bg-slate-700 rounded-l-md" />
              <div className="absolute top-44 -right-[5px] w-[4px] h-16 bg-slate-700 rounded-r-md" />

              {/* Dynamic Island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[110px] h-[26px] bg-black rounded-full z-30 flex items-center justify-between px-3 shadow-sm pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#151c2c] border border-blue-500/20" />
              </div>

              {/* Screen Content Frame */}
              <div
                style={{ width: "100%", height: "100%", minHeight: 640 }}
                className="w-full flex-1 bg-white dark:bg-[#080C16] rounded-[2.5rem] overflow-hidden relative border border-slate-800/40 shadow-inner"
              >
                <iframe
                  src={`/menu/${savedSlug || form.slug || "mercy-cafe"}?preview=true&theme=${encodeURIComponent(form.themeColor)}`}
                  style={{ width: "100%", height: "100%", minHeight: 640 }}
                  className="w-full h-full border-0 bg-slate-50 dark:bg-[#080C16]"
                  title="Mobile Preview"
                />
              </div>

              {/* Home Indicator Bar */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-20 pointer-events-none" />
            </div>
          )}

          {/* Mode 2: Social Media OpenGraph Card Preview */}
          {previewMode === "social" && (
            <div className="w-full max-w-[375px] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-left mx-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp & Social Card
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  OpenGraph v2.0
                </span>
              </div>

              <div className="bg-[#0b141a] p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3 font-sans">
                <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tl-none space-y-2 text-xs shadow-md">
                  <p className="text-slate-100 font-medium">Check out our menu & order online!</p>

                  <div className="bg-[#0b141a] rounded-xl overflow-hidden border border-emerald-500/30">
                    {logoUrl ? (
                      <div className="h-32 relative bg-slate-950 flex items-center justify-center overflow-hidden">
                        <Image src={logoUrl} alt="Logo" fill className="object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-[10px] font-bold rounded text-emerald-400 backdrop-blur-sm">
                          dinescan.app
                        </span>
                        <div className="absolute bottom-2 left-3 right-3">
                          <h5 className="font-bold text-white text-sm truncate">{form.name || "Restaurant Name"}</h5>
                          <p className="text-[10px] text-slate-300 line-clamp-1">{form.description || "Scan QR code at table to order."}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 bg-gradient-to-r from-emerald-600 to-teal-700 p-3 flex flex-col justify-end relative">
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 text-[10px] font-bold rounded text-white">
                          dinescan.app
                        </span>
                        <h5 className="font-bold text-white text-sm truncate">{form.name || "Restaurant Name"}</h5>
                        <p className="text-[11px] text-emerald-100 line-clamp-1">{form.description || "Scan QR to order online."}</p>
                      </div>
                    )}
                    <div className="p-2.5 bg-slate-900 text-[11px] space-y-1">
                      <p className="font-semibold text-slate-200 line-clamp-1">Table ordering, KOT status & digital receipt</p>
                      <p className="text-emerald-400 font-mono text-[10px] truncate">
                        dinescan.app/menu/{savedSlug || form.slug}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-200 text-right font-mono">Just now ✓✓</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Copy Share Link</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Share WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Direct URL & QR Specs */}
          {previewMode === "specs" && (
            <div className="w-full max-w-[375px] bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left mx-auto">
              <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" /> Direct Link Specifications & Status
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Public URL Route</span>
                  <p className="text-emerald-400 font-mono font-bold text-xs break-all">
                    {origin ? `${origin}/menu/${savedSlug || form.slug}` : `/menu/${savedSlug || form.slug}`}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">GST Tax Billing Engine</span>
                  <p className="text-white font-semibold">
                    {form.enableGst ? `Active (${form.gstRate}% Tax Splitting)` : "Disabled (No Tax Added)"}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Payment Methods Enabled</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.acceptCash && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">Cash</span>}
                    {form.acceptUpi && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-bold">UPI QR</span>}
                    {form.acceptOnline && <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded text-[10px] font-bold">Online</span>}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Publish Visibility</span>
                  <p className="text-white font-semibold flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isPublished ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    {isPublished ? "Publicly Accessible Online" : "Draft / Private Access Only"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
