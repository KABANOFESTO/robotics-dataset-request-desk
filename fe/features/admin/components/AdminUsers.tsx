"use client";

import { useMemo, useState, type FormEvent } from "react";

import { useCreateUserMutation, useUpdateUserMutation } from "@/features/admin/actions";
import { useGetUsersQuery } from "@/features/admin/queries";
import { useAppSelector } from "@/lib/store";
import type { UserRole } from "@/lib/types";

import { PageHeading } from "@/components/workspace/WorkspaceUi";

const ROLE_LABELS: Record<UserRole, string> = {
  client: "Client",
  operator: "Operator",
  admin: "Administrator",
};

function errorText(error: unknown) {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return "The change could not be saved. Please try again.";
  }
  const data = error.data;
  if (typeof data === "object" && data !== null) {
    if ("detail" in data && typeof data.detail === "string") return data.detail;
    return Object.entries(data).map(([field, messages]) => {
      const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
      return `${field.replaceAll("_", " ")}: ${message}`;
    }).join(" ");
  }
  return "The change could not be saved. Please try again.";
}

function displayName(firstName: string, lastName: string, email: string) {
  return `${firstName} ${lastName}`.trim() || email;
}

export default function AdminUsers() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: users = [], isLoading, isError, refetch } = useGetUsersQuery();
  const [createUser, createState] = useCreateUserMutation();
  const [updateUser, updateState] = useUpdateUserMutation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || `${user.email} ${user.first_name} ${user.last_name}`.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.is_active : !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setFeedback(null);

    try {
      await createUser({
        email: String(values.get("email")).trim(),
        first_name: String(values.get("first_name")).trim(),
        last_name: String(values.get("last_name")).trim(),
        password: String(values.get("password")),
        role: String(values.get("role")) as UserRole,
        is_active: true,
      }).unwrap();
      form.reset();
      setShowCreateForm(false);
      setFeedback({ kind: "success", message: "The account was created." });
    } catch (error) {
      setFeedback({ kind: "error", message: errorText(error) });
    }
  }

  async function handleRoleChange(userId: number, role: UserRole) {
    setFeedback(null);
    try {
      await updateUser({ id: userId, data: { role } }).unwrap();
      setFeedback({ kind: "success", message: "The user's role was updated." });
    } catch (error) {
      setFeedback({ kind: "error", message: errorText(error) });
    }
  }

  async function handleActiveChange(userId: number, isActive: boolean) {
    setFeedback(null);
    try {
      await updateUser({ id: userId, data: { is_active: !isActive } }).unwrap();
      setFeedback({ kind: "success", message: `The account was ${isActive ? "deactivated" : "activated"}.` });
    } catch (error) {
      setFeedback({ kind: "error", message: errorText(error) });
    }
  }

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="Access control" title="User management" description="Create accounts, update access roles, and deactivate access when it is no longer needed." action={<button type="button" onClick={() => { setShowCreateForm((shown) => !shown); setFeedback(null); }} className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
          <span aria-hidden="true">{showCreateForm ? "−" : "+"}</span>{showCreateForm ? "Close form" : "Create user"}
        </button>} />

      {feedback && (
        <div role={feedback.kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${feedback.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {feedback.message}
        </div>
      )}

      {showCreateForm && (
        <section aria-labelledby="create-user-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 id="create-user-title" className="text-base font-semibold text-slate-950">Create an account</h2>
            <p className="mt-1 text-sm text-slate-500">Share the temporary password with the user through your approved channel.</p>
          </div>
          <form onSubmit={handleCreateUser} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="user-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input id="user-email" name="email" type="email" autoComplete="off" required maxLength={254} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </div>
            <div>
              <label htmlFor="user-first-name" className="mb-1.5 block text-sm font-medium text-slate-700">First name</label>
              <input id="user-first-name" name="first_name" type="text" autoComplete="given-name" maxLength={150} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </div>
            <div>
              <label htmlFor="user-last-name" className="mb-1.5 block text-sm font-medium text-slate-700">Last name</label>
              <input id="user-last-name" name="last_name" type="text" autoComplete="family-name" maxLength={150} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </div>
            <div>
              <label htmlFor="user-password" className="mb-1.5 block text-sm font-medium text-slate-700">Temporary password</label>
              <input id="user-password" name="password" type="password" autoComplete="new-password" required minLength={8} className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </div>
            <div>
              <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
              <select id="user-role" name="role" defaultValue="client" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                <option value="client">Client</option>
                <option value="operator">Operator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={createState.isLoading} className="min-h-11 w-full rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                {createState.isLoading ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section aria-labelledby="user-list-title" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="user-list-title" className="text-base font-semibold text-slate-950">Workspace accounts</h2>
              <p className="mt-1 text-sm text-slate-500">{users.length} total account{users.length === 1 ? "" : "s"}</p>
            </div>
            <button type="button" onClick={() => void refetch()} className="mt-2 w-fit text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-950 sm:mt-0">Refresh list</button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_12rem_12rem]">
            <div>
              <label htmlFor="user-search" className="sr-only">Search users</label>
              <input id="user-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
            </div>
            <div>
              <label htmlFor="role-filter" className="sr-only">Filter by role</label>
              <select id="role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                <option value="all">All roles</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="sr-only">Filter by account status</label>
              <select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
                <option value="all">All account states</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {isError ? (
          <div role="alert" className="m-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between sm:m-6">
            <span>Could not load accounts. You may not have administrator access or the service may be unavailable.</span>
            <button type="button" onClick={() => void refetch()} className="w-fit font-semibold underline underline-offset-2">Retry</button>
          </div>
        ) : isLoading ? (
          <p className="p-6 text-sm text-slate-500" aria-live="polite">Loading accounts…</p>
        ) : filteredUsers.length ? (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <article key={user.id} className="grid gap-4 px-5 py-4 sm:px-6 md:grid-cols-[minmax(14rem,1.5fr)_minmax(10rem,0.8fr)_minmax(10rem,0.7fr)_auto] md:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">{user.email.slice(0, 2).toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName(user.first_name, user.last_name, user.email)}{isSelf && <span className="ml-2 text-xs font-normal text-slate-500">You</span>}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`role-${user.id}`} className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 md:sr-only">Role</label>
                    <select id={`role-${user.id}`} value={user.role} disabled={isSelf || updateState.isLoading} onChange={(event) => void handleRoleChange(user.id, event.target.value as UserRole)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500">
                      {Object.entries(ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 md:sr-only">Account status</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <span className={`size-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />{user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button type="button" disabled={isSelf || updateState.isLoading} onClick={() => void handleActiveChange(user.id, user.is_active)} className="min-h-10 w-fit rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                    {user.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="p-6 text-sm text-slate-500">No accounts match those filters.</p>
        )}
      </section>
    </div>
  );
}
