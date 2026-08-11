import SessionView from "./_components/session-view";

export default function UploadPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-2 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          SnapChef
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Drop in screenshots of the recipes you want to cook. We&apos;ll turn
          them into one combined grocery list.
        </p>
      </div>
      <SessionView />
    </div>
  );
}
