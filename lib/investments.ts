export type InvestmentType = "renda_fixa" | "tesouro" | "acoes" | "fiis" | "fundos" | "cripto" | "outros";
export type TxType = "aporte" | "resgate" | "dividendo" | "juros";
export type ValuationMode = "manual" | "auto_fixed" | "quote" | "cvm_fund";
export type IndexType = "cdi" | "prefixado" | "ipca";
export type FundKind = "fi" | "fii" | "fidc" | "fiagro";

export const VALUATION_MODES: { key: ValuationMode; label: string; hint: string }[] = [
  { key: "auto_fixed", label: "Renda fixa automática", hint: "CDI, prefixado ou IPCA+ — calcula sozinho" },
  { key: "quote", label: "Cotação de mercado", hint: "Ações, FIIs e cripto pelo preço atual" },
  { key: "cvm_fund", label: "Fundo CVM (cota oficial)", hint: "Busca a cota na CVM pelo CNPJ — sem atualização manual" },
  { key: "manual", label: "Manual", hint: "Você atualiza o valor quando quiser" },
];

export const FUND_KINDS: { key: FundKind; label: string; freq: string }[] = [
  { key: "fi", label: "Fundo (FI/FIF)", freq: "cota diária" },
  { key: "fii", label: "FII", freq: "cota mensal" },
  { key: "fidc", label: "FIDC", freq: "cota mensal por subclasse" },
  { key: "fiagro", label: "FIAGRO", freq: "cota mensal por subclasse" },
];

// Tipos de fundo que exigem subclasse no cadastro.
export const fundKindNeedsSubclass = (k: FundKind | null | undefined) => k === "fidc" || k === "fiagro";

export const fundKindMeta = (key: string | null | undefined) =>
  FUND_KINDS.find((k) => k.key === key) || null;

// Máscara progressiva de CNPJ: 52890602000165 -> 52.890.602/0001-65
export const formatCnpjInput = (s: string) => {
  const d = s.replace(/\D/g, "").slice(0, 14);
  let out = d;
  if (d.length > 2) out = `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length > 5) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 8) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 12) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return out;
};

export const isValidCnpj = (s: string) => {
  const d = s.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(d[i]), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
};

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
  cnpj: string | null;
  fund_kind: FundKind | null;
  fund_subclass: string | null;
  last_quote_date: string | null;
  last_quote_value: number | null;
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

// ---- análise (benchmark / TWR / matriz) ----
export type PeriodKey = "mes" | "ano" | "3m" | "6m" | "12m" | "24m" | "acumulado";

export interface PeriodReturn {
  period: PeriodKey;
  label: string;
  portfolioPct: number | null;
  portfolioBrl: number | null;
  cdiPct: number | null;
  pctOfCdi: number | null;
  ipcaPct: number | null;
  clampedToInception: boolean;
}

export interface MonthlyMatrixRow {
  year: number;
  months: (number | null)[]; // 12
  cdi: (number | null)[]; // 12
  pctDoCdi: (number | null)[]; // 12
  noAno: number | null;
  cdiNoAno: number | null;
  pctDoCdiNoAno: number | null;
  acumulado: number | null;
}

export interface ValuePoint {
  month: string;
  date: string;
  value: number;
}

export interface AssetAnalytics {
  id: number;
  name: string;
  type: InvestmentType;
  valuationMode: ValuationMode;
  currentValue: number;
  inception: string | null;
  hasGroundTruth: boolean;
  returnByPeriod: PeriodReturn[];
}

export interface InvestmentAnalytics {
  asOf: string;
  inception: string | null;
  benchmarkAsOf: { cdi: string | null; ipca: string | null };
  portfolio: {
    currentValue: number;
    totalAportado: number;
    totalProventos: number;
    returnByPeriod: PeriodReturn[];
    monthlyMatrix: MonthlyMatrixRow[];
    valueSeries: ValuePoint[];
  };
  assets: AssetAnalytics[];
}

// ---- importação de relatório BTG ----
export interface ImportAssetDraft {
  name: string;
  ticker?: string | null;
  type: InvestmentType;
  valuation_mode: ValuationMode;
  index_type?: IndexType | null;
  rate?: number | null;
  cnpj?: string | null;
  fund_kind?: FundKind | null;
  fund_subclass?: string | null;
}

export interface ImportPositionPreview {
  parsedName: string;
  saldoBruto: number | null;
  valorAplicado: number | null;
  dataInicial: string | null;
  action: "link" | "create";
  investmentId: number | null;
  investmentName: string | null;
  confidence: number;
  draft: ImportAssetDraft | null;
  corrections: { fund_kind?: FundKind; type?: InvestmentType; fund_subclass?: string } | null;
  candidates: { id: number; name: string; score: number }[];
  seedAporte: boolean;
}

export interface ImportPreview {
  contentHash: string;
  report: {
    period: string;
    refDate: string;
    periodStart: string;
    periodEnd: string;
    conta: string | null;
    patrimonio: { bruto: number | null; liquido: number | null };
    monthlyReturn: { portfolioRs: number; portfolioPct: number; cdiPct: number } | null;
    broker: string;
  };
  alreadyImported: boolean;
  positions: ImportPositionPreview[];
  warnings: string[];
}

export interface ImportCommitResult {
  created: number;
  updated: number;
  valuationsInserted: number;
  reportId: number;
  patrimonioBruto: number | null;
}
