import { AppRouteLayout } from "@/components/AppRouteLayout";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppRouteLayout>{children}</AppRouteLayout>;
}
