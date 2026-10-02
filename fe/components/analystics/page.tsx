// Shape returned by GET /analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
export type Analytics = {
    episodes_per_day: { day: string; robot_id: string; count: number }[];
    requests_by_status: Record<"submitted" | "in_progress" | "delivered" | "accepted" | "rejected", number>;
    median_submit_to_deliver_seconds: number | null;
    top_tasks: { task_name: string; good_count: number }[];
    totals: { episodes: number; good_episodes: number; requests: number; robots: number; tasks: number };
};

export const ROBOT_COLORS = ["#62d1ee", "#8b5cf6", "#e8a03e", "#55b88a", "#dd524f", "#f7d046"];

export const STATUS_STYLE: Record<string, { label: string; dot: string; chip: string; fill: string }> = {
    submitted: { label: "Submitted", dot: "bg-blue-400", chip: "text-blue-300 bg-blue-500/10 border-blue-500/30", fill: "#4272d8" },
    in_progress: { label: "In Progress", dot: "bg-yellow-400", chip: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30", fill: "#c98f38" },
    delivered: { label: "Delivered", dot: "bg-violet-400", chip: "text-violet-300 bg-violet-500/10 border-violet-500/30", fill: "#7050cf" },
    accepted: { label: "Accepted", dot: "bg-emerald-400", chip: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30", fill: "#4a9f78" },
    rejected: { label: "Rejected", dot: "bg-red-400", chip: "text-red-300 bg-red-500/10 border-red-500/30", fill: "#d25252" },
};

export function formatDuration(s: number | null) {
    if (s == null) return "–";
    const d = s / 86400;
    return d >= 1 ? `${d.toFixed(1)}d` : `${(s / 3600).toFixed(1)}h`;
}

// Pivot rows [{day, robot_id, count}] -> [{day, "arm-alpha-01": 2, ...}] for a stacked bar
export function pivotByDay(rows: Analytics["episodes_per_day"]) {
    const days = new Map<string, Record<string, number | string>>();
    const robots = new Set<string>();
    for (const r of rows) {
        robots.add(r.robot_id);
        const row = days.get(r.day) ?? { day: r.day };
        row[r.robot_id] = r.count;
        days.set(r.day, row);
    }
    return { data: [...days.values()], robots: [...robots].sort() };
}