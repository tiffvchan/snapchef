import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      recipes: {
        orderBy: { createdAt: "asc" },
        include: { ingredients: true },
      },
      haveItems: true,
    },
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({
    id: session.id,
    recipes: session.recipes,
    haveKeys: session.haveItems.map((item) => item.key),
  });
}
