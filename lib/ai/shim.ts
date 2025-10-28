// Local fallback for UiDsl and UiDslSchema to avoid a missing-module compile error
// This is a lightweight runtime passthrough that types the parsed value as UiDsl.
export type UiDsl = {
  version: string;
  palette?: {
    primary?: string;
    secondary?: string;
    background?: string;
    foreground?: string;
  };
  root: any;
};

export const UiDslSchema = {
  parse: (v: any): UiDsl => v as UiDsl,
};

declare global {
  interface Window {
    ai?: any;
  }
}

export type Detect = {
  available: boolean;
  features: { prompt: boolean; session: boolean };
};

export function detectBuiltInAI(): Detect {
  const ai = (globalThis as any).window?.ai;
  const available = !!ai;
  const features = {
    prompt: typeof ai?.prompt === "function",
    session: typeof ai?.createTextSession === "function",
  };
  return { available, features };
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

// Re-encoda como PNG para remover EXIF
export async function stripExif(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((ok, err) => {
    img.onload = () => ok();
    img.onerror = err;
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
}

function extractFirstJson(text: string): any {
  const match = text.match(/{[\s\S]*}/);
  if (!match) throw new Error("No JSON block in response");
  return JSON.parse(match[0]);
}

function buildPrompt(): string {
  return `
You are a UI analyzer. Given an image of a UI, output ONLY a JSON following this schema: { "version": "0.1", "palette": { "primary": string?, "secondary": string?, "background": string?, "foreground": string? }?, "root": { "type": "row|column|card|image|text|button|input|divider", "layout": { "gap"?: number, "align"?: "start|center|end|stretch", "justify"?: "start|center|end|between", "wrap"?: boolean }?, "style": { "color"?: string, "bg"?: string, "radius"?: number, "padding"?: number, "border"?: string }?, "variant"?: "title|body|primary|secondary", "text"?: string, "src"?: string, "children"?: [<node>...] } } Respond with JSON only.
`;
}

export async function analyzeImageWithBuiltInAI(
  file: File
): Promise<
  | { ok: true; json: UiDsl; raw: string }
  | { ok: false; error: string; raw?: string }
> {
  const det = detectBuiltInAI();
  if (!det.available) return { ok: false, error: "Built-in AI unavailable" };

  const ai = (window as any).ai;
  const prompt = buildPrompt();
  let raw = "";

  try {
    // remove EXIF e converte para PNG
    const stripped = await stripExif(file);
    const dataUrl = await fileToDataURL(
      new File([stripped], "img.png", { type: "image/png" })
    );
    if (det.features.prompt) {
      try {
        const resp = await ai.prompt({
          messages: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: dataUrl.split(",")[1],
                  },
                },
              ],
            },
          ],
        });
        raw = typeof resp === "string" ? resp : JSON.stringify(resp);
      } catch {}
      if (!raw) {
        const resp = await ai.prompt(prompt + "\nImage (data URL): " + dataUrl);
        raw = typeof resp === "string" ? resp : JSON.stringify(resp);
      }
    } else if (det.features.session) {
      const session = await ai.createTextSession();
      const resp = await session.prompt(
        prompt + "\nImage (data URL): " + dataUrl
      );
      raw = typeof resp === "string" ? resp : JSON.stringify(resp);
    } else {
      return { ok: false, error: "Unsupported Built-in AI variant" };
    }

    const parsed = extractFirstJson(raw);
    const json = UiDslSchema.parse(parsed);
    return { ok: true, json, raw };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error", raw };
  }
}

export function mockAnalyze(): UiDsl {
  return {
    version: "0.1",
    root: {
      type: "column",
      layout: { gap: 12, align: "center" },
      children: [
        { type: "text", variant: "title", text: "Login" },
        { type: "input", placeholder: "Email" },
        { type: "input", placeholder: "Password" },
        { type: "button", variant: "primary", text: "Continue" },
      ],
    },
  };
}
