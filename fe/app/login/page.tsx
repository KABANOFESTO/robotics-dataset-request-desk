import Image from "next/image";
import Link from "next/link";

import { ReviewerNotice } from "@/features/auth/components/ReviewerNotice";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <ReviewerNotice />
      <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-4 pb-10 pt-28 sm:px-6">
        <Image
          src="/robot-login-bg.avif"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/55 backdrop-blur-[2px]" />

        <section aria-labelledby="login-title" className="login-card w-full max-w-md rounded-2xl border border-white/50 bg-white/95 p-6 shadow-[0_30px_100px_-35px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-9">
          <Link href="/" className="login-brand-name mb-8 inline-flex items-center gap-3 rounded-lg text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
                <path d="M5 6.5h9.5a4.5 4.5 0 0 1 0 9H9.5" strokeLinecap="round" />
                <path d="m9 11-4 4.5L9 20" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="17.5" cy="6.5" r="1.5" className="fill-amber-400 stroke-amber-400" />
              </svg>
            </span>
            Dataset Request Desk
          </Link>

          <div className="mb-7">
            <h1 id="login-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Use the account provided by your workspace administrator.</p>
          </div>
          <LoginForm />
        </section>
      </main>
    </>
  );
}
