"use client";
import AppLayout from "@/components/layout/app-layout";
export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout page="vehicles">{children}</AppLayout>;
}
