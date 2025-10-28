// components/dsl/Renderer.tsx
"use client";
import React, { useState } from "react";
import type { UiDslT, NodeT } from "@/lib/dsl";

export function RenderDSL({ dsl }: { dsl: UiDslT }) {
  return <RenderNode node={dsl.root} />;
}

// ✅ CORRIGIDO: React.JSX.Element ao invés de JSX.Element
function RenderNode({ node }: { node: NodeT }): React.JSX.Element {
  switch (node.type) {
    case "container":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: node.direction === "vertical" ? "column" : "row",
            gap: node.gap,
            padding: node.padding,
          }}
        >
          {node.children?.map((c) => (
            <RenderNode key={c.id} node={c} />
          ))}
        </div>
      );
    case "card":
      return (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: node.padding,
          }}
        >
          {node.children?.map((c) => (
            <RenderNode key={c.id} node={c} />
          ))}
        </div>
      );
    case "text": {
      const Tag =
        node.variant === "h1"
          ? "h1"
          : node.variant === "h2"
          ? "h2"
          : node.variant === "h3"
          ? "h3"
          : node.variant === "label"
          ? "label"
          : "p";
      return <Tag>{node.content}</Tag>;
    }
    case "image":
      return (
        <img
          src={node.src}
          alt={node.alt || ""}
          width={node.width}
          height={node.height}
          style={{ borderRadius: node.radius }}
        />
      );
    case "form":
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("submit demo");
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {node.children?.map((c) => (
              <RenderNode key={c.id} node={c} />
            ))}
          </div>
        </form>
      );
    case "input":
      return <InputField node={node} />;
    case "button":
      return (
        <DebouncedButton
          text={node.text}
          variant={node.variant}
          debounceMs={node.debounceMs}
        />
      );
    default:
      return <div>Não suportado: {(node as any).type}</div>;
  }
}

function InputField({ node }: { node: Extract<NodeT, { type: "input" }> }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  const kind = (node.kind ?? "text") as "text" | "email" | "password";
  const isPassword = kind === "password";
  const type = isPassword ? (show ? "text" : "password") : kind;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {node.label && <label htmlFor={node.id}>{node.label}</label>}
      <div style={{ position: "relative" }}>
        <input
          id={node.id}
          type={type}
          name={node.name}
          placeholder={node.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete={
            isPassword ? "current-password" : kind === "email" ? "email" : "off"
          }
          style={{
            width: "100%",
            padding: "10px 36px 10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            background: "#0b1220",
            color: "#e5e7eb",
          }}
        />

        {isPassword && node.showToggle !== false && (
          <button
            type="button"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 8px",
            }}
          >
            {show ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
    </div>
  );
}

function DebouncedButton({
  text,
  variant = "primary",
  debounceMs = 600,
}: {
  text: string;
  variant?: "primary" | "secondary" | "link";
  debounceMs?: number;
}) {
  const [busy, setBusy] = useState(false);

  const style =
    variant === "primary"
      ? { background: "#0ea5e9", color: "white", border: "1px solid #0284c7" }
      : variant === "secondary"
      ? { background: "#111827", color: "#e5e7eb", border: "1px solid #334155" }
      : { background: "transparent", color: "#0ea5e9", border: "none" };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await new Promise((r) => setTimeout(r, debounceMs));
        setBusy(false);
      }}
      style={{
        ...style,
        borderRadius: 8,
        padding: "8px 12px",
        cursor: "pointer",
      }}
    >
      {busy ? "Aguarde…" : text}
    </button>
  );
}
