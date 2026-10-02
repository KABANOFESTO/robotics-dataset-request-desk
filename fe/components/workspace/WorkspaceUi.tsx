import type { ReactNode } from "react";

import type { RequestStatus } from "@/lib/types";

export const WORKSPACE_CARD = "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-950/[0.03]";

const STATUS_META: Record<RequestStatus, { label: string; styles: string }> = {
  submitted: { label: "Submitted", styles: "bg-sky-50 text-sky-700 ring-sky-600/15" },
  in_progress: { label: "In progress", styles: "bg-amber-50 text-amber-800 ring-amber-600/15" },
  delivered: { label: "Delivered", styles: "bg-violet-50 text-violet-700 ring-violet-600/15" },
  accepted: { label: "Accepted", styles: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  rejected: { label: "Rework requested", styles: "bg-rose-50 text-rose-700 ring-rose-600/15" },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.styles}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function PageHeading({
  eyebrow = "Workspace",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = "teal",
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent?: "teal" | "blue" | "amber" | "violet";
}) {
  const accents = {
    teal: "bg-teal-50 text-teal-800 ring-teal-100",
    blue: "bg-sky-50 text-sky-800 ring-sky-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    violet: "bg-violet-50 text-violet-800 ring-violet-100",
  };

  return (
    <article className={`${WORKSPACE_CARD} p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
        <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}>{icon}</span>
      </div>
    </article>
  );
}

export function LoadingState({ label = "Loading workspace data…" }: { label?: string }) {
  return (
    <div className={`${WORKSPACE_CARD} flex items-center gap-3 p-6 text-sm text-slate-600`} role="status" aria-live="polite">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="w-fit rounded-md px-2 py-1 font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">Try again</button>
    </div>
  );
}

export function DataPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-slate-500">Showing <span className="font-semibold text-slate-700">{start}–{end}</span> of <span className="font-semibold text-slate-700">{formatCount(totalItems)}</span></p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="min-h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        <span className="min-w-16 text-center text-xs text-slate-500">Page {Math.min(page, pageCount)} of {pageCount}</span>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount || totalItems === 0} className="min-h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
    </nav>
  );
}

export function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
