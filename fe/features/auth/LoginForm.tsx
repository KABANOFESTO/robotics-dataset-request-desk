"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLoginMutation } from "@/features/auth/actions";
import { useLazyGetCurrentUserQuery } from "@/features/auth/queries";
import { apiSlice } from "@/lib/redux/slices/ApiSlice";
import { setCredentials } from "@/lib/redux/slices/AuthSlice";
import { useAppDispatch } from "@/lib/store";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      dispatch(apiSlice.util.resetApiState());
      const tokens = await login({ email: email.trim(), password }).unwrap();
      dispatch(setCredentials(tokens));

      try {
        const user = await getCurrentUser().unwrap();
        router.replace(user.role === "admin" ? "/admin" : user.role === "operator" ? "/operator" : "/client");
      } catch {
        setErrorMessage("You signed in, but we couldn't load your account. Please try again.");
      }
    } catch {
      setErrorMessage("We couldn't sign you in. Check your email and password, then try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-sm font-semibold text-slate-800">Password</label>
          <span className="text-xs text-slate-500">Use your assigned account</span>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="password"
            className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-r-lg text-slate-500 transition hover:text-slate-950 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-700"
          >
            {showPassword ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.5 4.5 9.5 6.4a1.2 1.2 0 0 1 0 1.2 15 15 0 0 1-3.1 3.9" /><path d="M6.2 6.2a15.5 15.5 0 0 0-3.7 5.2 1.2 1.2 0 0 0 0 1.2C3.5 14.5 6.8 19 12 19c1 0 1.9-.2 2.8-.5" /></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M2.5 12s3.3-7 9.5-7 9.5 7 9.5 7-3.3 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? "Signing in…" : "Sign in"}
        {!isLoading && <span aria-hidden="true">→</span>}
      </button>
      <div className="text-center">
        <Link href="/" className="text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">Back to home</Link>
      </div>
    </form>
  );
}
