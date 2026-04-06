"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

interface LoginFormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);

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
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Welcome back");
    setLoading(false);
    router.push("/dashboard");
  };

  const onDemoLogin = async () => {
    setDemoLoading(true);
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@dinescan.app";
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "DemoPass123!";

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword
    });

    if (signInError) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword
      });
      if (signUpError) {
        toast.error(signUpError.message);
        setDemoLoading(false);
        return;
      }
      if (data.user) {
        const slug = `${slugify("demo-restaurant")}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from("restaurants").insert({
          owner_id: data.user.id,
          name: "Demo Restaurant",
          slug,
          description: "A starter demo menu",
          logo_url: null,
          address: null,
          phone: null,
          is_published: true,
          theme_color: "#22C55E"
        });
      }
      const { error: secondSignInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });
      if (secondSignInError) {
        toast.error(secondSignInError.message);
        setDemoLoading(false);
        return;
      }
    }

    toast.success("Signed in with demo account");
    setDemoLoading(false);
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-8">
        <h1 className="page-title">Sign in</h1>
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
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button className="btn-outline w-full" type="button" disabled={demoLoading} onClick={onDemoLogin}>
          {demoLoading ? "Preparing demo..." : "Use Demo Account"}
        </button>
        <p className="text-xs text-gray-400">Use the same email/password you registered with.</p>
        <Link className="text-sm text-gray-500" href="/auth/register">
          Need an account? Register
        </Link>
      </form>
    </main>
  );
}
