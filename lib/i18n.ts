// lib/i18n.ts
export type Lang = "pt" | "en";

type TranslationKey =
  | "drop_idle"
  | "try_sample"
  | "drop_hover"
  | "selected_ready"
  | "ondev_unavailable"
  | "file_line"
  | "analyzing"
  | "replace"
  | "remove"
  | "analyze_on_device"
  | "generate_hybrid";

const translations: Record<Lang, Record<TranslationKey, string>> = {
  pt: {
    drop_idle: "Arraste uma imagem ou clique para selecionar",
    try_sample: "Usar imagem de exemplo",
    drop_hover: "Solte para fazer upload",
    selected_ready: "Pronto",
    ondev_unavailable: "Indisponível",
    file_line: "Arquivo",
    analyzing: "Analisando...",
    replace: "Trocar",
    remove: "Remover",
    analyze_on_device: "Analisar no dispositivo",
    generate_hybrid: "Gerar híbrido",
  },
  en: {
    drop_idle: "Drag an image or click to select",
    try_sample: "Use sample image",
    drop_hover: "Drop to upload",
    selected_ready: "Ready",
    ondev_unavailable: "Unavailable",
    file_line: "File",
    analyzing: "Analyzing...",
    replace: "Replace",
    remove: "Remove",
    analyze_on_device: "Analyze on device",
    generate_hybrid: "Generate hybrid",
  },
};

export function t(key: TranslationKey, lang: Lang): string {
  return translations[lang][key] || key;
}
