import { apiSlice } from "@/lib/redux/slices/ApiSlice";
import type { Episode, EpisodeQuality } from "@/lib/types";

export type EpisodeList = Episode[];

export interface EpisodeFilters {
  task_name?: string;
  quality?: EpisodeQuality;
  available?: boolean;
}

export interface EpisodeImportResult {
  imported: number;
  skipped: number;
  invalid: number;
  issues: Array<{ line: number; category: "skipped" | "invalid"; message: string }>;
  issues_truncated: boolean;
}

export interface EpisodeTaskOptions {
  tasks: string[];
}

const episodesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEpisodes: builder.query<Episode[], EpisodeFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.task_name?.trim()) params.set("task_name", filters.task_name.trim());
        if (filters?.quality) params.set("quality", filters.quality);
        if (filters?.available !== undefined) {
          params.set("available", String(filters.available));
        }
        const queryString = params.toString();
        return `episodes/${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (episodes) => [
        { type: "Episode", id: "LIST" },
        ...(episodes ?? []).map(({ id }) => ({ type: "Episode" as const, id })),
      ],
    }),
    getEpisode: builder.query<Episode, number>({
      query: (id) => `episodes/${id}/`,
      providesTags: (_episode, _error, id) => [{ type: "Episode", id }],
    }),
    getEpisodeTasks: builder.query<EpisodeTaskOptions, void>({
      query: () => "episodes/tasks/",
      providesTags: [{ type: "Episode", id: "TASKS" }],
    }),
    importEpisodes: builder.mutation<EpisodeImportResult, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "episodes/import/", method: "POST", body };
      },
      invalidatesTags: [{ type: "Episode", id: "LIST" }, "Analytics"],
    }),
  }),
});

export const { useGetEpisodesQuery, useGetEpisodeQuery, useGetEpisodeTasksQuery, useImportEpisodesMutation } = episodesApi;
