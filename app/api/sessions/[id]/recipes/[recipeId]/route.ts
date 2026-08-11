import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  const { name, sourceUrl }: { name?: string; sourceUrl?: string | null } =
    await request.json();

  await prisma.recipe.update({
    where: { id: recipeId },
    data: {
      ...(name !== undefined && { name }),
      ...(sourceUrl !== undefined && { sourceUrl: sourceUrl || null }),
    },
  });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  await prisma.recipe.delete({ where: { id: recipeId } });
  return Response.json({ ok: true });
}
