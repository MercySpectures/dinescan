"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import ImportCSV from "./import";

interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  is_featured: boolean;
}

interface ItemFormState {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  is_featured: boolean;
}

export default function MenuBuilderPage() {
  const supabase = useMemo(() => createClient(), []);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<string>("");
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingItem, setIsSavingItem] = useState<boolean>(false);
  const [form, setForm] = useState<ItemFormState>({
    category_id: "",
    name: "",
    description: "",
    price: "",
    image_url: "",
    is_veg: true,
    is_available: true,
    is_featured: false
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!restaurant) {
      setIsLoading(false);
      return;
    }
    setRestaurantId(restaurant.id);

    const [{ data: categoryRows }, { data: itemRows }] = await Promise.all([
      supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
      supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order")
    ]);

    const safeCategories = (categoryRows ?? []) as Category[];
    setCategories(safeCategories);
    setOpenCategoryIds(safeCategories.map((row) => row.id));
    setItems((itemRows ?? []) as MenuItem[]);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Menu builder</h1>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <input
            className="input flex-1"
            placeholder="New category"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              if (!newCategory.trim()) return;
              if (!restaurantId) return;
              if (editingCategoryId) {
                const { error } = await supabase
                  .from("categories")
                  .update({ name: newCategory.trim() })
                  .eq("id", editingCategoryId);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                setEditingCategoryId("");
              } else {
                const { error } = await supabase.from("categories").insert({
                  restaurant_id: restaurantId,
                  name: newCategory.trim(),
                  description: null,
                  sort_order: categories.length
                });
                if (error) {
                  toast.error(error.message);
                  return;
                }
              }
              setNewCategory("");
              await loadData();
              toast.success("Category saved");
            }}
          >
            {editingCategoryId ? "Save category" : "Add category"}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setForm((prev) => ({ ...prev, id: undefined, category_id: categories[0]?.id ?? "" }));
              setShowModal(true);
            }}
          >
            Add item
          </button>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 flex justify-end">
           <ImportCSV restaurantId={restaurantId} onImportComplete={loadData} />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-6 text-sm text-gray-500">Loading menu data...</div>
      ) : null}

      {!isLoading && categories.length === 0 ? (
        <div className="card p-6 text-sm text-gray-500">No categories yet. Add your first category.</div>
      ) : null}

      {categories.map((category) => (
        <section key={category.id} className="card p-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="font-display text-left text-xl font-semibold"
              onClick={() =>
                setOpenCategoryIds((prev) =>
                  prev.includes(category.id) ? prev.filter((id) => id !== category.id) : [...prev, category.id]
                )
              }
            >
              {category.name}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditingCategoryId(category.id);
                  setNewCategory(category.name);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost text-red-500"
                onClick={async () => {
                  if (!window.confirm("Delete this category?")) return;
                  const { error } = await supabase.from("categories").delete().eq("id", category.id);
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  await loadData();
                  toast.success("Category deleted");
                }}
              >
                Delete
              </button>
            </div>
          </div>

          <div className={`mt-4 space-y-2 ${openCategoryIds.includes(category.id) ? "block" : "hidden"}`}>
            {items
              .filter((item) => item.category_id === category.id)
              .map((item) => (
                <article
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 p-3 ${
                    !item.is_available ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.image_url || "https://placehold.co/60x60/png"}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description ?? ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={item.is_veg ? "badge-veg" : "badge-nonveg"}>
                      {item.is_veg ? "Veg" : "Non-veg"}
                    </span>
                    <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={async () => {
                      const nextAvailability = !item.is_available;
                      setItems((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, is_available: nextAvailability } : row
                        )
                      );
                      const { error } = await supabase
                          .from("menu_items")
                        .update({ is_available: nextAvailability })
                          .eq("id", item.id);
                      if (error) {
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, is_available: !nextAvailability } : row
                          )
                        );
                        toast.error(error.message);
                        return;
                      }
                      toast.success(nextAvailability ? "Item enabled" : "Item disabled");
                      }}
                    >
                      {item.is_available ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setForm({
                          id: item.id,
                          category_id: item.category_id,
                          name: item.name,
                          description: item.description ?? "",
                          price: String(item.price),
                          image_url: item.image_url ?? "",
                          is_veg: item.is_veg,
                          is_available: item.is_available,
                          is_featured: item.is_featured
                        });
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-red-500"
                      onClick={async () => {
                        if (!window.confirm("Delete this item?")) return;
                        const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                        await loadData();
                        toast.success("Item deleted");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}

      {showModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-900/50 p-4">
          <div className="card animate-scale-in w-full max-w-2xl p-6">
            <h3 className="font-display text-xl font-semibold">{form.id ? "Edit item" : "Add item"}</h3>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  placeholder="Name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <select
                  className="input"
                  value={form.category_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="input min-h-20"
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  placeholder="Price"
                  type="number"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Image URL"
                  value={form.image_url}
                  onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_veg}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_veg: event.target.checked }))}
                  />
                  Veg
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
                  />
                  Featured
                </label>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file || !restaurantId) return;
                  const path = `${restaurantId}/items/${Date.now()}-${file.name}`;
                  const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
                  setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
                }}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={isSavingItem}
                onClick={async () => {
                  setIsSavingItem(true);
                  const payload = {
                    restaurant_id: restaurantId,
                    category_id: form.category_id,
                    name: form.name,
                    description: form.description || null,
                    price: Number(form.price || 0),
                    image_url: form.image_url || null,
                    is_veg: form.is_veg,
                    is_available: form.is_available,
                    is_featured: form.is_featured,
                    sort_order: items.length
                  };

                  if (form.id) {
                    const { error } = await supabase.from("menu_items").update(payload).eq("id", form.id);
                    if (error) {
                      toast.error(error.message);
                      setIsSavingItem(false);
                      return;
                    }
                  } else {
                    const { error } = await supabase.from("menu_items").insert(payload);
                    if (error) {
                      toast.error(error.message);
                      setIsSavingItem(false);
                      return;
                    }
                  }
                  await loadData();
                  setShowModal(false);
                  setIsSavingItem(false);
                  toast.success(form.id ? "Item updated" : "Item created");
                }}
              >
                {isSavingItem ? "Saving..." : "Save item"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
