"use client";

import { useState } from "react";
import { useRecipeSession } from "../_lib/use-recipe-session";
import UploadArea from "./upload-area";
import GroceryList from "./grocery-list";
import SavedRecipes from "./saved-recipes";

const TABS = ["Add recipes", "Grocery list", "Saved recipes"] as const;

export default function SessionView({ sessionId }: { sessionId: string }) {
  const session = useRecipeSession(sessionId);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Add recipes");
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (session.loading) {
    return <p className="text-sm text-zinc-500">Loading session…</p>;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-zinc-200 p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-olive-600 text-white"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100"
        >
          {copied ? "Link copied!" : "Share link"}
        </button>
      </div>

      {tab === "Add recipes" && <UploadArea session={session} />}
      {tab === "Grocery list" && <GroceryList session={session} />}
      {tab === "Saved recipes" && <SavedRecipes session={session} />}
    </div>
  );
}
