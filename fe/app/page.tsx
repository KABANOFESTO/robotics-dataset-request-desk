import Link from "next/link";

import { LandingNavbar } from "@/features/public/LandingNavbar";
import { WorkflowSection } from "@/features/public/WorkflowSection";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
      <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden bg-white text-slate-900">
      <LandingNavbar />

      <section aria-label="Welcome to Dataset Request Desk" className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-black px-5 pb-10 pt-[104px] text-white">
        <h1 className="sr-only">Dataset Request Desk</h1>
        <div aria-hidden="true" className="hero-glow hero-glow-blue absolute left-[12%] top-[24%] size-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div aria-hidden="true" className="hero-glow hero-glow-amber absolute bottom-[15%] right-[12%] size-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div aria-hidden="true" className="hero-signal hero-signal-one absolute left-[22%] top-[31%] size-2 rounded-full bg-sky-200 shadow-[0_0_28px_8px_rgba(125,211,252,0.24)]" />
        <div aria-hidden="true" className="hero-signal hero-signal-two absolute right-[24%] top-[39%] size-1.5 rounded-full bg-violet-200 shadow-[0_0_25px_8px_rgba(196,181,253,0.2)]" />
        <div aria-hidden="true" className="hero-signal hero-signal-three absolute bottom-[27%] left-[35%] size-1.5 rounded-full bg-cyan-100 shadow-[0_0_24px_8px_rgba(165,243,252,0.2)]" />
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3 text-center">
          <Link href="/login" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Open the request desk <ArrowIcon />
          </Link>
          <a href="#workflow" className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-white/35 bg-white/5 px-6 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            See how it works
          </a>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
            Track robotics dataset requests, episode assignments, and delivery reviews in one shared workspace.
          </p>
        </div>
      </section>

      <WorkflowSection />

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><span className="text-slate-900">Dataset Request Desk</span></div>
        <p>Internal workspace for robotics dataset operations.</p>
        <Link href="/login" className="font-semibold text-slate-700 hover:text-slate-950">Sign in <span aria-hidden="true">→</span></Link>
      </footer>
    </main>
  );
}
