import { redirect } from "next/navigation";

export default async function RequestAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/client/requests/${encodeURIComponent(id)}`);
}
