"use client";
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  ChangeEvent,
  DragEvent,
} from "react";
import { z } from "zod";
import { QAProvider, useQA } from "@/components/qa/QAProvider";
import { QAChecklist } from "@/components/qa/QAChecklist";
import { PreviewFrame, type PreviewState } from "@/components/qa/PreviewFrame"; // ✅ IMPORT DO TIPO
import { QAPanel } from "@/components/qa/QAPanel";
import { QuickToolbar } from "@/components/qa/QuickToolbar";
import { FocusOrderOverlay } from "@/components/qa/FocusOrderOverlay";
import { UploadZone } from "@/components/UploadZone";
import { ChatPanel } from "@/components/ChatPanel";
import { RenderDSL } from "@/components/dsl/Renderer";
import {
  calculateContrast,
  passesWCAG_AA,
  getColorsFromElement,
} from "@/lib/ai/contrast";
import type { UiDslT } from "@/lib/dsl";
/* ---------- Tipos ---------- */
type Lang = "en" | "pt";
type Step = 1 | 2 | 3 | 4;
type UiDsl = UiDslT;

type HistoryItem = {
  id: string;
  createdAt: number;
  lang: Lang;
  source: "sample" | "upload" | "on-device" | "mock" | "hybrid";
  dsl: UiDsl;
  tsx?: string | null;
  qa?: string | null;
};
/* ---------- DSL Inicial ---------- */
const STARTER_DSL: UiDslT = {
  version: "0.1",
  root: {
    type: "container",
    id: "root",
    direction: "vertical",
    gap: 12,
    padding: 16,
    children: [
      {
        type: "text",
        id: "t1",
        content: "Carregue uma imagem ou JSON (UI‑DSL) para começar",
        variant: "h3",
      } as any,
    ],
  } as any,
};

/* ---------- I18N (EN/PT) ---------- */
const STR = {
  en: {
    headline: "From sketch to React/Tailwind in seconds.",
    sub: "Analyzes your image on-device with Chrome's Built-in AI (Prompt API). Generates clean TSX via Gemini in the cloud.",
    steps: [
      "Upload",
      "Analyze (on-device)",
      "Generate (Gemini)",
      "Preview & Copy",
    ] as const,
    try: "Try a sample:",
    card: "Product Card",
    login: "Login Form",
    navbar: "Navbar",
    analyzing: "Analyzing…",
    drop: "Click to choose a file (image or JSON)",
    hint: "Drop an image or upload a JSON to mock analysis.",
    privacy: "On-device analysis. No upload until Generate.",
    powered: "Powered by Chrome's Built-in AI",
    tabs: ["JSON (UI-DSL)", "Code (TSX)", "QA", "Preview"] as const,
    copyJson: "Copy JSON",
    copyRaw: "Copy Raw",
    copyTsx: "Copy TSX",
    copyQa: "Copy QA",
    generateHybrid: "Generate (Hybrid)",
    cloudOk: "Cloud OK",
    cloudErr: "Cloud error: ",
    history: "History",
    load: "Load",
    remove: "Delete",
    validationErrors: "Validation errors:",
    validationOk: "DSL is valid ✓",
    preview: "Preview",
    idle: "Idle",
  },
  pt: {
    headline: "Do sketch para React/Tailwind em segundos.",
    sub: "Analisa sua imagem on‑device com a Built‑in AI do Chrome (Prompt API). Gera TSX limpo via Gemini na nuvem.",
    steps: [
      "Upload",
      "Analisar (on‑device)",
      "Gerar (Gemini)",
      "Prévia e Copiar",
    ] as const,
    try: "Tente um exemplo:",
    card: "Card de Produto",
    login: "Formulário de Login",
    navbar: "Navbar",
    analyzing: "Analisando…",
    drop: "Clique para escolher um arquivo (imagem ou JSON)",
    hint: "Solte uma imagem ou envie um JSON para simular a análise.",
    privacy: "Análise on‑device. Nada é enviado até clicar em Gerar.",
    powered: "Powered by Chrome Built-in AI",
    tabs: ["JSON (UI‑DSL)", "Código (TSX)", "QA", "Prévia"] as const,
    copyJson: "Copiar JSON",
    copyRaw: "Copiar Raw",
    copyTsx: "Copiar TSX",
    copyQa: "Copiar QA",
    generateHybrid: "Gerar (Hybrid)",
    cloudOk: "Nuvem OK",
    cloudErr: "Erro na nuvem: ",
    history: "Histórico",
    load: "Carregar",
    remove: "Excluir",
    validationErrors: "Erros de validação:",
    validationOk: "DSL válido ✓",
    preview: "Prévia",
    idle: "Aguardando",
  },
} as const;

function getLangFromURL(): Lang {
  if (typeof window === "undefined") return "en";
  const p = new URLSearchParams(window.location.search);
  return (p.get("lang") === "pt" ? "pt" : "en") as Lang;
}

function Stepper({
  labels,
  current,
}: {
  labels: ReadonlyArray<string>;
  current: Step;
}) {
  return (
    <div className="flex items-center flex-wrap gap-3 text-xs">
      {labels.map((label, i) => {
        const idx = (i + 1) as Step;
        const active = idx === current;
        const chip =
          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] ";
        const chipCls =
          chip +
          (active ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300");
        const txtCls = active ? "text-white" : "text-slate-400";
        return (
          <div
            key={label + idx}
            className={"flex items-center gap-2 " + txtCls}
          >
            <div className={chipCls}>{idx}</div>
            <div className="hidden md:block">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Toast({ msg, kind }: { msg: string; kind: "ok" | "warn" | "err" }) {
  const cls =
    kind === "ok"
      ? "bg-emerald-700 text-emerald-100"
      : kind === "warn"
      ? "bg-yellow-700 text-yellow-100"
      : "bg-rose-700 text-rose-100";
  return (
    <div
      className={
        "fixed top-20 right-4 z-50 px-3 py-2 rounded text-xs shadow " + cls
      }
    >
      {msg}
    </div>
  );
}

const HK = "triForge.history.v1";

function loadHistory(): HistoryItem[] {
  try {
    const j = localStorage.getItem(HK);
    return j ? JSON.parse(j) : [];
  } catch {
    return [];
  }
}

function saveHistory(arr: HistoryItem[]) {
  try {
    const last30 = arr.slice(-30);
    localStorage.setItem(HK, JSON.stringify(last30));
  } catch {
    // ignora erro
  }
}

function PageContent() {
  const [lang, setLang] = useState<Lang>("en");
  const {
    setIsActive,
    showDemoErrors,
    showFocusOverlay,
    setShowFocusOverlay,
    reducedMotion,
    setReducedMotion,
    setContrastResult,
    previewWidth,
    setPreviewWidth,
  } = useQA();

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLang(getLangFromURL());
  }, []);
  const S = useMemo(() => STR[lang], [lang]);

  const [step, setStep] = useState<Step>(1);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [dsl, setDsl] = useState<UiDsl>(STARTER_DSL);
  const [raw, setRaw] = useState<string | null>(null);
  const [tsx, setTsx] = useState<string | null>(null);
  const [qa, setQa] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    kind: "ok" | "warn" | "err";
  } | null>(null);
  const [tab, setTab] = useState<0 | 1 | 2 | 3>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  function showToast(msg: string, kind: "ok" | "warn" | "err") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    try {
      setHistory(loadHistory());
    } catch {
      // ignora erro
    }
  }, []);

  useEffect(() => {
    if (dsl && dsl !== STARTER_DSL) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [dsl, setIsActive]);

  function addHistory(h: HistoryItem) {
    const arr = [...history, h];
    setHistory(arr);
    saveHistory(arr);
  }

  // NOVA FUNÇÃO: Calcular contraste
  const handleCheckContrast = () => {
    if (!previewRef.current) {
      showToast(
        lang === "pt" ? "Preview não encontrado" : "Preview not found",
        "warn"
      );
      return;
    }

    const textElement = previewRef.current.querySelector(
      "p, span, div, button, h1, h2, h3"
    ) as HTMLElement;
    if (!textElement) {
      showToast(
        lang === "pt"
          ? "Nenhum elemento de texto encontrado"
          : "No text element found",
        "warn"
      );
      return;
    }

    const { textColor, bgColor } = getColorsFromElement(textElement);
    const ratio = calculateContrast(textColor, bgColor);
    const passes = passesWCAG_AA(ratio);

    setContrastResult({ ratio, passes, textColor, bgColor });
    showToast(
      lang === "pt"
        ? `Contraste: ${ratio.toFixed(2)}:1 - ${passes ? "PASS" : "FAIL"}`
        : `Contrast: ${ratio.toFixed(2)}:1 - ${passes ? "PASS" : "FAIL"}`,
      passes ? "ok" : "warn"
    );
  };

  async function callHybridGenerate() {
    try {
      if (!dsl) {
        showToast(
          lang === "pt" ? "Gere um JSON primeiro" : "Generate JSON first",
          "warn"
        );
        return;
      }

      setPreviewState("hybrid");

      const body: any = { dsl };

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "cloud fail");

      const finalDsl: UiDsl = data.dsl || dsl;
      const finalTsx: string = data.tsx || "";
      const finalQa: string = data.qa || "";

      setDsl(finalDsl);
      setTsx(finalTsx);
      setQa(finalQa);
      setTab(3);
      setPreviewState("ready");
      addHistory({
        id: String(Date.now()),
        createdAt: Date.now(),
        lang,
        source: "hybrid",
        dsl: finalDsl,
        tsx: finalTsx,
        qa: finalQa,
      });
      showToast(S.cloudOk, "ok");
    } catch (e: any) {
      setPreviewState("error");
      showToast(S.cloudErr + (e?.message || "error"), "err");
    }
  }

  function trySample(kind: "card" | "login" | "navbar") {
    setStep(2);
    setPreviewState("ready");

    const sample: UiDsl =
      kind === "card"
        ? {
            version: "0.1",
            palette: {
              primary: "#0ea5e9",
              secondary: "#64748b",
              background: "#0f172a",
              foreground: "#f8fafc",
            },
            root: {
              type: "card",
              id: "card1",
              style: { bg: "#1e293b", radius: 16, padding: 24 },
              layout: { gap: 16, align: "start" },
              children: [
                {
                  type: "image",
                  id: "img1",
                  src: "/examples/product-card.png",
                  style: { radius: 12 },
                },
                {
                  type: "text",
                  id: "title1",
                  variant: "title",
                  text: "Wireless Headphones",
                  style: { color: "#f1f5f9" },
                },
                {
                  type: "text",
                  id: "price1",
                  variant: "body",
                  text: "$199.00",
                  style: { color: "#94a3b8" },
                },
                {
                  type: "button",
                  id: "btn1",
                  variant: "primary",
                  text: "Add to cart",
                  style: { bg: "#0ea5e9", radius: 8, padding: 12 },
                },
              ],
            } as any,
          }
        : kind === "navbar"
        ? {
            version: "0.1",
            palette: { primary: "#0ea5e9", background: "#0f172a" },
            root: {
              type: "row",
              id: "navbar",
              layout: { gap: 32, align: "center", justify: "between" },
              style: { bg: "#1e293b", padding: 16 },
              children: [
                {
                  type: "text",
                  id: "brand",
                  variant: "title",
                  text: "Brand",
                  style: { color: "#0ea5e9" },
                },
                {
                  type: "row",
                  id: "nav-links",
                  layout: { gap: 24 },
                  children: [
                    { type: "text", id: "nav1", variant: "body", text: "Home" },
                    {
                      type: "text",
                      id: "nav2",
                      variant: "body",
                      text: "Products",
                    },
                    {
                      type: "text",
                      id: "nav3",
                      variant: "body",
                      text: "Contact",
                    },
                  ],
                },
                {
                  type: "button",
                  id: "signup",
                  variant: "primary",
                  text: "Sign up",
                },
              ],
            } as any,
          }
        : {
            version: "0.1",
            root: {
              type: "column",
              id: "login",
              layout: { gap: 16, align: "stretch" },
              style: { padding: 32, bg: "#1e293b", radius: 16 },
              children: [
                {
                  type: "text",
                  id: "title",
                  variant: "title",
                  text: "Sign in",
                },
                {
                  type: "input",
                  id: "email",
                  placeholder: "Email",
                  style: { radius: 8 },
                },
                {
                  type: "input",
                  id: "password",
                  placeholder: "Password",
                  style: { radius: 8 },
                },
                {
                  type: "button",
                  id: "submit",
                  variant: "primary",
                  text: "Continue",
                  style: { radius: 8 },
                },
              ],
            } as any,
          };

    setImageDataUrl(null);
    setDsl(sample);
    setRaw("sample");
    setTsx(null);
    setQa(null);
    setStep(4);
    setTab(3);
    addHistory({
      id: String(Date.now()),
      createdAt: Date.now(),
      lang,
      source: "sample",
      dsl: sample,
    });
  }

  function loadHistoryItem(it: HistoryItem) {
    setDsl(it.dsl);
    setTsx(it.tsx || null);
    setQa(it.qa || null);
    setRaw(null);
    setStep(4);
    setTab(3);
    setPreviewState("ready");
  }

  function deleteHistoryItem(id: string) {
    const arr = history.filter((h) => h.id !== id);
    setHistory(arr);
    saveHistory(arr);
  }

  // Mapear estados
  const getStateLabel = (state: PreviewState): string => {
    const labels: Record<PreviewState, string> = {
      idle: lang === "pt" ? "Aguardando" : "Idle",
      selected: lang === "pt" ? "Selecionado" : "Selected",
      analyzing: lang === "pt" ? "Analisando" : "Analyzing",
      ready: lang === "pt" ? "Pronto" : "Ready",
      error: lang === "pt" ? "Erro" : "Error",
      hybrid: "Hybrid",
    };
    return labels[state];
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}

      {/* Header */}
      <section className="mb-8 space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
          <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
            {S.headline}
          </span>
        </h1>
        <p className="text-slate-300 max-w-3xl">{S.sub}</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Stepper labels={S.steps} current={step} />
          <div className="text-xs text-slate-400">{S.powered}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-300">{S.try}</span>
          <button
            onClick={() => trySample("card")}
            className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {S.card}
          </button>
          <button
            onClick={() => trySample("login")}
            className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {S.login}
          </button>
          <button
            onClick={() => trySample("navbar")}
            className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {S.navbar}
          </button>
        </div>
      </section>
      {/* LAYOUT 2 COLUNAS PRINCIPAL */}
      <div className="grid lg:grid-cols-[1fr,380px] gap-6">
        {/* COLUNA ESQUERDA - Upload + Preview + Chat */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <section>
            <UploadZone
              lang={lang}
              onDslLoaded={(newDsl: UiDsl) => {
                setDsl(newDsl);
                setPreviewState("ready");
                setStep(4);
                addHistory({
                  id: String(Date.now()),
                  createdAt: Date.now(),
                  lang,
                  source: "upload",
                  dsl: newDsl,
                });
              }}
              onLocalPreview={() => {
                setPreviewState("ready");
              }}
              onHybridGenerate={callHybridGenerate}
              onStateChange={setPreviewState}
            />
            <p className="text-xs text-slate-400 mt-2">{S.privacy}</p>
          </section>

          {/* Preview com Quick Toolbar */}
          {dsl && dsl !== STARTER_DSL && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <strong className="text-slate-200">{S.preview}</strong>
                <span className="text-xs text-slate-400">
                  {getStateLabel(previewState)}
                </span>
              </div>

              <QuickToolbar
                onToggleFocusOverlay={() =>
                  setShowFocusOverlay(!showFocusOverlay)
                }
                onToggleReducedMotion={() => setReducedMotion(!reducedMotion)}
                onCheckContrast={handleCheckContrast}
                onChangeWidth={setPreviewWidth}
                currentWidth={previewWidth}
                showFocusOverlay={showFocusOverlay}
                reducedMotion={reducedMotion}
              />

              <div
                ref={previewRef}
                className={`relative ${
                  showDemoErrors ? "qa-demo-errors" : ""
                } ${reducedMotion ? "reduced-motion" : ""}`}
              >
                <PreviewFrame state={previewState} title={S.preview}>
                  <div
                    className={`preview-width-wrapper w-${previewWidth} mx-auto transition-all duration-300`}
                  >
                    <div className="min-h-[300px] flex items-center justify-center p-4">
                      <RenderDSL dsl={dsl} />
                    </div>
                  </div>

                  {showFocusOverlay && (
                    <FocusOrderOverlay containerRef={previewRef} />
                  )}
                </PreviewFrame>
              </div>
            </div>
          )}

          {/* Chat Panel */}
          {dsl && dsl !== STARTER_DSL && (
            <ChatPanel
              dsl={dsl}
              onUpdate={(newDsl: UiDsl) => {
                setDsl(newDsl);
                showToast(
                  lang === "pt"
                    ? "DSL atualizado via chat"
                    : "DSL updated via chat",
                  "ok"
                );
              }}
            />
          )}

          {/* Tabs de JSON/TSX/QA */}
          {dsl && dsl !== STARTER_DSL && (
            <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
              <div className="flex gap-2 text-xs overflow-x-auto pb-2">
                {S.tabs.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setTab(i as 0 | 1 | 2 | 3)}
                    className={
                      "px-3 py-1 rounded-full ring-1 whitespace-nowrap transition-all " +
                      (tab === i
                        ? "bg-slate-800 text-white ring-slate-600"
                        : "bg-slate-800/40 text-slate-300 ring-slate-700 hover:bg-slate-800/70")
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === 0 && (
                <div>
                  <pre className="text-xs overflow-auto bg-slate-950 p-3 rounded max-h-96">
                    {JSON.stringify(dsl, null, 2)}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(
                            JSON.stringify(dsl, null, 2)
                          );
                          showToast(S.copyJson + " ✓", "ok");
                        } catch {
                          // ignora erro
                        }
                      }}
                      className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      {S.copyJson}
                    </button>
                  </div>
                </div>
              )}

              {tab === 1 && (
                <div>
                  <pre className="text-xs overflow-auto bg-slate-950 p-3 rounded max-h-96">
                    {tsx || "// (empty)"}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(tsx || "");
                          showToast(S.copyTsx + " ✓", "ok");
                        } catch {
                          // ignora erro
                        }
                      }}
                      className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                    >
                      {S.copyTsx}
                    </button>
                  </div>
                </div>
              )}

              {tab === 2 && (
                <div>
                  <div className="bg-slate-950 p-4 rounded max-h-96 overflow-auto">
                    <p className="text-xs text-slate-400">
                      {qa ||
                        (lang === "pt"
                          ? "Nenhuma sugestão QA disponível"
                          : "No QA suggestions available")}
                    </p>
                  </div>
                </div>
              )}

              {tab === 3 && (
                <div className="rounded-lg border-2 border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 p-8 min-h-[200px] flex items-center justify-center">
                  <RenderDSL dsl={dsl} />
                </div>
              )}
            </section>
          )}

          {/* History */}
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-2">
              {S.history}
            </h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">—</p>
            ) : (
              <ul className="space-y-2">
                {history
                  .slice()
                  .reverse()
                  .map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded"
                    >
                      <span>
                        {new Date(it.createdAt).toLocaleString()} · {it.source}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadHistoryItem(it)}
                          className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        >
                          {S.load}
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(it.id)}
                          className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        >
                          {S.remove}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
        {/* COLUNA DIREITA - QA Checklist */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <QAChecklist />
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <QAProvider>
      <PageContent />
    </QAProvider>
  );
}
