import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Curated Unsplash images for automatic fallback by category
const categoryDefaultImages: Record<string, string> = {
  starters: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
  mains: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
  "main course": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
  biryani: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  "biryani & rice": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  breads: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
  beverages: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
  drinks: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
  desserts: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"
};

/**
 * Robust RFC 4180 compliant CSV line parser.
 * Correctly handles quotes, escaped quotes (""), and commas inside quotes.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalizes header keys to canonical field names.
 */
function normalizeHeaderKey(header: string): string {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean.includes("category") || clean === "cat") return "category";
  if (clean.includes("name") || clean === "dish" || clean === "item") return "name";
  if (clean.includes("price") || clean === "rate" || clean === "cost" || clean === "amount") return "price";
  if (clean.includes("desc") || clean.includes("detail")) return "description";
  if (clean.includes("veg") || clean === "type") return "is_veg";
  if (clean.includes("image") || clean.includes("photo") || clean.includes("pic") || clean.includes("url")) return "image_url";
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    let restaurantId = "";
    let csvText = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      restaurantId = (formData.get("restaurantId") as string) || "";
      const file = formData.get("file") as File | null;
      if (file) {
        csvText = await file.text();
      }
    } else {
      const body = await req.json();
      restaurantId = body.restaurantId || "";
      csvText = body.csvText || "";
    }

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required for menu import" },
        { status: 400 }
      );
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { error: "CSV file content is empty" },
        { status: 400 }
      );
    }

    // Clean BOM and standardize line endings
    const cleanText = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain a header row and at least one item row" },
        { status: 400 }
      );
    }

    const rawHeaders = parseCsvLine(lines[0]);
    const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);

    // Validate essential columns
    const hasName = normalizedHeaders.includes("name");
    const hasPrice = normalizedHeaders.includes("price");

    if (!hasName || !hasPrice) {
      return NextResponse.json(
        {
          error: `CSV is missing required columns. Found headers: [${rawHeaders.join(", ")}]. Must include at least 'Item Name' and 'Price'.`
        },
        { status: 400 }
      );
    }

    const nameIdx = normalizedHeaders.indexOf("name");
    const priceIdx = normalizedHeaders.indexOf("price");
    const catIdx = normalizedHeaders.indexOf("category");
    const descIdx = normalizedHeaders.indexOf("description");
    const vegIdx = normalizedHeaders.indexOf("is_veg");
    const imgIdx = normalizedHeaders.indexOf("image_url");

    const parsedRows: Array<{
      category: string;
      name: string;
      description: string;
      price: number;
      isVeg: boolean;
      imageUrl: string;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => c === "")) continue;

      const name = cols[nameIdx]?.replace(/^"|"$/g, "").trim() || "";
      const rawPrice = cols[priceIdx]?.replace(/[^0-9.]/g, "") || "0";
      const price = parseFloat(rawPrice) || 0;

      if (!name || price <= 0) continue;

      const category = (catIdx !== -1 && cols[catIdx]?.replace(/^"|"$/g, "").trim()) || "Main Course";
      const description = (descIdx !== -1 && cols[descIdx]?.replace(/^"|"$/g, "").trim()) || "";

      let isVeg = true;
      if (vegIdx !== -1 && cols[vegIdx]) {
        const v = cols[vegIdx].toLowerCase().trim();
        if (v === "false" || v === "no" || v === "non-veg" || v === "nonveg" || v === "0" || v === "red") {
          isVeg = false;
        }
      }

      let imageUrl = (imgIdx !== -1 && cols[imgIdx]?.replace(/^"|"$/g, "").trim()) || "";
      if (!imageUrl || imageUrl.includes("placehold.co")) {
        const catKey = category.toLowerCase().trim();
        imageUrl = categoryDefaultImages[catKey] || (isVeg ? categoryDefaultImages.starters : categoryDefaultImages.mains);
      }

      parsedRows.push({
        category,
        name,
        description,
        price,
        isVeg,
        imageUrl
      });
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: "No valid menu items could be parsed from the CSV file. Check item names and prices." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch or create categories
    const { data: existingCats } = await adminSupabase
      .from("categories")
      .select("id, name")
      .eq("restaurant_id", restaurantId);

    const catMap = new Map<string, string>();
    (existingCats || []).forEach((c) => {
      catMap.set(c.name.toLowerCase().trim(), c.id);
    });

    const categoriesInCsv = Array.from(new Set(parsedRows.map((r) => r.category.trim())));
    let sortOrder = (existingCats?.length || 0) + 1;

    for (const catName of categoriesInCsv) {
      const lower = catName.toLowerCase().trim();
      if (!catMap.has(lower)) {
        const { data: newCat, error: catError } = await adminSupabase
          .from("categories")
          .insert({
            restaurant_id: restaurantId,
            name: catName,
            sort_order: sortOrder++
          })
          .select("id")
          .single();

        if (newCat && !catError) {
          catMap.set(lower, newCat.id);
        }
      }
    }

    // Ensure at least one default category fallback exists
    let defaultCatId: string = existingCats?.[0]?.id || "";
    if (!defaultCatId) {
      const firstMapped = Array.from(catMap.values())[0];
      if (firstMapped) {
        defaultCatId = firstMapped;
      } else {
        const { data: fallbackCat } = await adminSupabase
          .from("categories")
          .insert({
            restaurant_id: restaurantId,
            name: "Main Course",
            sort_order: 1
          })
          .select("id")
          .single();
        if (fallbackCat) defaultCatId = fallbackCat.id;
      }
    }

    // 2. Fetch existing menu item count for ordering
    const { data: existingItems } = await adminSupabase
      .from("menu_items")
      .select("id")
      .eq("restaurant_id", restaurantId);

    let itemSort = existingItems?.length || 0;

    const itemsToInsert = parsedRows.map((row) => {
      const catId = catMap.get(row.category.toLowerCase().trim()) || defaultCatId;
      return {
        restaurant_id: restaurantId,
        category_id: catId,
        name: row.name,
        description: row.description || null,
        price: row.price,
        is_veg: row.isVeg,
        image_url: row.imageUrl,
        is_available: true,
        is_featured: false,
        sort_order: itemSort++
      };
    });

    const { error: insertError } = await adminSupabase
      .from("menu_items")
      .insert(itemsToInsert);

    if (insertError) {
      console.error("CSV Menu Insert Error:", insertError);
      return NextResponse.json(
        { error: `Database insert failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: itemsToInsert.length,
      categoriesCount: categoriesInCsv.length,
      message: `Successfully imported ${itemsToInsert.length} dishes across ${categoriesInCsv.length} categories!`
    });
  } catch (error) {
    console.error("Menu CSV import fatal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse and import CSV file." },
      { status: 500 }
    );
  }
}
