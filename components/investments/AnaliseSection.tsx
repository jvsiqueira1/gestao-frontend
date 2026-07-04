"use client";
import { useState } from "react";
import { InvestmentAnalytics } from "../../lib/investments";
import { fmtBRL, MONTH_NAMES_SHORT } from "../../lib/format";
import { Card, CardHead, CardTitle, CardSub } from "../ui/Card";
import Segmented from "../ui/Segmented";
import MultiLineSeries, { MLSeries } from "../charts/MultiLineSeries";
import ReturnByPeriodTable from "./ReturnByPeriodTable";
import MonthlyReturnsMatrix from "./MonthlyReturnsMatrix";

type ChartMode = "pct" | "brl";

export default function AnaliseSection({ data }: { data: InvestmentAnalytics | null }) {
  const [chartMode, setChartMode] = useState<ChartMode>("pct");

  if (!data || !data.portfolio.valueSeries.length) {
    return (
      <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>
        Sem histórico suficiente para análise. Importe um relatório de performance ou registre aportes com datas.
      </div>
    );
  }

  // Curva rebaseada a 100 (Carteira vs CDI) a partir da matriz mensal.
  const flat: { label: string; r: number | null; cdi: number | null }[] = [];
  const yearsAsc = [...data.portfolio.monthlyMatrix].sort((a, b) => a.year - b.year);
  for (const row of yearsAsc) {
    for (let m = 0; m < 12; m++) {
      if (row.months[m] != null || row.cdi[m] != null) {
        flat.push({ label: `${MONTH_NAMES_SHORT[m]}/${String(row.year).slice(2)}`, r: row.months[m], cdi: row.cdi[m] });
      }
    }
  }
  let ip = 100;
  let ic = 100;
  const pctData: Record<string, number | string>[] = [{ month: "início", Carteira: 100, CDI: 100 }];
  for (const f of flat) {
    if (f.r != null) ip *= 1 + f.r / 100;
    if (f.cdi != null) ic *= 1 + f.cdi / 100;
    pctData.push({ month: f.label, Carteira: Number(ip.toFixed(2)), CDI: Number(ic.toFixed(2)) });
  }
  const brlData = data.portfolio.valueSeries.map((v) => ({ month: v.month, Carteira: Number(v.value.toFixed(2)) }));

  const chartData = chartMode === "pct" ? pctData : brlData;
  const chartSeries: MLSeries[] =
    chartMode === "pct"
      ? [
          { key: "Carteira", label: "Carteira", color: "var(--accent)" },
          { key: "CDI", label: "CDI", color: "var(--muted)", dashed: true },
        ]
      : [{ key: "Carteira", label: "Carteira (R$)", color: "var(--accent)" }];
  const fmtVal =
    chartMode === "pct"
      ? (v: number) => `${v - 100 >= 0 ? "+" : ""}${(v - 100).toFixed(1)}%`
      : (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : fmtBRL(v));

  return (
    <div className="grid gap-[var(--gap)] p-[var(--gap)]">
      <Card>
        <CardHead>
          <div>
            <CardTitle>Carteira vs CDI</CardTitle>
            <CardSub>{chartMode === "pct" ? "Retorno acumulado (base 100 no início)" : "Patrimônio (R$)"}</CardSub>
          </div>
          <Segmented
            value={chartMode}
            onChange={setChartMode}
            options={[
              { value: "pct", label: "%" },
              { value: "brl", label: "R$" },
            ]}
          />
        </CardHead>
        <MultiLineSeries data={chartData} series={chartSeries} valueFormatter={fmtVal} height={260} />
      </Card>

      <div className="grid gap-[var(--gap)]" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)" }}>
        <Card>
          <CardHead>
            <div>
              <CardTitle>Rentabilidade por período</CardTitle>
              <CardSub>Carteira vs CDI (time-weighted)</CardSub>
            </div>
          </CardHead>
          <ReturnByPeriodTable periods={data.portfolio.returnByPeriod} />
        </Card>
        <Card>
          <CardHead>
            <div>
              <CardTitle>Rentabilidade mensal</CardTitle>
              <CardSub>Retorno mês a mês vs CDI</CardSub>
            </div>
          </CardHead>
          <MonthlyReturnsMatrix rows={data.portfolio.monthlyMatrix} />
        </Card>
      </div>
    </div>
  );
}
