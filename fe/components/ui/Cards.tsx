import { ReactNode } from "react";

export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
    return (
        <section className={`rounded-2xl border border-line bg-panel p-6 ${className}`}>
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted">{title}</h2>
            {children}
        </section>
    );
}

export function StatCard(props: { icon: ReactNode; iconBg: string; label: string; value: string; valueColor: string; sub: string }) {
    return (
        <div className="rounded-2xl border border-line bg-panel p-6">
            <div className={`mb-6 grid h-10 w-10 place-items-center rounded-lg border border-line ${props.iconBg}`}>{props.icon}</div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">{props.label}</p>
            <p className={`mt-1 text-5xl font-bold ${props.valueColor}`}>{props.value}</p>
            <p className="mt-2 text-sm text-soft">{props.sub}</p>
        </div>
    );
}