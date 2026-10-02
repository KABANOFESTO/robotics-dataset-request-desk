import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { SessionUser } from "@/lib/types";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: SessionUser | null;
  initialized: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  currentUser: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    restoreSession: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string } | null>,
    ) => {
      state.accessToken = action.payload?.accessToken ?? null;
      state.refreshToken = action.payload?.refreshToken ?? null;
      state.initialized = true;
      if (!action.payload) state.currentUser = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ access: string; refresh?: string }>,
    ) => {
      state.accessToken = action.payload.access;
      if (action.payload.refresh) state.refreshToken = action.payload.refresh;
      state.initialized = true;
    },
    setCurrentUser: (state, action: PayloadAction<SessionUser>) => {
      state.currentUser = action.payload;
    },
    clearSession: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.currentUser = null;
      state.initialized = true;
    },
  },
});

export const { restoreSession, setCredentials, setCurrentUser, clearSession } =
  authSlice.actions;
export default authSlice.reducer;
