"use client";

import { useMemo, useState } from "react";

import { useGetEpisodesQuery } from "@/features/episodes/queries";
import { useImportEpisodesMutation } from "@/features/episodes/actions";
import type { EpisodeQuality } from "@/lib/types";

import { WORKSPACE_CARD, DataPagination, ErrorState, formatCount, formatDateTime, formatDuration, LoadingState, MetricCard, PageHeading } from "@/components/workspace/WorkspaceUi";

const PAGE_SIZE = 20;
const QUALITY_LABEL: Record<EpisodeQuality, string> = { good: "Good", usable: "Usable", bad: "Bad" };
const QUALITY_STYLE: Record<EpisodeQuality, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  usable: "bg-amber-50 text-amber-800 ring-amber-600/15",
  bad: "bg-rose-50 text-rose-800 ring-rose-600/15",
};

function QualityBadge({ quality }: { quality: EpisodeQuality }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${QUALITY_STYLE[quality]}`}>{QUALITY_LABEL[quality]}</span>;
}

export default function EpisodeLibrary({ allowImport = false }: { allowImport?: boolean }) {
  const [importEpisodes, importState] = useImportEpisodesMutation();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [taskName, setTaskName] = useState("");
  const [search, setSearch] = useState("");
  const [quality, setQuality] = useState<"all" | EpisodeQuality>("all");
  const [availability, setAvailability] = useState<"all" | "available" | "assigned">("all");
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  const filterKey = `${taskName.trim().toLowerCase()}|${search.trim().toLowerCase()}|${quality}|${availability}`;
  const page = pageState.key === filterKey ? pageState.page : 1;
  const filters = useMemo(() => ({ task_name: taskName.trim() || undefined, available: availability === "available" ? true : undefined }), [availability, taskName]);
  const { data: episodes = [], isLoading, isFetching, isError, refetch } = useGetEpisodesQuery(filters);

  const visibleEpisodes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return episodes.filter((episode) => {
      const matchesQuality = quality === "all" || episode.quality === quality;
      const matchesAvailability = availability === "all" || (availability === "available" ? !episode.assigned : episode.assigned);
      const matchesSearch = !term || [episode.episode_id, episode.task_name, episode.robot_id, episode.operator_name].some((value) => value.toLowerCase().includes(term));
      return matchesQuality && matchesAvailability && matchesSearch;
    });
  }, [availability, episodes, quality, search]);

  const pageCount = Math.max(1, Math.ceil(visibleEpisodes.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageEpisodes = visibleEpisodes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const qualityCounts = useMemo(() => episodes.filter((episode) => availability === "all" || (availability === "available" ? !episode.assigned : episode.assigned)).reduce((counts, episode) => {
    counts[episode.quality] += 1;
    return counts;
  }, { good: 0, usable: 0, bad: 0 }), [availability, episodes]);

  async function submitImport(event: import("react").FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImportMessage(null);
    if (!importFile) return;
    if (importFile.size > 10 * 1024 * 1024) {
      setImportMessage("Choose a CSV file smaller than 10 MB.");
      return;
    }
    try {
      const result = await importEpisodes(importFile).unwrap();
      setImportMessage(`Imported ${result.imported}; skipped ${result.skipped} duplicates; rejected ${result.invalid} invalid rows.${result.issues.length ? ` First issue: row ${result.issues[0].line}, ${result.issues[0].message}` : ""}${result.issues_truncated ? " Additional row issues were omitted." : ""}`);
      setImportFile(null);
      const input = document.getElementById("episode-csv-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      const detail = error && typeof error === "object" && "data" in error ? (error as { data?: { detail?: string } }).data?.detail : undefined;
      setImportMessage(detail || "CSV import failed. Check the file format and try again.");
    }
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeading eyebrow="Collection" title="Episode library" description="Search and review imported recordings, quality ratings, and assignment availability." action={<span className="inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><span className={`size-2 rounded-full ${isFetching ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />{isFetching ? "Refreshing" : "Live data"}</span>} />

      {allowImport && <form onSubmit={(event) => void submitImport(event)} className={`${WORKSPACE_CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5`}>
        <div className="min-w-0"><label htmlFor="episode-csv-file" className="block text-sm font-semibold text-slate-900">Import episode CSV</label><p className="mt-1 text-xs leading-5 text-slate-500">Duplicates are skipped; invalid rows are reported. Maximum file size: 10 MB.</p><input id="episode-csv-file" type="file" accept=".csv,text/csv" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} className="mt-3 block w-full max-w-xl text-sm text-slate-600 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:font-semibold file:text-slate-700" /></div>
        <button type="submit" disabled={!importFile || importState.isLoading} className="min-h-11 shrink-0 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{importState.isLoading ? "Importing…" : "Import CSV"}</button>
        {importMessage && <p role="status" className="basis-full text-sm text-slate-700">{importMessage}</p>}
      </form>}

      <section aria-label="Episode quality totals" className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Good quality" value={isLoading || isError ? "—" : formatCount(qualityCounts.good)} hint="Ready for request assignment" icon={<span aria-hidden="true">✓</span>} accent="teal" />
        <MetricCard label="Usable" value={isLoading || isError ? "—" : formatCount(qualityCounts.usable)} hint="Available with acceptable quality" icon={<span aria-hidden="true">◌</span>} accent="amber" />
        <MetricCard label="Needs review" value={isLoading || isError ? "—" : formatCount(qualityCounts.bad)} hint="Bad-quality records excluded from assignment" icon={<span aria-hidden="true">!</span>} accent="violet" />
      </section>

      <section className={`${WORKSPACE_CARD} overflow-hidden`}>
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-base font-semibold text-slate-950">All episodes</h2><p className="mt-1 text-sm text-slate-500">{isLoading ? "Loading collection…" : `${formatCount(visibleEpisodes.length)} matching records`}</p></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(100%,52rem)] lg:grid-cols-[minmax(12rem,1fr)_minmax(10rem,.8fr)_10rem_11rem]">
              <div><label htmlFor="episode-task" className="sr-only">Filter by task name</label><input id="episode-task" type="search" value={taskName} onChange={(event) => setTaskName(event.target.value)} placeholder="Filter task name" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10" /></div>
              <div><label htmlFor="episode-search" className="sr-only">Search episodes</label><input id="episode-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, robot or operator" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10" /></div>
              <div><label htmlFor="episode-quality" className="sr-only">Filter by quality</label><select id="episode-quality" value={quality} onChange={(event) => setQuality(event.target.value as "all" | EpisodeQuality)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10"><option value="all">All quality</option><option value="good">Good</option><option value="usable">Usable</option><option value="bad">Bad</option></select></div>
              <div><label htmlFor="episode-availability" className="sr-only">Filter by assignment</label><select id="episode-availability" value={availability} onChange={(event) => setAvailability(event.target.value as "all" | "available" | "assigned")} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10"><option value="all">All episodes</option><option value="available">Available</option><option value="assigned">Assigned</option></select></div>
            </div>
          </div>
        </div>

        {isError ? <div className="p-4 sm:p-5"><ErrorState message="Episodes could not be loaded. Check your connection or access, then retry." onRetry={() => void refetch()} /></div> : isLoading ? <div className="p-4 sm:p-5"><LoadingState label="Loading episode library…" /></div> : visibleEpisodes.length === 0 ? <div className="px-5 py-14 text-center"><span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-xl text-slate-500">⌕</span><h3 className="mt-4 text-sm font-semibold text-slate-900">No matching episodes</h3><p className="mt-1 text-sm text-slate-500">Try changing the search term or filters.</p></div> : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-5 py-3">Episode</th><th scope="col" className="px-5 py-3">Task and robot</th><th scope="col" className="px-5 py-3">Recorded</th><th scope="col" className="px-5 py-3">Quality</th><th scope="col" className="px-5 py-3">Assignment</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{pageEpisodes.map((episode) => <tr key={episode.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{episode.episode_id}</p><p className="mt-1 text-xs text-slate-500">{episode.operator_name || "Operator not specified"}</p></td><td className="px-5 py-4"><p className="max-w-64 truncate font-medium text-slate-800">{episode.task_name}</p><p className="mt-1 text-xs text-slate-500">{episode.robot_id}</p></td><td className="whitespace-nowrap px-5 py-4 text-slate-600"><p>{formatDateTime(episode.recorded_at)}</p><p className="mt-1 text-xs text-slate-400">{formatDuration(episode.duration_seconds)}</p></td><td className="px-5 py-4"><QualityBadge quality={episode.quality} /></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-2 text-xs font-medium ${episode.assigned ? "text-slate-500" : "text-emerald-700"}`}><span className={`size-1.5 rounded-full ${episode.assigned ? "bg-slate-400" : "bg-emerald-500"}`} />{episode.assigned ? "Assigned" : "Available"}</span></td></tr>)}</tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">{pageEpisodes.map((episode) => <li key={episode.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{episode.episode_id}</p><p className="mt-1 truncate text-sm text-slate-600">{episode.task_name}</p></div><QualityBadge quality={episode.quality} /></div><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-slate-400">Robot</dt><dd className="mt-0.5 font-medium text-slate-700">{episode.robot_id}</dd></div><div><dt className="text-slate-400">Assignment</dt><dd className="mt-0.5 font-medium text-slate-700">{episode.assigned ? "Assigned" : "Available"}</dd></div><div><dt className="text-slate-400">Recorded</dt><dd className="mt-0.5 font-medium text-slate-700">{formatDateTime(episode.recorded_at)}</dd></div><div><dt className="text-slate-400">Duration</dt><dd className="mt-0.5 font-medium text-slate-700">{formatDuration(episode.duration_seconds)}</dd></div></dl></li>)}</ul>
            <DataPagination page={currentPage} pageSize={PAGE_SIZE} totalItems={visibleEpisodes.length} onPageChange={(nextPage) => setPageState({ key: filterKey, page: nextPage })} />
          </>
        )}
      </section>
    </div>
  );
}
