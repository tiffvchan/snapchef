"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import { Check, Copy, X } from "lucide-react";
import { CATEGORIES, type RecipeSession } from "../_lib/use-recipe-session";

const MAGNET_HEADER_COLORS = [
  "#e8432e",
  "#2f7fd1",
  "#f0b429",
  "#2a9d8f",
  "#e85f97",
  "#9c4fd1",
  "#c9714f",
  "#6b7a4f",
];

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

function abbreviateUnit(unit: string | null, plural: boolean): string | null {
  if (!unit) return unit;
  const trimmed = unit.trim();
  if (/^tablespoons?$|^tbsp\.?s?$/i.test(trimmed)) return plural ? "Tbsps" : "Tbsp";
  if (/^teaspoons?$|^tsp\.?s?$/i.test(trimmed)) return plural ? "tsps" : "tsp";
  if (/^pounds?$|^lbs?\.?$/i.test(trimmed)) return plural ? "lbs" : "lb";
  return unit;
}

function entryLabel(entry: UsedIn): string {
  const qty = parseQuantity(entry.quantity);
  const plural = qty === null ? true : qty !== 1;
  return (
    [entry.quantity, abbreviateUnit(entry.unit, plural)]
      .filter(Boolean)
      .join(" ") || entry.rawText
  );
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
      return `${formatQuantity(total)} ${abbreviateUnit(usedIn[0].unit, total !== 1)}`;
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
      aria-label={copied ? "Copied!" : "Copy list"}
      className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function UsedInTooltip({ item }: { item: CompiledItem }) {
  return (
    <div className="pointer-events-none absolute left-0 top-full z-50 hidden w-56 pt-1 group-hover:block">
      <div className="rounded-lg border border-olive-100 bg-white p-2 text-xs shadow-lg">
        {item.usedIn.map((entry) => (
          <div
            key={entry.ingredientId}
            className="flex items-center justify-between gap-2 py-0.5"
          >
            <span className="truncate text-olive-700">
              {entry.recipeName}
            </span>
            <span className="shrink-0 text-olive-900">
              {entryLabel(entry)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type ScribbleLine = {
  d: string;
  strokeWidth: number;
  delay: number;
  duration: number;
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateScribble(): ScribbleLine[] {
  const count = Math.floor(randomBetween(3, 6));
  const lines: ScribbleLine[] = [];
  for (let i = 0; i < count; i++) {
    const x0 = randomBetween(-2, 8);
    const x1 = randomBetween(192, 202);
    const y0 = randomBetween(1, 18);
    const y1 = randomBetween(1, 18);
    const midX = (x0 + x1) / 2 + randomBetween(-15, 15);
    const midY = randomBetween(1, 18);
    const delay = Math.max(0, i * 0.09 + randomBetween(-0.03, 0.03));
    lines.push({
      d: `M${x0.toFixed(1)},${y0.toFixed(1)} Q${midX.toFixed(1)},${midY.toFixed(
        1
      )} ${x1.toFixed(1)},${y1.toFixed(1)}`,
      strokeWidth: randomBetween(1.8, 3.2),
      delay,
      duration: randomBetween(0.18, 0.26),
    });
  }
  return lines;
}

function ItemRow({
  item,
  checked,
  onToggle,
  onRemoveExtra,
}: {
  item: CompiledItem;
  checked: boolean;
  onToggle: () => void;
  onRemoveExtra: (id: string) => void;
}) {
  const quantity = summarizeQuantity(item.usedIn);
  const [scribble, setScribble] = useState<ScribbleLine[] | null>(null);
  const [fading, setFading] = useState(false);

  function handleClick() {
    if (checked) {
      onToggle();
      return;
    }
    const lines = generateScribble();
    setScribble(lines);
    const totalMs = Math.max(...lines.map((l) => l.delay + l.duration)) * 1000;
    setTimeout(() => setFading(true), totalMs + 120);
    setTimeout(() => onToggle(), totalMs + 420);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative z-0 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition-opacity duration-300 hover:z-50 ${
        fading ? "opacity-0" : ""
      }`}
    >
      <span className="relative inline-flex items-baseline gap-1">
        <span
          className={`font-magnet-text text-base capitalize ${
            checked ? "text-olive-900/50" : "text-olive-900"
          }`}
        >
          {item.displayName}
        </span>
        {quantity && (
          <span
            className={`font-magnet-text group relative z-0 text-base hover:z-50 ${
              checked ? "text-olive-700/50" : "text-olive-700"
            }`}
          >
            ({quantity})
            {item.usedIn.length > 0 && <UsedInTooltip item={item} />}
          </span>
        )}
        {scribble && (
          <svg
            aria-hidden="true"
            viewBox="0 0 200 20"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {scribble.map((line, idx) => (
              <path
                key={idx}
                d={line.d}
                fill="none"
                stroke="#171717"
                strokeWidth={line.strokeWidth}
                strokeLinecap="round"
                style={{
                  strokeDasharray: 210,
                  strokeDashoffset: 210,
                  animation: `scribble-draw ${line.duration}s ease-out ${line.delay}s forwards`,
                }}
              />
            ))}
          </svg>
        )}
      </span>

      {item.extraItemId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveExtra(item.extraItemId!);
          }}
          aria-label={`Remove ${item.displayName}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-olive-400 hover:bg-olive-50 hover:text-olive-700"
        >
          <X className="h-3 w-3" />
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
    <div className="relative flex flex-col gap-8">
      {items.length === 0 && (
        <p className="text-sm text-olive-700">
          Add recipes and extract ingredients, or add an item below — your
          grocery list will show up here.
        </p>
      )}

      {grouped.length > 0 && <CopyListButton grouped={grouped} />}

      {grouped.length > 0 && (
        <div className="p-2 grid grid-cols-[repeat(auto-fit,minmax(40%,1fr))] gap-x-8 gap-y-6">
          {grouped.map((group, i) => (
            <div key={group.category} className="flex flex-col gap-2">
              <h3
                className="font-magnet text-2xl tracking-wide"
                style={{
                  color: MAGNET_HEADER_COLORS[i % MAGNET_HEADER_COLORS.length],
                }}
              >
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && needToBuy.length === 0 && (
        <p className="text-sm text-olive-700">
          Nothing left to buy — everything is checked off below.
        </p>
      )}

      <AddItemForm session={session} />

      {alreadyHave.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-olive-100 pt-6">
          <h3 className="font-magnet text-2xl tracking-wide text-olive-700">
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
