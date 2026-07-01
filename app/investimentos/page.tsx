"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  Archive,
  ArrowsClockwise,
  Receipt,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  Eye,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { fmtBRL, fmtDate, MONTH_NAMES_FULL } from "../../lib/format";
import {
  INVESTMENT_TYPES,
  TX_TYPES,
  VALUATION_MODES,
  INDEX_TYPES,
  Investment,
  InvestmentDetail,
  InvestmentSummary,
  InvestmentTransaction,
  InvestmentType,
  ValuationMode,
  IndexType,
  TxType,
  investmentTypeMeta,
  indexTypeMeta,
  txTypeMeta,
} from "../../lib/investments";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import Segmented from "../../components/ui/Segmented";
import Toggle from "../../components/ui/Toggle";
import Pill from "../../components/ui/Pill";
import InvestmentTypePill from "../../components/ui/InvestmentTypePill";
import Donut from "../../components/charts/Donut";
import LineSeries from "../../components/charts/LineSeries";
import { Card, CardHead, CardTitle, CardSub } from "../../components/ui/Card";

type View = "carteira" | "lancamentos";

const today = () => new Date().toISOString().split("T")[0];

// Descrição curta do rendimento/fonte de avaliação, ex.: "110% do CDI", "12% a.a.", ticker.
function yieldDescriptor(i: Investment): string | null {
  if (i.valuation_mode === "auto_fixed" && i.index_type && i.rate != null) {
    if (i.index_type === "cdi") return `${i.rate}% do CDI`;
    if (i.index_type === "prefixado") return `${i.rate}% a.a.`;
    if (i.index_type === "ipca") return `IPCA + ${i.rate}%`;
  }
  if (i.valuation_mode === "quote" && i.ticker) return i.ticker.toUpperCase();
  return null;
}

export default function InvestimentosPage() {
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("carteira");
  const [search, setSearch] = useState("");

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editAssetId, setEditAssetId] = useState<number | null>(null);
  const [assetForm, setAssetForm] = useState<{
    name: string;
    ticker: string;
    type: InvestmentType;
    broker: string;
    notes: string;
    valuation_mode: ValuationMode;
    index_type: IndexType;
    rate: string;
    maturity_date: string;
    tax_exempt: boolean;
  }>({
    name: "",
    ticker: "",
    type: "renda_fixa",
    broker: "",
    notes: "",
    valuation_mode: "auto_fixed",
    index_type: "cdi",
    rate: "",
    maturity_date: "",
    tax_exempt: false,
  });

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<InvestmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState<{
    investment_id: string;
    type: TxType;
    value: string;
    date: string;
    quantity: string;
    notes: string;
  }>({ investment_id: "", type: "aporte", value: "", date: today(), quantity: "", notes: "" });

  const [showValModal, setShowValModal] = useState(false);
  const [valForm, setValForm] = useState<{ investment_id: number | null; value: string; date: string }>({
    investment_id: null,
    value: "",
    date: today(),
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, month, year]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes, txRes] = await Promise.all([
        fetch(apiUrl(API_ENDPOINTS.INVESTMENTS.BASE), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl(API_ENDPOINTS.INVESTMENTS.SUMMARY)}?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl(API_ENDPOINTS.INVESTMENTS.TRANSACTIONS)}?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [l, s, t] = await Promise.all([listRes.json(), sumRes.json(), txRes.json()]);
      setInvestments(Array.isArray(l) ? l : []);
      setSummary(s);
      setTransactions(Array.isArray(t) ? t : []);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const activeInvestments = investments.filter((i) => !i.archived);
  const carteiraFiltered = activeInvestments.filter((i) =>
    search.trim()
      ? i.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (i.ticker || "").toLowerCase().includes(search.trim().toLowerCase())
      : true
  );
  const txFiltered = transactions.filter((t) =>
    search.trim()
      ? t.investment?.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (t.investment?.ticker || "").toLowerCase().includes(search.trim().toLowerCase())
      : true
  );

  const openCreateAsset = () => {
    setEditAssetId(null);
    setAssetForm({
      name: "",
      ticker: "",
      type: "renda_fixa",
      broker: "",
      notes: "",
      valuation_mode: "auto_fixed",
      index_type: "cdi",
      rate: "",
      maturity_date: "",
      tax_exempt: false,
    });
    setError("");
    setShowAssetModal(true);
  };

  const openEditAsset = (i: Investment) => {
    setEditAssetId(i.id);
    setAssetForm({
      name: i.name,
      ticker: i.ticker || "",
      type: i.type,
      broker: i.broker || "",
      notes: i.notes || "",
      valuation_mode: i.valuation_mode || "manual",
      index_type: i.index_type || "cdi",
      rate: i.rate != null ? String(i.rate) : "",
      maturity_date: i.maturity_date ? new Date(i.maturity_date).toISOString().split("T")[0] : "",
      tax_exempt: !!i.tax_exempt,
    });
    setError("");
    setShowAssetModal(true);
  };

  const openDetail = async (i: Investment) => {
    setDetailId(i.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${i.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  };

  const submitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body = {
        name: assetForm.name,
        ticker: assetForm.ticker || null,
        type: assetForm.type,
        broker: assetForm.broker || null,
        notes: assetForm.notes || null,
        valuation_mode: assetForm.valuation_mode,
        index_type: assetForm.valuation_mode === "auto_fixed" ? assetForm.index_type : null,
        rate: assetForm.valuation_mode === "auto_fixed" ? parseFloat(assetForm.rate) : null,
        maturity_date:
          assetForm.valuation_mode === "auto_fixed" && assetForm.maturity_date
            ? assetForm.maturity_date
            : null,
        tax_exempt: assetForm.valuation_mode === "auto_fixed" ? assetForm.tax_exempt : false,
      };
      const url = editAssetId
        ? `${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${editAssetId}`
        : apiUrl(API_ENDPOINTS.INVESTMENTS.BASE);
      const method = editAssetId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Erro ao salvar.");
        return;
      }
      setShowAssetModal(false);
      fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const archiveAsset = async (i: Investment) => {
    if (!confirm(i.archived ? "Reativar este ativo?" : "Arquivar este ativo?")) return;
    await fetch(`${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${i.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ archived: !i.archived }),
    });
    fetchAll();
  };

  const deleteAsset = async (i: Investment) => {
    if (!confirm(`Excluir "${i.name}" e TODOS os lançamentos vinculados?`)) return;
    await fetch(`${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${i.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  };

  const openTxModal = (investmentId?: number) => {
    setTxForm({
      investment_id: investmentId ? String(investmentId) : "",
      type: "aporte",
      value: "",
      date: today(),
      quantity: "",
      notes: "",
    });
    setError("");
    setShowTxModal(true);
  };

  const submitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.investment_id) {
      setError("Selecione um ativo.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body = {
        type: txForm.type,
        value: parseFloat(txForm.value),
        date: txForm.date,
        quantity: txForm.quantity ? parseFloat(txForm.quantity) : null,
        notes: txForm.notes || null,
      };
      const res = await fetch(
        `${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${txForm.investment_id}/transactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Erro ao salvar.");
        return;
      }
      setShowTxModal(false);
      fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTx = async (t: InvestmentTransaction) => {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(
      `${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${t.investment_id}/transactions/${t.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    fetchAll();
  };

  const openValModal = (i: Investment) => {
    setValForm({ investment_id: i.id, value: String(i.current_value || ""), date: today() });
    setError("");
    setShowValModal(true);
  };

  const submitVal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valForm.investment_id) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${apiUrl(API_ENDPOINTS.INVESTMENTS.BASE)}/${valForm.investment_id}/valuations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ value: parseFloat(valForm.value), date: valForm.date }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Erro ao salvar.");
        return;
      }
      setShowValModal(false);
      fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Patrimônio</div>
          <h1 className="page-title">Investimentos</h1>
          <p className="page-sub">Acompanhe sua carteira, aportes e rentabilidade.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex items-center"
            style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 8 }}
          >
            <button className="btn btn-ghost btn-icon" onClick={goPrev} aria-label="Anterior">
              <CaretLeft size={14} />
            </button>
            <span className="num" style={{ padding: "0 6px", fontSize: 12.5, fontWeight: 500 }}>
              {MONTH_NAMES_FULL[month - 1]} {year}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={goNext} aria-label="Próximo">
              <CaretRight size={14} />
            </button>
          </div>
          <button className="btn btn-outline" onClick={() => openTxModal()}>
            <Receipt size={14} /> Novo lançamento
          </button>
          <button className="btn btn-primary" onClick={openCreateAsset}>
            <Plus size={14} /> Novo investimento
          </button>
        </div>
      </div>

      <div
        className="grid mb-[var(--gap)]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}
      >
        <Stat label="Patrimônio total" value={fmtBRL(summary?.totalPatrimony || 0)} hint={`${summary?.activeCount || 0} ativos`} />
        <Stat label="Aportes no mês" value={fmtBRL(summary?.monthlyAportes || 0)} hint={summary?.monthlyResgates ? `${fmtBRL(summary.monthlyResgates)} em resgates` : undefined} />
        <Stat
          label="Rentabilidade"
          value={
            summary
              ? `${summary.totalRentabilidade >= 0 ? "+" : ""}${fmtBRL(summary.totalRentabilidade).replace("R$", "R$ ")}`
              : fmtBRL(0)
          }
          hint={summary ? `${summary.rentabilidadePct >= 0 ? "+" : ""}${summary.rentabilidadePct.toFixed(1)}%` : undefined}
          tone={summary?.totalRentabilidade && summary.totalRentabilidade < 0 ? "neg" : "pos"}
        />
        <Stat label="Aportado" value={fmtBRL(summary?.totalAportado || 0)} hint={`+ ${fmtBRL(summary?.totalProventos || 0)} em proventos`} />
      </div>

      <div
        className="grid mb-[var(--gap)]"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)", gap: "var(--gap)" }}
      >
        <Card>
          <CardHead>
            <div>
              <CardTitle>Alocação por tipo</CardTitle>
              <CardSub>Distribuição do patrimônio</CardSub>
            </div>
          </CardHead>
          {!summary?.allocationByType?.length ? (
            <div className="h-[200px] grid place-items-center text-sm" style={{ color: "var(--muted)" }}>
              Sem ativos.
            </div>
          ) : (
            <Donut
              data={summary.allocationByType.map((a) => ({
                name: investmentTypeMeta(a.type).label,
                value: a.value,
                color: investmentTypeMeta(a.type).color,
              }))}
            />
          )}
        </Card>

        <Card>
          <CardHead>
            <div>
              <CardTitle>Evolução do patrimônio</CardTitle>
              <CardSub>Últimos 12 meses</CardSub>
            </div>
          </CardHead>
          {!summary?.evolution?.length ? (
            <div className="h-[200px] grid place-items-center text-sm" style={{ color: "var(--muted)" }}>
              Sem dados.
            </div>
          ) : (
            <LineSeries data={summary.evolution} label="Patrimônio" />
          )}
        </Card>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-head">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              {
                value: "carteira",
                label: (
                  <>
                    Carteira <span className="num" style={{ marginLeft: 4, opacity: 0.6 }}>{activeInvestments.length}</span>
                  </>
                ),
              },
              {
                value: "lancamentos",
                label: (
                  <>
                    Lançamentos <span className="num" style={{ marginLeft: 4, opacity: 0.6 }}>{transactions.length}</span>
                  </>
                ),
              },
            ]}
          />
          <div
            className="flex items-center gap-2"
            style={{
              height: 30,
              padding: "0 10px",
              background: "var(--surface)",
              borderRadius: 8,
              border: "1px solid var(--border-soft)",
              width: 220,
            }}
          >
            <MagnifyingGlass size={14} style={{ color: "var(--muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-transparent outline-none"
              style={{ fontSize: 12.5 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : view === "carteira" ? (
          carteiraFiltered.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>
              Nenhum investimento cadastrado.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>Ativo</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: "right" }}>Aportado</th>
                  <th style={{ textAlign: "right" }}>Valor atual</th>
                  <th style={{ textAlign: "right" }}>Variação</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {carteiraFiltered.map((i) => {
                  const pct = i.rentabilidade_pct;
                  return (
                    <tr key={i.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="grid place-items-center"
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: investmentTypeMeta(i.type).color,
                              color: "white",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {(i.ticker || i.name).slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{i.name}</div>
                            <div style={{ fontSize: 10.5, color: "var(--muted)" }}>
                              {[yieldDescriptor(i), i.broker].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <InvestmentTypePill type={i.type} />
                      </td>
                      <td className="num" style={{ textAlign: "right", color: "var(--fg-soft)" }}>
                        {fmtBRL(i.aportes_liq).replace("R$", "").trim()}
                      </td>
                      <td className="num" style={{ textAlign: "right", fontWeight: 500 }}>
                        {fmtBRL(i.current_value).replace("R$", "").trim()}
                      </td>
                      <td className="num" style={{ textAlign: "right", color: pct >= 0 ? "var(--pos)" : "var(--neg)", fontWeight: 500 }}>
                        {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                      </td>
                      <td>
                        <div className="row-actions">
                          <button aria-label="Detalhes" onClick={() => openDetail(i)}>
                            <Eye size={14} />
                          </button>
                          {i.valuation_mode === "manual" && (
                            <button aria-label="Atualizar valor" onClick={() => openValModal(i)}>
                              <ArrowsClockwise size={14} />
                            </button>
                          )}
                          <button aria-label="Novo lançamento" onClick={() => openTxModal(i.id)}>
                            <Receipt size={14} />
                          </button>
                          <button aria-label="Editar" onClick={() => openEditAsset(i)}>
                            <PencilSimple size={14} />
                          </button>
                          <button aria-label="Arquivar" onClick={() => archiveAsset(i)}>
                            <Archive size={14} />
                          </button>
                          <button aria-label="Excluir" onClick={() => deleteAsset(i)}>
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : txFiltered.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>
            Sem lançamentos no mês.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Data</th>
                <th style={{ width: "30%" }}>Ativo</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Qtd</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th>Notas</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {txFiltered.map((t) => {
                const meta = txTypeMeta(t.type);
                const sign = t.type === "resgate" ? "−" : "+";
                const color =
                  t.type === "resgate"
                    ? "var(--neg)"
                    : t.type === "aporte"
                    ? "var(--accent-ink)"
                    : "var(--pos)";
                return (
                  <tr key={t.id}>
                    <td style={{ color: "var(--fg-soft)" }}>{fmtDate(t.date)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 500 }}>{t.investment?.name || `#${t.investment_id}`}</span>
                        {t.investment?.type && <InvestmentTypePill type={t.investment.type} />}
                      </div>
                    </td>
                    <td>
                      <Pill tone={meta.tone}>{meta.label}</Pill>
                    </td>
                    <td className="num" style={{ textAlign: "right", color: "var(--fg-soft)" }}>
                      {t.quantity != null ? t.quantity : "—"}
                    </td>
                    <td className="num" style={{ textAlign: "right", color, fontWeight: 500 }}>
                      {sign}
                      {fmtBRL(t.value).replace("R$", "").trim()}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{t.notes || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button aria-label="Excluir" onClick={() => deleteTx(t)}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAssetModal && (
        <Modal
          title={editAssetId ? "Editar investimento" : "Novo investimento"}
          subtitle="Cadastre um ativo da sua carteira."
          onClose={() => setShowAssetModal(false)}
        >
          <form onSubmit={submitAsset} className="grid gap-3.5">
            <div className="field">
              <label>Nome</label>
              <input
                className="input"
                required
                autoFocus
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                placeholder="Ex: Tesouro Selic 2029, BBAS3"
              />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Ticker (opcional)</label>
                <input
                  className="input"
                  value={assetForm.ticker}
                  onChange={(e) => setAssetForm({ ...assetForm, ticker: e.target.value })}
                  placeholder="BBAS3"
                />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select
                  className="select"
                  value={assetForm.type}
                  onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value as InvestmentType })}
                >
                  {INVESTMENT_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Como avaliar</label>
              <select
                className="select"
                value={assetForm.valuation_mode}
                onChange={(e) =>
                  setAssetForm({ ...assetForm, valuation_mode: e.target.value as ValuationMode })
                }
              >
                {VALUATION_MODES.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {VALUATION_MODES.find((m) => m.key === assetForm.valuation_mode)?.hint}
              </span>
            </div>

            {assetForm.valuation_mode === "auto_fixed" && (
              <>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="field">
                    <label>Indexador</label>
                    <select
                      className="select"
                      value={assetForm.index_type}
                      onChange={(e) =>
                        setAssetForm({ ...assetForm, index_type: e.target.value as IndexType })
                      }
                    >
                      {INDEX_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>{indexTypeMeta(assetForm.index_type)?.rateLabel || "Taxa"}</label>
                    <input
                      className="input input-currency"
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={assetForm.rate}
                      onChange={(e) => setAssetForm({ ...assetForm, rate: e.target.value })}
                      placeholder={
                        assetForm.index_type === "cdi" ? "110" : assetForm.index_type === "ipca" ? "6" : "12"
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "end" }}>
                  <div className="field">
                    <label>Vencimento (opcional)</label>
                    <input
                      className="input"
                      type="date"
                      value={assetForm.maturity_date}
                      onChange={(e) => setAssetForm({ ...assetForm, maturity_date: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <Toggle
                      checked={assetForm.tax_exempt}
                      onChange={(v) => setAssetForm({ ...assetForm, tax_exempt: v })}
                    >
                      Isento de IR <span style={{ color: "var(--muted)", marginLeft: 4 }}>(LCI/LCA)</span>
                    </Toggle>
                  </div>
                </div>
              </>
            )}
            {assetForm.valuation_mode === "quote" && (
              <p style={{ fontSize: 11.5, color: "var(--muted)" }}>
                Preencha o <b>Ticker</b> acima: ações/FIIs pelo código (ex.: PETR4, HGLG11); cripto pelo id do
                CoinGecko (ex.: bitcoin, ethereum).
              </p>
            )}

            <div className="field">
              <label>Corretora (opcional)</label>
              <input
                className="input"
                value={assetForm.broker}
                onChange={(e) => setAssetForm({ ...assetForm, broker: e.target.value })}
                placeholder="XP, Nubank, Binance…"
              />
            </div>
            <div className="field">
              <label>Notas (opcional)</label>
              <textarea
                className="textarea"
                value={assetForm.notes}
                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
              />
            </div>
            {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setShowAssetModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showTxModal && (
        <Modal
          title="Novo lançamento"
          subtitle="Aporte, resgate ou provento."
          onClose={() => setShowTxModal(false)}
        >
          <form onSubmit={submitTx} className="grid gap-3.5">
            <div className="field">
              <label>Ativo</label>
              <select
                className="select"
                required
                value={txForm.investment_id}
                onChange={(e) => setTxForm({ ...txForm, investment_id: e.target.value })}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {activeInvestments.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                    {i.ticker ? ` (${i.ticker})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Tipo</label>
                <select
                  className="select"
                  value={txForm.type}
                  onChange={(e) => setTxForm({ ...txForm, type: e.target.value as TxType })}
                >
                  {TX_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Data</label>
                <input
                  className="input"
                  required
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Valor (R$)</label>
                <input
                  className="input input-currency"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={txForm.value}
                  onChange={(e) => setTxForm({ ...txForm, value: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Quantidade (opcional)</label>
                <input
                  className="input input-currency"
                  type="number"
                  step="0.00000001"
                  value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label>Notas (opcional)</label>
              <textarea
                className="textarea"
                value={txForm.notes}
                onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
              />
            </div>
            {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setShowTxModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showValModal && (
        <Modal
          title="Atualizar valor atual"
          subtitle="Registre uma nova avaliação do ativo."
          onClose={() => setShowValModal(false)}
        >
          <form onSubmit={submitVal} className="grid gap-3.5">
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label>Valor atual (R$)</label>
                <input
                  className="input input-currency"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={valForm.value}
                  onChange={(e) => setValForm({ ...valForm, value: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Data</label>
                <input
                  className="input"
                  required
                  type="date"
                  value={valForm.date}
                  onChange={(e) => setValForm({ ...valForm, date: e.target.value })}
                />
              </div>
            </div>
            {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setShowValModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {detailId !== null && (
        <Modal
          title={detail?.name || "Detalhes"}
          subtitle={
            detail
              ? [yieldDescriptor(detail), detail.broker].filter(Boolean).join(" · ") || undefined
              : undefined
          }
          onClose={() => {
            setDetailId(null);
            setDetail(null);
          }}
        >
          {detailLoading || !detail ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <MiniStat label="Valor atual (bruto)" value={fmtBRL(detail.current_value)} />
                <MiniStat label="Aportado" value={fmtBRL(detail.aportes_liq)} />
                <MiniStat
                  label="Rentabilidade"
                  value={`${detail.rentabilidade >= 0 ? "+" : ""}${detail.rentabilidade_pct.toFixed(2)}%`}
                  tone={detail.rentabilidade >= 0 ? "pos" : "neg"}
                />
                {detail.maturity_date && (
                  <MiniStat label="Vencimento" value={fmtDate(detail.maturity_date)} />
                )}
              </div>

              {detail.positions && detail.positions.length > 0 ? (
                <div>
                  <div className="card-title mb-2">Posição por compra</div>
                  <div style={{ maxHeight: "42vh", overflowY: "auto" }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Compra</th>
                          <th style={{ textAlign: "right" }}>Investido</th>
                          <th style={{ textAlign: "right" }}>Bruto</th>
                          <th style={{ textAlign: "right" }}>IR</th>
                          <th style={{ textAlign: "right" }}>Líquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.positions.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ color: "var(--fg-soft)" }}>{fmtDate(p.date)}</td>
                            <td className="num" style={{ textAlign: "right" }}>
                              {fmtBRL(p.invested).replace("R$", "").trim()}
                            </td>
                            <td className="num" style={{ textAlign: "right", fontWeight: 500 }}>
                              {fmtBRL(p.gross).replace("R$", "").trim()}
                            </td>
                            <td className="num" style={{ textAlign: "right", color: "var(--muted)" }}>
                              {fmtBRL(p.ir).replace("R$", "").trim()}
                            </td>
                            <td className="num" style={{ textAlign: "right", color: "var(--pos)", fontWeight: 500 }}>
                              {fmtBRL(p.liquido).replace("R$", "").trim()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                    Cálculo automático via CDI/IPCA do Banco Central. IR/IOF estimados; IOF zera após 30 dias.
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {detail.valuation_mode === "quote"
                    ? "Valor calculado pela cotação de mercado × quantidade."
                    : "Sem detalhamento por compra para este ativo."}
                </p>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: 8,
        padding: "10px 12px",
        background: "var(--surface)",
      }}
    >
      <div style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        {label}
      </div>
      <div
        className="num font-display"
        style={{ fontSize: 17, fontWeight: 600, marginTop: 4, color: tone === "neg" ? "var(--neg)" : tone === "pos" ? "var(--pos)" : "var(--fg)" }}
      >
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        className="font-display num"
        style={{
          fontSize: 24,
          marginTop: 8,
          fontWeight: 600,
          color: tone === "neg" ? "var(--neg)" : tone === "pos" ? "var(--fg)" : "var(--fg)",
        }}
      >
        {value}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
