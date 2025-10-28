// components/qa/PreviewFrame.tsx
"use client";
import React, { ReactNode } from "react";

// ✅ INCLUIR 'hybrid' no tipo
export type PreviewState =
  | "idle"
  | "selected"
  | "analyzing"
  | "ready"
  | "error"
  | "hybrid";

export function PreviewFrame({
  children,
  state = "idle",
  title,
}: {
  children: ReactNode;
  state?: PreviewState;
  title?: string;
}) {
  const borderColors: Record<PreviewState, string> = {
    idle: "border-slate-600",
    selected: "border-blue-500",
    analyzing: "border-yellow-500 animate-pulse",
    ready: "border-green-500",
    error: "border-red-500",
    hybrid: "border-purple-500", // ✅ ADICIONADO
  };

  const bgColors: Record<PreviewState, string> = {
    idle: "bg-slate-900",
    selected: "bg-slate-900",
    analyzing: "bg-yellow-900/10",
    ready: "bg-green-900/10",
    error: "bg-red-900/10",
    hybrid: "bg-purple-900/10", // ✅ ADICIONADO
  };

  const statusLabels: Record<PreviewState, string> = {
    idle: "Aguardando",
    selected: "Selecionado",
    analyzing: "Analisando...",
    ready: "Pronto",
    error: "Erro",
    hybrid: "Hybrid", // ✅ ADICIONADO
  };

  const statusColors: Record<PreviewState, string> = {
    idle: "text-slate-400",
    selected: "text-blue-400",
    analyzing: "text-yellow-400",
    ready: "text-green-400",
    error: "text-red-400",
    hybrid: "text-purple-400", // ✅ ADICIONADO
  };

  return (
    <div
      className={`rounded-xl border-2 ${borderColors[state]} ${bgColors[state]} overflow-hidden transition-all duration-300`}
    >
      {title && (
        <div className="border-b border-slate-700 px-4 py-3 flex items-center justify-between bg-slate-800/50">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <span className={`text-xs font-medium ${statusColors[state]}`}>
            {statusLabels[state]}
          </span>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
