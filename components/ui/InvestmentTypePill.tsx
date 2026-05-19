import { investmentTypeMeta } from "../../lib/investments";

export default function InvestmentTypePill({ type }: { type: string }) {
  const meta = investmentTypeMeta(type);
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        padding: "3px 9px",
        borderRadius: 999,
        background: "var(--surface)",
        fontSize: 11.5,
        fontWeight: 500,
        color: "var(--fg-soft)",
        border: "1px solid var(--border-soft)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: meta.color,
          display: "inline-block",
        }}
      />
      {meta.label}
    </span>
  );
}
