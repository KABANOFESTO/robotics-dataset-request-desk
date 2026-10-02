import WorkspaceNav from "@/components/navigation/WorkspaceNav";

const items = [
  { href: "/client", label: "Dashboard", icon: "grid", exact: true },
  { href: "/client/requests", label: "Requests", icon: "inbox" },
  { href: "/client/new-request", label: "New request", icon: "plus" },
] as const;

export default function ClientNav() {
  return <WorkspaceNav items={[...items]} subtitle="Client workspace" roleLabel="Client" homeHref="/client" />;
}
