"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Link as LinkIcon, Pin, PinOff, Plus, X } from "lucide-react";
import type { RecipeSession } from "../_lib/use-recipe-session";


function imageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];

  const fromFiles = Array.from(data.files).filter((file) =>
    file.type.startsWith("image/")
  );
  if (fromFiles.length > 0) return fromFiles;

  const fromItems: File[] = [];
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  return fromItems;
}

function isTypingIntoField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function UploadArea({ session }: { session: RecipeSession }) {
  const {
    recipes: allRecipes,
    extractions,
    addFiles,
    removeRecipe,
    renameRecipe,
    updateRecipeSourceUrl,
    setRecipeArchived,
    runExtraction,
    runAllExtractions,
  } = session;

  const recipes = allRecipes.filter((r) => !r.archived);
  const archivedRecipes = allRecipes.filter((r) => r.archived);

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const seenRecipeIds = useRef<Set<string>>(new Set());
  const addFilesRef = useRef(addFiles);
  useEffect(() => {
    addFilesRef.current = addFiles;
  });

  useEffect(() => {
    const currentIds = recipes.map((r) => r.id);
    const newIds = currentIds.filter((id) => !seenRecipeIds.current.has(id));
    seenRecipeIds.current = new Set(currentIds);

    // Only auto-focus when a single recipe was just added — with a batch
    // drop it's ambiguous which one to jump to, so leave it to the user.
    if (newIds.length === 1) {
      const input = nameInputRefs.current[newIds[0]];
      input?.focus();
      input?.select();
    }
  }, [recipes]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const images = imageFilesFromClipboard(e.clipboardData);
      if (images.length === 0) return;
      if (
        isTypingIntoField(e.target) &&
        e.clipboardData?.getData("text/plain")
      ) {
        return;
      }
      e.preventDefault();
      addFilesRef.current(images);
    }

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const hasStartedReview = Object.keys(extractions).length > 0;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
          {recipes.map((recipe, i) => (
              <div
                key={recipe.id}
                className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-none border-2 border-[#171717] bg-white p-1 text-center ${
                  i % 2 === 0 ? "-rotate-2" : "rotate-2"
                }`}
              >
                <div className="absolute right-0.5 top-0.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setRecipeArchived(recipe.id, true)}
                    aria-label={`Save ${recipe.name} for later`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
                  >
                    <Clock className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecipe(recipe.id)}
                    aria-label={`Remove ${recipe.name}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
                <textarea
                  ref={(el) => {
                    nameInputRefs.current[recipe.id] = el;
                  }}
                  value={recipe.name}
                  onChange={(e) => renameRecipe(recipe.id, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Name this recipe"
                  rows={2}
                  className="w-full shrink-0 resize-none rounded-md border border-transparent bg-transparent px-0.5 py-0.5 text-center text-[11px] font-bold leading-tight text-[#171717] hover:border-olive-100 focus:border-olive-400 focus:outline-none"
                />
                <div className="flex w-full items-center gap-0.5 px-0.5">
                  <LinkIcon className="h-2.5 w-2.5 shrink-0 text-olive-400" />
                  <input
                    value={recipe.sourceUrl ?? ""}
                    onChange={(e) =>
                      updateRecipeSourceUrl(recipe.id, e.target.value)
                    }
                    placeholder="link"
                    className="w-full min-w-0 pl-1 rounded border border-transparent bg-transparent py-0.5 text-[9px] text-olive-700 hover:border-olive-100 focus:border-olive-400 focus:outline-none"
                  />
                </div>
              </div>
            ))}

          {archivedRecipes.map((recipe, i) => (
            <div
              key={recipe.id}
              className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-none border-2 border-[#171717] bg-white p-1 text-center opacity-60 ${
                i % 2 === 0 ? "-rotate-2" : "rotate-2"
              }`}
            >
              <Pin
                aria-hidden="true"
                className="absolute -top-2 -left-2 h-4 w-4 rotate-[-30deg] text-[#171717]"
                fill="#f0b429"
              />
              <div className="absolute right-0.5 top-0.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setRecipeArchived(recipe.id, false)}
                  aria-label={`Add ${recipe.name} back to list`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
                >
                  <PinOff className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeRecipe(recipe.id)}
                  aria-label={`Delete ${recipe.name}`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
              <p className="w-full px-0.5 text-center text-[11px] font-bold leading-tight text-[#171717]">
                {recipe.name}
              </p>
            </div>
          ))}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                inputRef.current?.click();
            }}
            className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 border-2 border-dashed bg-paper/40 p-1 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-[#171717] bg-paper/70"
                : "border-olive-400 hover:border-[#171717]"
            }`}
          >
            <Plus aria-hidden="true" className="h-4 w-4 text-olive-400" />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {recipes.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={runAllExtractions}
              className="mt-2 flex h-12 items-center justify-center rounded-full bg-olive-600 px-5 text-base font-medium text-white transition-colors hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate grocery list
            </button>
          </div>
        )}
      </div>

      {hasStartedReview && (
        <div className="flex flex-col gap-2">
          {recipes.map((recipe) => {
            const extraction = extractions[recipe.id];
            if (!extraction || extraction.status === "done") return null;

            return (
              <div key={recipe.id} className="flex items-center gap-3 text-sm">
                {extraction.status === "loading" && (
                  <p className="text-olive-700">Reading ingredients…</p>
                )}
                {extraction.status === "error" && (
                  <>
                    <p className="text-red-600">{extraction.message}</p>
                    <button
                      type="button"
                      onClick={() => runExtraction(recipe)}
                      className="font-medium text-olive-900 underline"
                    >
                      Retry
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
