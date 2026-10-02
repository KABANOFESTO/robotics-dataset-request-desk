"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ErrorState, formatCount, LoadingState, MetricCard, PageHeading } from "@/components/workspace/WorkspaceUi";
import { useGetRequestsQuery } from "@/features/requests/queries";
import { ClientRequestCard } from "@/features/client/components/ClientRequestCard";

export default function ClientDashboard() {
  const { data: requests = [], isLoading, isError, refetch } = useGetRequestsQuery();
  const counts = useMemo(() => requests.reduce((result, request) => {
    result[request.status] += 1;
    return result;
  }, { submitted: 0, in_progress: 0, delivered: 0, accepted: 0, rejected: 0 }), [requests]);
  const recentRequests = requests.slice(0, 3);
  const reviewRequest = requests.find((request) => request.status === "delivered");

  return <div className="space-y-8 sm:space-y-10">
    <PageHeading eyebrow="Client workspace" title="" description="" action={<Link href="/client/new-request" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800">Create a request <span aria-hidden="true" className="ml-2">＋</span></Link>} />
    {isError ? <ErrorState message="Your requests could not be loaded. Check your connection and try again." onRetry={() => void refetch()} /> : isLoading ? <LoadingState label="Loading your requests…" /> : <>
      <section aria-label="Request summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="All requests" value={formatCount(requests.length)} hint="Requests in your workspace" icon={<span aria-hidden="true">▤</span>} accent="teal" />
        <MetricCard label="With operations" value={formatCount(counts.submitted + counts.in_progress + counts.rejected)} hint="Submitted, active, or correction requested" icon={<span aria-hidden="true">↗</span>} accent="blue" />
        <MetricCard label="Ready to review" value={formatCount(counts.delivered)} hint="Delivered and waiting for your decision" icon={<span aria-hidden="true">◷</span>} accent="amber" />
        <MetricCard label="Completed" value={formatCount(counts.accepted)} hint="Accepted deliveries" icon={<span aria-hidden="true">✓</span>} accent="violet" />
      </section>

      {reviewRequest && <section className="flex flex-col gap-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">Your review is needed</p><h2 className="mt-2 text-lg font-semibold text-slate-950">{reviewRequest.task_name} is ready</h2><p className="mt-1 text-sm text-slate-600">Check the delivered episodes and accept the delivery or request changes.</p></div><Link href={`/client/requests/${reviewRequest.id}`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-800 px-4 text-sm font-semibold text-white transition hover:bg-teal-900">Review delivery <span aria-hidden="true" className="ml-2">→</span></Link></section>}

      <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Workspace activity</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Recent requests</h2></div><Link href="/client/requests" className="text-sm font-semibold text-teal-800 hover:text-teal-950">View all requests →</Link></div>
        {recentRequests.length ? <div className="grid gap-3">{recentRequests.map((request) => <ClientRequestCard key={request.id} request={request} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-50 text-xl text-teal-800">＋</span><h3 className="mt-4 text-sm font-semibold text-slate-900">Start with your first request</h3><p className="mt-1 text-sm text-slate-500">Tell the operations team what task data you need.</p><Link href="/client/new-request" className="mt-4 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50">Create a request →</Link></div>}
      </section>
    </>}
  </div>;
}
