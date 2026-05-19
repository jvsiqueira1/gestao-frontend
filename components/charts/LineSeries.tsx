"use client";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtBRL } from "../../lib/format";

export interface LineDatum {
  month: string;
  value: number;
}

interface LineSeriesProps {
  data: LineDatum[];
  height?: number;
  color?: string;
  label?: string;
}

const tickStyle = { fontSize: 11, fill: "var(--muted)" };

export default function LineSeries({
  data,
  height = 220,
  color = "var(--accent)",
  label = "Valor",
}: LineSeriesProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
        <defs>
          <linearGradient id="lineseries-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
        <YAxis
          tick={tickStyle}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
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
            boxShadow: "0 4px 14px oklch(0% 0 0 / 0.08)",
          }}
          labelStyle={{ color: "var(--fg-soft)", marginBottom: 4 }}
          formatter={(v: any) => [fmtBRL(Number(v)), label]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#lineseries-grad)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
