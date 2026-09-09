"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getMenuUrl } from "@/lib/utils";
import { QrCode, Wifi, MessageSquare, Download, Printer, Layers, Sparkles } from "lucide-react";

type QrStyle = "classic" | "brand" | "inverted" | "minimal";
type QrMode = "menu" | "wifi" | "feedback";
type TemplateType = "table_tent" | "sticker" | "counter_poster";

export default function QrPage() {
  const supabase = useMemo(() => createClient(), []);
  const hiddenRenderRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<QrMode>("menu");
  const [size, setSize] = useState<number>(512);
  const [style, setStyle] = useState<QrStyle>("brand");
  const [slug, setSlug] = useState<string>("demo");
  const [brandColor, setBrandColor] = useState<string>("#22C55E");
  const [bannerText, setBannerText] = useState<string>("SCAN TO ORDER & PAY");
  const [template, setTemplate] = useState<TemplateType>("table_tent");
  
  // Wi-Fi QR options
  const [wifiSsid, setWifiSsid] = useState<string>("Restaurant_Guest");
  const [wifiPassword, setWifiPassword] = useState<string>("Welcome2026");
  const [wifiAuth, setWifiAuth] = useState<string>("WPA");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tableCount] = useState<number>(12);
  const [selectedTables, setSelectedTables] = useState<number[]>([1, 2, 3, 4]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setIsLoading(false);
        return;
      }

      // 0. Extract candidate slug from URL pathname first (e.g. /silsila/dashboard/qr)
      const pathParts = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean) : [];
      const urlSlug = pathParts[0] && !["dashboard", "admin", "auth", "api", "onboarding"].includes(pathParts[0]) ? pathParts[0] : null;

      let data: { name: string; slug: string; theme_color: string | null } | null = null;

      if (urlSlug) {
        const { data: bySlug } = await supabase
          .from("restaurants")
          .select("id, name, slug, theme_color")
          .eq("slug", urlSlug)
          .maybeSingle();
        if (bySlug) {
          data = bySlug;
          localStorage.setItem("dinescan_active_restaurant_id", bySlug.id);
        }
      }

      const activeId = !data ? localStorage.getItem("dinescan_active_restaurant_id") : null;

      if (!data && activeId) {
        const { data: pref } = await supabase
          .from("restaurants")
          .select("id, name, slug, theme_color")
          .eq("id", activeId)
          .maybeSingle();
        if (pref) data = pref;
      }

      if (!data) {
        const { data: ownerRests } = await supabase
          .from("restaurants")
          .select("id, name, slug, theme_color")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (ownerRests && ownerRests.length > 0) {
          data = ownerRests[0];
          localStorage.setItem("dinescan_active_restaurant_id", ownerRests[0].id);
        }
      }

      if (!data) {
        const { data: firstRest } = await supabase
          .from("restaurants")
          .select("id, name, slug, theme_color")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        data = firstRest;
      }

      if (data) {
        setSlug(data.slug);
        if (data.theme_color) setBrandColor(data.theme_color);
      }
      setIsLoading(false);
    };
    void load();
  }, [supabase]);

  const getStyleColors = (s: QrStyle) => {
    switch (s) {
      case "brand": return { fg: brandColor, bg: "#FFFFFF" };
      case "inverted": return { fg: "#FFFFFF", bg: "#0B0F19" };
      case "minimal": return { fg: "#475569", bg: "#F8FAFC" };
      default: return { fg: "#0F172A", bg: "#FFFFFF" };
    }
  };

  const { fg, bg } = getStyleColors(style);

  const getQrValue = (tableNum: number) => {
    if (mode === "wifi") {
      return `WIFI:S:${wifiSsid};T:${wifiAuth};P:${wifiPassword};;`;
    }
    if (mode === "feedback") {
      return `${getMenuUrl(slug)}?feedback=true`;
    }
    return `${getMenuUrl(slug)}?table=${tableNum}`;
  };

  const toggleTable = (num: number) => {
    setSelectedTables((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const selectAll = () => {
    setSelectedTables(Array.from({ length: tableCount }, (_, i) => i + 1));
  };

  const clearSelection = () => {
    setSelectedTables([]);
  };

  const handleDownloadZip = async () => {
    if (selectedTables.length === 0 && mode === "menu") {
      toast.error("Please select at least one table");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Packaging High-Res ZIP Archive...");

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const canvases = hiddenRenderRef.current?.querySelectorAll("canvas");
      if (!canvases || canvases.length === 0) throw new Error("No QR rendering canvas found");

      canvases.forEach((canvas) => {
        const identifier = canvas.getAttribute("data-table") || "QR";
        const dataUrl = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`QR-Code-${identifier}.png`, dataUrl, { base64: true });
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dinescan-qr-bundle-${new Date().getTime()}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("ZIP Archive Downloaded!", { id: toastId });
    } catch {
      toast.error("Failed to generate ZIP bundle", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Digital Menu & Wi-Fi QR Generator</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate print-ready vector QR codes, Wi-Fi table tents, and counter acrylic displays.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { key: "menu", label: "Menu & Ordering", icon: QrCode },
            { key: "wifi", label: "Guest Wi-Fi", icon: Wifi },
            { key: "feedback", label: "Feedback & Reviews", icon: MessageSquare }
          ].map((item) => {
            const IconComp = item.icon;
            const active = mode === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMode(item.key as QrMode);
                  if (item.key === "wifi") setBannerText("CONNECT TO GUEST WIFI");
                  else if (item.key === "feedback") setBannerText("SHARE YOUR FEEDBACK");
                  else setBannerText("SCAN TO ORDER & PAY");
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-white dark:bg-emerald-500 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="card p-6 text-sm text-slate-500 animate-pulse">Loading generator options...</div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Options Form (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Table Selection Grid (Only if Menu Mode) */}
          {mode === "menu" && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Select Tables to Generate</h3>
                  <p className="text-xs text-slate-400">Each table receives a unique contactless QR code.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-bold text-emerald-500 hover:underline" onClick={selectAll}>
                    Select All ({tableCount})
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" className="text-xs font-bold text-slate-400 hover:underline" onClick={clearSelection}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
                  const isSelected = selectedTables.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => toggleTable(num)}
                      className={`h-10 rounded-xl text-xs font-extrabold transition-all border ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-500/40"
                      }`}
                    >
                      #{num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wi-Fi Configuration Inputs */}
          {mode === "wifi" && (
            <div className="card p-6 space-y-4 bg-emerald-500/5 border-emerald-500/20">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-500" />
                Wi-Fi Network Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Network SSID</label>
                  <input
                    className="input text-xs"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Guest_WiFi"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Password</label>
                  <input
                    className="input text-xs"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="WiFi Password"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Encryption</label>
                  <select
                    className="input text-xs bg-white dark:bg-slate-950"
                    value={wifiAuth}
                    onChange={(e) => setWifiAuth(e.target.value)}
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP Legacy</option>
                    <option value="nopass">Open Network (No Password)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Styling & Template Options */}
          <div className="card p-6 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Design & Print Customization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Display Banner Text</label>
                <input
                  className="input text-xs"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="SCAN FOR DIGITAL MENU"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Resolution Quality</label>
                <div className="grid grid-cols-3 gap-2">
                  {[512, 1024, 2048].map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setSize(res)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        size === res
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {res === 2048 ? "2K Ultra HD" : `${res}px`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* QR Visual Theme Palette */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">QR Color Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "brand", label: "Brand Emerald", colors: "bg-emerald-500 text-white" },
                  { key: "classic", label: "Classic Black", colors: "bg-slate-900 text-white" },
                  { key: "inverted", label: "Dark Obsidian", colors: "bg-slate-950 text-emerald-400 border border-slate-800" },
                  { key: "minimal", label: "Minimal Slate", colors: "bg-slate-200 text-slate-700" }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStyle(item.key as QrStyle)}
                    className={`p-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      style === item.key ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`w-4 h-4 rounded-full ${item.colors}`}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stand Template Layout */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Print Layout Template</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "table_tent", label: "A5 Acrylic Stand", desc: "Dual sided table tent" },
                  { key: "sticker", label: "Table Sticker", desc: "Round / Square tag" },
                  { key: "counter_poster", label: "Counter Poster", desc: "A4 Standee poster" }
                ].map((tmpl) => (
                  <button
                    key={tmpl.key}
                    type="button"
                    onClick={() => setTemplate(tmpl.key as TemplateType)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      template === tmpl.key
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{tmpl.label}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{tmpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview Box (5 columns) */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <div className="card p-6 flex flex-col items-center text-center shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              Live Printable Preview ({template.replace("_", " ").toUpperCase()})
            </p>

            {/* Printable Mockup Container */}
            <div className="w-full max-w-[280px] p-6 rounded-3xl border-4 border-slate-900 bg-white shadow-2xl flex flex-col items-center justify-between space-y-4">
              <div className="w-full border-b border-slate-100 pb-3">
                <p className="font-extrabold text-slate-900 text-sm tracking-wider uppercase">{bannerText}</p>
                {mode === "menu" && (
                  <p className="text-xs font-black text-emerald-600 tracking-widest mt-1 uppercase">TABLE #{selectedTables[0] || 1}</p>
                )}
              </div>

              <div className="p-3 rounded-2xl border-2 border-slate-100 shadow-inner" style={{ backgroundColor: bg }}>
                <QRCodeCanvas
                  value={getQrValue(selectedTables[0] || 1)}
                  size={180}
                  fgColor={fg}
                  bgColor={bg}
                />
              </div>

              <div className="w-full pt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  {mode === "wifi" ? `SSID: ${wifiSsid}` : "Powered by DineScan Contactless QR"}
                </p>
              </div>
            </div>

            {/* Download & Print Actions */}
            <div className="w-full mt-6 space-y-3">
              <button
                type="button"
                className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                onClick={handleDownloadZip}
              >
                <Download className="w-4 h-4" />
                Download {selectedTables.length || 1} QR Code(s) ZIP
              </button>

              <button
                type="button"
                className="btn-outline w-full py-3.5 text-sm flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
                Print A4/A5 Delivery Sheet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Render Target for ZIP extraction & Print media queries */}
      <div className="hidden print:grid print:grid-cols-3 print:gap-8" ref={hiddenRenderRef}>
        {(selectedTables.length > 0 ? selectedTables : [1]).map((num) => (
          <div key={num} className="flex flex-col items-center p-6 border-2 border-black rounded-2xl break-inside-avoid text-center">
            <p className="font-extrabold text-base text-black uppercase">{bannerText}</p>
            <p className="text-lg font-black text-black tracking-widest my-2">TABLE #{num}</p>
            <div className="p-3 border border-black inline-block" style={{ backgroundColor: bg }}>
              <QRCodeCanvas
                data-table={num}
                value={getQrValue(num)}
                size={size}
                fgColor={fg}
                bgColor={bg}
              />
            </div>
            <p className="mt-3 text-xs font-bold text-black uppercase tracking-widest">DineScan Contactless QR</p>
          </div>
        ))}
      </div>
    </div>
  );
}
