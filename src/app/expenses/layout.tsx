"use client";
import AppLayout from "@/components/layout/app-layout";
export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout page="expenses">{children}</AppLayout>;
}
