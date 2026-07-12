"use client";
import AppLayout from "@/components/layout/app-layout";
export default function FuelLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout page="fuel">{children}</AppLayout>;
}
