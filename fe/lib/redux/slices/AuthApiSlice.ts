import { apiSlice } from "@/lib/redux/slices/ApiSlice";
import {
  clearSession,
  setCredentials,
  setCurrentUser,
} from "@/lib/redux/slices/AuthSlice";
import type { SessionUser } from "@/lib/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

function persistTokens(tokens: TokenPair) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("access", tokens.access);
  window.sessionStorage.setItem("refresh", tokens.refresh);
  document.cookie = `dataset_session=${encodeURIComponent(tokens.access)}; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
}

function discardTokens() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("access");
  window.sessionStorage.removeItem("refresh");
  document.cookie = "dataset_session=; Path=/; Max-Age=0; SameSite=Lax";
}

const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<TokenPair, LoginCredentials>({
      query: (credentials) => ({
        url: "auth/token/",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(apiSlice.util.resetApiState());
          dispatch(setCredentials(data));
          persistTokens(data);
        } catch {
          // The mutation result exposes the API error to the calling login form.
        }
      },
    }),
    getCurrentUser: builder.query<SessionUser, void>({
      query: () => "auth/me/",
      providesTags: ["Auth"],
    async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled;
          const state = getState() as unknown as {
            auth: { accessToken: string | null };
          };
        if (state.auth.accessToken) dispatch(setCurrentUser(data));
        } catch {
          // Query consumers handle the error; token refresh is managed by ApiSlice.
        }
      },
    }),
    verifyAccessToken: builder.mutation<Record<string, never>, string>({
      query: (token) => ({
        url: "auth/token/verify/",
        method: "POST",
        body: { token },
      }),
    }),
    logout: builder.mutation<void, void>({
      async queryFn(_arg, { dispatch }) {
        dispatch(clearSession());
        dispatch(apiSlice.util.resetApiState());
        discardTokens();
        return { data: undefined };
      },
      invalidatesTags: ["Auth", "Request", "Episode"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useVerifyAccessTokenMutation,
  useLogoutMutation,
} = authApi;
