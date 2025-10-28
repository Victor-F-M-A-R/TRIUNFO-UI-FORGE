// components/qa/QAProvider.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// ========== TIPOS ==========
export type QAItem = {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
};

export type ContrastResult = {
  ratio: number;
  passes: boolean;
  textColor: string;
  bgColor: string;
};

export type QAContextType = {
  items: QAItem[];
  addQuestion: (question: string, answer: string) => void;
  clearAll: () => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;

  // Novos estados
  showDemoErrors: boolean;
  setShowDemoErrors: (show: boolean) => void;
  showFocusOverlay: boolean;
  setShowFocusOverlay: (show: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  contrastResult: ContrastResult | null;
  setContrastResult: (result: ContrastResult | null) => void;
  previewWidth: "full" | "320" | "768" | "1024";
  setPreviewWidth: (width: "full" | "320" | "768" | "1024") => void;
  panelOpenedAt: number;
};

// ========== CONTEXT ==========
const QAContext = createContext<QAContextType | null>(null);

// ========== PROVIDER ==========
export function QAProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QAItem[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [showDemoErrors, setShowDemoErrors] = useState(false);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [contrastResult, setContrastResult] = useState<ContrastResult | null>(
    null
  );
  const [previewWidth, setPreviewWidth] = useState<
    "full" | "320" | "768" | "1024"
  >("full");
  const [panelOpenedAt] = useState(Date.now());

  const addQuestion = (question: string, answer: string) => {
    const newItem: QAItem = {
      id: String(Date.now()),
      question,
      answer,
      timestamp: Date.now(),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const clearAll = () => {
    setItems([]);
  };

  const value: QAContextType = {
    items,
    addQuestion,
    clearAll,
    isActive,
    setIsActive,
    showDemoErrors,
    setShowDemoErrors,
    showFocusOverlay,
    setShowFocusOverlay,
    reducedMotion,
    setReducedMotion,
    contrastResult,
    setContrastResult,
    previewWidth,
    setPreviewWidth,
    panelOpenedAt,
  };

  return <QAContext.Provider value={value}>{children}</QAContext.Provider>;
}

// ========== HOOK ==========
export function useQA(): QAContextType {
  const context = useContext(QAContext);
  if (!context) {
    throw new Error("useQA must be used within QAProvider");
  }
  return context;
}
