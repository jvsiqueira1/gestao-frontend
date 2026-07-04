"use client";
import { Fragment } from "react";
import { MonthlyMatrixRow } from "../../lib/investments";
import { MONTH_NAMES_SHORT } from "../../lib/format";

function cell(v: number | null) {
  if (v == null) return { txt: "—", style: { color: "var(--muted)" as string } };
  const pos = v >= 0;
  return {
    txt: `${pos ? "+" : ""}${v.toFixed(2)}%`,
    style: { color: pos ? "var(--pos)" : "var(--neg)", background: pos ? "var(--pos-soft)" : "var(--neg-soft)" },
  };
}

const stickyLeft = (bg: string): React.CSSProperties => ({ position: "sticky", left: 0, background: bg, zIndex: 1 });

export default function MonthlyReturnsMatrix({ rows }: { rows: MonthlyMatrixRow[] }) {
  if (!rows.length) return <div className="p-6 text-sm" style={{ color: "var(--muted)" }}>Sem dados.</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tbl" style={{ minWidth: 760, fontSize: 11.5 }}>
        <thead>
          <tr>
            <th style={stickyLeft("var(--bg-elev)")}>Ano</th>
            {MONTH_NAMES_SHORT.map((m) => (
              <th key={m} style={{ textAlign: "right" }}>{m}</th>
            ))}
            <th style={{ textAlign: "right" }}>No ano</th>
            <th style={{ textAlign: "right" }}>Acum.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.year}>
              <tr>
                <td className="num" style={{ ...stickyLeft("var(--bg-elev)"), fontWeight: 600 }}>{r.year}</td>
                {r.months.map((v, i) => {
                  const c = cell(v);
                  return (
                    <td key={i} className="num" style={{ textAlign: "right", ...c.style }}>
                      {c.txt}
                    </td>
                  );
                })}
                <td className="num" style={{ textAlign: "right", fontWeight: 600, color: (r.noAno ?? 0) >= 0 ? "var(--pos)" : "var(--neg)" }}>
                  {r.noAno == null ? "—" : `${r.noAno >= 0 ? "+" : ""}${r.noAno.toFixed(2)}%`}
                </td>
                <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>
                  {r.acumulado == null ? "—" : `${r.acumulado >= 0 ? "+" : ""}${r.acumulado.toFixed(2)}%`}
                </td>
              </tr>
              <tr style={{ background: "var(--surface)" }}>
                <td style={{ ...stickyLeft("var(--surface)"), color: "var(--muted)", fontSize: 10.5 }}>CDI</td>
                {r.cdi.map((v, i) => (
                  <td key={i} className="num" style={{ textAlign: "right", color: "var(--muted)" }}>
                    {v == null ? "—" : `${v.toFixed(2)}%`}
                  </td>
                ))}
                <td className="num" style={{ textAlign: "right", color: "var(--muted)" }}>
                  {r.cdiNoAno == null ? "—" : `${r.cdiNoAno.toFixed(2)}%`}
                </td>
                <td className="num" style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
