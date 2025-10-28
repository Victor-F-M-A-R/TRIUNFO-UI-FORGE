// components/UploadZone.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { isOnDeviceAvailable, fakeAnalyze } from "@/lib/onDevice";
import { t } from "@/lib/i18n";
import { tryConvertImageRepresentation, validateDsl, UiDslT } from "@/lib/dsl";

type Meta = {
  name: string;
  sizeKB: number;
  width?: number;
  height?: number;
  url?: string;
};

export function UploadZone({
  lang = "pt",
  onDslLoaded,
  onLocalPreview,
  onHybridGenerate,
  onStateChange,
}: {
  lang?: "pt" | "en";
  onDslLoaded?: (dsl: UiDslT) => void;
  onLocalPreview?: (meta: Meta) => void;
  onHybridGenerate?: (meta: Meta) => void;
  onStateChange?: (
    state: "idle" | "selected" | "analyzing" | "error" | "ready" | "hybrid"
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const ondevice = isOnDeviceAvailable();

  const announceRef = useRef<HTMLDivElement | null>(null);
  const announce = (msg: string) => {
    if (announceRef.current) announceRef.current.textContent = msg;
  };

  useEffect(() => {
    onStateChange?.(meta ? (analyzing ? "analyzing" : "selected") : "idle");
  }, [meta, analyzing, onStateChange]);

  const handleFiles = async (files: FileList | null) => {
    setError(null);
    if (!files || !files[0]) return;
    const f = files[0];

    if (/application\/json|\.json$/i.test(f.type) || /\.json$/i.test(f.name)) {
      try {
        const text = await f.text();
        const json = JSON.parse(text);

        const val = validateDsl(json);

        if (val.ok) {
          onDslLoaded?.(val.dsl);
          setMeta({ name: f.name, sizeKB: Math.round(f.size / 1024) });
          announce(
            `JSON DSL carregado: ${f.name}, ${Math.round(f.size / 1024)} KB`
          );
          onStateChange?.("ready");
          return;
        }

        // Tentar converter image_representation.json
        const converted = tryConvertImageRepresentation(json);
        if (converted) {
          onDslLoaded?.(converted);
          setMeta({ name: f.name, sizeKB: Math.round(f.size / 1024) });
          announce(`JSON convertido para DSL: ${f.name}`);
          onStateChange?.("ready");
          return;
        }

        // Type guard explícito
        if ("error" in val) {
          setError(`JSON inválido: ${val.error}`);
        } else {
          setError("JSON inválido: erro desconhecido");
        }
        onStateChange?.("error");
      } catch (e: any) {
        setError(`Falha ao ler JSON: ${e?.message || e}`);
        onStateChange?.("error");
      }
      return;
    }

    if (!/image\/(png|jpe?g)/i.test(f.type)) {
      setError("Formato inválido. Use PNG/JPG ou JSON.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setError("Arquivo grande. Máx 2MB.");
      return;
    }

    const url = URL.createObjectURL(f);
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {});
    const m: Meta = {
      name: f.name,
      sizeKB: Math.round(f.size / 1024),
      width: img.naturalWidth,
      height: img.naturalHeight,
      url,
    };
    setMeta(m);
    announce(
      `Imagem selecionada: ${m.name}, ${m.sizeKB} KB, ${m.width}x${m.height}`
    );

    if (ondevice) {
      setAnalyzing(true);
      await fakeAnalyze((p) => setProgress(p), 2000);
      setAnalyzing(false);
      onLocalPreview?.(m);
      onStateChange?.("ready");
    }
  };

  const remove = () => {
    setMeta(null);
    setProgress(0);
    setAnalyzing(false);
    setError(null);
    onStateChange?.("idle");
  };

  return (
    <div>
      <div aria-live="polite" className="sr-only" ref={announceRef} />
      <div
        className={`dropzone ${hover ? "hover" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setHover(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <p>{t("drop_idle", lang)}</p>
        <div style={{ marginTop: 8 }}>
          <button
            className="badge"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            {t("try_sample", lang)}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".json,image/png,image/jpeg,application/json"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {hover && (
          <div style={{ marginTop: 6, color: "#6366f1" }}>
            {t("drop_hover", lang)}
          </div>
        )}
        {error && <div style={{ marginTop: 6, color: "#b91c1c" }}>{error}</div>}
      </div>

      {meta && (
        <div className="filecard" role="group" aria-label="Arquivo selecionado">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              background: "#0f172a",
              display: "grid",
              placeItems: "center",
            }}
          >
            {meta.url ? (
              <img className="thumb" src={meta.url} alt="" />
            ) : (
              <span>JSON</span>
            )}
          </div>
          <div>
            <div className="drop-meta">
              <strong>{meta.name}</strong>
              <span className="badge ok">Pronto</span>
            </div>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
              {t("file_line", lang)}:{" "}
              {meta.width ? `${meta.width}×${meta.height}, ` : ""}
              {meta.sizeKB} KB
            </div>
            {analyzing && (
              <>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{t("analyzing", lang)}</span>
                </div>
                <div className="progress" style={{ marginTop: 6 }}>
                  <span style={{ "--p": `${progress}%` } as any} />
                </div>
              </>
            )}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <button onClick={() => inputRef.current?.click()}>Trocar</button>
            <button onClick={remove}>Remover</button>
            {meta.url ? (
              <button
                disabled={analyzing}
                onClick={() => onLocalPreview?.(meta)}
              >
                Analisar (on‑device)
              </button>
            ) : (
              <button onClick={() => onHybridGenerate?.(meta)}>
                Gerar (Hybrid)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
