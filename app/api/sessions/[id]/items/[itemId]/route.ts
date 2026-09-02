import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  await prisma.extraItem.delete({ where: { id: itemId } });
  return Response.json({ ok: true });
}
