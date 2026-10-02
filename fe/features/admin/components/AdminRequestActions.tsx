"use client";

import { useMemo, useState } from "react";

import { useGetEpisodesQuery } from "@/features/episodes/queries";
import { useAssignEpisodeMutation, useTransitionRequestMutation } from "@/features/requests/actions";
import type { DatasetRequest } from "@/lib/types";

export function AdminRequestActions({ request, enabled }: { request: DatasetRequest; enabled: boolean }) {
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const needsEpisodes = request.status === "in_progress" && request.assignments.length < request.episodes_requested;
  const episodeFilters = useMemo(() => ({ available: true, task_name: request.task_name }), [request.task_name]);
  const episodesQuery = useGetEpisodesQuery(episodeFilters, { skip: !enabled || !needsEpisodes });
  const eligibleEpisodes = useMemo(() => (episodesQuery.data ?? []).filter((episode) => episode.quality !== "bad"), [episodesQuery.data]);
  const [assignEpisode, assignmentState] = useAssignEpisodeMutation();
  const [transitionRequest, transitionState] = useTransitionRequestMutation();
  const remaining = Math.max(0, request.episodes_requested - request.assignments.length);

  async function moveToInProgress() {
    setFeedback(null);
    try {
      await transitionRequest({ id: request.id, status: "in_progress" }).unwrap();
    } catch {
      setFeedback("The request could not be started. Refresh the request and try again.");
    }
  }

  async function assignSelectedEpisode() {
    const episodeId = Number(selectedEpisode);
    if (!Number.isInteger(episodeId) || episodeId < 1) return;
    setFeedback(null);
    try {
      await assignEpisode({ id: request.id, episode: episodeId }).unwrap();
      setSelectedEpisode("");
      setFeedback("Episode assigned to this request.");
    } catch {
      setFeedback("That episode could not be assigned. It may have been assigned to another request.");
    }
  }

  async function markDelivered() {
    setFeedback(null);
    try {
      await transitionRequest({ id: request.id, status: "delivered" }).unwrap();
    } catch {
      setFeedback("The request could not be marked delivered. Check its assignments and try again.");
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
          {remaining > 0 ? <>
            <p className="text-xs font-semibold text-slate-800">Assign {remaining} more {remaining === 1 ? "episode" : "episodes"} before delivery.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`episode-for-${request.id}`}>Choose an available episode</label>
              <select id={`episode-for-${request.id}`} value={selectedEpisode} onChange={(event) => setSelectedEpisode(event.target.value)} disabled={episodesQuery.isLoading || !eligibleEpisodes.length} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 disabled:opacity-60">
                <option value="">{episodesQuery.isLoading ? "Finding matching episodes…" : eligibleEpisodes.length ? "Select matching episode" : "No available good or usable episodes"}</option>
                {eligibleEpisodes.map((episode) => <option key={episode.id} value={episode.id}>{episode.episode_id} · {episode.robot_id} · {episode.quality}</option>)}
              </select>
              <button type="button" onClick={() => void assignSelectedEpisode()} disabled={!selectedEpisode || assignmentState.isLoading} className="min-h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-45">{assignmentState.isLoading ? "Assigning…" : "Assign"}</button>
            </div>
          </> : <p className="text-xs font-medium text-emerald-700">All requested episodes are assigned.</p>}
          {episodesQuery.isError && <p role="alert" className="text-xs text-rose-700">Could not load available episodes.</p>}
          {remaining === 0 && <button type="button" onClick={() => void markDelivered()} disabled={transitionState.isLoading} className="min-h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50">{transitionState.isLoading ? "Updating…" : "Mark delivered"}</button>}
        </>
      )}
      {feedback && <p role="status" className={`text-xs ${feedback.startsWith("Episode assigned") ? "text-emerald-700" : "text-rose-700"}`}>{feedback}</p>}
    </div>
  );
}
