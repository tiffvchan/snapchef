"use client";

import { useState } from "react";
import { useRecipeSession } from "../_lib/use-recipe-session";
import UploadArea from "./upload-area";
import GroceryList from "./grocery-list";

const TABS = ["Add recipes", "Grocery list"] as const;

export default function SessionView() {
  const session = useRecipeSession();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Add recipes");

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex gap-1 rounded-full border border-zinc-200 p-1 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Add recipes" ? (
        <UploadArea session={session} />
      ) : (
        <GroceryList session={session} />
      )}
    </div>
  );
}
