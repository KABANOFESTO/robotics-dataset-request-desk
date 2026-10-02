"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { PageHeading } from "@/components/workspace/WorkspaceUi";
import { useGetEpisodeTasksQuery } from "@/features/episodes/queries";
import { useCreateRequestMutation } from "@/features/requests/actions";

function apiErrorMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("data" in error)) return "Your request could not be submitted. Please try again.";
  const data = (error as { data?: unknown }).data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    const first = Object.values(record).flatMap((value) => Array.isArray(value) ? value : [value]).find((value) => typeof value === "string");
    if (typeof first === "string") return first;
  }
  return "Your request could not be submitted. Check the details and try again.";
}

export default function NewClientRequest() {
  const router = useRouter();
  const [createRequest, { isLoading }] = useCreateRequestMutation();
  const { data: taskOptions, isLoading: tasksLoading, isError: tasksError, refetch: refetchTasks } = useGetEpisodeTasksQuery();
  const [taskName, setTaskName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const minimumDeadline = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!taskOptions?.tasks.includes(taskName)) {
      setError("Select a task from the available dataset tasks.");
      return;
    }
    if (deadline < minimumDeadline) {
      setError("Choose a deadline today or later.");
      return;
    }
    try {
      const request = await createRequest({ task_name: taskName.trim(), episodes_requested: Number(quantity), deadline, notes: notes.trim() }).unwrap();
      router.replace(`/client/requests/${request.id}`);
      router.refresh();
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  return <div className="mx-auto max-w-3xl space-y-7">
    <PageHeading eyebrow="Request desk" title="Create a dataset request" description="Describe the task data you need. The operations team will review your requirements and update progress here." />
    <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-950/[0.03] sm:p-7">
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      <div className="space-y-5">
        <div><label htmlFor="task-name" className="mb-1.5 block text-sm font-semibold text-slate-800">Dataset task</label><select id="task-name" name="task_name" required value={taskName} onChange={(event) => setTaskName(event.target.value)} disabled={tasksLoading || tasksError || !taskOptions?.tasks.length} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"><option value="">{tasksLoading ? "Loading available tasks…" : tasksError ? "Could not load tasks" : taskOptions?.tasks.length ? "Select a dataset task" : "No eligible dataset tasks available"}</option>{taskOptions?.tasks.map((task) => <option key={task} value={task}>{task}</option>)}</select><p className="mt-1.5 text-xs text-slate-500">Choose from tasks with good or usable episodes in the dataset.</p>{tasksError && <button type="button" onClick={() => void refetchTasks()} className="mt-2 text-xs font-semibold text-teal-800 underline underline-offset-2">Retry loading tasks</button>}{!tasksLoading && !tasksError && taskOptions?.tasks.length === 0 && <p role="status" className="mt-2 text-xs text-amber-800">The episode dataset has no eligible tasks yet. Please contact the operations team.</p>}</div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="episodes-requested" className="mb-1.5 block text-sm font-semibold text-slate-800">Episodes required</label><input id="episodes-requested" name="episodes_requested" type="number" required min={1} max={10000} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /></div><div><label htmlFor="deadline" className="mb-1.5 block text-sm font-semibold text-slate-800">Deadline</label><input id="deadline" name="deadline" type="date" required min={minimumDeadline} value={deadline} onChange={(event) => setDeadline(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 text-sm outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /><p className="mt-1.5 text-xs text-slate-500">Choose a date that gives the team time to fulfill your request.</p></div></div>
        <div><label htmlFor="request-notes" className="mb-1.5 block text-sm font-semibold text-slate-800">Additional notes <span className="font-normal text-slate-500">(optional)</span></label><textarea id="request-notes" name="notes" rows={5} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Describe important details, constraints, or acceptance criteria…" className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10" /><p className="mt-1.5 text-right text-xs text-slate-400">{notes.length}/5000</p></div>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Link href="/client/requests" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</Link><button type="submit" disabled={isLoading || tasksLoading || tasksError || !taskOptions?.tasks.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60">{isLoading ? "Submitting request…" : "Submit request"}{!isLoading && <span aria-hidden="true">→</span>}</button></div>
    </form>
  </div>;
}
