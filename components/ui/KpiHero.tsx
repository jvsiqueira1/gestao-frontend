"use client";
import { ArrowUp, ArrowDown } from "@phosphor-icons/react";
import { fmtBRL, fmtBRLParts } from "../../lib/format";

interface KpiHeroProps {
  balance: number;
  income: number;
  expense: number;
  incomeCount?: number;
  expenseCount?: number;
  expenseFixedCount?: number;
  prevBalance?: number | null;
  label?: string;
}

export default function KpiHero({
  balance,
  income,
  expense,
  incomeCount,
  expenseCount,
  expenseFixedCount,
  prevBalance,
  label = "Saldo do mês",
}: KpiHeroProps) {
  const [sym, intPart, cents] = fmtBRLParts(balance);
  const incomePct = income + expense === 0 ? 0 : Math.round((income / (income + expense)) * 100);
  const expensePct = income + expense === 0 ? 0 : 100 - incomePct;

  const delta =
    prevBalance && prevBalance !== 0
      ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100
      : null;
  const deltaPositive = delta != null && delta >= 0;

  return (
    <div
      className="bg-bg-elev border border-border-soft mb-[var(--gap)] overflow-hidden relative"
      style={{
        borderRadius: "var(--r-xl)",
        padding: "28px 32px",
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr",
        gap: 32,
        alignItems: "stretch",
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">{label}</div>
        <div
          className="font-display num mt-2 flex items-baseline gap-2"
          style={{ fontSize: 64, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          <span className="text-[28px] text-muted font-medium mr-1">{sym}</span>
          {intPart}
          <span className="text-[32px] text-muted font-medium">{cents}</span>
        </div>
        {delta != null && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-fg-soft">
            <span className={`delta-chip ${deltaPositive ? "" : "neg"}`}>
              {deltaPositive ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
              {deltaPositive ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
            {prevBalance != null && (
              <span className="text-muted">vs. mês anterior ({fmtBRL(prevBalance)})</span>
            )}
          </div>
        )}
      </div>

      <KpiMini
        label="Receitas"
        value={fmtBRL(income).replace("R$", "").trim()}
        pct={incomePct}
        color="var(--pos)"
        dotClass="dot-pos"
        hint={incomeCount != null ? `${incomeCount} lançamentos` : undefined}
        tone="pos"
      />
      <KpiMini
        label="Despesas"
        value={fmtBRL(expense).replace("R$", "").trim()}
        pct={expensePct}
        color="var(--neg)"
        dotClass="dot-neg"
        hint={
          expenseCount != null
            ? `${expenseCount} lançamentos${expenseFixedCount != null ? ` · ${expenseFixedCount} fixas` : ""}`
            : undefined
        }
        tone="neg"
      />
    </div>
  );
}

function KpiMini({
  label,
  value,
  pct,
  color,
  dotClass,
  hint,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  dotClass: string;
  hint?: string;
  tone: "pos" | "neg";
}) {
  return (
    <div
      className="flex flex-col justify-center"
      style={{ paddingLeft: 32, borderLeft: "1px solid var(--border-soft)" }}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] text-muted font-semibold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
        {label}
      </div>
      <div
        className="font-display num mt-2.5"
        style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div
        className="mt-2.5 h-1 rounded-full overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        <span className="block h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      {hint && (
        <div className="text-[11.5px] text-muted mt-2">
          <span className={tone === "pos" ? "text-pos font-semibold" : "text-neg font-semibold"}>{hint.split(" · ")[0]}</span>
          {hint.includes(" · ") && <span> · {hint.split(" · ").slice(1).join(" · ")}</span>}
        </div>
      )}
    </div>
  );
}
