import clsx from "clsx";

interface CatChipProps {
  name: string;
  color?: string;
  className?: string;
}

const PALETTE = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ef4444",
  "#8b5cf6",
  "#84cc16",
  "#3b82f6",
  "#a855f7",
];

export { PALETTE };

/**
 * Cor de uma categoria. Se `explicitColor` (cor salva no banco) for informada,
 * ela tem prioridade; caso contrário cai no hash determinístico sobre id/nome.
 */
export function categoryColor(idOrName: string | number, explicitColor?: string | null): string {
  if (explicitColor) return explicitColor;
  const s = String(idOrName);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function CatChip({ name, color, className }: CatChipProps) {
  const dotColor = color || categoryColor(name);
  return (
    <span className={clsx("cat-chip", className)}>
      <span className="dot" style={{ background: dotColor }} />
      {name}
    </span>
  );
}
