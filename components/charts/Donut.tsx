"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fmtBRL } from "../../lib/format";
import { categoryColor } from "../ui/CatChip";

export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

interface DonutProps {
  data: DonutDatum[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function Donut({ data, height = 240, centerLabel, centerValue }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={66}
            outerRadius={96}
            paddingAngle={2}
            stroke="var(--bg-elev)"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color || categoryColor(d.name)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--bg-elev)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
              color: "var(--fg)",
            }}
            formatter={(v: any, name: any) => [fmtBRL(Number(v)), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ textAlign: "center" }}
        >
          {centerLabel && (
            <span
              style={{
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span
              className="font-display num"
              style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}
            >
              {centerValue}
            </span>
          )}
        </div>
      )}
      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {data.map((d, i) => {
          const pct = total === 0 ? 0 : (d.value / total) * 100;
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-2 text-xs"
              style={{ padding: "4px 0" }}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: d.color || categoryColor(d.name),
                    flexShrink: 0,
                  }}
                />
                <span className="truncate" style={{ color: "var(--fg-soft)" }}>{d.name}</span>
              </span>
              <span className="num font-mono" style={{ fontSize: 11.5 }}>{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
