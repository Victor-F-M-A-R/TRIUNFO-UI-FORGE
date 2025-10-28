// app/api/assist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UiDsl, UiDslT } from "@/lib/dsl";

type Body = {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  dsl: any;
};

export async function POST(req: NextRequest) {
  const { messages, dsl } = (await req.json()) as Body;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_API_KEY ausente" },
      { status: 501 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const system = `Você é um assistente de UI DSL. Sempre responda APENAS JSON com a forma:
{
  "dsl": <objeto DSL versão "0.1">,
  "summary": "breve descrição do que mudou"
}
Regras:
- Preserve campos desconhecidos.
- Não inclua comentários.
- O DSL deve validar contra: { version: "0.1", root: ... }.
- Para senhas, use { type:"input", kind:"password", showToggle:true }.
- Para botões, use { type:"button", debounceMs:600 }.
`;

  const convo = [
    { role: "user", content: system },
    { role: "user", content: `Estado atual do DSL:\n${JSON.stringify(dsl)}` },
    ...messages.map((m) => ({
      role: "user" as const,
      content: `${m.role === "user" ? "Usuário" : "Mensagem"}: ${m.content}`,
    })),
    {
      role: "user",
      content:
        "Atualize o DSL conforme os pedidos. Retorne só o JSON especificado.",
    },
  ];

  const result = await model.generateContent({
    contents: convo.map((c) => ({
      role: "user",
      parts: [{ text: c.content }],
    })),
  });
  const text = result.response.text().trim();

  // Tenta achar JSON
  const jsonStr = extractJson(text);
  if (!jsonStr)
    return NextResponse.json({ error: "Resposta sem JSON" }, { status: 500 });

  let payload: { dsl: UiDslT; summary?: string };
  try {
    const raw = JSON.parse(jsonStr);
    const validated = UiDsl.parse(raw.dsl);
    payload = { dsl: validated, summary: raw.summary };
  } catch (e: any) {
    return NextResponse.json(
      { error: "JSON inválido do modelo", detail: e?.message, raw: text },
      { status: 500 }
    );
  }
  return NextResponse.json(payload);
}

function extractJson(s: string): string | null {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}
