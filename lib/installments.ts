import { fmtBRL, MONTH_NAMES_SHORT } from "./format";

export interface InstallmentParcel {
  id: number;
  installment_number: number;
  value: number;
  date: string;
  category_id: number | null;
}

export interface InstallmentGroup {
  group_id: string;
  description: string;
  category_id: number | null;
  category?: { id: number; name: string; color?: string | null } | null;
  installment_total: number;
  value_per_installment: number;
  total_value: number;
  first_date: string;
  last_date: string;
  parcels: InstallmentParcel[];
}

// Divide `total` em `n` parcelas trabalhando em centavos — espelha o backend
// utils/installments.splitAmount (primeiras `remainder` parcelas +1 centavo).
export function splitAmount(total: number, n: number): number[] {
  const count = Math.trunc(n);
  const totalCents = Math.round((Number(total) || 0) * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push((base + (i < remainder ? 1 : 0)) / 100);
  }
  return values;
}

// Rótulo "mmm/aaaa" a partir de uma data YYYY-MM-DD somada de `index` meses.
function monthLabel(firstDate: string, index: number): string {
  const [y, m] = firstDate.split("-").map(Number);
  const total0 = m - 1 + index;
  const year = y + Math.floor(total0 / 12);
  const month = (total0 % 12) + 1;
  return `${MONTH_NAMES_SHORT[month - 1].toLowerCase()}/${year}`;
}

export interface InstallmentPreview {
  valid: boolean;
  even: boolean; // true quando todas as parcelas têm o mesmo valor
  count: number;
  perInstallment: number; // valor da 1ª parcela (a maior, quando há resto)
  total: number;
  firstLabel: string;
  lastLabel: string;
  summary: string; // ex.: "6x de R$ 100,00 · jul/2026 → dez/2026"
}

const EMPTY_PREVIEW: InstallmentPreview = {
  valid: false,
  even: true,
  count: 0,
  perInstallment: 0,
  total: 0,
  firstLabel: "",
  lastLabel: "",
  summary: "",
};

// Preview ao vivo do plano de parcelas para o formulário de criação.
export function installmentPreview(
  total: number,
  installments: number,
  firstDate: string
): InstallmentPreview {
  const count = Math.trunc(installments);
  const validNums =
    Number.isFinite(total) &&
    total > 0 &&
    Number.isInteger(count) &&
    count >= 2 &&
    count <= 360;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(firstDate || "");
  if (!validNums || !validDate) return EMPTY_PREVIEW;

  const values = splitAmount(total, count);
  const per = values[0];
  const even = values.every((v) => v === per);
  const firstLabel = monthLabel(firstDate, 0);
  const lastLabel = monthLabel(firstDate, count - 1);
  const summary = `${count}x de ${fmtBRL(per)} · ${firstLabel} → ${lastLabel}`;
  return { valid: true, even, count, perInstallment: per, total, firstLabel, lastLabel, summary };
}
