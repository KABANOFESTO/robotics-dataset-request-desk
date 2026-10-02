import { apiSlice } from "@/lib/redux/slices/ApiSlice";
import type { DatasetRequest, RequestStatus } from "@/lib/types";

export type RequestList = DatasetRequest[];

export interface CreateRequestPayload {
  task_name: string;
  episodes_requested: number;
  deadline: string;
  notes?: string;
}

export interface ChangeRequestStatusPayload {
  id: number;
  status: RequestStatus;
}

export interface AssignEpisodePayload {
  id: number;
  episode: number;
}

const requestsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRequests: builder.query<DatasetRequest[], void>({
      query: () => "requests/",
      providesTags: (requests) => [
        { type: "Request", id: "LIST" },
        ...(requests ?? []).map(({ id }) => ({ type: "Request" as const, id })),
      ],
    }),
    getRequest: builder.query<DatasetRequest, number>({
      query: (id) => `requests/${id}/`,
      providesTags: (_request, _error, id) => [{ type: "Request", id }],
    }),
    createRequest: builder.mutation<DatasetRequest, CreateRequestPayload>({
      query: (body) => ({ url: "requests/", method: "POST", body }),
      invalidatesTags: [{ type: "Request", id: "LIST" }],
    }),
    transitionRequest: builder.mutation<DatasetRequest, ChangeRequestStatusPayload>({
      query: ({ id, status }) => ({
        url: `requests/${id}/transition/`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_request, _error, { id }) => [
        { type: "Request", id },
        { type: "Request", id: "LIST" },
      ],
    }),
    reviewRequest: builder.mutation<DatasetRequest, ChangeRequestStatusPayload>({
      query: ({ id, status }) => ({
        url: `requests/${id}/review/`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: (_request, _error, { id }) => [
        { type: "Request", id },
        { type: "Request", id: "LIST" },
      ],
    }),
    assignEpisode: builder.mutation<DatasetRequest["assignments"][number], AssignEpisodePayload>({
      query: ({ id, episode }) => ({
        url: `requests/${id}/assign/`,
        method: "POST",
        body: { episode },
      }),
      invalidatesTags: (_assignment, _error, { id }) => [
        { type: "Request", id },
        { type: "Request", id: "LIST" },
        "Episode",
      ],
    }),
  }),
});

export const {
  useGetRequestsQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useTransitionRequestMutation,
  useReviewRequestMutation,
  useAssignEpisodeMutation,
} = requestsApi;
