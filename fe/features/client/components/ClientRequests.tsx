"use client";

import { useMemo, useState } from "react";

import { DataPagination, ErrorState, formatCount, LoadingState, PageHeading } from "@/components/workspace/WorkspaceUi";
import { useGetRequestsQuery } from "@/features/requests/queries";
import type { RequestStatus } from "@/lib/types";
import { ClientRequestCard } from "@/features/client/components/ClientRequestCard";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: Array<{ value: "all" | RequestStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Changes requested" },
  { value: "accepted", label: "Accepted" },
];

export default function ClientRequests() {
  const { data: requests = [], isLoading, isError, refetch } = useGetRequestsQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | RequestStatus>("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => requests.filter((request) => (status === "all" || request.status === status) && (!search.trim() || `${request.task_name} ${request.id} ${request.notes}`.toLowerCase().includes(search.trim().toLowerCase()))), [requests, search, status]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return <div className="space-y-7">
    <PageHeading eyebrow="My workspace" title="Requests" description="Search your dataset requests, check their progress, or open a delivered request to review it." />
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-950/[0.03]">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5"><div><h2 className="text-base font-semibold text-slate-950">Your requests</h2><p className="mt-1 text-sm text-slate-500">{isLoading ? "Loading…" : `${formatCount(filtered.length)} ${filtered.length === 1 ? "request" : "requests"}`}</p></div><div className="grid gap-3 sm:grid-cols-2 sm:items-end"><div><label htmlFor="client-request-search" className="mb-1.5 block text-xs font-semibold text-slate-600">Search</label><input id="client-request-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Task, notes, or ID" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10" /></div><div><label htmlFor="client-request-status" className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label><select id="client-request-status" value={status} onChange={(event) => { setStatus(event.target.value as "all" | RequestStatus); setPage(1); }} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10">{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div></div>
      {isError ? <div className="p-4 sm:p-5"><ErrorState message="Your requests could not be loaded." onRetry={() => void refetch()} /></div> : isLoading ? <div className="p-4 sm:p-5"><LoadingState label="Loading your requests…" /></div> : visible.length ? <div className="grid gap-3 p-4 sm:p-5">{visible.map((request) => <ClientRequestCard key={request.id} request={request} />)}<DataPagination page={currentPage} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} /></div> : <div className="px-5 py-14 text-center"><span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-500">⌕</span><h3 className="mt-4 text-sm font-semibold text-slate-900">No requests found</h3><p className="mt-1 text-sm text-slate-500">Try changing the search or status filter.</p></div>}
    </section>
  </div>;
}
