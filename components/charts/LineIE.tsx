"use client";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtBRL } from "../../lib/format";

export interface LineIEDatum {
  month: string;
  income: number;
  expense: number;
}

interface LineIEProps {
  data: LineIEDatum[];
  height?: number;
  /** Quando true, ocupa 100% da altura do container pai (pai precisa ter altura definida, ex.: .card-fill). */
  fill?: boolean;
}

const tickStyle = { fontSize: 11, fill: "var(--muted)" };

function ChartBody({ data }: { data: LineIEDatum[] }) {
  return (
    <AreaChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
      <defs>
        <linearGradient id="lineie-pos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pos)" stopOpacity={0.18} />
          <stop offset="100%" stopColor="var(--pos)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="lineie-neg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--neg)" stopOpacity={0.18} />
          <stop offset="100%" stopColor="var(--neg)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="var(--border-soft)" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
      <YAxis
        tick={tickStyle}
        axisLine={false}
        tickLine={false}
        width={56}
        tickFormatter={(v) => {
          if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
          return String(v);
        }}
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
        formatter={(v: any, name: any) => [fmtBRL(Number(v)), name === "income" ? "Receitas" : "Despesas"]}
      />
      <Area
        type="monotone"
        dataKey="income"
        stroke="var(--pos)"
        strokeWidth={2}
        fill="url(#lineie-pos)"
        dot={false}
        activeDot={{ r: 4 }}
      />
      <Area
        type="monotone"
        dataKey="expense"
        stroke="var(--neg)"
        strokeWidth={2}
        fill="url(#lineie-neg)"
        dot={false}
        activeDot={{ r: 4 }}
      />
    </AreaChart>
  );
}

export default function LineIE({ data, height = 220, fill = false }: LineIEProps) {
  if (fill) {
    return (
      <div className="card-fill" style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartBody data={data} />
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartBody data={data} />
    </ResponsiveContainer>
  );
}
