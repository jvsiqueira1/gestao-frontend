"use client";
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface MLSeries {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface MultiLineSeriesProps {
  data: Record<string, number | string | null>[];
  series: MLSeries[];
  xKey?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}

const tickStyle = { fontSize: 11, fill: "var(--muted)" };

export default function MultiLineSeries({
  data,
  series,
  xKey = "month",
  height = 240,
  valueFormatter,
}: MultiLineSeriesProps) {
  const fmt = valueFormatter || ((v: number) => String(v));
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
          <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={tickStyle} axisLine={false} tickLine={false} minTickGap={22} />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={["auto", "auto"]}
            tickFormatter={(v) => fmt(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
              color: "var(--fg)",
              boxShadow: "0 4px 14px oklch(0% 0 0 / 0.12)",
            }}
            labelStyle={{ color: "var(--fg-soft)", marginBottom: 4 }}
            formatter={(v: any, name: any) => [v == null ? "—" : fmt(Number(v)), name]}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "4 4" : undefined}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 flex-wrap" style={{ fontSize: 12 }}>
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              style={{
                width: 12,
                height: 0,
                borderTop: `2px ${s.dashed ? "dashed" : "solid"} ${s.color}`,
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--fg-soft)" }}>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
