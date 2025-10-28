// components/qa/QAPanel.tsx
"use client";
import React, { useState } from "react";
import { useQA, type QAItem } from "./QAProvider";
import { MarkdownExportButton } from "./MarkdownExport";

type Lang = "pt" | "en";

export function QAPanel({ lang = "pt" }: { lang?: Lang }) {
  const {
    items,
    addQuestion,
    clearAll,
    isActive,
    showDemoErrors,
    setShowDemoErrors,
    contrastResult,
  } = useQA();

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const labels = {
    pt: {
      title: "Painel de Perguntas",
      placeholder: "Faça uma pergunta sobre o design...",
      send: "Enviar",
      clear: "Limpar tudo",
      empty: "Nenhuma pergunta ainda. Faça uma pergunta sobre o design!",
      sending: "Enviando...",
      demoErrors: "Mostrar Exemplos de Erro",
      contrast: "Contraste",
    },
    en: {
      title: "Q&A Panel",
      placeholder: "Ask a question about the design...",
      send: "Send",
      clear: "Clear all",
      empty: "No questions yet. Ask something about the design!",
      sending: "Sending...",
      demoErrors: "Show Error Examples",
      contrast: "Contrast",
    },
  };

  const t = labels[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);

    setTimeout(() => {
      const mockAnswer =
        lang === "pt"
          ? `Esta é uma resposta simulada para: "${question}"`
          : `This is a mock answer for: "${question}"`;
      addQuestion(question, mockAnswer);
      setQuestion("");
      setLoading(false);
    }, 1000);
  };

  if (!isActive) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-400">
          {lang === "pt"
            ? "Carregue uma imagem para ativar o painel de perguntas"
            : "Upload an image to activate the Q&A panel"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-700 px-4 py-3 bg-slate-800/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">{t.title}</h3>
          <div className="flex gap-2">
            <MarkdownExportButton lang={lang} />
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs px-2 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {t.clear}
              </button>
            )}
          </div>
        </div>

        {/* Demo Errors Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDemoErrors}
            onChange={(e) => setShowDemoErrors(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-300">{t.demoErrors}</span>
        </label>

        {/* Contrast Result */}
        {contrastResult && (
          <div
            className={`text-xs p-2 rounded ${
              contrastResult.passes
                ? "bg-green-900/30 border border-green-700 text-green-200"
                : "bg-red-900/30 border border-red-700 text-red-200"
            }`}
          >
            <div className="font-semibold mb-1">{t.contrast}:</div>
            <div>
              Ratio:{" "}
              <span className="font-mono">
                {contrastResult.ratio.toFixed(2)}:1
              </span>
            </div>
            <div>{contrastResult.passes ? "✅ PASS (AA)" : "❌ FAIL"}</div>
            <div className="flex gap-2 mt-1">
              <span
                className="inline-block w-4 h-4 rounded border border-slate-600"
                style={{ backgroundColor: contrastResult.textColor }}
              />
              <span
                className="inline-block w-4 h-4 rounded border border-slate-600"
                style={{ backgroundColor: contrastResult.bgColor }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-8">
            {t.empty}
          </p>
        ) : (
          items.map((item: QAItem) => (
            <div key={item.id} className="space-y-2">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-200">{item.question}</p>
                <span className="text-xs text-blue-400/60 mt-1 block">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 ml-4">
                <p className="text-sm text-slate-300">{item.answer}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-700 p-4 bg-slate-900/50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.placeholder}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {loading ? t.sending : t.send}
          </button>
        </div>
      </form>
    </div>
  );
}
