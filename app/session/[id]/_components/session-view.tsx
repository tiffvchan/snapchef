"use client";

import { useState } from "react";
import { useRecipeSession } from "../_lib/use-recipe-session";
import UploadArea from "./upload-area";
import GroceryList from "./grocery-list";

export default function SessionView({ sessionId }: { sessionId: string }) {
  const session = useRecipeSession(sessionId);
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
      <div className="bg-fridge relative flex aspect-[433/593] w-full flex-col rounded-3xl border-[3px] border-[#171717]">
        {/* freezer */}
        <div className="relative p-4 pb-8 pl-10 sm:p-6 sm:pb-10 sm:pl-12">
          <div
            aria-hidden="true"
            className="fridge-handle pointer-events-none absolute left-3 bottom-4 h-16 w-3.5 rounded-full"
          />
          <div className="relative">
            <UploadArea session={session} />
          </div>
        </div>

        {/* seam between freezer and fridge doors */}
        <div className="relative h-[3px] shrink-0 bg-[#171717]" />

        {/* fridge */}
        <div className="relative min-h-[320px] p-4 pt-8 pl-10 sm:p-6 sm:pt-10 sm:pl-12">
          <div
            aria-hidden="true"
            className="fridge-handle pointer-events-none absolute left-3 top-8 h-20 w-3.5 rounded-full sm:h-24"
          />
          <div className="relative">
            <GroceryList session={session} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-full bg-paper px-4 py-2 text-sm font-medium text-olive-900 shadow-md hover:bg-olive-50"
        >
          {copied ? "Link copied!" : "Share link"}
        </button>
      </div>
    </div>
  );
}
