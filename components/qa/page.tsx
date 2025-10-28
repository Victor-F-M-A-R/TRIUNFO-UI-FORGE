// app/qa/page.tsx
"use client";
import React from "react";

export default function QAPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
          QA Dashboard
        </h1>
        <p className="text-slate-400 mb-8">
          Página dedicada para análise de qualidade e acessibilidade
        </p>

        <div className="grid gap-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-3">
              Análise de Acessibilidade
            </h2>
            <p className="text-sm text-slate-400">
              Ferramentas e relatórios de acessibilidade serão exibidos aqui.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-3">
              Checklist de Qualidade
            </h2>
            <ul className="list-disc list-inside text-sm text-slate-400 space-y-2">
              <li>Verificação de contraste WCAG AA/AAA</li>
              <li>Ordem de foco de teclado</li>
              <li>Responsividade em múltiplos breakpoints</li>
              <li>Suporte a reduced motion</li>
              <li>Semântica HTML adequada</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-3">Relatórios</h2>
            <p className="text-sm text-slate-400">
              Histórico de análises e exportação de relatórios em Markdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
