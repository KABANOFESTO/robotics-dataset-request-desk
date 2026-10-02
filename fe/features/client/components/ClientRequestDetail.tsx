"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ErrorState, formatDate, formatDateTime, LoadingState, PageHeading, StatusBadge, WORKSPACE_CARD } from "@/components/workspace/WorkspaceUi";
import { useReviewRequestMutation } from "@/features/requests/actions";
import { useGetRequestQuery } from "@/features/requests/queries";
import type { RequestStatus } from "@/lib/types";

const STATUS_LABEL: Record<RequestStatus, string> = { submitted: "Submitted", in_progress: "In progress", delivered: "Delivered", accepted: "Accepted", rejected: "Changes requested" };

export default function ClientRequestDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const validId = Number.isSafeInteger(id) && id > 0;
  const { data: request, isLoading, isError, refetch } = useGetRequestQuery(id, { skip: !validId });
  const [reviewRequest, reviewState] = useReviewRequestMutation();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");

  async function review(status: "accepted" | "rejected") {
    if (!request || request.status !== "delivered") return;
    const confirmed = window.confirm(status === "accepted" ? "Accept this delivery? This will complete the request." : "Request changes to this delivery? This will return the request to the operations team.");
    if (!confirmed) return;
    setFeedback(null);
    try {
      await reviewRequest({ id: request.id, status }).unwrap();
      setFeedbackTone("success");
      setFeedback(status === "accepted" ? "Delivery accepted. This request is complete." : "Changes requested. The operations team will continue working on your request.");
    } catch {
      setFeedbackTone("error");
      setFeedback("Your review could not be saved. Refresh the request and try again.");
    }
  }

  if (!validId) return <div className="space-y-5"><Link href="/client/requests" className="text-sm font-semibold text-teal-800 hover:text-teal-950">← Your requests</Link><div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">This request link is invalid.</div></div>;
  if (isLoading) return <LoadingState label="Loading request details…" />;
  if (isError || !request) return <div className="space-y-5"><Link href="/client/requests" className="text-sm font-semibold text-teal-800 hover:text-teal-950">← Your requests</Link><ErrorState message="This request could not be loaded. It may no longer be available." onRetry={() => void refetch()} /></div>;

  const progress = Math.min(100, Math.round((request.assignments.length / request.episodes_requested) * 100));
  const deliveredForReview = request.status === "delivered";
  const completed = request.status === "accepted";

  return <div className="space-y-7">
    <Link href="/client/requests" className="inline-flex min-h-8 items-center text-sm font-semibold text-teal-800 hover:text-teal-950">← Your requests</Link>
    <PageHeading eyebrow={`Request #${request.id}`} title={request.task_name} description="View the request status, fulfillment details, assigned episodes, and activity." action={<StatusBadge status={request.status} />} />

    {deliveredForReview && <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">Delivery ready for review</p><h2 className="mt-2 text-lg font-semibold text-slate-950">Please review the assigned episodes</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Accept the delivery to complete this request, or request changes to send it back to the operations team.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => void review("accepted")} disabled={reviewState.isLoading} className="min-h-11 rounded-xl bg-teal-800 px-4 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:cursor-wait disabled:opacity-60">{reviewState.isLoading ? "Saving review…" : "Accept delivery"}</button><button type="button" onClick={() => void review("rejected")} disabled={reviewState.isLoading} className="min-h-11 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-800 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60">Request changes</button></div>{feedback && <p role="status" className={`mt-3 text-sm ${feedbackTone === "success" ? "text-emerald-800" : "text-rose-800"}`}>{feedback}</p>}</section>}
    {completed && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><span className="font-semibold">Request complete.</span> You accepted this delivery on {request.status_history.filter((entry) => entry.to_status === "accepted").at(-1) ? formatDateTime(request.status_history.filter((entry) => entry.to_status === "accepted").at(-1)!.changed_at) : "the recorded review date"}.</section>}
    {request.status === "rejected" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">You requested changes. The operations team is working on the updated delivery.</section>}

    <section className={`${WORKSPACE_CARD} p-5 sm:p-6`} aria-label="Fulfillment progress"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Fulfillment progress</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{request.assignments.length} of {request.episodes_requested} episodes</h2></div><span className="text-2xl font-semibold tabular-nums text-slate-900">{progress}%</span></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-700 to-cyan-500 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div><dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3"><div><dt className="text-xs font-medium text-slate-500">Submitted</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(request.created_at)}</dd></div><div><dt className="text-xs font-medium text-slate-500">Deadline</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(request.deadline)}</dd></div><div><dt className="text-xs font-medium text-slate-500">Last updated</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(request.updated_at)}</dd></div></dl></section>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,.8fr)]"><section className={`${WORKSPACE_CARD} overflow-hidden`}><div className="border-b border-slate-100 p-4 sm:px-5"><h2 className="text-base font-semibold text-slate-950">{deliveredForReview || completed ? "Delivered episodes" : "Assigned episodes"}</h2><p className="mt-1 text-sm text-slate-500">Episodes attached to this request</p></div>{request.assignments.length ? <ul className="divide-y divide-slate-100">{request.assignments.map((assignment) => <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"><div><p className="text-sm font-semibold text-slate-900">{assignment.episode_code}</p><p className="mt-1 text-xs text-slate-500">Assigned {formatDateTime(assignment.assigned_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.episode_quality === "good" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{assignment.episode_quality}</span></li>)}</ul> : <p className="p-5 text-sm text-slate-500">No episodes have been assigned yet.</p>}</section>
      <section className={`${WORKSPACE_CARD} p-4 sm:p-5`}><h2 className="text-base font-semibold text-slate-950">Your notes</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.notes || "No additional notes were added to this request."}</p></section></div>

    <section className={`${WORKSPACE_CARD} p-4 sm:p-5`}><h2 className="text-base font-semibold text-slate-950">Status history</h2>{request.status_history.length ? <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">{[...request.status_history].reverse().map((entry) => <li key={entry.id} className="relative"><span aria-hidden="true" className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-teal-600 ring-4 ring-white" /><p className="text-sm font-semibold text-slate-800">{entry.from_status ? `${STATUS_LABEL[entry.from_status]} → ` : ""}{STATUS_LABEL[entry.to_status]}</p><p className="mt-1 text-xs text-slate-500">{entry.changed_by_email} · {formatDateTime(entry.changed_at)}</p></li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Your request has been submitted and is waiting for the operations team.</p>}</section>
  </div>;
}
