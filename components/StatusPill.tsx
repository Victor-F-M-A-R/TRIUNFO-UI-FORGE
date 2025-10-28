"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    ai?: any;
  }
}

type Lang = "en" | "pt";
type PillState = "checking" | "on" | "text" | "off";
type ProbeMode =
  | "multi"
  | "text"
  | "session"
  | "writerGroup"
  | "no_ai"
  | "timeout"
  | "error";

const STR = {
  en: {
    checking: "Checking…",
    on: "On-device: Prompt API (Gemini Nano)",
    textOnly: "On-device: text APIs only",
    off: "Built-in AI unavailable",
    how: "How to enable",
    again: "Check again",
    popTitle: "Enable on-device AI",
    flagsTitle: "Turn on in chrome://flags:",
    f1: "Prompt API for Gemini Nano (or Enabled Multilingual)",
    f2: "Prompt API for Gemini Nano with Multimodal Input",
    f3: "Summarization / Writer / Rewriter / Proofreader (optional, text)",
    diag: "Diagnostic",
    probeNow: "Probe now",
    runDiag: "Run diagnostics",
    running: "Running…",
    diagDone: "Diagnostics done ✓",
    copyDiag: "Copy diagnostics",
    openDocs: "Open full guide",
    tip: "Enable the two Prompt API flags and restart Chrome. If still unavailable, use Hybrid.",
    toastAvail: "On-device: available",
    toastText: "Text-only: local text APIs available",
    toastOff: "On-device: unavailable",
    reason: {
      multi: "Multimodal prompt responded.",
      text: "Text prompt responded.",
      session: "Text session responded.",
      writer: "Text-only APIs present.",
      no_ai: "window.ai not present.",
      timeout: "Probes timed out.",
      error: "Probes failed.",
    },
    lastProbe: "Last probe",
    lastDiag: "Last diagnostics",
    resultsNote: "These results come from active probes run by the app.",
    now: "just now",
    sAgo: (s: number) => `${s}s ago`,
    mAgo: (m: number) => `${m}m ago`,
    yes: "yes",
    no: "no",
  },
  pt: {
    checking: "Verificando…",
    on: "On‑device: Prompt API (Gemini Nano)",
    textOnly: "On‑device: apenas APIs de texto",
    off: "Built‑in AI indisponível",
    how: "Como habilitar",
    again: "Checar novamente",
    popTitle: "Habilitar on‑device AI",
    flagsTitle: "Ative em chrome://flags:",
    f1: "Prompt API for Gemini Nano (ou Enabled Multilingual)",
    f2: "Prompt API for Gemini Nano with Multimodal Input",
    f3: "Summarization / Writer / Rewriter / Proofreader (opcional, texto)",
    diag: "Diagnóstico",
    probeNow: "Procurar agora",
    runDiag: "Rodar diagnóstico",
    running: "Rodando…",
    diagDone: "Diagnóstico concluído ✓",
    copyDiag: "Copiar diagnóstico",
    openDocs: "Abrir guia completo",
    tip: "Ative as duas flags de Prompt API e reinicie o Chrome. Se ainda indisponível, use Hybrid.",
    toastAvail: "On-device: disponível",
    toastText: "Text-only: APIs de texto locais disponíveis",
    toastOff: "On-device: indisponível",
    reason: {
      multi: "Prompt multimodal respondeu.",
      text: "Prompt de texto respondeu.",
      session: "Sessão de texto respondeu.",
      writer: "APIs apenas de texto presentes.",
      no_ai: "window.ai não presente.",
      timeout: "Probes excederam o tempo.",
      error: "Probes falharam.",
    },
    lastProbe: "Última verificação",
    lastDiag: "Último diagnóstico",
    resultsNote:
      "Esses resultados vêm de verificações ativas executadas pelo app.",
    now: "agora",
    sAgo: (s: number) => `${s}s atrás`,
    mAgo: (m: number) => `${m}min atrás`,
    yes: "sim",
    no: "não",
  },
};

function getChromeVersion(): string {
  try {
    const m = navigator.userAgent.match(/Chrome\/(\d+)/);
    return m ? "Chrome " + m[1] : "Unknown";
  } catch {
    return "Unknown";
  }
}

function isSecure(): boolean {
  return (
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  );
}

function readCaps() {
  const ai: any =
    typeof window !== "undefined" ? (window as any).ai : undefined;
  return {
    present: !!ai,
    prompt: typeof ai?.prompt === "function",
    session: typeof ai?.createTextSession === "function",
    writer: typeof ai?.writer === "function",
    rewriter: typeof ai?.rewriter === "function",
    proofreader: typeof ai?.proofreader === "function",
    summarizer: typeof ai?.summarizer === "function",
  };
}

/* Probes com timeout curto */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

const tinyPNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO4Yv9wAAAAASUVORK5CYII=";

async function probeMultimodal(ai: any): Promise<boolean> {
  if (typeof ai?.prompt !== "function") return false;
  try {
    await withTimeout(
      ai.prompt({
        messages: [
          {
            role: "user",
            parts: [
              { text: "ping" },
              { inlineData: { mimeType: "image/png", data: tinyPNG } },
            ],
          },
        ],
      }),
      1000
    );
    return true;
  } catch {
    return false;
  }
}

async function probeText(ai: any): Promise<boolean> {
  if (typeof ai?.prompt !== "function") return false;
  try {
    await withTimeout(ai.prompt("ping"), 800);
    return true;
  } catch {
    return false;
  }
}

async function probeSession(ai: any): Promise<boolean> {
  if (typeof ai?.createTextSession !== "function") return false;
  try {
    const s: any = await withTimeout(ai.createTextSession(), 600);
    await withTimeout(s.prompt("ping"), 800);
    return true;
  } catch {
    return false;
  }
}

async function runProbes(): Promise<{ state: PillState; mode: ProbeMode }> {
  const ai: any =
    typeof window !== "undefined" ? (window as any).ai : undefined;
  if (!ai) return { state: "off", mode: "no_ai" };

  try {
    if (await probeMultimodal(ai)) return { state: "on", mode: "multi" };
    if (await probeText(ai)) return { state: "on", mode: "text" };
    if (await probeSession(ai)) return { state: "on", mode: "session" };
    const caps = readCaps();
    if (caps.writer || caps.rewriter || caps.proofreader || caps.summarizer)
      return { state: "text", mode: "writerGroup" };
    return { state: "off", mode: "error" };
  } catch (e: any) {
    if (String(e?.message || "").includes("timeout"))
      return { state: "off", mode: "timeout" };
    return { state: "off", mode: "error" };
  }
}

/* Hybrid helpers (evento custom para sincronizar) */
function getHybrid(): boolean {
  try {
    return localStorage.getItem("uiForge.forceCloud") === "1";
  } catch {
    return false;
  }
}

function setHybrid(value: boolean) {
  try {
    localStorage.setItem("uiForge.forceCloud", value ? "1" : "0");
    window.dispatchEvent(
      new CustomEvent("uiForgeHybridChanged", { detail: value })
    );
  } catch {}
}

/* Tempo relativo */
function since(ts: number, lang: Lang): string {
  const delta = Math.floor((Date.now() - ts) / 1000);
  if (delta < 5) return STR[lang].now;
  if (delta < 60) return STR[lang].sAgo(delta);
  const m = Math.floor(delta / 60);
  return STR[lang].mAgo(m);
}

/* Componente */
export default function StatusPill({ lang }: { lang: Lang }) {
  const S = STR[lang];
  const [state, setState] = useState<PillState>("checking");
  const [mode, setMode] = useState<ProbeMode>("no_ai");
  const [note, setNote] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    kind: "ok" | "warn" | "err";
  } | null>(null);
  const [hybrid, setHybridState] = useState<boolean>(false);
  const [lastProbeAt, setLastProbeAt] = useState<number | null>(null);
  const [lastDiagAt, setLastDiagAt] = useState<number | null>(null);
  const [diagStatus, setDiagStatus] = useState<"idle" | "running" | "done">(
    "idle"
  );

  // Refs para fechar popover ao clicar fora / Esc
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHybridState(getHybrid());
  }, []);

  function showToast(msg: string, kind: "ok" | "warn" | "err") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2200);
  }

  function apply(next: PillState, reason: ProbeMode) {
    setMode(reason);
    const reasonMsg =
      reason === "multi"
        ? S.reason.multi
        : reason === "text"
        ? S.reason.text
        : reason === "session"
        ? S.reason.session
        : reason === "writerGroup"
        ? S.reason.writer
        : reason === "timeout"
        ? S.reason.timeout
        : reason === "no_ai"
        ? S.reason.no_ai
        : S.reason.error;

    if (next === "on") {
      setState("on");
      setNote(reasonMsg);
      showToast(S.toastAvail, "ok");
    } else if (next === "text") {
      setState("text");
      setNote(reasonMsg);
      showToast(S.toastText, "warn");
    } else {
      setState("off");
      setNote(reasonMsg + " · " + S.tip);
      showToast(S.toastOff, "err");
    }
    setLastProbeAt(Date.now());
  }

  async function detect() {
    setState("checking");
    setNote("");
    const result = await runProbes();
    setTimeout(() => apply(result.state, result.mode), 500);
  }

  function runDiagnostics() {
    setDiagStatus("running");
    const caps = readCaps();
    console.group("[Triunfo UI Forge] Diagnostics");
    console.table(caps);
    console.log("!!window.ai", !!(window as any).ai);
    console.log("typeof window.ai?.prompt", typeof (window as any).ai?.prompt);
    console.log(
      "typeof window.ai?.createTextSession",
      typeof (window as any).ai?.createTextSession
    );
    console.log("typeof window.ai?.writer", typeof (window as any).ai?.writer);
    console.log(
      "typeof window.ai?.rewriter",
      typeof (window as any).ai?.rewriter
    );
    console.log(
      "typeof window.ai?.proofreader",
      typeof (window as any).ai?.proofreader
    );
    console.log(
      "typeof window.ai?.summarizer",
      typeof (window as any).ai?.summarizer
    );
    console.log("isSecureContext", window.isSecureContext);
    console.log("crossOriginIsolated", (self as any).crossOriginIsolated);
    console.log("userAgent", navigator.userAgent);
    console.groupEnd();
    setLastDiagAt(Date.now());
    setTimeout(() => setDiagStatus("done"), 300);
    showToast(
      lang === "pt" ? "Diagnóstico concluído" : "Diagnostics done",
      "ok"
    );
  }

  function copyDiagnostics() {
    const caps = readCaps();
    const payload = {
      result: { state, mode, lastProbeAt, lastDiagAt },
      chrome: getChromeVersion(),
      secureContext: window.isSecureContext,
      crossOriginIsolated: (self as any).crossOriginIsolated,
      caps,
    };
    try {
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast(
        lang === "pt" ? "Diagnóstico copiado ✓" : "Diagnostics copied ✓",
        "ok"
      );
    } catch {}
  }

  function toggleHybrid() {
    const now = !hybrid;
    setHybrid(now);
    setHybridState(now);
  }

  // Fecha popover ao clicar fora e com Esc
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    detect();
  }, []);

  const label =
    state === "checking"
      ? S.checking
      : state === "on"
      ? S.on
      : state === "text"
      ? S.textOnly
      : S.off;
  const wrap =
    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border " +
    (state === "checking"
      ? "bg-yellow-700 text-yellow-100 border-yellow-500 animate-pulse"
      : state === "on"
      ? "bg-emerald-700 text-emerald-100 border-emerald-500"
      : "bg-rose-700 text-rose-100 border-rose-500");

  return (
    <>
      <span className="relative">
        <span className={wrap}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {label}
          <button
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            className="ml-2 underline hover:opacity-80"
          >
            {S.how}
          </button>
          <button
            onClick={detect}
            className="ml-2 text-slate-300 hover:text-white"
          >
            {S.again}
          </button>
        </span>

        {open && (
          <div
            ref={popoverRef}
            className="absolute right-0 mt-2 w-96 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 shadow-xl z-50"
          >
            <div className="font-semibold mb-2">{S.popTitle}</div>
            <div className="mb-2">{S.flagsTitle}</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>{S.f1}</li>
              <li>{S.f2}</li>
              <li>{S.f3}</li>
            </ul>

            <div className="mt-3 font-semibold">{S.diag}</div>
            <ul className="ml-0 mt-1 space-y-1">
              <li>Chrome: {getChromeVersion()}</li>
              <li>Secure context: {isSecure() ? S.yes : S.no}</li>
              <li>
                crossOriginIsolated:{" "}
                {(self as any).crossOriginIsolated ? S.yes : S.no}
              </li>
              <li>window.ai: {readCaps().present ? S.yes : S.no}</li>
              <li>
                prompt/session:{" "}
                {readCaps().prompt || readCaps().session ? S.yes : S.no}
              </li>
              <li>
                text APIs:{" "}
                {readCaps().writer ||
                readCaps().rewriter ||
                readCaps().proofreader ||
                readCaps().summarizer
                  ? S.yes
                  : S.no}
              </li>
            </ul>

            {(lastProbeAt || lastDiagAt) && (
              <div className="mt-2 text-slate-300">
                <div>
                  {S.lastProbe}: {lastProbeAt ? since(lastProbeAt, lang) : "—"}
                </div>
                <div>
                  {S.lastDiag}: {lastDiagAt ? since(lastDiagAt, lang) : "—"}
                </div>
                <div className="text-slate-400 mt-1">{S.resultsNote}</div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={detect}
                  className="px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  {S.probeNow}
                </button>
                <button
                  onClick={runDiagnostics}
                  disabled={diagStatus === "running"}
                  className={
                    "px-2 py-1 rounded border border-slate-700 text-slate-200 " +
                    (diagStatus === "running"
                      ? "bg-slate-700 opacity-70"
                      : "bg-slate-800 hover:bg-slate-700")
                  }
                >
                  {diagStatus === "running"
                    ? S.running
                    : lastDiagAt
                    ? S.diagDone
                    : S.runDiag}
                </button>
                <button
                  onClick={copyDiagnostics}
                  className="px-2 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  {S.copyDiag}
                </button>
              </div>
              <a
                className="text-sky-300 hover:underline"
                href="/docs"
                target="_blank"
                rel="noreferrer"
              >
                {S.openDocs}
              </a>
            </div>

            {note && <div className="mt-2 text-slate-300">{note}</div>}
          </div>
        )}
      </span>

      {toast && (
        <div
          className={
            "fixed top-20 right-4 z-50 px-3 py-2 rounded text-xs shadow " +
            (toast.kind === "ok"
              ? "bg-emerald-700 text-emerald-100"
              : toast.kind === "warn"
              ? "bg-yellow-700 text-yellow-100"
              : "bg-rose-700 text-rose-100")
          }
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
