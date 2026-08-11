import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ingredientId: string }> }
) {
  const { ingredientId } = await params;
  const body: { name?: string; quantity?: string | null; unit?: string | null } =
    await request.json();

  await prisma.ingredientLine.update({
    where: { id: ingredientId },
    data: body,
  });

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ingredientId: string }> }
) {
  const { ingredientId } = await params;
  await prisma.ingredientLine.delete({ where: { id: ingredientId } });
  return Response.json({ ok: true });
}
