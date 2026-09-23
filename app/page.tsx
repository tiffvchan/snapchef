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
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-[63%_37%_54%_46%/43%_47%_53%_57%] bg-paper px-12 py-16 text-center shadow-xl">
        <h1 className="font-logo text-6xl text-olive-900">snapchef</h1>
        <p className="font-sans text-lg leading-normal text-zinc-600">
          Drop or paste recipe screenshots in, get a categorized, combined
          grocery list out. Share the link with whoever you&apos;re cooking
          with.
        </p>
        <form action={createSession}>
          <button
            type="submit"
            className="flex h-12 items-center justify-center rounded-2xl bg-olive-600 px-8 text-base font-medium text-white transition-colors hover:bg-olive-700"
          >
            New list
          </button>
        </form>
      </div>
    </div>
  );
}
