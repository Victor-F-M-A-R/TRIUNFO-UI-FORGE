// app/api/generate/route.ts
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "";
const API_BASES = ["v1beta", "v1beta1"];

type ExtractedData = {
  dsl: any;
  tsx: string;
  qa: string;
  raw: string;
};

type GenerateSuccess = ExtractedData & {
  ok: true;
  model: string;
};

type GenerateError = {
  ok: false;
  errors: any[];
};

type GenerateResult = GenerateSuccess | GenerateError;

const hits = new Map<string, number[]>();

function rateLimit(ip: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const list = hits.get(ip) || [];
  const filtered = list.filter((t) => now - t < windowMs);
  filtered.push(now);
  hits.set(ip, filtered);
  return filtered.length <= max;
}

function buildPrompt3Etapas(dsl?: unknown, schema?: string): string {
  const schemaText =
    schema?.trim() ||
    `{
  version: "0.1",
  palette?: { primary?: string, secondary?: string, background?: string, foreground?: string },
  root: {
    type: "row|column|card|image|text|button|input|divider",
    layout?: { gap?: number, align?: "start|center|end|stretch", justify?: "start|center|end|between", wrap?: boolean },
    style?: { color?: string, bg?: string, radius?: number, padding?: number, border?: string },
    variant?: "title|body|primary|secondary",
    text?: string,
    src?: string,
    placeholder?: string,
    children?: Node[]
  }
}`;

  const dslHint = dsl
    ? `Um UI-DSL foi enviado pelo usuário; use-o como referência e ajuste inconsistências claras.`
    : `Analise a imagem/descrição (se houver) e deduza a estrutura.`;

  const dslReference = dsl
    ? `\n\nReferência de UI-DSL enviada:\n${JSON.stringify(dsl, null, 2)}`
    : "";

  return `Você é um time de frontend de elite especializado em React, TypeScript e Tailwind CSS.
Execute EXATAMENTE 3 etapas sequenciais, separando cada uma com uma linha contendo apenas '---'.

═══════════════════════════════════════════════════════════════
ETAPA 1: ANÁLISE E GERAÇÃO DO UI-DSL (JSON)
═══════════════════════════════════════════════════════════════

${dslHint}

Gere um JSON estritamente válido seguindo este schema:
${schemaText}

REGRAS OBRIGATÓRIAS para ETAPA 1:
✓ Retorne APENAS JSON válido (sem comentários, sem explicações)
✓ Use aspas duplas em todas as propriedades
✓ Seja conciso e preciso
✓ Valide a estrutura hierárquica (root > children)
✓ Use cores e estilos consistentes com Tailwind
✓ Para layouts row/column, sempre defina layout.gap e layout.align

---

═══════════════════════════════════════════════════════════════
ETAPA 2: GERAÇÃO DO CÓDIGO REACT + TYPESCRIPT + TAILWIND
═══════════════════════════════════════════════════════════════

Usando EXCLUSIVAMENTE o JSON da Etapa 1, gere um componente React.

REGRAS OBRIGATÓRIAS para ETAPA 2:
✓ Retorne SOMENTE código cercado por \`\`\`tsx ... \`\`\`
✓ Nome do componente: GeneratedView (função, sem props)
✓ Use 'use client' no topo se houver interatividade
✓ Use APENAS Tailwind classes (sem CSS inline, sem styled-components)
✓ Mapeie TODOS os tipos: row→flex-row, column→flex-col, card→rounded border shadow, etc
✓ Para 'input': adicione placeholder, border, padding adequados
✓ Para 'button': adicione hover states e cursor-pointer
✓ Para 'text': respeite variant (title→text-2xl font-bold, body→text-base)
✓ Implemente layout.gap com gap-{n}, layout.align com items-{align}
✓ Se houver palette, use as cores definidas via Tailwind (ex: text-[{color}])
✓ Código limpo, indentado, sem console.logs
✓ Sem fetch, sem libs externas, sem imagens remotas
✓ Componente totalmente funcional e renderizável

---

═══════════════════════════════════════════════════════════════
ETAPA 3: SUGESTÕES DE QA (QUALITY ASSURANCE)
═══════════════════════════════════════════════════════════════

Liste 5-7 sugestões práticas de testes para este componente.

CATEGORIAS OBRIGATÓRIAS:
• Responsividade (mobile, tablet, desktop)
• Acessibilidade (ARIA, navegação por teclado, contraste)
• Interatividade (estados de hover, focus, disabled)
• Edge cases (textos longos, campos vazios, overflow)
• Performance (re-renders desnecessários, otimizações)

FORMATO:
- [Categoria] Descrição clara e objetiva do teste

Exemplo:
- [Responsividade] Verificar se o layout adapta-se corretamente em telas menores que 640px
- [Acessibilidade] Garantir que todos os inputs tenham labels associados e atributos ARIA${dslReference}`;
}

function extractEtapas(text: string): ExtractedData {
  const raw = text;
  let dsl: any = null;

  try {
    const m = text.match(/{[\s\S]*}/);
    if (m) dsl = JSON.parse(m[0]);
  } catch {
    // ignora
  }

  let tsx = "";
  const m2 = text.match(/```tsx([\s\S]*?)```/i);
  if (m2) {
    tsx = m2[1].trim();
  } else {
    const anyFence = text.match(/```(?:typescript|jsx|tsx)?([\s\S]*?)```/i);
    if (anyFence) tsx = anyFence[1].trim();
  }

  let qa = "";
  const idx = text.lastIndexOf("---");
  if (idx >= 0) qa = text.slice(idx + 3).trim();
  if (tsx && qa.includes(tsx)) {
    qa = qa.replace(tsx, "").trim();
  }

  return { dsl, tsx: tsx || "// empty", qa, raw };
}

function stripModelPrefix(name: string): string {
  return name.replace(/^models\//, "");
}

async function listModels(): Promise<{ id: string; methods: string[] }[]> {
  if (!GEMINI_API_KEY) return [];

  for (const base of API_BASES) {
    const url = `https://generativelanguage.googleapis.com/${base}/models?key=${GEMINI_API_KEY}`;
    try {
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json().catch(() => ({}));
        const arr = (data?.models || []).map((m: any) => ({
          id: stripModelPrefix(m?.name || ""),
          methods: m?.supportedGenerationMethods || [],
        }));
        if (arr.length) return arr;
      }
    } catch {
      continue;
    }
  }
  return [];
}

async function tryGenerate(
  modelId: string,
  payload: any
): Promise<GenerateResult> {
  const errors: any[] = [];

  for (const base of API_BASES) {
    const url = `https://generativelanguage.googleapis.com/${base}/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (r.ok) {
        const data = await r.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const joined = parts.map((p: any) => p?.text || "").join("\n");
        const out = extractEtapas(joined);
        return { ok: true, model: `${base}/${modelId}`, ...out };
      } else {
        const errorText = await r.text().catch(() => "");
        errors.push({ base, status: r.status, text: errorText });
        if (r.status === 404) continue;
      }
    } catch (e: any) {
      errors.push({ base, error: e?.message || "fetch error" });
    }
  }

  return { ok: false, errors };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("list") === "1") {
    const models = await listModels();
    return NextResponse.json({ ok: true, models });
  }
  return NextResponse.json({
    ok: true,
    route: "api/generate",
    info: "POST { dsl, schema? } to get { dsl, tsx, qa }",
  });
}

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") || "local")
      .split(",")[0]
      .trim();

    if (!rateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const dsl = body?.dsl;
    const schema = body?.schema;

    if (!dsl) {
      return NextResponse.json(
        { ok: false, error: 'Missing "dsl" in body' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      const out = extractEtapas(
        `---\n${JSON.stringify(
          dsl,
          null,
          2
        )}\n---\n\`\`\`tsx\n// TODO: generated TSX from cloud\nexport default function GeneratedView(){return null}\n\`\`\`\n---\n- [Responsividade] Testar em mobile\n- [Acessibilidade] Validar ARIA\n- [Interatividade] Testar estados`
      );
      return NextResponse.json({ ok: true, mode: "cloud-stub", ...out });
    }

    if (GEMINI_MODEL) {
      const payload = {
        contents: [
          { role: "user", parts: [{ text: buildPrompt3Etapas(dsl, schema) }] },
        ],
      };
      const r = await tryGenerate(GEMINI_MODEL, payload);
      if (r.ok) {
        return NextResponse.json({
          ok: true,
          mode: "cloud-gemini",
          model: r.model,
          dsl: r.dsl,
          tsx: r.tsx,
          qa: r.qa,
        });
      }
    }

    const models = await listModels();
    const candidate = models.find((m) =>
      (m?.methods || []).includes("generateContent")
    );

    if (!candidate?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "No model with generateContent available",
          availableModels: models,
        },
        { status: 502 }
      );
    }

    const payload = {
      contents: [
        { role: "user", parts: [{ text: buildPrompt3Etapas(dsl, schema) }] },
      ],
    };

    const r2 = await tryGenerate(candidate.id, payload);

    if (r2.ok) {
      return NextResponse.json({
        ok: true,
        mode: "cloud-gemini",
        model: r2.model,
        dsl: r2.dsl,
        tsx: r2.tsx,
        qa: r2.qa,
      });
    }

    // Type narrowing: se não é ok, então tem errors
    const failedResult = r2 as GenerateError;

    return NextResponse.json(
      {
        ok: false,
        error: "Generation failed",
        attempts: failedResult.errors,
        availableModels: models,
      },
      { status: 502 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
