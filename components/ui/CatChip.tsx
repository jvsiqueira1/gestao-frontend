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

export function categoryColor(idOrName: string | number): string {
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
