"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getMenuUrl } from "@/lib/utils";

type QrStyle = "classic" | "brand" | "inverted" | "minimal";

export default function QrPage() {
  const supabase = useMemo(() => createClient(), []);
  // We use this invisible container to render all QRs for zip extraction
  const hiddenRenderRef = useRef<HTMLDivElement | null>(null);
  
  const [size, setSize] = useState<number>(256);
  const [style, setStyle] = useState<QrStyle>("classic");
  const [slug, setSlug] = useState<string>("demo");
  const [brandColor, setBrandColor] = useState<string>("#22C55E");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tableCount, setTableCount] = useState<number>(10);
  const [selectedTables, setSelectedTables] = useState<number[]>([1]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase
        .from("restaurants")
        .select("slug, theme_color, table_count")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!data) {
        setIsLoading(false);
        return;
      }
      setSlug(data.slug);
      if (data.theme_color) setBrandColor(data.theme_color);
      if (data.table_count) setTableCount(data.table_count);
      setIsLoading(false);
    };
    void load();
  }, [supabase]);

  const getStyleColors = (s: QrStyle) => {
    switch(s) {
      case "brand": return { fg: brandColor, bg: "#FFFFFF" };
      case "inverted": return { fg: "#FFFFFF", bg: "#0F172A" };
      case "minimal": return { fg: "#64748b", bg: "#f8fafc" };
      default: return { fg: "#0F172A", bg: "#FFFFFF" }; // classic
    }
  };

  const { fg, bg } = getStyleColors(style);

  const toggleTable = (num: number) => {
    setSelectedTables(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const selectAll = () => {
    const all = Array.from({ length: tableCount }, (_, i) => i + 1);
    setSelectedTables(all);
  };

  const clearSelection = () => {
    setSelectedTables([]);
  };

  const handleDownloadZip = async () => {
    if (selectedTables.length === 0) {
      toast.error("Please select at least one table");
      return;
    }
    
    setIsLoading(true);
    toast.loading("Generating ZIP...", { id: "zip" });

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      
      const canvases = hiddenRenderRef.current?.querySelectorAll("canvas");
      if (!canvases) throw new Error("No canvas found");

      canvases.forEach((canvas) => {
        const tableCode = canvas.getAttribute("data-table");
        const dataUrl = canvas.toDataURL("image/png").split(",")[1];
        zip.file(`Table-${tableCode}.png`, dataUrl, { base64: true });
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dinescan-qr-codes-${new Date().getTime()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("ZIP Downloaded!", { id: "zip" });
    } catch (e) {
      toast.error("Failed to generate ZIP", { id: "zip" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
         <h1 className="page-title">Generate QR Codes</h1>
         <p className="mt-1 text-sm text-slate-500">Select tables and download high-resolution QR codes mapped to your live digital menu.</p>
      </div>
      
      {isLoading ? <div className="card p-6 text-sm text-gray-500 max-w-sm"><div className="animate-pulse flex space-x-4"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div></div> : null}
      
      <div className="grid gap-6 md:grid-cols-[1fr_350px]">
        <div className="space-y-6">
           <div className="card p-6">
             <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-slate-900">Select Tables</p>
                <div className="flex gap-2">
                   <button className="text-xs font-semibold text-primary" onClick={selectAll}>Select All</button>
                   <button className="text-xs font-semibold text-slate-400 hover:text-slate-600" onClick={clearSelection}>Clear</button>
                </div>
             </div>
             
             <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
               {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => {
                 const isSelected = selectedTables.includes(num);
                 return (
                   <button
                     key={num}
                     type="button"
                     onClick={() => toggleTable(num)}
                     className={`h-10 rounded-lg text-sm font-bold transition-all border ${isSelected ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary/50 hover:bg-primary/5'}`}
                   >
                     {num}
                   </button>
                 );
               })}
             </div>
           </div>

           <div className="card p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <p className="font-bold text-slate-900 mb-3">QR Style</p>
                   <div className="flex flex-col gap-2">
                     {(["classic", "brand", "inverted", "minimal"] as QrStyle[]).map((item) => (
                       <button
                         key={item}
                         className={`text-left px-4 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all ${style === item ? 'border-primary ring-1 ring-primary pointer-events-none' : 'border-slate-200 hover:border-slate-300'}`}
                         onClick={() => setStyle(item)}
                       >
                         {item}
                       </button>
                     ))}
                   </div>
                </div>
                <div>
                   <p className="font-bold text-slate-900 mb-3">Resolution Size</p>
                   <div className="flex flex-col gap-2">
                     {[256, 512, 1024].map((item) => (
                       <button 
                          key={item} 
                          className={`text-left px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${size === item ? 'border-primary ring-1 ring-primary pointer-events-none' : 'border-slate-200 hover:border-slate-300'}`}
                          onClick={() => setSize(item)}
                        >
                         {item}x{item}px
                       </button>
                     ))}
                   </div>
                </div>
             </div>
           </div>
        </div>
        
        <div className="space-y-4">
           {selectedTables.length > 0 ? (
             <div className="card p-6 flex flex-col items-center text-center">
               <p className="font-bold text-slate-900 mb-4">Preview (Table {selectedTables[0]})</p>
               <div className="inline-block rounded-2xl border-4 border-slate-100 p-4 shadow-inner" style={{ backgroundColor: bg }}>
                 <QRCodeCanvas value={`${getMenuUrl(slug)}?table=${selectedTables[0]}`} size={200} fgColor={fg} bgColor={bg} />
               </div>
               <p className="mt-3 text-sm font-bold text-slate-600 tracking-widest uppercase">Table {selectedTables[0]}</p>
               
               <div className="w-full mt-6 space-y-2">
                 <button className="btn-primary w-full py-3" onClick={handleDownloadZip}>
                   Download {selectedTables.length} QR(s) ZIP
                 </button>
                 <button className="btn-outline w-full py-3" onClick={() => window.print()}>
                   Print Delivery Sheet
                 </button>
               </div>
             </div>
           ) : (
             <div className="card p-6 flex items-center justify-center h-64 text-slate-400 font-medium">
                Select a table to preview
             </div>
           )}
        </div>
      </div>

      {/* Hidden render target for all selected QRs for ZIP extraction & Print media queries */}
      <div className="hidden print:grid print:grid-cols-3 print:gap-10" ref={hiddenRenderRef}>
        {selectedTables.map((num) => (
          <div key={num} className="flex flex-col items-center mb-8 break-inside-avoid">
             <div className="p-4 border-4 border-black inline-block" style={{ backgroundColor: bg }}>
               <QRCodeCanvas data-table={num} value={`${getMenuUrl(slug)}?table=${num}`} size={size} fgColor={fg} bgColor={bg} />
             </div>
             <p className="mt-4 text-xl font-bold uppercase tracking-widest text-black">Table {num}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
