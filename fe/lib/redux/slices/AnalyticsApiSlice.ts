import { apiSlice } from "@/lib/redux/slices/ApiSlice";
import type { RequestStatus } from "@/lib/types";

export interface AnalyticsQuery {
  start_date: string;
  end_date: string;
}

export interface AnalyticsResponse {
  date_range: AnalyticsQuery;
  episodes_per_day_per_robot: Array<{ date: string; robot_id: string; count: number }>;
  request_fulfillment: {
    by_status: Array<{ status: RequestStatus; count: number }>;
    median_submitted_to_delivered_seconds: number | null;
  };
  top_good_tasks: Array<{ task_name: string; count: number }>;
}

const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, AnalyticsQuery>({
      query: ({ start_date, end_date }) => ({
        url: "analytics/",
        params: { start_date, end_date },
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAnalyticsQuery } = analyticsApi;
