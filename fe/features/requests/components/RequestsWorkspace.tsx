"use client";

import { useMemo, useState } from "react";

import { useGetRequestsQuery } from "@/features/requests/queries";
import type { DatasetRequest, RequestStatus } from "@/lib/types";

import { RequestWorkflowActions } from "./RequestWorkflowActions";
import { WORKSPACE_CARD, DataPagination, ErrorState, formatCount, formatDate, formatDateTime, LoadingState, MetricCard, PageHeading, StatusBadge } from "@/components/workspace/WorkspaceUi";

const PAGE_SIZE = 15;
const STATUSES: RequestStatus[] = ["submitted", "in_progress", "delivered", "accepted", "rejected"];
const STATUS_LABELS: Record<RequestStatus, string> = { submitted: "Submitted", in_progress: "In progress", delivered: "Delivered", accepted: "Accepted", rejected: "Rework requested" };

function RequestRecord({ request }: { request: DatasetRequest }) {
  const [expanded, setExpanded] = useState(false);
  const completion = Math.min(100, (request.assignments.length / request.episodes_requested) * 100);

  return (
    <li className="p-4 sm:p-5">
      <article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(8rem,.75fr)_minmax(9rem,.8fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold text-slate-950">{request.task_name}</h3><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">#{request.id}</span></div>
            <p className="mt-1 truncate text-xs text-slate-500" title={request.client_email}>{request.client_name} · {request.client_email} · Created {formatDate(request.created_at)}</p>
          </div>
          <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Episode progress</p><p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">{request.assignments.length} <span className="font-normal text-slate-400">/ {request.episodes_requested}</span></p><div className="mt-2 h-1.5 max-w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-700 to-cyan-500 transition-[width] duration-500" style={{ width: `${completion}%` }} /></div></div>
          <div className="flex items-center justify-between gap-3 sm:block"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Deadline</p><p className="mt-1 text-sm font-medium text-slate-700">{formatDate(request.deadline)}</p></div><StatusBadge status={request.status} /></div>
          <div className="hidden justify-end lg:flex"><span className="text-xs text-slate-400">Updated {formatDateTime(request.updated_at)}</span></div>
        </div>

        <details className="group mt-4 border-t border-slate-100 pt-3" onToggle={(event) => setExpanded(event.currentTarget.open)}>
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-xs font-semibold text-teal-800 outline-none transition hover:text-teal-950 focus-visible:ring-2 focus-visible:ring-teal-700/30">
            <span className="group-open:hidden">View notes, activity and workflow actions</span><span className="hidden group-open:inline">Hide request details</span>
            <span aria-hidden="true" className="text-base transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">⌄</span>
          </summary>
          <div className="grid gap-5 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.85fr)]">
            <div className="grid gap-5 sm:grid-cols-2">
              <section><h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Client notes</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.notes || "No notes were provided."}</p></section>
              <section><h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Status history</h4>{request.status_history.length ? <ol className="mt-3 space-y-3 border-l border-slate-200 pl-3">{[...request.status_history].reverse().map((entry) => <li key={entry.id} className="relative text-xs"><span aria-hidden="true" className="absolute -left-[17px] top-1 size-2 rounded-full bg-teal-600 ring-2 ring-white" /><p className="font-semibold text-slate-800">{entry.from_status ? `${STATUS_LABELS[entry.from_status]} → ` : ""}{STATUS_LABELS[entry.to_status]}</p><p className="mt-0.5 text-slate-500">{entry.changed_by_email} · {formatDateTime(entry.changed_at)}</p></li>)}</ol> : <p className="mt-2 text-sm text-slate-500">No status changes recorded.</p>}</section>
            </div>
            <section><h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Workflow</h4><RequestWorkflowActions request={request} enabled={expanded} /></section>
          </div>
        </details>
      </article>
    </li>
  );
}

export default function RequestsWorkspace() {
  const { data: requests = [], isLoading, isFetching, isError, refetch } = useGetRequestsQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | RequestStatus>("all");
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  const filterKey = `${search.trim().toLowerCase()}|${status}`;
  const page = pageState.key === filterKey ? pageState.page : 1;

  const statusCounts = useMemo(() => {
    const counts: Record<RequestStatus, number> = { submitted: 0, in_progress: 0, delivered: 0, accepted: 0, rejected: 0 };
    requests.forEach((request) => { counts[request.status] += 1; });
    return counts;
  }, [requests]);
  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...requests]
      .filter((request) => status === "all" || request.status === status)
      .filter((request) => !term || [String(request.id), String(request.client), request.task_name, request.notes].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [requests, search, status]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE)));
  const pageRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeading eyebrow="Workflow" title="Request desk" description="Monitor every client request, deadline, episode assignment, and status change." action={<button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900 disabled:opacity-60">{isFetching ? <span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" /> : <span aria-hidden="true">↻</span>}Refresh</button>} />

      <section aria-label="Request totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total requests" value={isLoading || isError ? "—" : formatCount(requests.length)} hint="All requests across clients" icon={<span aria-hidden="true">▤</span>} accent="teal" />
        <MetricCard label="In progress" value={isLoading || isError ? "—" : formatCount(statusCounts.in_progress)} hint="Being fulfilled by the operations team" icon={<span aria-hidden="true">↗</span>} accent="blue" />
        <MetricCard label="Awaiting review" value={isLoading || isError ? "—" : formatCount(statusCounts.delivered)} hint="Delivered and waiting for client feedback" icon={<span aria-hidden="true">◷</span>} accent="violet" />
        <MetricCard label="Needs attention" value={isLoading || isError ? "—" : formatCount(statusCounts.submitted + statusCounts.rejected)} hint="New work or requested rework" icon={<span aria-hidden="true">!</span>} accent="amber" />
      </section>

      <section className={`${WORKSPACE_CARD} overflow-hidden`}>
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-base font-semibold text-slate-950">All client requests</h2><p className="mt-1 text-sm text-slate-500">{isLoading ? "Loading requests…" : `${formatCount(filteredRequests.length)} matching ${filteredRequests.length === 1 ? "request" : "requests"}`}</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(100%,35rem)] lg:grid-cols-[minmax(14rem,1fr)_13rem]">
              <div><label htmlFor="request-search" className="sr-only">Search requests</label><input id="request-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search task, client, or request ID" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10" /></div>
              <div><label htmlFor="request-status" className="sr-only">Filter by status</label><select id="request-status" value={status} onChange={(event) => setStatus(event.target.value as "all" | RequestStatus)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10"><option value="all">All statuses</option>{STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></div>
            </div>
          </div>
        </div>

        {isError ? <div className="p-4 sm:p-5"><ErrorState message="Requests could not be loaded. Check your connection or access, then retry." onRetry={() => void refetch()} /></div> : isLoading ? <div className="p-4 sm:p-5"><LoadingState label="Loading request desk…" /></div> : filteredRequests.length === 0 ? <div className="px-5 py-14 text-center"><span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-500">⌕</span><h3 className="mt-4 text-sm font-semibold text-slate-900">No matching requests</h3><p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p></div> : (
          <>
            <ul className="divide-y divide-slate-100">{pageRequests.map((request) => <RequestRecord key={request.id} request={request} />)}</ul>
            <DataPagination page={currentPage} pageSize={PAGE_SIZE} totalItems={filteredRequests.length} onPageChange={(nextPage) => setPageState({ key: filterKey, page: nextPage })} />
          </>
        )}
      </section>
    </div>
  );
}
