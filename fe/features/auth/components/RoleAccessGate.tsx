"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useGetCurrentUserQuery } from "@/features/auth/queries";
import type { UserRole } from "@/lib/types";
import { useAppSelector } from "@/lib/store";

export function RoleAccessGate({ children, role, deniedHref, label }: { children: ReactNode; role: UserRole; deniedHref: string; label: string }) {
  const router = useRouter();
  const { initialized, accessToken, currentUser } = useAppSelector((state) => state.auth);
  const { isLoading, isFetching, isError } = useGetCurrentUserQuery(undefined, { skip: !initialized || !accessToken });

  useEffect(() => {
    if (!initialized) return;
    if (!accessToken || (isError && !isFetching)) {
      router.replace("/login");
      return;
    }
    if (currentUser && currentUser.role !== role) {
      router.replace(currentUser.role === "admin" ? "/admin" : currentUser.role === "operator" ? "/operator" : deniedHref);
    }
  }, [accessToken, currentUser, deniedHref, initialized, isError, isFetching, role, router]);

  if (!initialized || !accessToken || isLoading || isFetching || !currentUser) {
    return <main className="mx-auto flex min-h-[55vh] max-w-7xl items-center justify-center px-4" aria-live="polite"><div className="flex items-center gap-3 text-sm text-slate-600"><span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" aria-hidden="true" />Checking {label} access…</div></main>;
  }
  return currentUser.role === role ? children : null;
}
