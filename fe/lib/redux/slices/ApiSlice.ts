import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { clearSession, setCredentials } from "@/lib/redux/slices/AuthSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api/",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { auth?: { accessToken: string | null } };
    if (state.auth?.accessToken) {
      headers.set("Authorization", `Bearer ${state.auth.accessToken}`);
    }
    return headers;
  },
});

function withoutTrailingSlash(args: string | FetchArgs): string | FetchArgs {
  const normalize = (url: string) => {
    const suffixIndex = url.search(/[?#]/);
    const pathname = suffixIndex === -1 ? url : url.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? "" : url.slice(suffixIndex);

    if (!pathname || !pathname.endsWith("/")) return url;
    return `${pathname.slice(0, -1)}${suffix}`;
  };

  return typeof args === "string" ? normalize(args) : { ...args, url: normalize(args.url) };
}

const slashSafeBaseQuery: typeof rawBaseQuery = (args, api, extraOptions) =>
  rawBaseQuery(withoutTrailingSlash(args), api, extraOptions);

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await slashSafeBaseQuery(args, api, extraOptions);
  const state = api.getState() as {
    auth?: { accessToken: string | null; refreshToken: string | null };
  };
  const refreshToken = state.auth?.refreshToken;
  const isAuthEndpoint = api.endpoint === "login" || api.endpoint === "refreshAccessToken";

  if (result.error?.status === 401 && refreshToken && !isAuthEndpoint) {
    const refreshResult = await slashSafeBaseQuery(
      { url: "auth/token/refresh/", method: "POST", body: { refresh: refreshToken } },
      api,
      extraOptions,
    );

    const refreshed = refreshResult.data as { access?: string } | undefined;
    if (refreshed?.access) {
      api.dispatch(setCredentials({ access: refreshed.access }));
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("access", refreshed.access);
        document.cookie = `dataset_session=${encodeURIComponent(refreshed.access)}; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      }
      result = await slashSafeBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearSession());
      api.dispatch(apiSlice.util.resetApiState());
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("access");
        window.sessionStorage.removeItem("refresh");
        document.cookie = "dataset_session=; Path=/; Max-Age=0; SameSite=Lax";
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Request", "Episode", "User", "Analytics"],
  endpoints: () => ({}),
});
