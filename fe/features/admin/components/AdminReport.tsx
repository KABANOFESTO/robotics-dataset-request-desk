"use client";

import { useMemo, useState } from "react";

import { useGetAnalyticsQuery } from "@/features/analytics/queries";
import type { RequestStatus } from "@/lib/types";

import { ADMIN_CARD, ErrorState, formatCount, formatDate, LoadingState, MetricCard, PageHeading, StatusBadge } from "./AdminUi";

const STATUS_ORDER: RequestStatus[] = ["submitted", "in_progress", "delivered", "accepted", "rejected"];
const STATUS_LABELS: Record<RequestStatus, string> = { submitted: "Submitted", in_progress: "In progress", delivered: "Delivered", accepted: "Accepted", rejected: "Rework requested" };

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function initialRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { start_date: localDate(start), end_date: localDate(end) };
}

function medianLabel(seconds: number | null) {
  if (seconds == null) return "—";
  const hours = Math.round(seconds / 3600);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function AdminReport() {
  const [startDate, setStartDate] = useState(() => initialRange().start_date);
  const [endDate, setEndDate] = useState(() => initialRange().end_date);
  const validRange = startDate <= endDate;
  const { data, isLoading, isFetching, isError, refetch } = useGetAnalyticsQuery(
    { start_date: startDate, end_date: endDate },
    { skip: !validRange },
  );

  const dailyTotals = useMemo(() => {
    const grouped = new Map<string, number>();
    (data?.episodes_per_day_per_robot ?? []).forEach(({ date, count }) => grouped.set(date, (grouped.get(date) ?? 0) + count));
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
  }, [data]);
  const totalEpisodes = (data?.episodes_per_day_per_robot ?? []).reduce((sum, row) => sum + row.count, 0);
  const fulfillment = data?.request_fulfillment.by_status ?? [];
  const totalRequests = fulfillment.reduce((sum, row) => sum + row.count, 0);
  const maxDaily = Math.max(1, ...dailyTotals.map(({ count }) => count));
  const maxStatus = Math.max(1, ...fulfillment.map(({ count }) => count));

  function exportCsv() {
    if (!data) return;
    const lines = [
      ["Dataset Request Desk analytics", startDate, endDate],
      [],
      ["Request status", "Count"],
      ...STATUS_ORDER.map((status) => [STATUS_LABELS[status], fulfillment.find((entry) => entry.status === status)?.count ?? 0]),
      [],
      ["Episode date", "Episode count"],
      ...dailyTotals.map(({ date, count }) => [date, count]),
      [],
      ["Top tasks with good episodes", "Count"],
      ...data.top_good_tasks.map(({ task_name, count }) => [task_name, count]),
      [],
      ["Median submitted to delivered (seconds)", data.request_fulfillment.median_submitted_to_delivered_seconds ?? ""],
    ];
    const csv = lines.map((row) => row.map((value) => csvCell(value ?? "")).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dataset-desk-report-${startDate}-to-${endDate}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeading eyebrow="Insights" title="Workspace reports" description="Explore request fulfillment and episode collection over a date range, then export the current report." action={<button type="button" onClick={exportCsv} disabled={!data} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3" /></svg>Export CSV</button>} />

      <section className={`${ADMIN_CARD} p-4 sm:p-5`} aria-label="Report date range">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
          <div><label htmlFor="report-start" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">From</label><input id="report-start" type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10" /></div>
          <span aria-hidden="true" className="hidden pb-3 text-slate-400 sm:block">to</span>
          <div><label htmlFor="report-end" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">To</label><input id="report-end" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10" /></div>
          <span className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-500"><span className={`size-2 rounded-full ${isFetching ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />{isFetching ? "Updating" : "Live report"}</span>
        </div>
        {!validRange && <p className="mt-3 text-sm text-rose-700" role="alert">Choose an end date on or after the start date.</p>}
      </section>

      {isError && validRange ? <ErrorState message="Report data could not be loaded for this date range." onRetry={() => void refetch()} /> : null}

      <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Episodes recorded" value={isLoading || isError || !validRange ? "—" : formatCount(totalEpisodes)} hint="Recordings created in the selected period" icon={<span aria-hidden="true">▤</span>} accent="teal" />
        <MetricCard label="Requests created" value={isLoading || isError || !validRange ? "—" : formatCount(totalRequests)} hint="Requests submitted in the selected period" icon={<span aria-hidden="true">↗</span>} accent="blue" />
        <MetricCard label="Accepted requests" value={isLoading || isError || !validRange ? "—" : formatCount(fulfillment.find((row) => row.status === "accepted")?.count ?? 0)} hint="Accepted within requests created in range" icon={<span aria-hidden="true">✓</span>} accent="teal" />
        <MetricCard label="Median delivery time" value={isLoading || isError || !validRange ? "—" : medianLabel(data?.request_fulfillment.median_submitted_to_delivered_seconds ?? null)} hint="From submission to first delivery" icon={<span aria-hidden="true">◷</span>} accent="violet" />
      </section>

      {isLoading && validRange ? <LoadingState label="Loading report data…" /> : null}

      {data && validRange && !isError && (
        <section className="grid gap-5 xl:grid-cols-2">
          <article className={`${ADMIN_CARD} p-5 sm:p-6`}>
            <div><h2 className="text-base font-semibold text-slate-950">Daily episode collection</h2><p className="mt-1 text-sm text-slate-500">Episodes recorded per day for the selected range</p></div>
            {dailyTotals.length ? <div className="mt-6">
              <div className="flex h-60 items-end gap-1.5 overflow-x-auto border-b border-slate-200 pb-0.5 sm:gap-2" role="img" aria-label={`Bar chart of ${formatCount(totalEpisodes)} episodes recorded per day`}>
                {dailyTotals.map(({ date, count }) => <div key={date} title={`${formatDate(date)}: ${formatCount(count)} episodes`} className="group flex h-full min-w-2 flex-1 flex-col items-center justify-end"><span className="mb-1 hidden text-[10px] font-semibold text-slate-600 group-hover:block">{count}</span><span className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-teal-800 to-teal-400 transition-all duration-300 group-hover:from-sky-700 group-hover:to-cyan-400" style={{ height: `${Math.max(2, (count / maxDaily) * 88)}%` }} /><span className="mt-2 w-full truncate text-center text-[9px] text-slate-400">{date.slice(5)}</span></div>)}
              </div>
              <p className="mt-3 text-xs text-slate-500">{dailyTotals.length} days with recordings <span aria-hidden="true">·</span> Hover over a bar for its count</p>
            </div> : <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No episodes were recorded in this date range.</div>}
          </article>

          <article className={`${ADMIN_CARD} p-5 sm:p-6`}>
            <div><h2 className="text-base font-semibold text-slate-950">Request fulfillment</h2><p className="mt-1 text-sm text-slate-500">Workflow status for requests created during this period</p></div>
            <div className="mt-6 space-y-5">{STATUS_ORDER.map((status) => {
              const count = fulfillment.find((row) => row.status === status)?.count ?? 0;
              const percent = totalRequests ? Math.round((count / totalRequests) * 100) : 0;
              return <div key={status}><div className="mb-2 flex items-center justify-between gap-3"><StatusBadge status={status} /><span className="text-sm font-semibold tabular-nums text-slate-700">{formatCount(count)} <span className="font-normal text-slate-400">({percent}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${STATUS_LABELS[status]} requests`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-slate-800 to-teal-600 transition-[width] duration-500" style={{ width: `${(count / maxStatus) * 100}%` }} /></div></div>;
            })}</div>
            <div className="mt-6 border-t border-slate-100 pt-5"><h3 className="text-sm font-semibold text-slate-900">Top tasks · good-quality episodes</h3>{data.top_good_tasks.length ? <ol className="mt-3 divide-y divide-slate-100">{data.top_good_tasks.map((task, index) => <li key={task.task_name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{task.task_name}</span><span className="text-sm font-semibold tabular-nums text-slate-900">{formatCount(task.count)}</span></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">No good-quality task recordings in this range.</p>}</div>
          </article>
        </section>
      )}
    </div>
  );
}
