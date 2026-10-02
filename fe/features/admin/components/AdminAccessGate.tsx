"use client";

import type { ReactNode } from "react";

import { RoleAccessGate } from "@/features/auth/components/RoleAccessGate";

export function AdminAccessGate({ children }: { children: ReactNode }) {
  return <RoleAccessGate role="admin" deniedHref="/requests" label="administrator">{children}</RoleAccessGate>;
}
