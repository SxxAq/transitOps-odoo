"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email ?? email,
      });
    }

    setSuccess("Account created! Check your email for confirmation, then sign in.");
    setLoading(false);
    setMode("login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-600">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Truck className="h-8 w-8" />
            </div>
            <span className="text-3xl font-bold tracking-tight">TransitOps</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Smart Fleet
            <br />
            Management
            <br />
            Platform
          </h1>

          <p className="mt-6 max-w-md text-lg text-white/70 leading-relaxed">
            Manage vehicles, drivers, trips, maintenance, and fuel — all in one place with real-time analytics and business rule enforcement.
          </p>

          <div className="mt-10 space-y-3">
            {["Vehicle lifecycle tracking", "Automated business rules", "Real-time fleet analytics", "Role-based access control"].map(
              (feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-white/50" />
                  {feature}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">TransitOps</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to manage your fleet operations"
                : "Get started with TransitOps in seconds"}
            </p>
          </div>

          <form
            onSubmit={mode === "login" ? handleLogin : handleSignup}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 rounded-xl"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 border border-emerald-500/20">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-sm font-semibold group"
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="font-semibold text-primary hover:underline underline-offset-4"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
