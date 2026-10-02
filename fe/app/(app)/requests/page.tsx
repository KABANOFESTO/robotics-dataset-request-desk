"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { REQUESTS, StatusPill, card, fmt, daysLeft, type Status } from "../shared";

type Q = "good" | "usable" | "bad";
/* Sample episode pool. Replace with GET /episodes?task_name=&quality= */
const POOL: { id: string; task: string; robot: string; quality: Q; takenBy?: string }[] = [
  { id: "EP-0101", task: "pick and place", robot: "robot-01", quality: "good" },
  { id: "EP-0102", task: "pick and place", robot: "robot-02", quality: "usable" },
  { id: "EP-0103", task: "pick and place", robot: "robot-01", quality: "bad" },
  { id: "EP-0104", task: "pick and place", robot: "robot-03", quality: "good", takenBy: "REQ4" },
  { id: "EP-0105", task: "stack blocks", robot: "robot-03", quality: "good" },
  { id: "EP-0106", task: "open drawer", robot: "robot-01", quality: "usable" },
];
const STEPS: { s: Status; label: string }[] = [
  { s: "submitted", label: "Submitted" }, { s: "in_progress", label: "In Progress" },
  { s: "delivered", label: "Delivered" }, { s: "accepted", label: "Accepted" },
];
const POS: Record<Status, number> = { submitted: 0, in_progress: 1, delivered: 2, accepted: 3, rejected: 2 };
const sel = "rounded-full bg-white/80 px-4 py-2 text-sm";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const req = REQUESTS.find((r) => r.id === id);
  const [status, setStatus] = useState<Status>(req?.status ?? "submitted");
  const [added, setAdded] = useState<string[]>([]);
  const [log, setLog] = useState<{ s: Status; by: string; at: string }[]>([]);
  const [task, setTask] = useState("all");
  const [quality, setQuality] = useState("all");

  if (!req) return <main className="mt-10"><Link href="/admin/requests">← All requests</Link><p className="mt-6 text-2xl font-light">Request not found.</p></main>;

  const count = req.got + added.length;
  const left = req.need - count;
  const move = (s: Status) => { setStatus(s); setLog((l) => [{ s, by: "Jordan Kim", at: new Date().toLocaleString("en-GB") }, ...l]); };
  const d = daysLeft(req.deadline);
  const pool = POOL.filter((e) => (task === "all" || e.task === task) && (quality === "all" || e.quality === quality));
  const blocked = (e: (typeof POOL)[number]) => e.quality === "bad" ? "bad quality" : e.takenBy ? `in ${e.takenBy}` : status !== "in_progress" ? "start progress first" : "";
  const btn = "rounded-full bg-[#f6d55c] px-6 py-3 text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <main>
      <Link href="/admin/requests" className="mt-4 inline-block text-sm text-black/60 hover:text-black">← All requests</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-4"><h1 className="text-5xl font-light sm:text-6xl">{req.task}</h1><StatusPill s={status} /></div>
          <p className="mt-2 text-black/60">{req.id} · created by {req.client}</p>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-light ${d < 0 && status !== "accepted" ? "text-red-700" : ""}`}>{d < 0 ? `${-d}d overdue` : `${d}d left`}</p>
          <p className="text-sm text-black/60">Deadline: {fmt(req.deadline)} 2026</p>
        </div>
      </div>

      <section className={`${card} mt-8`} aria-label="Workflow status">
        <h2 className="text-sm text-black/55">Workflow status</h2>
        <ol className="mt-5 flex flex-wrap items-center gap-y-4">
          {STEPS.map((st, i) => (
            <li key={st.s} className="flex items-center">
              <span className={`rounded-full px-5 py-2.5 text-[15px] ${i === POS[status] ? "bg-[#2b2b2b] text-white" : i < POS[status] ? "bg-[#f6d55c]" : "bg-black/5 text-black/50"}`} aria-current={i === POS[status] ? "step" : undefined}>{st.label}</span>
              {i < 3 && <span className="mx-2 hidden h-px w-8 bg-black/25 sm:block" />}
            </li>
          ))}
        </ol>
        {status === "rejected" && <p className="mt-4 text-sm text-red-700">The client rejected this delivery. Start rework to continue.</p>}
      </section>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[["Task", req.task], ["Requested", `${req.need} episodes`], ["Assigned", `${count} / ${req.need}`], ["Submitted", `${fmt(req.created)} 2026`]].map(([k, v]) => (
          <div key={k} className={card}><dt className="text-sm text-black/55">{k}</dt><dd className="mt-2 text-2xl font-light">{v}</dd></div>
        ))}
      </dl>

      <section className={`${card} mt-5`}>
        <h2 className="text-sm text-black/55">Client notes</h2>
        <p className="mt-2 text-xl font-light">{req.notes || "No notes."}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-3xl font-light">Assigned episodes ({count}/{req.need})</h2>
        <div className="mt-3 h-2 rounded-full bg-black/10"><div className="h-full rounded-full bg-[#2b2b2b]" style={{ width: `${Math.min(100, (count / req.need) * 100)}%` }} /></div>
        <div className="mt-4 rounded-[24px] border border-dashed border-black/30 p-6">
          {count === 0 ? <p className="text-center text-black/55">No episodes assigned yet.</p> : (
            <ul className="space-y-2">
              {req.got > 0 && <li className="text-sm text-black/55">{req.got} episodes assigned earlier</li>}
              {added.map((eid) => (
                <li key={eid} className="flex items-center justify-between">
                  <span>{eid}</span>
                  {status === "in_progress" && <button onClick={() => setAdded(added.filter((x) => x !== eid))} className="text-sm underline underline-offset-4">remove</button>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${card} mt-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-light">Available episodes</h3>
            <div className="flex gap-2">
              <select aria-label="Filter by task" value={task} onChange={(e) => setTask(e.target.value)} className={sel}>
                <option value="all">All tasks</option>
                {[...new Set(POOL.map((e) => e.task))].map((t) => <option key={t}>{t}</option>)}
              </select>
              <select aria-label="Filter by quality" value={quality} onChange={(e) => setQuality(e.target.value)} className={sel}>
                <option value="all">Any quality</option><option>good</option><option>usable</option><option>bad</option>
              </select>
            </div>
          </div>
          <ul className="mt-3">
            {pool.map((e) => {
              const why = blocked(e);
              const on = added.includes(e.id);
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 border-b border-dashed border-black/15 py-3 last:border-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{e.id}</span><span className="rounded-lg bg-black/5 px-2 py-0.5 text-sm">{e.task}</span>
                    <span className="text-sm text-black/55">{e.robot} · {e.quality}</span>
                  </div>
                  {on ? <span className="text-sm text-black/55">assigned here</span> : (
                    <button disabled={!!why} onClick={() => setAdded([...added, e.id])} className="rounded-full bg-white px-4 py-1.5 text-sm hover:bg-black hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-inherit">
                      {why || "Assign"}
                    </button>
                  )}
                </li>
              );
            })}
            {pool.length === 0 && <li className="py-6 text-center text-black/55">No episodes match.</li>}
          </ul>
        </div>
      </section>

      <section className="mt-5 rounded-[32px] bg-[#2b2b2b] p-6 text-white">
        <h2 className="text-sm text-white/60">Available actions</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {(status === "submitted") && <button className={btn} style={{ color: "#1c1c1c" }} onClick={() => move("in_progress")}>Start Progress</button>}
          {status === "rejected" && <button className={btn} style={{ color: "#1c1c1c" }} onClick={() => move("in_progress")}>Start Rework</button>}
          {status === "in_progress" && (
            <>
              <button className={btn} style={{ color: "#1c1c1c" }} disabled={left > 0} onClick={() => move("delivered")}>Mark Delivered</button>
              {left > 0 && <span className="text-sm text-white/65">Assign {left} more {left === 1 ? "episode" : "episodes"} to deliver.</span>}
            </>
          )}
          {status === "delivered" && <span className="text-white/75">Waiting for the client to accept or reject. Only the client can do this.</span>}
          {status === "accepted" && <span className="text-white/75">This request is complete.</span>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-3xl font-light">Activity log</h2>
        <ul className="mt-4 space-y-3">
          {[...log, { s: "submitted" as Status, by: req.client, at: `${fmt(req.created)} 2026` }].map((l, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3"><StatusPill s={l.s} /><span className="text-black/65">by {l.by} · {l.at}</span></li>
          ))}
        </ul>
      </section>
    </main>
  );
}