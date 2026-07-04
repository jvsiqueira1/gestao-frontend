"use client";
import { PeriodReturn } from "../../lib/investments";
import { fmtBRL } from "../../lib/format";

const pctTxt = (v: number | null) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`);
const pctColor = (v: number | null) => (v == null ? "var(--muted)" : v >= 0 ? "var(--pos)" : "var(--neg)");

export default function ReturnByPeriodTable({ periods }: { periods: PeriodReturn[] }) {
  const clamped = periods.some((p) => p.clampedToInception);
  return (
    <div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Período</th>
            <th style={{ textAlign: "right" }}>Carteira</th>
            <th style={{ textAlign: "right" }}>R$</th>
            <th style={{ textAlign: "right" }}>CDI</th>
            <th style={{ textAlign: "right" }}>% do CDI</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p.period}>
              <td style={{ color: "var(--fg-soft)" }}>
                {p.label}
                {p.clampedToInception && <span style={{ color: "var(--muted)", fontSize: 10.5 }}> *</span>}
              </td>
              <td className="num" style={{ textAlign: "right", color: pctColor(p.portfolioPct), fontWeight: 500 }}>
                {pctTxt(p.portfolioPct)}
              </td>
              <td className="num" style={{ textAlign: "right", color: "var(--fg-soft)" }}>
                {p.portfolioBrl == null ? "—" : fmtBRL(p.portfolioBrl).replace("R$", "").trim()}
              </td>
              <td className="num" style={{ textAlign: "right", color: "var(--fg-soft)" }}>
                {p.cdiPct == null ? "—" : `${p.cdiPct.toFixed(2)}%`}
              </td>
              <td className="num" style={{ textAlign: "right", fontWeight: 500 }}>
                {p.pctOfCdi == null ? "—" : `${p.pctOfCdi.toFixed(0)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {clamped && (
        <p style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 8 }}>
          * período maior que o histórico disponível — calculado desde o início.
        </p>
      )}
    </div>
  );
}
