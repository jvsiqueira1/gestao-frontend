"use client";
import { useRef, useState } from "react";
import { UploadSimple, FilePdf, CheckCircle } from "@phosphor-icons/react";
import { apiUrl, API_ENDPOINTS } from "../../lib/api";
import { ImportPreview, ImportCommitResult } from "../../lib/investments";
import { fmtBRL } from "../../lib/format";
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
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const pdfs = Array.from(list).filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    if (!pdfs.length) {
      setError("Selecione arquivos PDF.");
      return;
    }
    setError("");
    setFiles(pdfs);
  };

  const doPreview = async () => {
    if (!files.length) return;
    setStatus("uploading");
    setError("");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(apiUrl(API_ENDPOINTS.INVESTMENTS.IMPORT_PREVIEW), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // sem Content-Type: o browser define o boundary
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Falha ao ler os relatórios.");
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
      const assets = preview.assets.map((a, i) => ({ ...a, skip: skip.has(i) }));
      const res = await fetch(apiUrl(API_ENDPOINTS.INVESTMENTS.IMPORT_COMMIT), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contentHash: preview.contentHash, periodTo: preview.periodTo, assets }),
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

  const nMatched = preview?.assets.filter((a) => a.action === "link").length || 0;
  const nNew = preview?.assets.filter((a) => a.action === "create").length || 0;

  return (
    <Modal
      title="Importar relatórios BTG"
      subtitle="Envie os PDFs de Relatório de Performance. O histórico é reconstruído a partir deles."
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
              pick(e.dataTransfer.files);
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
              multiple
              style={{ display: "none" }}
              onChange={(e) => pick(e.target.files)}
            />
            {files.length ? (
              <div className="flex items-center justify-center gap-2">
                <FilePdf size={22} style={{ color: "var(--accent-ink)" }} />
                <span style={{ fontWeight: 500 }}>{files.length} PDF{files.length > 1 ? "s" : ""} selecionado{files.length > 1 ? "s" : ""}</span>
              </div>
            ) : (
              <div className="grid gap-1.5 place-items-center" style={{ color: "var(--muted)" }}>
                <UploadSimple size={24} />
                <span style={{ fontSize: 13 }}>Clique ou arraste os PDFs aqui (pode selecionar todos de uma vez)</span>
              </div>
            )}
          </div>
          {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={doPreview} disabled={!files.length} loading={status === "uploading"}>
              {status === "uploading" ? "Lendo os PDFs…" : "Enviar"}
            </Button>
          </div>
        </div>
      ) : status === "preview" && preview ? (
        <div className="grid gap-4">
          <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 12.5 }}>
            <span style={{ color: "var(--fg-soft)" }}>
              {preview.periodFrom} → {preview.periodTo} · <b>{preview.monthsCount} meses</b>
            </span>
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

          <div style={{ maxHeight: "48vh", overflowY: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 34 }}></th>
                  <th>Ativo (relatório)</th>
                  <th>Ação</th>
                  <th style={{ textAlign: "right" }}>Aportado</th>
                  <th style={{ textAlign: "right" }}>Valor final</th>
                  <th style={{ textAlign: "right" }}>Lançam.</th>
                </tr>
              </thead>
              <tbody>
                {preview.assets.map((a, i) => {
                  const off = skip.has(i);
                  return (
                    <tr key={a.key} style={{ opacity: off ? 0.45 : 1 }}>
                      <td>
                        <input type="checkbox" checked={!off} onChange={() => toggleSkip(i)} aria-label="Incluir" />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.parsedName}</div>
                        {a.action === "link" && a.investmentName && (
                          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>→ {a.investmentName}</div>
                        )}
                      </td>
                      <td>
                        {a.action === "link" ? (
                          <div className="flex items-center gap-1.5">
                            <Pill tone="info">vincular</Pill>
                            {a.corrections && <Pill tone="warn">corrigir</Pill>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Pill tone="pos">criar</Pill>
                            {a.draft && <InvestmentTypePill type={a.draft.type} />}
                          </div>
                        )}
                      </td>
                      <td className="num" style={{ textAlign: "right", color: "var(--fg-soft)" }}>
                        {fmtBRL(a.aportado).replace("R$", "").trim()}
                      </td>
                      <td className="num" style={{ textAlign: "right", fontWeight: 500 }}>
                        {fmtBRL(a.finalValue).replace("R$", "").trim()}
                      </td>
                      <td className="num" style={{ textAlign: "right", color: "var(--muted)" }}>
                        {a.nTransactions}t · {a.nValuations}v
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>
            A reconstrução <b>substitui</b> os lançamentos existentes destes ativos pelo histórico dos relatórios
            (aportes/resgates + patrimônio mês a mês). Reimportar o mesmo conjunto apenas atualiza.
          </p>
          {error && <p className="text-xs" style={{ color: "var(--neg)" }}>{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={doCommit} disabled={skip.size === preview.assets.length}>
              Confirmar importação
            </Button>
          </div>
        </div>
      ) : status === "committing" ? (
        <div className="py-10 grid place-items-center gap-3">
          <LoadingSpinner />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Importando e reconstruindo o histórico…</span>
        </div>
      ) : status === "done" && result ? (
        <div className="grid gap-4 py-4">
          <div className="grid place-items-center gap-2">
            <CheckCircle size={40} weight="fill" style={{ color: "var(--pos)" }} />
            <div style={{ fontWeight: 600 }}>Importação concluída</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {result.created} criados · {result.updated} atualizados · {result.transactionsInserted} lançamentos ·{" "}
              {result.valuationsInserted} avaliações
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
