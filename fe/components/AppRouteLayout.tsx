"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AppRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Staff subtrees render their own navigation and page shell.
  if (pathname.startsWith("/admin") || pathname.startsWith("/operator") || pathname.startsWith("/client")) return children;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/requests" className="text-sm font-semibold tracking-tight text-slate-950">Dataset Request Desk</Link>
          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <Link href="/requests" className="text-sm font-medium text-slate-600 hover:text-slate-950">Requests</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
