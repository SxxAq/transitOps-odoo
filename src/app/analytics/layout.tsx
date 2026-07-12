"use client";
import AppLayout from "@/components/layout/app-layout";
export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout page="analytics">{children}</AppLayout>;
}
