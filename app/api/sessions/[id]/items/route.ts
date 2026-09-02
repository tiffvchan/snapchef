import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const { name, category }: { name: string; category: string } =
    await request.json();

  if (!name?.trim() || !category) {
    return Response.json(
      { error: "Missing item name or category" },
      { status: 400 }
    );
  }

  const item = await prisma.extraItem.create({
    data: { sessionId, name: name.trim(), category },
  });

  return Response.json(item);
}
