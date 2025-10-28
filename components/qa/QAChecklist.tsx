// components/qa/QAChecklist.tsx
"use client";
import React from "react";
import { useQA } from "./QAProvider";

export function QAChecklist() {
  const { isActive, contrastResult, showDemoErrors, setShowDemoErrors } =
    useQA();

  if (!isActive) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          QA Checklist
        </h2>
        <p className="text-sm text-slate-400">
          Carregue um design para começar a análise de qualidade
        </p>
      </div>
    );
  }

  const handleExportMarkdown = () => {
    const checklist = [
      "Contraste adequado (WCAG AA)",
      "Ordem de foco lógica",
      "Design responsivo",
      "Reduced motion respeitado",
      "Textos alternativos",
      "Labels em formulários",
    ];

    let md = `# QA Checklist Report\n\n`;
    md += `**Data:** ${new Date().toLocaleString()}\n\n`;

    if (contrastResult) {
      md += `## Contraste\n`;
      md += `- Ratio: ${contrastResult.ratio.toFixed(2)}:1\n`;
      md += `- Status: ${contrastResult.passes ? "✅ PASS" : "❌ FAIL"}\n\n`;
    }

    md += `## Checklist\n\n`;
    checklist.forEach((item) => {
      md += `- [ ] ${item}\n`;
    });

    navigator.clipboard.writeText(md);
    alert("✅ Relatório copiado para a área de transferência!");
  };

  const checklist = [
    {
      id: "contrast",
      label: "Contraste adequado (WCAG AA)",
      status: contrastResult
        ? contrastResult.passes
          ? "pass"
          : "fail"
        : "pending",
    },
    {
      id: "focus",
      label: "Ordem de foco lógica",
      status: "pending",
    },
    {
      id: "responsive",
      label: "Design responsivo",
      status: "pending",
    },
    {
      id: "motion",
      label: "Reduced motion respeitado",
      status: "pending",
    },
    {
      id: "alt",
      label: "Textos alternativos",
      status: "pending",
    },
    {
      id: "labels",
      label: "Labels em formulários",
      status: "pending",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">QA Checklist</h2>
        <button
          onClick={handleExportMarkdown}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-lg"
          title="Exportar relatório em Markdown"
        >
          📄 Exportar MD
        </button>
      </div>

      {/* Toggle Demo Errors */}
      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-slate-800/50 border border-slate-700">
        <input
          type="checkbox"
          checked={showDemoErrors}
          onChange={(e) => setShowDemoErrors(e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-300">
          Modo Demonstração (mostrar erros)
        </span>
      </label>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                item.status === "pass"
                  ? "bg-green-600 text-white"
                  : item.status === "fail"
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {item.status === "pass"
                ? "✓"
                : item.status === "fail"
                ? "✗"
                : "?"}
            </div>
            <span className="text-sm text-slate-300 flex-1">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Contrast Details */}
      {contrastResult && (
        <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            Detalhes do Contraste
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Ratio:</span>
              <span className="text-slate-200 font-mono">
                {contrastResult.ratio.toFixed(2)}:1
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span
                className={
                  contrastResult.passes ? "text-green-400" : "text-red-400"
                }
              >
                {contrastResult.passes ? "PASS" : "FAIL"}
              </span>
            </div>
            <div className="flex gap-2 items-center mt-2">
              <span className="text-slate-400 text-xs">Cores:</span>
              <div
                className="w-6 h-6 rounded border border-slate-600"
                style={{ backgroundColor: contrastResult.textColor }}
                title={contrastResult.textColor}
              />
              <div
                className="w-6 h-6 rounded border border-slate-600"
                style={{ backgroundColor: contrastResult.bgColor }}
                title={contrastResult.bgColor}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="pt-3 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-green-400 font-bold">
              {checklist.filter((i) => i.status === "pass").length}
            </div>
            <div className="text-slate-500">Passou</div>
          </div>
          <div>
            <div className="text-red-400 font-bold">
              {checklist.filter((i) => i.status === "fail").length}
            </div>
            <div className="text-slate-500">Falhou</div>
          </div>
          <div>
            <div className="text-slate-400 font-bold">
              {checklist.filter((i) => i.status === "pending").length}
            </div>
            <div className="text-slate-500">Pendente</div>
          </div>
        </div>
      </div>
    </div>
  );
}
