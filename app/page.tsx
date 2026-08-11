import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          SnapChef
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Drop recipe screenshots in, get a categorized, deduped grocery list
          out.
        </p>
        <Link
          href="/upload"
          className="flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          New list
        </Link>
      </div>
    </div>
  );
}
