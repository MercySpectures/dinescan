"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

interface SettingsForm {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  themeColor: string;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    slug: "",
    description: "",
    address: "",
    phone: "",
    themeColor: "#22C55E"
  });
  const [savedSlug, setSavedSlug] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!restaurant) {
        setIsLoading(false);
        return;
      }
      setRestaurantId(restaurant.id);
      setSavedSlug(restaurant.slug);
      setLogoUrl(restaurant.logo_url ?? "");
      setIsPublished(restaurant.is_published);
      setForm({
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description ?? "",
        address: restaurant.address ?? "",
        phone: restaurant.phone ?? "",
        themeColor: restaurant.theme_color ?? "#22C55E"
      });
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
    toast.success("Settings saved");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="page-title">Restaurant settings</h1>
        <div className="card p-6 text-sm text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="page-title">Restaurant settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form Settings */}
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 pb-3">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Restaurant Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value, slug: slugify(event.target.value) }))
                  }
                  placeholder="The French Laundry"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Public URL Slug</label>
                <input
                  className="input font-mono text-sm"
                  value={form.slug}
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
                  placeholder="french-laundry"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Property Description</label>
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="A short engaging description of your venue..."
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 pb-3">Contact & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Address</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="123 Ocean Drive, CA"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-lg border-b border-slate-100 pb-3">Branding & Status</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Logo Image</label>
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

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Primary Theme Color</label>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 w-fit">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0 shadow-none"
                    value={form.themeColor}
                    onChange={(event) => setForm((prev) => ({ ...prev, themeColor: event.target.value }))}
                  />
                  <span className="font-mono text-sm text-slate-600 uppercase pr-3">{form.themeColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">Publish Menu to Public</p>
                  <p className="text-xs text-slate-500 mt-0.5">Toggle whether diners can access your menu URL.</p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="publish-toggle"
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-slate-200 appearance-none cursor-pointer transition-transform duration-200 ease-in-out z-10"
                    checked={isPublished}
                    onChange={(event) => setIsPublished(event.target.checked)}
                    style={{ transform: isPublished ? 'translateX(100%)' : 'translateX(0)', borderColor: isPublished ? form.themeColor : '#e2e8f0' }}
                  />
                  <div className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-200 cursor-pointer transition-colors duration-200 ease-in-out" style={{ backgroundColor: isPublished ? `${form.themeColor}50` : '#e2e8f0' }}></div>
                </div>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full py-4 text-base shadow-lg shadow-primary/25" type="submit" disabled={isSaving}>
            {isSaving ? "Synchronizing Changes..." : "Save All Restaurant Settings"}
          </button>
        </form>

        {/* Right Column: Live Mobile Preview Frame */}
        <div className="sticky top-6 hidden lg:flex flex-col items-center justify-start max-h-[calc(100vh-2rem)] pb-6 overflow-hidden">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 shrink-0">Live Preview Simulator</p>
          <div className="relative w-[320px] 2xl:w-[360px] h-[680px] 2xl:h-[760px] max-h-[85vh] shrink-0 bg-[#0f172a] rounded-[2.5rem] xl:rounded-[3rem] p-[8px] xl:p-[10px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-[2px] border-[#334155] mx-auto flex flex-col ring-[4px] ring-[#0f172a]/20">
            {/* Hardware Buttons */}
            <div className="absolute top-24 -left-[3px] w-[3px] h-8 bg-[#334155] rounded-l-md"></div>
            <div className="absolute top-36 -left-[3px] w-[3px] h-14 bg-[#334155] rounded-l-md"></div>
            <div className="absolute top-52 -left-[3px] w-[3px] h-14 bg-[#334155] rounded-l-md"></div>
            <div className="absolute top-40 -right-[3px] w-[3px] h-16 bg-[#334155] rounded-r-md"></div>

            {/* iPhone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-[26px] bg-[#0f172a] rounded-b-2xl xl:rounded-b-3xl z-20 flex justify-center items-center gap-2 pb-1">
              <div className="w-[30%] h-1.5 rounded-full bg-slate-800 shadow-inner"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80 shadow-inner flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-900/30"></div>
              </div>
            </div>

            {/* Screen Content */}
            <div className="w-full flex-1 bg-white rounded-[2.25rem] overflow-hidden relative border border-slate-800 shadow-inner">
              {savedSlug ? (
                <iframe
                  src={`/menu/${savedSlug}?preview=true&theme=${encodeURIComponent(form.themeColor)}`}
                  className="w-full h-full border-0 bg-slate-50"
                  title="Mobile Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm p-8 text-center bg-slate-50 leading-relaxed font-medium">
                  Save your settings to generate a live preview.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
