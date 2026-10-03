"use client";

import { useState } from "react";

export function ReviewerNotice() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      role="note"
      aria-label="Reviewer information"
      className="fixed left-1/2 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-start gap-3 rounded-2xl border border-white/70 border-l-4 border-l-amber-400 bg-white/95 p-4 text-slate-800 shadow-[0_16px_48px_-20px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:gap-4 sm:p-5"
    >
      <p className="min-w-0 flex-1 pt-0.5 text-sm leading-5 text-slate-600">
        <span className="font-semibold text-slate-950">Dear reviewers</span>
        <span aria-hidden="true"> · </span>
        This demo runs on Render and Vercel&apos;s free tiers, so the backend may take a few seconds to wake on your first request. Thanks for your patience and for taking a look.
      </p>

      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Close reviewer message"
        className="-mr-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="size-4"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
