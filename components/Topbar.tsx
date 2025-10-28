"use client";
import { useEffect, useState } from "react";
import StatusPill from "./StatusPill";
type Lang = "en" | "pt";

function getLangFromURL(): Lang {
  if (typeof window === "undefined") return "en";
  const p = new URLSearchParams(window.location.search);
  return (p.get("lang") === "pt" ? "pt" : "en") as Lang;
}

/* Hybrid pronto + switch (tradução EN/PT e sincronismo com StatusPill) */
function HybridControl({ lang }: { lang: Lang }) {
  const TXT = {
    en: { ready: "Hybrid ready", on: "ON", off: "OFF" },
    pt: { ready: "Hybrid pronto", on: "LIGADO", off: "DESLIGADO" },
  } as const;

  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      setOn(localStorage.getItem("uiForge.forceCloud") === "1");
      // Sincroniza com alterações em outras partes da UI (evento custom)
      const onCustom = (e: Event) => {
        try {
          const detail = (e as CustomEvent<boolean>).detail;
          if (typeof detail === "boolean") setOn(detail);
        } catch {}
      };
      window.addEventListener(
        "uiForgeHybridChanged",
        onCustom as EventListener
      );

      // Sincroniza com outras abas/janelas (evento storage)
      const onStorage = (e: StorageEvent) => {
        if (e.key === "uiForge.forceCloud") setOn(e.newValue === "1");
      };
      window.addEventListener("storage", onStorage);

      return () => {
        window.removeEventListener(
          "uiForgeHybridChanged",
          onCustom as EventListener
        );
        window.removeEventListener("storage", onStorage);
      };
    } catch {}
  }, []);

  function toggle() {
    const next = !on;
    try {
      localStorage.setItem("uiForge.forceCloud", next ? "1" : "0");
    } catch {}
    setOn(next);
    // Dispara evento para sincronizar com outros componentes (ex.: StatusPill)
    try {
      window.dispatchEvent(
        new CustomEvent("uiForgeHybridChanged", { detail: next })
      );
    } catch {}
  }

  return (
    <div className="inline-flex items-center gap-2">
      {/* Pill no mesmo porte do Built‑in AI */}
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/50 bg-emerald-700 text-emerald-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        {TXT[lang].ready}
      </span>
      {/* Switch deslizante ON/OFF */}
      <button
        onClick={toggle}
        role="switch"
        aria-checked={on}
        className={
          "relative h-5 w-10 rounded-full transition-colors " +
          (on ? "bg-emerald-500" : "bg-slate-600")
        }
        title={on ? TXT[lang].on : TXT[lang].off}
      >
        <span
          className={
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform " +
            (on ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}

export default function Topbar() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    setLang(getLangFromURL());
  }, []);

  function setLangInURL(next: Lang) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.location.href = url.toString();
  }

  return (
    <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-semibold">
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Triunfo UI Forge
            </span>
          </a>
          <a href="/" className="text-sm text-slate-300 hover:text-white">
            Home
          </a>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 border border-amber-500/50">
            Alpha
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            className="text-sm text-slate-300 hover:text-white"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>

          {/* EN/PT */}
          <div className="ml-2 text-xs rounded border border-slate-700 overflow-hidden">
            <button
              onClick={() => setLangInURL("en")}
              className={
                "px-2 py-1 " +
                (lang === "en"
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800")
              }
            >
              EN
            </button>
            <button
              onClick={() => setLangInURL("pt")}
              className={
                "px-2 py-1 " +
                (lang === "pt"
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800")
              }
            >
              PT
            </button>
          </div>

          {/* Built‑in AI */}
          <StatusPill lang={lang} />

          {/* Hybrid pronto + switch traduzidos */}
          <HybridControl lang={lang} />
        </div>
      </div>
    </div>
  );
}
