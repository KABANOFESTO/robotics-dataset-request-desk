"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useLogoutMutation } from "@/features/auth/actions";
import { useAppSelector } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "grid", exact: true },
  { href: "/admin/requests", label: "Requests", icon: "inbox", exact: false },
  { href: "/admin/episodes", label: "Episodes", icon: "layers", exact: false },
  { href: "/admin/report", label: "Reports", icon: "chart", exact: false },
  { href: "/admin/users", label: "Users", icon: "users", exact: false },
] as const;

function initials(firstName: string, lastName: string, email: string) {
  const name = `${firstName} ${lastName}`.trim();
  return name
    ? name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : email.slice(0, 2).toUpperCase();
}

function NavIcon({ name }: { name: (typeof NAV_ITEMS)[number]["icon"] }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    inbox: <><path d="M4 4h16l1 11h-5l-2 3h-4l-2-3H3L4 4Z" /><path d="M3.5 15h4l2 3h5l2-3h4" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M17 6h3v3" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1H3ZM16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6v1" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">{paths[name]}</svg>;
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group inline-flex min-h-11 items-center gap-2.5 rounded-xl px-3.5 text-sm font-medium transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
        active
          ? "bg-white text-slate-950 shadow-sm shadow-black/10"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className={active ? "text-teal-700" : "text-slate-400 group-hover:text-teal-300"}><NavIcon name={item.icon} /></span>
      {item.label}
      {active && <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-teal-500" />}
    </Link>
  );
}

export default function AdminNav() {
  const path = usePathname();
  return <AdminNavContent key={path} path={path} />;
}

function AdminNavContent({ path }: { path: string }) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.currentUser);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : "Loading account";

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  async function handleLogout() {
    await logout().unwrap();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-white/10 bg-[#07131c] text-white shadow-lg shadow-slate-950/10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[18%] size-56 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -top-28 right-[15%] size-56 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[76px] items-center justify-between gap-3 sm:gap-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-300 to-cyan-500 text-slate-950 shadow-lg shadow-teal-950/30">
              <span aria-hidden="true" className="absolute inset-0 rounded-2xl border border-white/40" />
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6"><path d="M4 18V6l8 7 8-7v12" /><path d="M8 18v-5m8 5v-5" /></svg>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold tracking-tight text-white sm:text-base">Dataset Desk</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300"><span className="size-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(94,234,212,.8)]" />Control room</span>
            </span>
          </Link>

          <nav aria-label="Admin navigation" className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
              return <NavLink key={item.href} item={item} active={active} />;
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 text-right xl:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-100">{displayName}</p>
              <p className="max-w-40 truncate text-xs text-slate-400">{user?.email ?? "Loading profile"}</p>
            </div>
            <span aria-label={displayName} className="hidden size-10 shrink-0 items-center justify-center rounded-full border border-teal-200/20 bg-gradient-to-br from-teal-200/20 to-sky-200/10 text-xs font-bold text-teal-100 sm:flex">
              {user ? initials(user.first_name, user.last_name, user.email) : "…"}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="hidden min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 disabled:cursor-wait disabled:opacity-60 sm:inline-flex"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4"><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-menu"
              className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 lg:hidden"
            >
              <span className="relative flex size-5 flex-col items-center justify-center gap-[5px]">
                <span className={`h-[1.5px] w-5 rounded bg-current transition duration-300 ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`} />
                <span className={`h-[1.5px] w-5 rounded bg-current transition duration-200 ${menuOpen ? "scale-x-0 opacity-0" : ""}`} />
                <span className={`h-[1.5px] w-5 rounded bg-current transition duration-300 ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>

        <div id="admin-mobile-menu" aria-hidden={!menuOpen} inert={!menuOpen} className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none lg:hidden ${menuOpen ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] pb-0 opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-white/10 bg-[#0b1b27]/95 p-2 shadow-2xl shadow-black/20">
              <nav aria-label="Mobile admin navigation" className="grid gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
                  return <NavLink key={item.href} item={item} active={active} onClick={() => setMenuOpen(false)} />;
                })}
              </nav>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 px-3 pt-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-teal-200/20 bg-teal-200/10 text-xs font-bold text-teal-100">{user ? initials(user.first_name, user.last_name, user.email) : "…"}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{displayName}</p><p className="truncate text-xs text-slate-400">Administrator</p></div>
                </div>
                <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-teal-200 transition hover:bg-white/10 disabled:opacity-50">
                  {isLoggingOut ? "Signing out…" : "Sign out"}<span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent" />
    </header>
  );
}
