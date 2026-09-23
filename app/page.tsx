import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function createSession() {
  "use server";
  const session = await prisma.session.create({ data: {} });
  redirect(`/session/${session.id}`);
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-[63%_37%_54%_46%/43%_47%_53%_57%] bg-paper px-12 py-28 text-center shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-logo text-6xl text-olive-900">snapchef*</h1>
          <p className="font-sans text-lg text-zinc-600">
            recipes in, groceries out.
          </p>
        </div>
        <form action={createSession}>
          <button
            type="submit"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-olive-600 px-5 text-base font-medium text-white transition-colors hover:bg-olive-700"
          >
            let&apos;s get cookin&apos; <span aria-hidden="true">🔥</span>
          </button>
        </form>
      </div>
    </div>
  );
}
