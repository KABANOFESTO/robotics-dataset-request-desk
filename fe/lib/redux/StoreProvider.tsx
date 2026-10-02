"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { useGetCurrentUserQuery } from "@/lib/redux/slices/AuthApiSlice";
import { restoreSession } from "@/lib/redux/slices/AuthSlice";
import { makeStore, type AppStore } from "@/lib/store";
import { useAppDispatch, useAppSelector } from "@/lib/store";

function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.auth.initialized);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    const access = window.sessionStorage.getItem("access");
    const refresh = window.sessionStorage.getItem("refresh");
    dispatch(
      restoreSession(access && refresh ? { accessToken: access, refreshToken: refresh } : null),
    );

    if (!access || !refresh) {
      window.sessionStorage.removeItem("access");
      window.sessionStorage.removeItem("refresh");
      document.cookie = "dataset_session=; Path=/; Max-Age=0; SameSite=Lax";
    }
  }, [dispatch]);

  useGetCurrentUserQuery(undefined, { skip: !initialized || !accessToken });
  return null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(makeStore);

  return (
    <Provider store={store}>
      <SessionBootstrap />
      {children}
    </Provider>
  );
}
