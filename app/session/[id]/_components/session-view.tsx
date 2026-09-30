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
    return <p className="text-sm text-olive-700">Loading session…</p>;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-olive-100 bg-paper p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-olive-600 text-white"
                  : "text-olive-700 hover:text-olive-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-full bg-paper px-4 py-2 text-sm font-medium text-olive-900 shadow-md hover:bg-olive-50"
        >
          {copied ? "Link copied!" : "Share link"}
        </button>
      </div>

      <div className="bg-fridge relative overflow-hidden rounded-3xl shadow-md">
        {/* freezer */}
        <div className="relative p-4 pb-8 pl-10 sm:p-6 sm:pb-10 sm:pl-12">
          <div
            aria-hidden="true"
            className="fridge-handle pointer-events-none absolute left-3 bottom-4 h-24 w-3.5 rounded-full"
          />
          <div className="relative flex flex-col gap-6">
            {tab === "Add recipes" && <UploadArea session={session} />}
          </div>
        </div>

        {/* seam between freezer and fridge doors */}
        <div className="relative h-1 bg-black/10" />

        {/* fridge */}
        <div className="relative flex min-h-[320px] flex-col p-4 pt-8 pl-10 sm:p-6 sm:pt-10 sm:pl-12">
          <div
            aria-hidden="true"
            className="fridge-handle pointer-events-none absolute left-3 top-8 h-20 w-3.5 rounded-full sm:h-24"
          />
          <div
            className={`relative flex-1 ${
              tab === "Add recipes" ? "flex items-center justify-center" : ""
            }`}
          >
            {tab === "Grocery list" && <GroceryList session={session} />}
            {tab === "Saved recipes" && <SavedRecipes session={session} />}
            {tab === "Add recipes" && (
              <p className="text-center text-sm text-olive-700/70">
                Your grocery list will show up here once you review some
                ingredients.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
