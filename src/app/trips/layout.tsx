"use client";
import AppLayout from "@/components/layout/app-layout";
export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout page="trips">{children}</AppLayout>;
}
