"use client";

import { useEffect, useRef, useState } from "react";
import type { RecipeSession } from "../_lib/use-recipe-session";

export default function UploadArea({ session }: { session: RecipeSession }) {
  const {
    recipes,
    extractions,
    addFiles,
    removeRecipe,
    renameRecipe,
    updateRecipeSourceUrl,
    runExtraction,
    runAllExtractions,
    updateIngredient,
    removeIngredient,
  } = session;

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const seenRecipeIds = useRef<Set<string>>(new Set());

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

  const hasStartedReview = Object.keys(extractions).length > 0;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
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
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-zinc-950 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
            : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
        }`}
      >
        <p className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
          Drop recipe screenshots here
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          or click to browse — you can add more than one
        </p>
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

      {recipes.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {recipes.length} recipe{recipes.length === 1 ? "" : "s"} added
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {recipe.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={recipe.previewUrl}
                      alt={recipe.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-600">
                      added by partner
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeRecipe(recipe.id)}
                    aria-label={`Remove ${recipe.name}`}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
                <input
                  ref={(el) => {
                    nameInputRefs.current[recipe.id] = el;
                  }}
                  value={recipe.name}
                  onChange={(e) => renameRecipe(recipe.id, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Name this recipe"
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-1.5 py-1 text-sm font-medium text-zinc-950 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:text-zinc-50"
                />
                <input
                  value={recipe.sourceUrl ?? ""}
                  onChange={(e) =>
                    updateRecipeSourceUrl(recipe.id, e.target.value)
                  }
                  placeholder="Paste a link (optional)"
                  className="w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-xs text-zinc-500 hover:border-zinc-200 focus:border-zinc-400 focus:outline-none dark:text-zinc-400 dark:hover:border-zinc-800"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={runAllExtractions}
            disabled={recipes.length === 0}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 sm:w-auto"
          >
            Continue to review ingredients
          </button>
        </div>
      )}

      {hasStartedReview && (
        <div className="flex flex-col gap-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Review ingredients
          </h2>
          {recipes.map((recipe) => {
            const extraction = extractions[recipe.id];
            if (!extraction) return null;

            return (
              <div key={recipe.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {recipe.name}
                  </p>
                  {recipe.sourceUrl && (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open source link for ${recipe.name}`}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      🔗
                    </a>
                  )}
                </div>

                {extraction.status === "loading" && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Reading ingredients…
                  </p>
                )}

                {extraction.status === "error" && (
                  <div className="flex items-center gap-3 text-sm">
                    <p className="text-red-600 dark:text-red-400">
                      {extraction.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => runExtraction(recipe)}
                      className="font-medium text-zinc-950 underline dark:text-zinc-50"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {extraction.status === "done" && (
                  <div className="flex flex-col gap-1">
                    {extraction.ingredients.length === 0 && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No ingredients found — add them manually below.
                      </p>
                    )}
                    {extraction.ingredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 dark:border-zinc-800"
                      >
                        <input
                          value={ingredient.quantity ?? ""}
                          onChange={(e) =>
                            updateIngredient(
                              recipe.id,
                              ingredient.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          placeholder="qty"
                          className="w-14 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm text-zinc-700 hover:border-zinc-200 focus:border-zinc-400 focus:outline-none dark:text-zinc-300 dark:hover:border-zinc-800"
                        />
                        <input
                          value={ingredient.unit ?? ""}
                          onChange={(e) =>
                            updateIngredient(
                              recipe.id,
                              ingredient.id,
                              "unit",
                              e.target.value
                            )
                          }
                          placeholder="unit"
                          className="w-16 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm text-zinc-700 hover:border-zinc-200 focus:border-zinc-400 focus:outline-none dark:text-zinc-300 dark:hover:border-zinc-800"
                        />
                        <input
                          value={ingredient.name}
                          onChange={(e) =>
                            updateIngredient(
                              recipe.id,
                              ingredient.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-medium text-zinc-950 hover:border-zinc-200 focus:border-zinc-400 focus:outline-none dark:text-zinc-50 dark:hover:border-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(recipe.id, ingredient.id)}
                          aria-label={`Remove ${ingredient.name}`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
