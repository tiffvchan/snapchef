"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import { X } from "lucide-react";
import { CATEGORIES, type RecipeSession } from "../_lib/use-recipe-session";

type UsedIn = {
  recipeId: string;
  recipeName: string;
  ingredientId: string;
  quantity: string | null;
  unit: string | null;
  rawText: string;
};

type CompiledItem = {
  key: string;
  displayName: string;
  category: (typeof CATEGORIES)[number];
  usedIn: UsedIn[];
  extraItemId: string | null;
};

type UpdateIngredient = (
  recipeId: string,
  ingredientId: string,
  field: "name" | "quantity" | "unit",
  value: string
) => void;

function compileItems(session: RecipeSession): CompiledItem[] {
  const byKey = new Map<string, CompiledItem>();

  for (const recipe of session.recipes) {
    if (recipe.archived) continue;
    const extraction = session.extractions[recipe.id];
    if (extraction?.status !== "done") continue;

    for (const ingredient of extraction.ingredients) {
      const key = ingredient.name.trim().toLowerCase();
      if (!key) continue;

      const usedIn: UsedIn = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredientId: ingredient.id,
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
          extraItemId: null,
        });
      }
    }
  }

  for (const item of session.extraItems) {
    byKey.set(`extra:${item.id}`, {
      key: `extra:${item.id}`,
      displayName: item.name,
      category: item.category,
      usedIn: [],
      extraItemId: item.id,
    });
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
  if (usedIn.length === 0) return "";
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

function formatGroceryListText(
  grouped: { category: string; items: CompiledItem[] }[]
): string {
  return grouped
    .map(({ category, items }) => {
      const lines = items.map((item) => {
        const qty = summarizeQuantity(item.usedIn);
        return `- ${item.displayName}${qty ? ` (${qty})` : ""}`;
      });
      return `${category}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

function CopyListButton({
  grouped,
}: {
  grouped: { category: string; items: CompiledItem[] }[];
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(formatGroceryListText(grouped));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="self-start rounded-full border border-olive-100 px-4 py-1.5 text-xs font-medium text-olive-900 hover:bg-olive-50"
    >
      {copied ? "Copied!" : "Copy list"}
    </button>
  );
}

function UsedInBadge({
  item,
  onUpdateIngredient,
}: {
  item: CompiledItem;
  onUpdateIngredient: UpdateIngredient;
}) {
  return (
    <div className="group relative">
      <span className="cursor-default rounded-full bg-olive-50 px-2 py-0.5 text-xs font-medium text-olive-700">
        used in {item.usedIn.length} recipe{item.usedIn.length === 1 ? "" : "s"}
      </span>
      <div className="pointer-events-none absolute right-0 top-full z-10 hidden w-64 pt-1 group-hover:pointer-events-auto group-hover:block">
        <div className="rounded-lg border border-olive-100 bg-white p-2 text-xs shadow-lg">
          {item.usedIn.map((entry) => (
            <div
              key={entry.ingredientId}
              className="flex items-center justify-between gap-2 py-0.5"
            >
              <span className="truncate text-olive-700">
                {entry.recipeName}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <input
                  value={entry.quantity ?? ""}
                  onChange={(e) =>
                    onUpdateIngredient(
                      entry.recipeId,
                      entry.ingredientId,
                      "quantity",
                      e.target.value
                    )
                  }
                  placeholder="qty"
                  className="w-10 rounded border border-transparent bg-transparent px-1 text-right text-olive-900 hover:border-olive-100 focus:border-olive-400 focus:outline-none"
                />
                <input
                  value={entry.unit ?? ""}
                  onChange={(e) =>
                    onUpdateIngredient(
                      entry.recipeId,
                      entry.ingredientId,
                      "unit",
                      e.target.value
                    )
                  }
                  placeholder="unit"
                  className="w-12 rounded border border-transparent bg-transparent px-1 text-olive-900 hover:border-olive-100 focus:border-olive-400 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  checked,
  onToggle,
  onRemoveExtra,
  onUpdateIngredient,
}: {
  item: CompiledItem;
  checked: boolean;
  onToggle: () => void;
  onRemoveExtra: (id: string) => void;
  onUpdateIngredient: UpdateIngredient;
}) {
  const single = item.usedIn.length === 1 ? item.usedIn[0] : null;

  function renameItem(value: string) {
    item.usedIn.forEach((entry) =>
      onUpdateIngredient(entry.recipeId, entry.ingredientId, "name", value)
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-olive-100 px-3 py-2 ${
        checked ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 accent-olive-600"
      />
      {item.extraItemId ? (
        <span className="flex-1 text-sm capitalize text-olive-900">
          {item.displayName}
        </span>
      ) : (
        <input
          value={item.displayName}
          onChange={(e) => renameItem(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm capitalize text-olive-900 hover:border-olive-100 focus:border-olive-400 focus:outline-none"
        />
      )}

      {single && (
        <div className="flex shrink-0 items-center gap-1">
          <input
            value={single.quantity ?? ""}
            onChange={(e) =>
              onUpdateIngredient(
                single.recipeId,
                single.ingredientId,
                "quantity",
                e.target.value
              )
            }
            placeholder="qty"
            className="w-10 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-right text-sm text-olive-700 hover:border-olive-100 focus:border-olive-400 focus:outline-none"
          />
          <input
            value={single.unit ?? ""}
            onChange={(e) =>
              onUpdateIngredient(
                single.recipeId,
                single.ingredientId,
                "unit",
                e.target.value
              )
            }
            placeholder="unit"
            className="w-14 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm text-olive-700 hover:border-olive-100 focus:border-olive-400 focus:outline-none"
          />
        </div>
      )}

      {item.usedIn.length > 1 && (
        <>
          <span className="shrink-0 text-sm text-olive-700">
            {summarizeQuantity(item.usedIn)}
          </span>
          <UsedInBadge item={item} onUpdateIngredient={onUpdateIngredient} />
        </>
      )}

      {item.extraItemId && (
        <button
          type="button"
          onClick={() => onRemoveExtra(item.extraItemId!)}
          aria-label={`Remove ${item.displayName}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function AddItemForm({ session }: { session: RecipeSession }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    CATEGORIES[0]
  );

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    session.addExtraItem(name.trim(), category);
    setName("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-lg border border-dashed border-olive-200 px-3 py-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add something else you need…"
        className="flex-1 bg-transparent text-sm text-olive-900 placeholder:text-olive-400 focus:outline-none"
      />
      <select
        value={category}
        onChange={(e) =>
          setCategory(e.target.value as (typeof CATEGORIES)[number])
        }
        className="rounded-md border border-olive-100 bg-transparent px-1.5 py-1 text-xs text-olive-700 focus:outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!name.trim()}
        className="rounded-full bg-olive-600 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add
      </button>
    </form>
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

  return (
    <div className="flex flex-col gap-8">
      {items.length === 0 && (
        <p className="text-sm text-olive-700">
          Add recipes and extract ingredients, or add an item below — your
          grocery list will show up here.
        </p>
      )}

      {grouped.length > 0 && <CopyListButton grouped={grouped} />}

      {grouped.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-olive-900">
            {group.category}
          </h3>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                checked={false}
                onToggle={() => session.toggleHave(item.key)}
                onRemoveExtra={session.removeExtraItem}
                onUpdateIngredient={session.updateIngredient}
              />
            ))}
          </div>
        </div>
      ))}

      {items.length > 0 && needToBuy.length === 0 && (
        <p className="text-sm text-olive-700">
          Nothing left to buy — everything is checked off below.
        </p>
      )}

      <AddItemForm session={session} />

      {alreadyHave.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-olive-100 pt-6">
          <h3 className="text-sm font-semibold text-olive-700">
            Already have
          </h3>
          <div className="flex flex-col gap-1">
            {alreadyHave.map((item) => (
              <ItemRow
                key={item.key}
                item={item}
                checked={true}
                onToggle={() => session.toggleHave(item.key)}
                onRemoveExtra={session.removeExtraItem}
                onUpdateIngredient={session.updateIngredient}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
