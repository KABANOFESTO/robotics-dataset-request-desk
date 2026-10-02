"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useGetAnalyticsQuery } from "@/features/analytics/queries";
import { useGetRequestsQuery } from "@/features/requests/queries";
import { useGetUsersQuery } from "@/features/admin/queries";
import type { DatasetRequest, RequestStatus } from "@/lib/types";

import { ADMIN_CARD, ErrorState, formatCount, formatDate, MetricCard, PageHeading, StatusBadge } from "./AdminUi";

const STATUSES: RequestStatus[] = ["submitted", "in_progress", "delivered", "accepted", "rejected"];
const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  delivered: "Delivered",
  accepted: "Accepted",
  rejected: "Rework requested",
};
const CHART_COLORS = ["#0f766e", "#0284c7", "#8b5cf6", "#d97706", "#db2777", "#475569"];

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateRangeFor(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return { start_date: localDate(start), end_date: localDate(end) };
}

function medianLabel(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const totalHours = Math.round(seconds / 3600);
  if (totalHours < 24) return `${totalHours}h`;
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours ? `${days}d ${hours}h` : `${days}d`;
}

function RequestPreview({ request }: { request: DatasetRequest }) {
  return (
    <article className="grid gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-teal-200 hover:bg-teal-50/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{request.task_name}</p>
        <p className="mt-1 text-xs text-slate-500">Request #{request.id} <span aria-hidden="true">·</span> Client #{request.client} <span aria-hidden="true">·</span> Due {formatDate(request.deadline)}</p>
      </div>
      <StatusBadge status={request.status} />
    </article>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState(30);
  const dateRange = useMemo(() => dateRangeFor(period), [period]);
  const requestsQuery = useGetRequestsQuery();
  const usersQuery = useGetUsersQuery();
  const analyticsQuery = useGetAnalyticsQuery(dateRange);

  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);
  const users = usersQuery.data ?? [];
  const statusCounts = useMemo(() => {
    const counts: Record<RequestStatus, number> = { submitted: 0, in_progress: 0, delivered: 0, accepted: 0, rejected: 0 };
    requests.forEach(({ status }) => { counts[status] += 1; });
    return counts;
  }, [requests]);
  const activeRequests = statusCounts.submitted + statusCounts.in_progress + statusCounts.rejected;
  const episodeCount = (analyticsQuery.data?.episodes_per_day_per_robot ?? []).reduce((total, row) => total + row.count, 0);
  const latestRequests = [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  const activity = useMemo(() => {
    const rows = analyticsQuery.data?.episodes_per_day_per_robot ?? [];
    const robotIds = [...new Set(rows.map((row) => row.robot_id))].sort();
    const totalsByDate = new Map<string, Map<string, number>>();
    rows.forEach(({ date, robot_id, count }) => {
      const robotTotals = totalsByDate.get(date) ?? new Map<string, number>();
      robotTotals.set(robot_id, count);
      totalsByDate.set(date, robotTotals);
    });

    const end = new Date(`${dateRange.end_date}T00:00:00`);
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(end);
      day.setDate(day.getDate() - 6 + index);
      const date = localDate(day);
      const robots = totalsByDate.get(date) ?? new Map<string, number>();
      return { date, robots, total: [...robots.values()].reduce((sum, count) => sum + count, 0) };
    });
    return { days, robotIds, maxTotal: Math.max(1, ...days.map(({ total }) => total)) };
  }, [analyticsQuery.data, dateRange.end_date]);

  const retryAll = () => {
    void requestsQuery.refetch();
    void usersQuery.refetch();
    void analyticsQuery.refetch();
  };
  const hasErrors = requestsQuery.isError || usersQuery.isError || analyticsQuery.isError;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeading
        eyebrow="Admin control room"
        title="Workspace overview"
        description="A live view of dataset requests, episode collection, and account activity."
        action={<Link href="/admin/requests" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">Open request desk <span aria-hidden="true">↗</span></Link>}
      />

      {hasErrors && <ErrorState message="Some overview data could not be refreshed." onRetry={retryAll} />}

      <section aria-label="Workspace metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active requests" value={requestsQuery.isLoading || requestsQuery.isError ? "—" : formatCount(activeRequests)} hint="Submitted, in progress, or returned for rework" icon={<span className="text-xl" aria-hidden="true">↗</span>} accent="teal" />
        <MetricCard label="Awaiting client review" value={requestsQuery.isLoading || requestsQuery.isError ? "—" : formatCount(statusCounts.delivered)} hint="Delivered requests awaiting a decision" icon={<span className="text-xl" aria-hidden="true">◷</span>} accent="violet" />
        <MetricCard label="Episodes collected" value={analyticsQuery.isLoading || analyticsQuery.isError ? "—" : formatCount(episodeCount)} hint={`Recorded in the last ${period} days`} icon={<span className="text-xl" aria-hidden="true">▤</span>} accent="blue" />
        <MetricCard label="Active accounts" value={usersQuery.isLoading || usersQuery.isError ? "—" : formatCount(users.filter((user) => user.is_active).length)} hint={usersQuery.isError ? "Account data unavailable" : `${formatCount(users.length)} accounts in the workspace`} icon={<span className="text-xl" aria-hidden="true">◎</span>} accent="amber" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className={`${ADMIN_CARD} p-5 sm:p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-base font-semibold text-slate-950">Request pipeline</h2><p className="mt-1 text-sm text-slate-500">Live distribution across workflow stages</p></div>
            <Link href="/admin/requests" className="text-sm font-semibold text-teal-800 hover:text-teal-950">View all <span aria-hidden="true">→</span></Link>
          </div>
          {requestsQuery.isError ? <div className="mt-5"><ErrorState message="Request totals are unavailable." onRetry={() => void requestsQuery.refetch()} /></div> : (
            <div className="mt-6 space-y-4">
              {STATUSES.map((status) => {
                const percentage = requests.length ? Math.round((statusCounts[status] / requests.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm"><span className="text-slate-600">{STATUS_LABELS[status]}</span><span className="font-semibold tabular-nums text-slate-900">{requestsQuery.isLoading ? "—" : formatCount(statusCounts[status])}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${STATUS_LABELS[status]} requests`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-teal-700 to-cyan-500 transition-[width] duration-500" style={{ width: `${requestsQuery.isLoading ? 0 : percentage}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div><p className="text-xs text-slate-500">Accepted</p><p className="mt-1 text-xl font-semibold text-emerald-700 tabular-nums">{requestsQuery.isLoading ? "—" : formatCount(statusCounts.accepted)}</p></div>
            <div><p className="text-xs text-slate-500">Median request delivery</p><p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{medianLabel(analyticsQuery.data?.request_fulfillment.median_submitted_to_delivered_seconds)}</p></div>
          </div>
        </article>

        <article className={`${ADMIN_CARD} p-5 sm:p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-base font-semibold text-slate-950">Episode collection</h2><p className="mt-1 text-sm text-slate-500">Recent recordings by day and robot</p></div>
            <label className="sr-only" htmlFor="dashboard-range">Analytics time period</label>
            <select id="dashboard-range" value={period} onChange={(event) => setPeriod(Number(event.target.value))} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10"><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select>
          </div>
          {analyticsQuery.isError ? <div className="mt-5"><ErrorState message="Episode analytics are unavailable." onRetry={() => void analyticsQuery.refetch()} /></div> : analyticsQuery.isLoading ? <p className="mt-6 text-sm text-slate-500" aria-live="polite">Loading collection data…</p> : (
            <>
              <div className="mt-6 flex h-36 items-end justify-between gap-2 border-b border-slate-200 px-1" role="img" aria-label="Stacked bar chart showing episodes recorded each of the last seven days">
                {activity.days.map(({ date, robots, total }) => (
                  <div key={date} title={`${formatDate(date)}: ${formatCount(total)} episodes`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex h-28 w-full max-w-9 flex-col-reverse overflow-hidden rounded-t-lg bg-slate-50">
                      {activity.robotIds.map((robotId, index) => {
                        const count = robots.get(robotId) ?? 0;
                        return count ? <span key={robotId} className="block w-full shrink-0 transition-[height] duration-500" style={{ height: `${(count / activity.maxTotal) * 100}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /> : null;
                      })}
                    </div>
                    <span className="text-[10px] text-slate-500">{new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${date}T00:00:00`))}</span>
                  </div>
                ))}
              </div>
              {activity.robotIds.length ? <ul aria-label="Robots in chart" className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{activity.robotIds.map((robotId, index) => <li key={robotId} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><span className="size-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />{robotId}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No episodes were recorded in this period.</p>}
            </>
          )}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">Top good-quality tasks</h3><Link href="/admin/report" className="text-xs font-semibold text-teal-800 hover:text-teal-950">Open reports →</Link></div>
            {analyticsQuery.isLoading ? <p className="mt-3 text-sm text-slate-500">Loading task rankings…</p> : analyticsQuery.data?.top_good_tasks.length ? <ol className="mt-3 space-y-3">{analyticsQuery.data.top_good_tasks.slice(0, 4).map((task, index) => {
              const maximum = analyticsQuery.data?.top_good_tasks[0]?.count ?? 1;
              return <li key={task.task_name} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 text-sm"><span className="text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0"><span className="block truncate font-medium text-slate-700">{task.task_name}</span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-teal-700" style={{ width: `${Math.max(5, (task.count / maximum) * 100)}%` }} /></span></span><span className="font-semibold tabular-nums text-slate-800">{formatCount(task.count)}</span></li>;
            })}</ol> : <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No good-quality episodes recorded during this period.</p>}
          </div>
        </article>
      </section>

      <section className={`${ADMIN_CARD} p-5 sm:p-6`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold text-slate-950">Recently submitted requests</h2><p className="mt-1 text-sm text-slate-500">Latest activity across the workspace</p></div><Link href="/admin/requests" className="text-sm font-semibold text-teal-800 hover:text-teal-950">Browse request desk →</Link></div>
        <div className="mt-5 space-y-2">
          {requestsQuery.isLoading ? <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500" aria-live="polite">Loading recent requests…</p> : requestsQuery.isError ? <ErrorState message="Recent requests are unavailable." onRetry={() => void requestsQuery.refetch()} /> : latestRequests.length ? latestRequests.map((request) => <RequestPreview key={request.id} request={request} />) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No requests have been submitted yet.</p>}
        </div>
      </section>
    </div>
  );
}
