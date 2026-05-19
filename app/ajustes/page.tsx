"use client";
import { useAppearance, ACCENT_PRESETS, AccentKey, Density, Theme } from "../../context/AppearanceContext";
import Segmented from "../../components/ui/Segmented";
import Button from "../../components/Button";

export default function AjustesPage() {
  const { theme, density, accent, setTheme, setDensity, setAccent, reset } = useAppearance();

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Configurações</div>
          <h1 className="page-title">Ajustes</h1>
          <p className="page-sub">Personalize tema, densidade e cor de destaque do app.</p>
        </div>
        <Button variant="ghost" onClick={reset}>
          Restaurar padrão
        </Button>
      </div>

      <div className="grid gap-[var(--gap)]" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <Section title="Tema" hint="Modo claro ou escuro.">
          <Segmented<Theme>
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: "Claro" },
              { value: "dark", label: "Escuro" },
            ]}
          />
        </Section>

        <Section title="Densidade" hint="Espaçamento e altura de linhas.">
          <Segmented<Density>
            value={density}
            onChange={setDensity}
            options={[
              { value: "compact", label: "Compacto" },
              { value: "regular", label: "Regular" },
              { value: "cozy", label: "Espaçado" },
            ]}
          />
        </Section>

        <Section title="Cor de destaque" hint="Aplicada em botões accent, gráficos e indicadores.">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACCENT_PRESETS) as AccentKey[]).map((key) => {
              const preset = ACCENT_PRESETS[key];
              const active = accent === key;
              return (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  className="flex items-center gap-2"
                  style={{
                    padding: "8px 12px 8px 8px",
                    borderRadius: 999,
                    background: active ? "var(--surface)" : "var(--bg-elev)",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--fg)",
                    transition: "background 0.12s, border-color 0.12s",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: preset.hex,
                      border: "1px solid oklch(0% 0 0 / 0.08)",
                    }}
                  />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {hint && <p className="card-sub mb-4">{hint}</p>}
      {children}
    </div>
  );
}
