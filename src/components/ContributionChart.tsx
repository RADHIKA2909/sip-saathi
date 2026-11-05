"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/sip/calc";

const MARK = "#0f9b74"; // validated: lightness band, chroma, ≥3:1 vs light surface

/** Single series (cumulative contributions): title names it, so no legend box. Table view provided alongside. */
export function ContributionChart({ data }: { data: { instalment: number; total: number }[] }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-muted">No successful instalments yet, so there is nothing to chart.</p>;
  return (
    <div className="h-64 w-full" role="img" aria-label={`Bar chart of cumulative contributions over ${data.length} successful instalments, reaching ${formatINR(data.at(-1)!.total)}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="#e2e8e5" strokeDasharray="0" />
          <XAxis dataKey="instalment" tickLine={false} axisLine={{ stroke: "#cdd6d1" }} tick={{ fill: "#55625b", fontSize: 12 }}
            interval="preserveStartEnd" label={{ value: "Successful instalment #", position: "insideBottom", offset: -2, fill: "#55625b", fontSize: 11 }} height={36} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#55625b", fontSize: 12 }} width={64}
            tickFormatter={(v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `₹${v}`)} />
          <Tooltip cursor={{ fill: "rgba(15,155,116,0.08)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
                  <p className="text-muted">After instalment {payload[0].payload.instalment}</p>
                  <p className="font-semibold tabular-nums text-foreground">{formatINR(payload[0].payload.total)} contributed</p>
                </div>
              ) : null
            } />
          <Bar dataKey="total" fill={MARK} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
