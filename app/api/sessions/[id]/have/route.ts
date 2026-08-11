import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const { key, have }: { key: string; have: boolean } = await request.json();

  if (!key) {
    return Response.json({ error: "Missing key" }, { status: 400 });
  }

  if (have) {
    await prisma.haveItem.upsert({
      where: { sessionId_key: { sessionId, key } },
      create: { sessionId, key },
      update: {},
    });
  } else {
    await prisma.haveItem.deleteMany({ where: { sessionId, key } });
  }

  return Response.json({ ok: true });
}
