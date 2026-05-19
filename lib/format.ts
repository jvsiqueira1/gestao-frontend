export const fmtBRL = (v: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export const fmtBRLParts = (v: number): [string, string, string] => {
  const negative = v < 0;
  const abs = Math.abs(v || 0);
  const parts = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(abs);
  const sym = parts.find((p) => p.type === "currency")?.value || "R$";
  const intParts = parts.filter((p) => p.type === "integer" || p.type === "group").map((p) => p.value).join("");
  const fracParts = parts.find((p) => p.type === "fraction")?.value || "00";
  return [(negative ? "-" : "") + sym, intParts, "," + fracParts];
};

export const fmtDate = (iso: string | Date): string => {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export const MONTH_NAMES_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
