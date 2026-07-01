export type InvestmentType = "renda_fixa" | "tesouro" | "acoes" | "fiis" | "fundos" | "cripto" | "outros";
export type TxType = "aporte" | "resgate" | "dividendo" | "juros";
export type ValuationMode = "manual" | "auto_fixed" | "quote";
export type IndexType = "cdi" | "prefixado" | "ipca";

export const VALUATION_MODES: { key: ValuationMode; label: string; hint: string }[] = [
  { key: "auto_fixed", label: "Renda fixa automática", hint: "CDI, prefixado ou IPCA+ — calcula sozinho" },
  { key: "quote", label: "Cotação de mercado", hint: "Ações, FIIs e cripto pelo preço atual" },
  { key: "manual", label: "Manual", hint: "Você atualiza o valor quando quiser" },
];

export const INDEX_TYPES: { key: IndexType; label: string; rateLabel: string; rateSuffix: string }[] = [
  { key: "cdi", label: "% do CDI", rateLabel: "% do CDI", rateSuffix: "% do CDI" },
  { key: "prefixado", label: "Prefixado", rateLabel: "Taxa (% a.a.)", rateSuffix: "% a.a." },
  { key: "ipca", label: "IPCA +", rateLabel: "Spread (% a.a.)", rateSuffix: "% a.a. + IPCA" },
];

export const valuationModeMeta = (key: string) =>
  VALUATION_MODES.find((m) => m.key === key) || VALUATION_MODES[2];
export const indexTypeMeta = (key: string | null | undefined) =>
  INDEX_TYPES.find((t) => t.key === key) || null;

export const INVESTMENT_TYPES: { key: InvestmentType; label: string; color: string }[] = [
  { key: "renda_fixa", label: "Renda fixa", color: "#3b82f6" },
  { key: "tesouro", label: "Tesouro", color: "#0ea5e9" },
  { key: "acoes", label: "Ações", color: "#10b981" },
  { key: "fiis", label: "FIIs", color: "#8b5cf6" },
  { key: "fundos", label: "Fundos", color: "#6366f1" },
  { key: "cripto", label: "Cripto", color: "#f59e0b" },
  { key: "outros", label: "Outros", color: "#64748b" },
];

export const TX_TYPES: { key: TxType; label: string; tone: "pos" | "neg" | "info" }[] = [
  { key: "aporte", label: "Aporte", tone: "pos" },
  { key: "resgate", label: "Resgate", tone: "neg" },
  { key: "dividendo", label: "Dividendo", tone: "info" },
  { key: "juros", label: "Juros", tone: "info" },
];

export const investmentTypeMeta = (key: string) =>
  INVESTMENT_TYPES.find((t) => t.key === key) || { key, label: key, color: "#64748b" };

export const txTypeMeta = (key: string) =>
  TX_TYPES.find((t) => t.key === key) || { key, label: key, tone: "info" as const };

export interface Investment {
  id: number;
  name: string;
  ticker: string | null;
  type: InvestmentType;
  broker: string | null;
  notes: string | null;
  archived: boolean;
  valuation_mode: ValuationMode;
  index_type: IndexType | null;
  rate: number | null;
  maturity_date: string | null;
  tax_exempt: boolean;
  created_at: string;
  updated_at: string;
  total_aportes: number;
  total_resgates: number;
  total_proventos: number;
  aportes_liq: number;
  quantity_total: number;
  current_value: number;
  current_value_date: string | null;
  rentabilidade: number;
  rentabilidade_pct: number;
}

export interface InvestmentPosition {
  date: string;
  invested: number;
  days: number;
  gross: number;
  rendimento: number;
  iof: number;
  ir: number;
  liquido: number;
}

export interface InvestmentDetail extends Investment {
  transactions: InvestmentTransaction[];
  valuations: Valuation[];
  positions: InvestmentPosition[];
}

export interface InvestmentTransaction {
  id: number;
  investment_id: number;
  type: TxType;
  value: number;
  quantity: number | null;
  date: string;
  notes: string | null;
  created_at: string;
  investment?: { name: string; ticker: string | null; type: InvestmentType };
}

export interface Valuation {
  id: number;
  investment_id: number;
  value: number;
  date: string;
}

export interface InvestmentSummary {
  totalPatrimony: number;
  totalAportado: number;
  totalProventos: number;
  totalRentabilidade: number;
  rentabilidadePct: number;
  monthlyAportes: number;
  monthlyResgates: number;
  monthlyProventos: number;
  activeCount: number;
  archivedCount: number;
  allocationByType: { type: InvestmentType; value: number; pct: number }[];
  evolution: { month: string; value: number }[];
}
