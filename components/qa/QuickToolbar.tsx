// components/qa/QuickToolbar.tsx
"use client";
import React from "react";

type PreviewWidth = "full" | "320" | "768" | "1024";

export function QuickToolbar({
  onToggleFocusOverlay,
  onToggleReducedMotion,
  onCheckContrast,
  onChangeWidth,
  currentWidth,
  showFocusOverlay,
  reducedMotion,
}: {
  onToggleFocusOverlay: () => void;
  onToggleReducedMotion: () => void;
  onCheckContrast: () => void;
  onChangeWidth: (w: PreviewWidth) => void;
  currentWidth: PreviewWidth;
  showFocusOverlay: boolean;
  reducedMotion: boolean;
}) {
  const widths: { label: string; value: PreviewWidth }[] = [
    { label: "Full", value: "full" },
    { label: "320px", value: "320" },
    { label: "768px", value: "768" },
    { label: "1024px", value: "1024" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-800/50 border-b border-slate-700">
      {/* Focus Overlay */}
      <button
        onClick={onToggleFocusOverlay}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
          showFocusOverlay
            ? "bg-blue-600 text-white shadow-lg"
            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
        }`}
        title="Mostrar ordem de foco (Tab)"
      >
        🎯 {showFocusOverlay ? "Foco ON" : "Testar Foco"}
      </button>

      {/* Reduced Motion */}
      <button
        onClick={onToggleReducedMotion}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
          reducedMotion
            ? "bg-purple-600 text-white shadow-lg"
            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
        }`}
        title="Desativar animações"
      >
        ⏸️ {reducedMotion ? "Motion OFF" : "Reduced Motion"}
      </button>

      {/* Contrast Check */}
      <button
        onClick={onCheckContrast}
        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
        title="Verificar contraste de cores"
      >
        🎨 Checar Contraste
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-600" />

      {/* Width Controls */}
      <span className="text-xs text-slate-400 font-medium">Largura:</span>
      {widths.map((w) => (
        <button
          key={w.value}
          onClick={() => onChangeWidth(w.value)}
          className={`text-xs px-2.5 py-1.5 rounded font-mono transition-all ${
            currentWidth === w.value
              ? "bg-green-600 text-white shadow-lg"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
