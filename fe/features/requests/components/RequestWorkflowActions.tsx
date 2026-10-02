"use client";

import { useMemo, useState } from "react";

import { useGetEpisodesQuery } from "@/features/episodes/queries";
import { useAssignAvailableEpisodesMutation, useAssignEpisodeMutation, useRemoveAssignmentMutation, useTransitionRequestMutation } from "@/features/requests/actions";
import type { DatasetRequest } from "@/lib/types";

export function RequestWorkflowActions({ request, enabled }: { request: DatasetRequest; enabled: boolean }) {
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [manualSelectionOpen, setManualSelectionOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const needsEpisodes = request.status === "in_progress" && request.assignments.length < request.episodes_requested;
  const episodeFilters = useMemo(() => ({ available: true, task_name: request.task_name }), [request.task_name]);
  const episodesQuery = useGetEpisodesQuery(episodeFilters, { skip: !enabled || !needsEpisodes || !manualSelectionOpen });
  const eligibleEpisodes = useMemo(() => (episodesQuery.data ?? []).filter((episode) => episode.quality !== "bad" && episode.task_name.trim().toLowerCase() === request.task_name.trim().toLowerCase()), [episodesQuery.data, request.task_name]);
  const [assignEpisode, assignmentState] = useAssignEpisodeMutation();
  const [assignAvailableEpisodes, bulkAssignmentState] = useAssignAvailableEpisodesMutation();
  const [transitionRequest, transitionState] = useTransitionRequestMutation();
  const [removeAssignment, removalState] = useRemoveAssignmentMutation();
  const remaining = Math.max(0, request.episodes_requested - request.assignments.length);
  const isAssigning = assignmentState.isLoading || bulkAssignmentState.isLoading || removalState.isLoading;

  async function moveToInProgress() {
    setFeedback(null);
    setFeedbackIsError(false);
    try {
      await transitionRequest({ id: request.id, status: "in_progress" }).unwrap();
    } catch {
      setFeedback("The request could not be started. Refresh the request and try again.");
      setFeedbackIsError(true);
    }
  }

  async function assignSelectedEpisode() {
    const episodeId = Number(selectedEpisode);
    if (!Number.isInteger(episodeId) || episodeId < 1) return;
    setFeedback(null);
    setFeedbackIsError(false);
    try {
      await assignEpisode({ id: request.id, episode: episodeId }).unwrap();
      setSelectedEpisode("");
      setFeedback("Episode assigned to this request.");
    } catch {
      setFeedback("That episode could not be assigned. It may have been assigned to another request.");
      setFeedbackIsError(true);
    }
  }

  async function assignAvailable() {
    setFeedback(null);
    setFeedbackIsError(false);
    try {
      const assignments = await assignAvailableEpisodes(request.id).unwrap();
      const left = Math.max(0, remaining - assignments.length);
      setFeedback(`${assignments.length} matching ${assignments.length === 1 ? "episode" : "episodes"} assigned${left ? `; ${left} still needed` : ". The request has enough episodes for delivery."}`);
    } catch {
      setFeedback("No available matching episodes could be assigned. Check the episode library or refresh and try again.");
      setFeedbackIsError(true);
    }
  }

  async function markDelivered() {
    setFeedback(null);
    setFeedbackIsError(false);
    try {
      await transitionRequest({ id: request.id, status: "delivered" }).unwrap();
    } catch {
      setFeedback("The request could not be marked delivered. Check its assignments and try again.");
      setFeedbackIsError(true);
    }
  }

  async function removeEpisode(assignmentId: number) {
    if (!window.confirm("Remove this episode from the request? You can assign a replacement afterward.")) return;
    setFeedback(null);
    setFeedbackIsError(false);
    try {
      await removeAssignment({ id: request.id, assignmentId }).unwrap();
      setFeedback("Episode removed. Assign a suitable replacement before delivery.");
    } catch {
      setFeedback("The episode could not be removed. Refresh the request and try again.");
      setFeedbackIsError(true);
    }
  }

  if (request.status === "accepted") return <p className="text-xs font-medium text-emerald-700">Request complete</p>;
  if (request.status === "delivered") return <p className="text-xs text-slate-500">Waiting for the client to accept or request changes.</p>;

  return (
    <div className="min-w-52 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      {request.status === "submitted" || request.status === "rejected" ? (
        <div>
          <p className="mb-2 text-xs text-slate-500">{request.status === "rejected" ? "Restart work after client feedback." : "Move this request into the active queue."}</p>
          <button type="button" onClick={() => void moveToInProgress()} disabled={transitionState.isLoading} className="min-h-9 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-50">{transitionState.isLoading ? "Updating…" : request.status === "rejected" ? "Start rework" : "Start request"}</button>
        </div>
      ) : (
        <>
          {request.assignments.length > 0 && <ul className="space-y-2" aria-label="Assigned episodes">{request.assignments.map((assignment) => <li key={assignment.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"><span className="min-w-0 truncate font-medium text-slate-700">{assignment.episode_code} · {assignment.episode_quality}</span><button type="button" onClick={() => void removeEpisode(assignment.id)} disabled={isAssigning} className="shrink-0 rounded-md px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50" aria-label={`Remove episode ${assignment.episode_code}`}>Remove</button></li>)}</ul>}
          {remaining > 0 ? <>
            <p className="text-xs font-semibold text-slate-800">Assign {remaining} more {remaining === 1 ? "episode" : "episodes"} before delivery.</p>
            <p className="text-xs leading-5 text-slate-600">Assign up to {remaining} matching episodes in one step. Good quality episodes are selected first, then usable episodes.</p>
            <button type="button" onClick={() => void assignAvailable()} disabled={isAssigning} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-800 px-3 text-xs font-semibold text-white transition hover:bg-teal-900 disabled:cursor-wait disabled:opacity-50">{bulkAssignmentState.isLoading ? <><span aria-hidden="true" className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />Assigning matching episodes…</> : <>Assign available matches <span aria-hidden="true">→</span></>}</button>
            <details className="group rounded-lg border border-slate-200 bg-white" onToggle={(event) => setManualSelectionOpen(event.currentTarget.open)}>
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-700 marker:hidden hover:text-teal-900"><span className="group-open:hidden">Choose an episode manually</span><span className="hidden group-open:inline">Close manual selection</span><span aria-hidden="true" className="float-right transition-transform group-open:rotate-180">⌄</span></summary>
              <div className="space-y-2 border-t border-slate-100 p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`episode-for-${request.id}`}>Choose an available episode</label>
              <select id={`episode-for-${request.id}`} value={selectedEpisode} onChange={(event) => setSelectedEpisode(event.target.value)} disabled={episodesQuery.isLoading || !eligibleEpisodes.length} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 disabled:opacity-60">
                <option value="">{episodesQuery.isLoading ? "Finding matching episodes…" : eligibleEpisodes.length ? "Select matching episode" : "No available good or usable episodes"}</option>
                {eligibleEpisodes.map((episode) => <option key={episode.id} value={episode.id}>{episode.episode_id} · {episode.robot_id} · {episode.quality}</option>)}
              </select>
              <button type="button" onClick={() => void assignSelectedEpisode()} disabled={!selectedEpisode || isAssigning} className="min-h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-45">{assignmentState.isLoading ? "Assigning…" : "Assign"}</button>
            </div>
              {episodesQuery.isError && <p role="alert" className="text-xs text-rose-700">Could not load available episodes.</p>}
              </div>
            </details>
          </> : <p className="text-xs font-medium text-emerald-700">All requested episodes are assigned.</p>}
          {remaining === 0 && <button type="button" onClick={() => void markDelivered()} disabled={transitionState.isLoading} className="min-h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50">{transitionState.isLoading ? "Updating…" : "Mark delivered"}</button>}
        </>
      )}
      {feedback && <p role="status" className={`text-xs ${feedbackIsError ? "text-rose-700" : "text-emerald-700"}`}>{feedback}</p>}
    </div>
  );
}
