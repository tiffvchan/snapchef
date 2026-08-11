import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "@/lib/anthropic";

const IngredientsSchema = z.object({
  ingredients: z.array(
    z.object({
      rawText: z.string().describe("The ingredient line exactly as it appears in the image"),
      name: z.string().describe("Normalized ingredient name, e.g. 'cucumber'"),
      quantity: z.string().nullable().describe("Amount, e.g. '2', '1/2' — null if not specified"),
      unit: z.string().nullable().describe("Unit, e.g. 'cups', 'tbsp' — null if not specified"),
    })
  ),
});

const SUPPORTED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing image file" }, { status: 400 });
  }

  if (!SUPPORTED_MEDIA_TYPES.has(file.type)) {
    return Response.json(
      { error: `Unsupported image type: ${file.type}` },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const response = await anthropic.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract every ingredient listed in this recipe screenshot. Ignore instructions, captions, and hashtags — only the ingredients list.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(IngredientsSchema),
    },
  });

  if (!response.parsed_output) {
    return Response.json(
      { error: "Failed to parse ingredients from image" },
      { status: 502 }
    );
  }

  return Response.json(response.parsed_output);
}
