// components/qa/MarkdownExport.tsx
"use client";
import React from "react";
import { useQA, type ContrastResult } from "./QAProvider";

export function MarkdownExportButton({ lang = "pt" }: { lang?: "pt" | "en" }) {
  const { items, contrastResult, panelOpenedAt } = useQA();

  const generateMarkdown = (): string => {
    const now = Date.now();
    const elapsed = Math.round((now - panelOpenedAt) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    let md = `# QA Report\n\n`;
    md += `**Gerado em:** ${new Date().toLocaleString()}\n`;
    md += `**Tempo de sessão:** ${minutes}m ${seconds}s\n\n`;

    if (contrastResult) {
      md += `## 🎨 Contraste\n\n`;
      md += `- **Ratio:** ${contrastResult.ratio.toFixed(2)}:1\n`;
      md += `- **Status:** ${
        contrastResult.passes ? "✅ PASS (AA)" : "❌ FAIL"
      }\n`;
      md += `- **Cores:** ${contrastResult.textColor} sobre ${contrastResult.bgColor}\n\n`;
    }

    if (items.length > 0) {
      md += `## 💬 Perguntas & Respostas (${items.length})\n\n`;
      items.forEach((item, i) => {
        md += `### ${i + 1}. ${item.question}\n\n`;
        md += `${item.answer}\n\n`;
        md += `*${new Date(item.timestamp).toLocaleString()}*\n\n`;
        md += `---\n\n`;
      });
    }

    md += `## ✅ Checklist\n\n`;
    md += `- [ ] Contraste adequado (AA 4.5:1)\n`;
    md += `- [ ] Ordem de foco lógica\n`;
    md += `- [ ] Responsividade (320px, 768px, 1024px)\n`;
    md += `- [ ] Reduced motion respeitado\n`;
    md += `- [ ] Textos alternativos em imagens\n`;
    md += `- [ ] Formulários com labels\n`;

    return md;
  };

  const handleExport = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    alert(lang === "pt" ? "📋 Markdown copiado!" : "📋 Markdown copied!");
  };

  return (
    <button
      onClick={handleExport}
      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-lg"
      title={
        lang === "pt"
          ? "Exportar relatório em Markdown"
          : "Export report as Markdown"
      }
    >
      📄 {lang === "pt" ? "Copiar QA (Markdown)" : "Copy QA (Markdown)"}
    </button>
  );
}
