"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Upload, FileSpreadsheet } from "lucide-react";

export default function ImportCSV({
  restaurantId,
  onImportComplete
}: {
  restaurantId: string;
  onImportComplete: () => void;
}) {
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadDemo = () => {
    const csvContent =
      "Category,Name,Description,Price,Is_Veg,Image_Url\n" +
      'Starters,"Crispy Paneer Tikka","Charcoal-grilled cottage cheese skewers marinated in mustard yogurt and aromatic spices",280,true,https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80\n' +
      'Starters,"Tandoori Chicken Tikka","Charred chicken skewers glazed with roasted garlic mint chutney",340,false,https://images.unsplash.com/photo-1527477378308-1e0e7638c340?w=800&auto=format&fit=crop&q=80\n' +
      'Main Course,"Old Delhi Butter Chicken","Tender chicken simmered in rich creamy tomato and cashew butter gravy",390,false,https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80\n' +
      'Main Course,"Dal Makhani Royale","Slow-cooked black lentils overnight with churned butter and cream",290,true,https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80\n' +
      'Biryani & Rice,"Hyderabadi Dum Biryani","Fragrant long-grain basmati rice with aromatic spices and saffron",399,false,https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80\n' +
      'Beverages,"Alphonso Mango Lassi","Chilled thick yogurt blended with real Ratnagiri mango pulp",150,true,https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80\n';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dinescan-menu-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded CSV menu template!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resolve restaurant ID if not immediately passed in props
    let targetRestaurantId = restaurantId;
    if (!targetRestaurantId && typeof window !== "undefined") {
      targetRestaurantId = localStorage.getItem("dinescan_active_restaurant_id") || "";
    }

    if (!targetRestaurantId) {
      toast.error("Restaurant ID not found. Please refresh the page and try again.");
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading("Processing & validating menu CSV...");

    try {
      const formData = new FormData();
      formData.append("restaurantId", targetRestaurantId);
      formData.append("file", file);

      const res = await fetch("/api/menu/import", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process CSV import");
      }

      toast.success(data.message || `Imported ${data.count} items successfully!`, { id: toastId });
      onImportComplete();
    } catch (err) {
      console.error("CSV import error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to process CSV", { id: toastId });
    } finally {
      setIsImporting(false);
      e.target.value = ""; // reset input so same file can be uploaded again
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn-outline text-xs h-9 px-3 flex items-center gap-1.5"
        onClick={handleDownloadDemo}
      >
        <Download className="w-3.5 h-3.5 text-emerald-500" />
        Template CSV
      </button>

      <label
        className={`btn-primary text-xs h-9 px-3 flex items-center gap-1.5 cursor-pointer shadow-sm ${
          isImporting ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <Upload className="w-3.5 h-3.5" />
        {isImporting ? "Importing Dishes..." : "Upload Menu CSV"}
        <input
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isImporting}
        />
      </label>
    </div>
  );
}
