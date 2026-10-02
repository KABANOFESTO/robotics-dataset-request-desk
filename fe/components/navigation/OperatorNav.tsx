import WorkspaceNav from "@/components/navigation/WorkspaceNav";

const items = [
  { href: "/operator", label: "Dashboard", icon: "grid", exact: true },
  { href: "/operator/requests", label: "Requests", icon: "inbox" },
  { href: "/operator/episodes", label: "Episodes", icon: "layers" },
  { href: "/operator/analytics", label: "Analytics", icon: "chart" },
] as const;

export default function OperatorNav() {
  return <WorkspaceNav items={[...items]} subtitle="Operations floor" roleLabel="Operator" homeHref="/operator" />;
}
