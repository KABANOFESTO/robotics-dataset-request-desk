import Link from "next/link";

import { StatusBadge, formatDate } from "@/components/workspace/WorkspaceUi";
import type { DatasetRequest } from "@/lib/types";

export function ClientRequestCard({ request }: { request: DatasetRequest }) {
  const progress = Math.min(100, Math.round((request.assignments.length / request.episodes_requested) * 100));
  const needsReview = request.status === "delivered";

  return <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-950/[0.03] transition hover:border-teal-200 sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-semibold text-slate-950">{request.task_name}</h3><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Request #{request.id}</span></div><p className="mt-1 text-xs text-slate-500">Submitted {formatDate(request.created_at)} · Due {formatDate(request.deadline)}</p></div>
      <div className="flex items-center justify-between gap-3 sm:justify-start"><StatusBadge status={request.status} />{needsReview && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">Review needed</span>}</div>
    </div>
    <div className="mt-5"><div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-slate-600">Fulfillment</span><span className="font-semibold tabular-nums text-slate-800">{request.assignments.length} of {request.episodes_requested} episodes</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-700 to-cyan-500 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div></div>
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between"><p className="line-clamp-2 text-sm text-slate-600">{request.notes || "No additional notes."}</p><Link href={`/client/requests/${request.id}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-700">View details <span aria-hidden="true" className="ml-1">→</span></Link></div>
  </article>;
}
