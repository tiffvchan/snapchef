import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await prisma.session.create({ data: {} });
  return Response.json({ id: session.id });
}
