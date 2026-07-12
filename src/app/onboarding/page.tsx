"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { roleConfig, type UserRole } from "@/lib/rbac";

const roles: UserRole[] = [
  "fleet_manager",
  "driver",
  "safety_officer",
  "financial_analyst",
];

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
      .update({ role: selected })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to TransitOps</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select your role to get started
          </p>
        </div>

        <div className="grid gap-3">
          {roles.map((role) => {
            const config = roleConfig[role];
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-colors ${
                  selected === role
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                    selected === role
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                />
                <div>
                  <div className="font-medium">{config.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {config.description}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Access: {config.pages.join(", ")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
          disabled={!selected || loading}
          onClick={handleSubmit}
        >
          {loading ? "Setting up..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
