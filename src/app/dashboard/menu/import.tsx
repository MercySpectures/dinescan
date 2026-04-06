"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ImportCSV({ restaurantId, onImportComplete }: { restaurantId: string; onImportComplete: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const supabase = createClient();

  const handleDownloadDemo = () => {
    const headers = "category_name,item_name,description,price,is_veg,image_url\n";
    const demoData = "Starters,Paneer Tikka,Delicious grilled paneer,250,true,https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=200\nMain Course,Butter Chicken,Creamy chicken gravy,350,false,https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=200\n";
    const blob = new Blob([headers + demoData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dinescan-menu-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    toast.loading("Analyzing CSV...", { id: "csv" });

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV is empty or missing headers");

      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.toLowerCase().split(",").map(h => h.trim());

      const requiredHeaders = ["category_name", "item_name", "price"];
      for (const req of requiredHeaders) {
        if (!headers.includes(req)) throw new Error(`Missing required column: ${req}`);
      }

      // Step 1: Ensure categories exist
      const categoriesSet = new Set<string>();
      const parsedItems = dataLines.map(line => {
        // Regex to handle basic comma splitting ignoring commas inside quotes
        const cols = line.split(","); // keeping it simple for now as requested
        
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = cols[i]?.trim().replace(/^"|"$/g, "") || "";
        });
        
        if (row.category_name) categoriesSet.add(row.category_name);
        return row;
      });

      // Fetch or Create Categories
      const { data: existingCats } = await supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId);
      const catMap = new Map((existingCats || []).map(c => [c.name.toLowerCase(), c.id]));
      
      let sortOrder = existingCats?.length || 0;
      for (const catName of Array.from(categoriesSet)) {
        if (!catMap.has(catName.toLowerCase())) {
          const { data: newCat, error } = await supabase.from("categories").insert({
            restaurant_id: restaurantId,
            name: catName,
            sort_order: sortOrder++
          }).select("id").single();
          
          if (!error && newCat) {
            catMap.set(catName.toLowerCase(), newCat.id);
          }
        }
      }

      // Step 2: Insert Menu Items
      const { data: existingItems } = await supabase.from("menu_items").select("id").eq("restaurant_id", restaurantId);
      let itemSortOrder = existingItems?.length || 0;

      const itemsToInsert = parsedItems.filter(p => p.item_name && p.price).map(p => ({
        restaurant_id: restaurantId,
        category_id: catMap.get(p.category_name.toLowerCase()) || "",
        name: p.item_name,
        description: p.description || null,
        price: parseFloat(p.price) || 0,
        is_veg: p.is_veg?.toLowerCase() === "true" || p.is_veg === "1" || p.is_veg?.toLowerCase() === "yes",
        image_url: p.image_url || null,
        is_available: true,
        sort_order: itemSortOrder++
      }));

      const { error: insertError } = await supabase.from("menu_items").insert(itemsToInsert);
      
      if (insertError) throw insertError;

      toast.success(`Imported ${itemsToInsert.length} items securely!`, { id: "csv" });
      onImportComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process CSV", { id: "csv" });
    } finally {
      setIsImporting(false);
      e.target.value = ""; // reset input
    }
  };

  return (
    <div className="flex gap-2">
      <button type="button" className="btn-outline text-xs h-9 px-3" onClick={handleDownloadDemo}>
        Download Demo CSV
      </button>
      <label className={`btn-primary text-xs h-9 px-3 flex items-center cursor-pointer ${isImporting ? "opacity-50 pointer-events-none" : ""}`}>
        {isImporting ? "Importing..." : "Upload CSV"}
        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
      </label>
    </div>
  );
}
