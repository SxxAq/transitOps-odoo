"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { roleConfig, type UserRole } from "@/lib/rbac";
import {
  Truck,
  Navigation,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const roles: UserRole[] = [
  "fleet_manager",
  "driver",
  "safety_officer",
  "financial_analyst",
];

const roleIcons: Record<UserRole, typeof Truck> = {
  fleet_manager: Truck,
  driver: Navigation,
  safety_officer: ShieldCheck,
  financial_analyst: BarChart3,
};

const roleColors: Record<UserRole, string> = {
  fleet_manager: "from-blue-500 to-blue-600 shadow-blue-500/25",
  driver: "from-emerald-500 to-emerald-600 shadow-emerald-500/25",
  safety_officer: "from-orange-500 to-orange-600 shadow-orange-500/25",
  financial_analyst: "from-purple-500 to-purple-600 shadow-purple-500/25",
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit() {
    if (!selected || !user) return;
    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? "",
        role: selected,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-float">
            <Truck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to TransitOps
          </h1>
          <p className="mt-3 text-muted-foreground">
            Choose your role to personalize your experience
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role, index) => {
            const config = roleConfig[role];
            const Icon = roleIcons[role];
            const isSelected = selected === role;

            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-stagger ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/40 bg-card hover:border-primary/30"
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {isSelected && (
                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                )}

                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br p-3 text-white shadow-lg ${roleColors[role]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="relative">
                  <div className="text-base font-bold">{config.label}</div>
                  <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {config.description}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {config.pages.map((page) => (
                      <span
                        key={page}
                        className="inline-block rounded-md bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {page}
                      </span>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <Button
          className="h-12 w-full rounded-xl text-sm font-semibold group"
          disabled={!selected || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
