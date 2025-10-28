// lib/dsl.ts
import { z } from "zod";

export const NodeBase = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2)),
  type: z.enum([
    "container",
    "text",
    "input",
    "button",
    "image",
    "form",
    "card",
  ]),
});

const Container = NodeBase.extend({
  type: z.literal("container"),
  direction: z.enum(["vertical", "horizontal"]).default("vertical"),
  gap: z.number().default(12),
  padding: z.number().default(16),
  children: z.lazy(() => Node.array()).default([]),
});

const Text = NodeBase.extend({
  type: z.literal("text"),
  content: z.string(),
  variant: z.enum(["h1", "h2", "h3", "p", "label"]).default("p"),
});

const Input = NodeBase.extend({
  type: z.literal("input"),
  name: z.string().default("field"),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  kind: z.enum(["text", "email", "password"]).default("text"),
  showToggle: z.boolean().default(true),
});

const Button = NodeBase.extend({
  type: z.literal("button"),
  text: z.string(),
  variant: z.enum(["primary", "secondary", "link"]).default("primary"),
  debounceMs: z.number().default(600),
});

const ImageN = NodeBase.extend({
  type: z.literal("image"),
  src: z.string(),
  alt: z.string().default(""),
  width: z.number().optional(),
  height: z.number().optional(),
  radius: z.number().default(8),
});

const Form = NodeBase.extend({
  type: z.literal("form"),
  children: z.lazy(() => Node.array()).default([]),
});

const Card = NodeBase.extend({
  type: z.literal("card"),
  children: z.lazy(() => Node.array()).default([]),
  padding: z.number().default(16),
});

export const Node = z.discriminatedUnion("type", [
  Container,
  Text,
  Input,
  Button,
  ImageN,
  Form,
  Card,
]);

export type NodeT = z.infer<typeof Node>;

export const UiDsl = z.object({
  version: z.literal("0.1"),
  palette: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      background: z.string().optional(),
      foreground: z.string().optional(),
    })
    .optional(),
  root: Node,
});

export type UiDslT = z.infer<typeof UiDsl>;

export function validateDsl(
  data: unknown
): { ok: true; dsl: UiDslT } | { ok: false; error: string } {
  const parsed = UiDsl.safeParse(data);
  if (parsed.success) return { ok: true, dsl: parsed.data };
  return {
    ok: false,
    // ✅ CORRIGIDO: parsed.error.issues (não .errors)
    error: parsed.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; "),
  };
}

export function tryConvertImageRepresentation(json: any): UiDslT | null {
  try {
    const textBlobs = JSON.stringify(json).toLowerCase();
    const hasEmail = textBlobs.includes("email");
    const hasPassword =
      textBlobs.includes("password") || textBlobs.includes("senha");
    const hasButton =
      textBlobs.includes("button") ||
      textBlobs.includes("continu") ||
      textBlobs.includes("login") ||
      textBlobs.includes("entrar");
    const imgs = findImageUrls(json);

    if (hasEmail || hasPassword || hasButton) {
      const children: NodeT[] = [
        { type: "text", content: "Login", variant: "h2", id: "title" } as NodeT,
        {
          type: "form",
          id: "form",
          children: [
            hasEmail
              ? ({
                  type: "input",
                  kind: "email",
                  name: "email",
                  placeholder: "Email",
                  id: "email",
                } as NodeT)
              : null,
            hasPassword
              ? ({
                  type: "input",
                  kind: "password",
                  name: "password",
                  placeholder: "Password",
                  showToggle: true,
                  id: "pass",
                } as NodeT)
              : null,
            hasButton
              ? ({
                  type: "button",
                  text: "Continue",
                  variant: "primary",
                  id: "cta",
                } as NodeT)
              : null,
          ].filter(Boolean) as NodeT[],
        } as NodeT,
      ];
      if (imgs.length) {
        children.unshift({
          type: "image",
          src: imgs[0],
          alt: "preview",
          id: "img",
        } as NodeT);
      }
      return {
        version: "0.1",
        root: {
          type: "container",
          id: "root",
          direction: "vertical",
          gap: 12,
          padding: 16,
          children,
        } as NodeT,
      };
    }

    if (imgs.length) {
      return {
        version: "0.1",
        root: {
          type: "card",
          id: "card",
          padding: 16,
          children: [
            { type: "image", src: imgs[0], id: "img", alt: "image" } as NodeT,
            {
              type: "text",
              content: "Imagem",
              variant: "h3",
              id: "tx",
            } as NodeT,
          ],
        } as NodeT,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function findImageUrls(obj: any): string[] {
  const urls: string[] = [];
  const walk = (x: any) => {
    if (!x) return;
    if (
      typeof x === "string" &&
      /^data:image\/|https?:\/\/|\.png$|\.jpe?g$/i.test(x)
    ) {
      urls.push(x);
    }
    if (Array.isArray(x)) {
      x.forEach(walk);
    } else if (typeof x === "object") {
      Object.values(x).forEach(walk);
    }
  };
  walk(obj);
  return urls;
}
