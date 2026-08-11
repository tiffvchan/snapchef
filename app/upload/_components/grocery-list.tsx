"use client";

import { useMemo } from "react";
import { CATEGORIES, type RecipeSession } from "../_lib/use-recipe-session";

type UsedIn = {
  recipeId: string;
  recipeName: string;
  quantity: string | null;
  unit: string | null;
  rawText: string;
};

type CompiledItem = {
  key: string;
  displayName: string;
  category: (typeof CATEGORIES)[number];
  usedIn: UsedIn[];
};

function compileItems(session: RecipeSession): CompiledItem[] {
  const byKey = new Map<string, CompiledItem>();

  for (const recipe of session.recipes) {
    const extraction = session.extractions[recipe.id];
    if (extraction?.status !== "done") continue;

    for (const ingredient of extraction.ingredients) {
      const key = ingredient.name.trim().toLowerCase();
      if (!key) continue;

      const usedIn: UsedIn = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        rawText: ingredient.rawText,
      };

      const existing = byKey.get(key);
      if (existing) {
        existing.usedIn.push(usedIn);
      } else {
        byKey.set(key, {
          key,
          displayName: ingredient.name,
          category: ingredient.category,
          usedIn: [usedIn],
        });
      }
    }
  }

  return Array.from(byKey.values());
}

function parseQuantity(quantity: string | null): number | null {
  if (!quantity) return null;
  const trimmed = quantity.trim();
  const fraction = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator ? Number(fraction[1]) / denominator : null;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function formatQuantity(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function entryLabel(entry: UsedIn): string {
  return [entry.quantity, entry.unit].filter(Boolean).join(" ") || entry.rawText;
}

function summarizeQuantity(usedIn: UsedIn[]): string {
  if (usedIn.length === 1) return entryLabel(usedIn[0]);

  const unit = usedIn[0].unit?.trim().toLowerCase() || null;
  const sameUnit =
    unit !== null &&
    usedIn.every((e) => (e.unit?.trim().toLowerCase() || null) === unit);

  if (sameUnit) {
    const amounts = usedIn.map((e) => parseQuantity(e.quantity));
    if (amounts.every((n): n is number => n !== null)) {
      const total = amounts.reduce((sum, n) => sum + n, 0);
      return `${formatQuantity(total)} ${usedIn[0].unit}`;
    }
  }

  return usedIn.map(entryLabel).join(" + ");
}

function UsedInBadge({ item }: { item: CompiledItem }) {
  return (
    <div className="group relative">
      <span className="cursor-default rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        used in {item.usedIn.length} recipe{item.usedIn.length === 1 ? "" : "s"}
      </span>
      <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden w-56 rounded-lg border border-zinc-200 bg-white p-2 text-xs shadow-lg group-hover:block dark:border-zinc-700 dark:bg-zinc-900">
        {item.usedIn.map((entry, i) => (
          <div key={i} className="flex justify-between gap-2 py-0.5">
            <span className="text-zinc-500 dark:text-zinc-400">
              {entry.recipeName}
            </span>
            <span className="text-right font-medium text-zinc-950 dark:text-zinc-50">
              {entryLabel(entry)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroceryList({ session }: { session: RecipeSession }) {
  const items = useMemo(() => compileItems(session), [session]);

  const needToBuy = items.filter((item) => !session.haveKeys.has(item.key));
  const alreadyHave = items.filter((item) => session.haveKeys.has(item.key));

  const grouped = CATEGORIES.map((category) => ({
    category,
    items: needToBuy.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Add recipes and extract ingredients first — your grocery list will
        show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {grouped.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {group.category}
          </h3>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => session.toggleHave(item.key)}
                  className="h-4 w-4 accent-zinc-950 dark:accent-zinc-50"
                />
                <span className="flex-1 text-sm capitalize text-zinc-950 dark:text-zinc-50">
                  {item.displayName}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {summarizeQuantity(item.usedIn)}
                </span>
                <UsedInBadge item={item} />
              </label>
            ))}
          </div>
        </div>
      ))}

      {needToBuy.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nothing left to buy — everything is checked off below.
        </p>
      )}

      {alreadyHave.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Already have
          </h3>
          <div className="flex flex-col gap-1">
            {alreadyHave.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 opacity-60 dark:border-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => session.toggleHave(item.key)}
                  className="h-4 w-4 accent-zinc-950 dark:accent-zinc-50"
                />
                <span className="flex-1 text-sm capitalize text-zinc-950 dark:text-zinc-50">
                  {item.displayName}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {summarizeQuantity(item.usedIn)}
                </span>
                <UsedInBadge item={item} />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
