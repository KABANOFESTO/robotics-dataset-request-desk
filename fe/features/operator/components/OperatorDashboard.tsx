"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useGetAnalyticsQuery } from "@/features/analytics/queries";
import { useGetRequestsQuery } from "@/features/requests/queries";
import { WORKSPACE_CARD, ErrorState, formatCount, formatDate, LoadingState, MetricCard, PageHeading, StatusBadge } from "@/components/workspace/WorkspaceUi";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function OperatorDashboard() {
  const { data: requests = [], isLoading, isError, refetch } = useGetRequestsQuery();
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  const analytics = useGetAnalyticsQuery({ start_date: dateKey(start), end_date: dateKey(end) });
  const counts = useMemo(() => requests.reduce((value, request) => {
    value[request.status] += 1;
    return value;
  }, { submitted: 0, in_progress: 0, delivered: 0, accepted: 0, rejected: 0 }), [requests]);
  const attention = requests.filter((request) => request.status === "submitted" || request.status === "rejected").sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
  const episodeCount = (analytics.data?.episodes_per_day_per_robot ?? []).reduce((total, row) => total + row.count, 0);

  return <div className="space-y-8 sm:space-y-10">
    <PageHeading eyebrow="Operations" title="Operator dashboard" description="A live view of incoming work, active fulfillment, episode supply, and requests that need attention." action={<Link href="/operator/requests" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800">Open request desk <span aria-hidden="true" className="ml-2">→</span></Link>} />
    {isError ? <ErrorState message="Request data could not be loaded." onRetry={() => void refetch()} /> : isLoading ? <LoadingState label="Loading operations dashboard…" /> : <>
      <section aria-label="Operations summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="New requests" value={formatCount(counts.submitted)} hint="Submitted and ready to start" icon={<span aria-hidden="true">＋</span>} accent="blue" />
        <MetricCard label="In fulfillment" value={formatCount(counts.in_progress)} hint="Active assignments in progress" icon={<span aria-hidden="true">↗</span>} accent="teal" />
        <MetricCard label="Awaiting client" value={formatCount(counts.delivered)} hint="Delivered; client owns the review" icon={<span aria-hidden="true">◷</span>} accent="violet" />
        <MetricCard label="Episodes this month" value={analytics.isLoading ? "—" : formatCount(episodeCount)} hint="Imported in the last 30 days" icon={<span aria-hidden="true">▤</span>} accent="amber" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.8fr)]">
        <section className={`${WORKSPACE_CARD} overflow-hidden`}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 sm:p-5"><div><h2 className="text-base font-semibold text-slate-950">Needs attention</h2><p className="mt-1 text-sm text-slate-500">New work and client requested rework</p></div><Link href="/operator/requests" className="text-sm font-semibold text-teal-800 hover:text-teal-950">All requests →</Link></div>
          {attention.length ? <ul className="divide-y divide-slate-100">{attention.map((request) => <li key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{request.task_name}</p><p className="mt-1 text-xs text-slate-500">Request #{request.id} · {request.assignments.length}/{request.episodes_requested} episodes · Due {formatDate(request.deadline)}</p></div><div className="flex items-center justify-between gap-3"><StatusBadge status={request.status} /><Link href="/operator/requests" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-900">Open desk</Link></div></li>)}</ul> : <p className="p-6 text-sm text-slate-500">The queue is clear. No new requests or rework need action.</p>}
        </section>

        <section className={`${WORKSPACE_CARD} p-5 sm:p-6`}><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Quick actions</p><h2 className="mt-2 text-lg font-semibold text-slate-950">Keep work moving</h2><div className="mt-5 grid gap-3">{[{ href: "/operator/requests", title: "Review request queue", detail: "Assign episodes and advance delivery" }, { href: "/operator/episodes", title: "Browse episode library", detail: "Filter by task, quality, and availability" }, { href: "/operator/analytics", title: "View analytics", detail: "Track throughput and fulfillment" }].map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border border-slate-200 p-3.5 transition hover:border-teal-300 hover:bg-teal-50/40"><span className="block text-sm font-semibold text-slate-800 group-hover:text-teal-900">{item.title}<span aria-hidden="true" className="float-right">↗</span></span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span></Link>)}</div></section>
      </div>
    </>}
  </div>;
}
