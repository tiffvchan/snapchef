import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const { name, sourceUrl } = await request.json();

  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Missing recipe name" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: { sessionId, name, sourceUrl: sourceUrl || null },
  });

  return Response.json({
    id: recipe.id,
    name: recipe.name,
    sourceUrl: recipe.sourceUrl,
  });
}
