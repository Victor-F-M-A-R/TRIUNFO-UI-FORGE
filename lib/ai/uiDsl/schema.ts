import { z } from "zod";

export const NodeType = z.enum([
  "row",
  "column",
  "card",
  "image",
  "text",
  "button",
  "input",
  "divider",
]);

export const NodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    type: NodeType,
    layout: z
      .object({
        gap: z.number().optional(),
        align: z.enum(["start", "center", "end", "stretch"]).optional(),
        justify: z.enum(["start", "center", "end", "between"]).optional(),
        wrap: z.boolean().optional(),
      })
      .optional(),
    style: z
      .object({
        color: z.string().optional(),
        bg: z.string().optional(),
        radius: z.number().optional(),
        padding: z.number().optional(),
        border: z.string().optional(),
      })
      .optional(),
    variant: z.enum(["title", "body", "primary", "secondary"]).optional(),
    text: z.string().optional(),
    src: z.string().optional(),
    placeholder: z.string().optional(),
    children: z.array(z.lazy(() => NodeSchema)).optional(),
  })
);

export const UiDslSchema = z.object({
  version: z.literal("0.1"),
  palette: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      background: z.string().optional(),
      foreground: z.string().optional(),
    })
    .optional(),
  root: NodeSchema,
});

export type UiDsl = z.infer<typeof UiDslSchema>;
