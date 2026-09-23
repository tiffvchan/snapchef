"use client";

import type { RecipeSession } from "../_lib/use-recipe-session";

export default function SavedRecipes({ session }: { session: RecipeSession }) {
  const saved = session.recipes.filter((r) => r.archived);

  if (saved.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Recipes you save for later will show up here — use &quot;Save for
        later&quot; on a recipe once you&apos;re done shopping for it.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {saved.map((recipe) => {
        const extraction = session.extractions[recipe.id];
        const ingredients =
          extraction?.status === "done" ? extraction.ingredients : [];

        return (
          <div
            key={recipe.id}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3"
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-950">
                {recipe.name}
              </p>
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open source link for ${recipe.name}`}
                  className="text-zinc-400 hover:text-zinc-700"
                >
                  🔗
                </a>
              )}
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={() => session.setRecipeArchived(recipe.id, false)}
                  className="text-xs font-medium text-zinc-950 hover:underline"
                >
                  Add to list
                </button>
                <button
                  type="button"
                  onClick={() => session.removeRecipe(recipe.id)}
                  className="text-xs font-medium text-zinc-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            {ingredients.length > 0 && (
              <p className="text-xs text-zinc-500">
                {ingredients.map((i) => i.name).join(", ")}
              </p>
            )}
            <textarea
              value={recipe.notes ?? ""}
              onChange={(e) =>
                session.updateRecipeNotes(recipe.id, e.target.value)
              }
              placeholder="Notes — adjustments, commentary…"
              rows={2}
              className="w-full resize-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-zinc-700 placeholder:text-zinc-400 hover:border-zinc-200 focus:border-zinc-400 focus:outline-none"
            />
          </div>
        );
      })}
    </div>
  );
}
