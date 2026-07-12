"use client";
import AppLayout from "@/components/layout/app-layout";
export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout page="maintenance">{children}</AppLayout>;
}
