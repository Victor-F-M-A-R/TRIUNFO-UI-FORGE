// components/ChatPanel.tsx
"use client";
import React, { useState } from "react";
import type { UiDslT } from "@/lib/dsl";

export function ChatPanel({
  dsl,
  onUpdate,
}: {
  dsl: UiDslT;
  onUpdate: (dsl: UiDslT) => void;
}) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; at: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    setError(null);
    const now = new Date().toLocaleTimeString();

    // ✅ CORRIGIDO: Tipagem explícita do array
    const newMsgs: {
      role: "user" | "assistant";
      content: string;
      at: string;
    }[] = [
      ...messages,
      { role: "user" as const, content: input.trim(), at: now },
    ];

    setMessages(newMsgs);
    setInput("");
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
          dsl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha no assistente");
      onUpdate(data.dsl);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const, // ✅ CORRIGIDO: as const
          content: data.summary || "DSL atualizado.",
          at: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (e: any) {
      setError(e?.message || "Erro desconhecido");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #1f2937",
        borderRadius: 10,
        padding: 12,
        background: "#0b1220",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Assistente (Gemini)
      </div>
      <div
        style={{
          display: "grid",
          gap: 8,
          maxHeight: 240,
          overflow: "auto",
          background: "#0a0f1a",
          padding: 8,
          borderRadius: 8,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "end" : "start",
              background: m.role === "user" ? "#1d4ed8" : "#111827",
              color: "#e5e7eb",
              borderRadius: 8,
              padding: "8px 10px",
              maxWidth: "80%",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              {m.at}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
        {!messages.length && (
          <div style={{ opacity: 0.6, fontSize: 12 }}>
            Peça alterações tipo: "Troque o botão por um link secundário",
            "Adicione input de confirmação de senha com toggle", "Aumente o
            radius do card para 16".
          </div>
        )}
      </div>
      {error && <div style={{ color: "#ef4444", marginTop: 6 }}>{error}</div>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          marginTop: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva a mudança no DSL…"
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 6,
            padding: "6px 10px",
            color: "#e5e7eb",
          }}
        />
        <button
          disabled={busy}
          onClick={send}
          style={{
            background: busy ? "#374151" : "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Enviando…" : "Aplicar"}
        </button>
      </div>
    </div>
  );
}
