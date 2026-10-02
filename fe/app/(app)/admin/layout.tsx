import AdminNav from "@/components/admin/AdminNav";
import { AdminAccessGate } from "@/features/admin/components/AdminAccessGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminNav />
      <AdminAccessGate>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {children}
        </div>
      </AdminAccessGate>
    </div>
  );
}
