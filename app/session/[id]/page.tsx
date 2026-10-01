import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SessionView from "./_components/session-view";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) notFound();

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="font-logo pb-8 text-6xl text-olive-900">snapchef*</h1>
      <SessionView sessionId={id} />
    </div>
  );
}
