import OperatorNav from "@/components/navigation/OperatorNav";
import { RoleAccessGate } from "@/features/auth/components/RoleAccessGate";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900"><OperatorNav /><RoleAccessGate role="operator" deniedHref="/requests" label="operator"><main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main></RoleAccessGate></div>;
}
