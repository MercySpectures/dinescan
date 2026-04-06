"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

interface RegisterFormState {
  email: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<RegisterFormState>({ email: "", password: "" });
  const strength = useMemo<number>(() => Math.min(100, form.password.length * 10), [form.password]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/dashboard");
      }
    };
    void checkSession();
  }, [router, supabase]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp(form);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      const baseSlug = slugify(form.email.split("@")[0] || "restaurant");
      const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error: restaurantError } = await supabase.from("restaurants").insert({
        owner_id: data.user.id,
        name: "My Restaurant",
        slug,
        description: null,
        logo_url: null,
        address: null,
        phone: null,
        is_published: false,
        theme_color: "#22C55E"
      });
      if (restaurantError) {
        toast.error(restaurantError.message);
        setLoading(false);
        return;
      }
    }
    if (!data.session) {
      toast.success("Account created. Verify your email, then sign in.");
      setLoading(false);
      router.push("/auth/login");
      return;
    }
    toast.success("Account created");
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-8">
        <h1 className="page-title">Create account</h1>
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <div className="h-2 rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${strength}%` }} />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="text-xs text-gray-400">Minimum 8 characters.</p>
        <Link className="text-sm text-gray-500" href="/auth/login">
          Already have an account? Sign in
        </Link>
      </form>
    </main>
  );
}
