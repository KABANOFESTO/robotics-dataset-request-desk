"use client";

import Link from "next/link";
import { useEffect } from "react";

function BrandMark() {
  return (
    <span className="brand-mark flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M5 6.5h9.5a4.5 4.5 0 0 1 0 9H9.5" strokeLinecap="round" />
        <path d="m9 11-4 4.5L9 20" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17.5" cy="6.5" r="1.5" className="fill-amber-400 stroke-amber-400" />
      </svg>
    </span>
  );
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function LandingNavbar() {
  useEffect(() => {
    let savedTheme: string | null = null;
    try {
      savedTheme = window.localStorage.getItem("dataset-desk-theme");
    } catch {
      // Keep the default light theme if storage is unavailable.
    }
    applyTheme(savedTheme === "dark" ? "dark" : "light");

    function syncTheme(event: StorageEvent) {
      if (event.key === "dataset-desk-theme") {
        applyTheme(event.newValue === "dark" ? "dark" : "light");
      }
    }

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem("dataset-desk-theme", nextTheme);
    } catch {
      // The theme still changes for this page view if storage is unavailable.
    }
  }

  return (
    <header className="landing-navbar fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="Dataset Request Desk home" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900">
          <BrandMark />
          <span className="navbar-brand-name text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Dataset Request Desk</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-6">
          <a href="#workflow" className="navbar-link hidden px-2 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline">How it works</a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light and dark theme"
            title="Toggle light and dark theme"
            className="theme-toggle inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="theme-sun size-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="theme-moon hidden size-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
            </svg>
          </button>
          <Link href="/login" className="landing-sign-in inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
            Sign in <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
