"use client";
import Link from "next/link";
import { useState } from "react";
import { REQUESTS, STATUS, StatusPill, card, fmt, daysLeft, type Status } from "./shared";

export default function AllRequests() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const count = (s: Status) => REQUESTS.filter((r) => r.status === s).length;
  const rows = REQUESTS.filter(
    (r) => (filter === "all" || r.status === filter) && (r.task + r.id).toLowerCase().includes(q.trim().toLowerCase())
  );
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm transition ${on ? "bg-[#2b2b2b] text-white" : "bg-white/70 hover:bg-white"}`;

  return (
    <main>
      <h1 className="mt-6 text-5xl font-light sm:text-6xl">All Requests</h1>
      <p className="mt-2 text-black/60">{REQUESTS.length} total</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by task or ID…"
          aria-label="Search requests"
          className="w-full rounded-full bg-white/70 px-5 py-2.5 text-[15px] placeholder:text-black/40 sm:w-72"
        />
        <button onClick={() => setFilter("all")} aria-pressed={filter === "all"} className={chip(filter === "all")}>All ({REQUESTS.length})</button>
        {(Object.keys(STATUS) as Status[]).filter(count).map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={chip(filter === s)}>
            {STATUS[s].label.toLowerCase()} ({count(s)})
          </button>
        ))}
      </div>

      <section className={`${card} mt-6 overflow-x-auto`}>
        <table className="w-full min-w-[820px] text-left text-[15px]">
          <thead className="text-sm text-black/55">
            <tr className="border-b border-dashed border-black/25">
              {["ID", "Task", "Client", "Status", "Episodes", "Deadline", "Created", ""].map((h) => <th key={h} className="pb-3 font-normal">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = daysLeft(r.deadline);
              const open = r.status !== "accepted";
              const due = open && d < 0 ? { t: `${-d}d overdue`, c: "text-red-700" } : open && d <= 5 ? { t: `${d}d`, c: "text-amber-700" } : { t: fmt(r.deadline), c: "text-black/70" };
              const done = r.got >= r.need;
              return (
                <tr key={r.id} className="border-b border-dashed border-black/15 last:border-0">
                  <td className="py-4 text-black/60">{r.id}</td>
                  <td><span className="rounded-lg bg-black/5 px-2 py-1">{r.task}</span></td>
                  <td>{r.client}</td>
                  <td><StatusPill s={r.status} /></td>
                  <td className="w-44">
                    <span>{r.got} / {r.need}{done && " ✓"}</span>
                    <div className="mt-1 h-1.5 w-32 rounded-full bg-black/10">
                      <div className={`h-full rounded-full ${done ? "bg-[#2b2b2b]" : "bg-[#f6d55c]"}`} style={{ width: `${Math.min(100, (r.got / r.need) * 100)}%` }} />
                    </div>
                  </td>
                  <td className={due.c}>{due.t}</td>
                  <td className="text-black/55">{fmt(r.created)}</td>
                  <td className="text-right"><Link href={`/admin/requests/${r.id}`} className="underline underline-offset-4">view →</Link></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-black/55">No requests match.</td></tr>}
          </tbody>
        </table>
      </section>
      <p className="mt-4 text-sm text-black/55">Showing {rows.length} of {REQUESTS.length} requests</p>
    </main>
  );
}