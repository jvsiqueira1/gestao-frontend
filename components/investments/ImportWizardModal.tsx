"use client";
import { useRef, useState } from "react";
import { UploadSimple, FilePdf, CheckCircle } from "@phosphor-icons/react";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { ImportPreview, ImportCommitResult } from "../../lib/investments";
import { fmtBRL, fmtDate } from "../../lib/format";
import Modal from "../ui/Modal";
import Button from "../Button";
import LoadingSpinner from "../LoadingSpinner";
import Pill from "../ui/Pill";
import InvestmentTypePill from "../ui/InvestmentTypePill";

type Status = "idle" | "uploading" | "preview" | "committing" | "done" | "error";

export default function ImportWizardModal({
  token,
  onClose,
  onDone,
}: {
  token: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      setError("Selecione um arquivo PDF.");
      return;
    }
    setError("");
    setFile(f);
  };

  const doPreview = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(apiUrl(API_ENDPOINTS.INVESTMENTS.IMPORT_PREVIEW), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // sem Content-Type: o browser define o boundary
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Falha ao ler o relatório.");
      setPreview(json as ImportPreview);
      setSkip(new Set());
      setStatus("preview");
    } catch (e: any) {
      setError(e.message || "Erro.");
      setStatus("error");
    }
  };

  const toggleSkip = (i: number) => {
    setSkip((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const doCommit = async () => {
    if (!preview) return;
    setStatus("committing");
    setError("");
    try {
      const items = preview.positions
        .map((p, i) => ({ p, i }))
        .filter(({ i }) => !skip.has(i))
        .map(({ p }) => ({
          action: p.action,
          investmentId: p.investmentId,
          parsedName: p.parsedName,
          saldoBruto: p.saldoBruto,
          valorAplicado: p.valorAplicado,
          dataInicial: p.dataInicial,
          draft: p.draft,
          corrections: p.corrections,
          seedAporte: p.seedAporte,
        }));
      const body = {
        contentHash: preview.contentHash,
        period: preview.report.period,
        refDate: preview.report.refDate,
        patrimonioBruto: preview.report.patrimonio.bruto,
        items,
      };
      const res = await fetch(apiUrl(API_ENDPOINTS.INVESTMENTS.IMPORT_COMMIT), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Falha ao importar.");
      setResult(json as ImportCommitResult);
      setStatus("done");
    } catch (e: any) {
      setError(e.message || "Erro.");
      setStatus("error");
    }
  };

  const nMatched = preview?.positions.filter((p) => p.action === "link").length || 0;
  const nNew = preview?.positions.filter((p) => p.action === "create").length || 0;

  return (
    <Modal
      title="Importar relatório BTG"
      subtitle="Envie um PDF de Relatório de Performance para popular a carteira e o histórico."
      onClose={onClose}
      size="lg"
    >
      {status === "idle" || status === "uploading" ? (
        <div className="grid gap-4">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files?.[0] || null);
            }}
            style={{
              border: "1px dashed var(--border)",
              borderRadius: "var(--r-lg)",
              padding: 28,
              textAlign: "center",
              cursor: "pointer",
              background: "var(--surface)",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => pick(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FilePdf size={22} style={{ color: "var(--accent-ink)" }} />
                <span style={{ fontWeight: 500 }}>{file.name}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <div className="grid gap-1.5 place-items-center" style={{ color: "var(--muted)" }}>
                <UploadSimple size={24} />
                <span style={{ fontSize: 13 }}>Clique ou arraste um PDF aqui</span>
              </div>
            )}
          </div>
          {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={doPreview} disabled={!file} loading={status === "uploading"}>
              {status === "uploading" ? "Lendo o PDF…" : "Enviar"}
            </Button>
          </div>
        </div>
      ) : status === "preview" && preview ? (
        <div className="grid gap-4">
          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 12.5 }}>
            <span style={{ color: "var(--fg-soft)" }}>
              Período <b>{preview.report.period}</b>
            </span>
            {preview.report.patrimonio.bruto != null && (
              <span style={{ color: "var(--fg-soft)" }}>
                · Patrimônio {fmtBRL(preview.report.patrimonio.bruto)}
              </span>
            )}
            <Pill tone="info">{nMatched} reconhecidos</Pill>
            <Pill tone="pos">{nNew} novos</Pill>
          </div>

          {preview.warnings.length > 0 && (
            <div className="grid gap-1">
              {preview.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 11.5, color: "var(--neg)" }}>
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 34 }}></th>
                  <th>Ativo (relatório)</th>
                  <th>Ação</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {preview.positions.map((p, i) => {
                  const off = skip.has(i);
                  return (
                    <tr key={i} style={{ opacity: off ? 0.45 : 1 }}>
                      <td>
                        <input type="checkbox" checked={!off} onChange={() => toggleSkip(i)} aria-label="Incluir" />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.parsedName}</div>
                        {p.action === "link" && p.investmentName && (
                          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>→ {p.investmentName}</div>
                        )}
                      </td>
                      <td>
                        {p.action === "link" ? (
                          <div className="flex items-center gap-1.5">
                            <Pill tone="info">vincular</Pill>
                            {p.corrections && <Pill tone="warn">corrigir</Pill>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Pill tone="pos">criar</Pill>
                            {p.draft && <InvestmentTypePill type={p.draft.type} />}
                          </div>
                        )}
                      </td>
                      <td className="num" style={{ textAlign: "right", fontWeight: 500 }}>
                        {p.saldoBruto == null ? "—" : fmtBRL(p.saldoBruto).replace("R$", "").trim()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>
            Cada ativo recebe uma avaliação (valor bruto) na data do relatório. Ativos novos já entram com a
            avaliação automática correta (CVM/cotação). Reimportar o mesmo mês substitui os valores.
          </p>
          {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={doCommit} disabled={skip.size === preview.positions.length}>
              Confirmar importação
            </Button>
          </div>
        </div>
      ) : status === "committing" ? (
        <div className="py-10 grid place-items-center gap-3">
          <LoadingSpinner />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Importando…</span>
        </div>
      ) : status === "done" && result ? (
        <div className="grid gap-4 py-4">
          <div className="grid place-items-center gap-2">
            <CheckCircle size={40} weight="fill" style={{ color: "var(--pos)" }} />
            <div style={{ fontWeight: 600 }}>Importação concluída</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {result.created} criados · {result.updated} atualizados · {result.valuationsInserted} avaliações
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                onDone();
                onClose();
              }}
            >
              Concluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 py-2">
          <p className="text-sm" style={{ color: "var(--neg)" }}>{error || "Ocorreu um erro."}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button type="button" onClick={() => setStatus(preview ? "preview" : "idle")}>
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
