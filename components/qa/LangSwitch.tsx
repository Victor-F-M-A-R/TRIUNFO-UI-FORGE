"use client";

import React from "react";
import type { Lang } from "@/lib/i18n";

export default function LangSwitch({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Idioma:</span>
      <button
        className="qa-btn"
        onClick={() => setLang("pt")}
        style={{ opacity: lang === "pt" ? 1 : 0.6 }}
      >
        PT
      </button>
      <button
        className="qa-btn"
        onClick={() => setLang("en")}
        style={{ opacity: lang === "en" ? 1 : 0.6 }}
      >
        EN
      </button>
    </div>
  );
}
