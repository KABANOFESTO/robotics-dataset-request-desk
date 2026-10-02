import WorkspaceNav from "@/components/navigation/WorkspaceNav";

const items = [
  { href: "/admin", label: "Overview", icon: "grid", exact: true },
  { href: "/admin/requests", label: "Requests", icon: "inbox" },
  { href: "/admin/episodes", label: "Episodes", icon: "layers" },
  { href: "/admin/report", label: "Reports", icon: "chart" },
  { href: "/admin/users", label: "Users", icon: "users" },
] as const;

export default function AdminNav() {
  return <WorkspaceNav items={[...items]} subtitle="Control room" roleLabel="Administrator" homeHref="/admin" />;
}
