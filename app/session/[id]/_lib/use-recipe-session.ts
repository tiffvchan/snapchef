import { useEffect, useRef, useState } from "react";

export const CATEGORIES = [
  "Produce",
  "Meat/Seafood",
  "Dairy",
  "Pantry",
  "Frozen",
  "Spices",
  "Bakery",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type RecipeDraft = {
  id: string;
  name: string;
  sourceUrl: string | null;
  file: File | null;
  previewUrl: string | null;
};

export type IngredientLine = {
  id: string;
  rawText: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  category: Category;
};

export type ExtractionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; ingredients: IngredientLine[] };

const JUNK_FILENAME_PATTERN =
  /^(screenshot|screen shot|img[_-]?\d|image[_-]?\d|photo[_-]?\d|snapchat[_-]|dsc[_-]?\d|\d{6,})/i;

function nameFromFile(file: File, index: number) {
  const base = file.name.replace(/\.[^/.]+$/, "").trim();
  if (!base || JUNK_FILENAME_PATTERN.test(base)) return `Recipe ${index + 1}`;
  return base;
}

async function extractIngredients(
  file: File
): Promise<Omit<IngredientLine, "id">[]> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/extract-ingredients", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Extraction failed (${res.status})`);
  }

  const data: { ingredients: Omit<IngredientLine, "id">[] } = await res.json();
  return data.ingredients;
}

async function createRecipe(sessionId: string, name: string): Promise<string> {
  const res = await fetch(`/api/sessions/${sessionId}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.id;
}

async function saveIngredients(
  sessionId: string,
  recipeId: string,
  ingredients: Omit<IngredientLine, "id">[]
): Promise<IngredientLine[]> {
  const res = await fetch(
    `/api/sessions/${sessionId}/recipes/${recipeId}/ingredients`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    }
  );
  const data: { ingredients: IngredientLine[] } = await res.json();
  return data.ingredients;
}

type SessionData = {
  id: string;
  recipes: {
    id: string;
    name: string;
    sourceUrl: string | null;
    ingredients: IngredientLine[];
  }[];
  haveKeys: string[];
};

export function useRecipeSession(sessionId: string) {
  const [recipes, setRecipes] = useState<RecipeDraft[]>([]);
  const [extractions, setExtractions] = useState<
    Record<string, ExtractionState>
  >({});
  const [haveKeys, setHaveKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;
  const recipeIdPromises = useRef<Record<string, Promise<string>>>({});

  function getRecipeId(localId: string) {
    return recipeIdPromises.current[localId];
  }

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data: SessionData) => {
        if (cancelled) return;

        setRecipes(
          data.recipes.map((r) => ({
            id: r.id,
            name: r.name,
            sourceUrl: r.sourceUrl,
            file: null,
            previewUrl: null,
          }))
        );
        setExtractions(
          Object.fromEntries(
            data.recipes.map((r) => [
              r.id,
              r.ingredients.length > 0
                ? { status: "done" as const, ingredients: r.ingredients }
                : { status: "idle" as const },
            ])
          )
        );
        setHaveKeys(new Set(data.haveKeys));
        data.recipes.forEach((r) => {
          recipeIdPromises.current[r.id] = Promise.resolve(r.id);
        });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      recipesRef.current.forEach((recipe) => {
        if (recipe.previewUrl) URL.revokeObjectURL(recipe.previewUrl);
      });
    };
  }, []);

  function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    const startIndex = recipes.length;

    const newDrafts: RecipeDraft[] = imageFiles.map((file, i) => {
      const localId = `local-${Date.now()}-${i}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const name = nameFromFile(file, startIndex + i);
      recipeIdPromises.current[localId] = createRecipe(sessionId, name);
      return {
        id: localId,
        name,
        sourceUrl: null,
        file,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setRecipes((prev) => [...prev, ...newDrafts]);
  }

  function removeRecipe(id: string) {
    setRecipes((prev) => {
      const target = prev.find((recipe) => recipe.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((recipe) => recipe.id !== id);
    });
    setExtractions((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
    getRecipeId(id)?.then((recipeId) =>
      fetch(`/api/sessions/${sessionId}/recipes/${recipeId}`, {
        method: "DELETE",
      })
    );
    delete recipeIdPromises.current[id];
  }

  function renameRecipe(id: string, name: string) {
    setRecipes((prev) =>
      prev.map((recipe) => (recipe.id === id ? { ...recipe, name } : recipe))
    );
    getRecipeId(id)?.then((recipeId) =>
      fetch(`/api/sessions/${sessionId}/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    );
  }

  function updateRecipeSourceUrl(id: string, sourceUrl: string) {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === id ? { ...recipe, sourceUrl: sourceUrl || null } : recipe
      )
    );
    getRecipeId(id)?.then((recipeId) =>
      fetch(`/api/sessions/${sessionId}/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: sourceUrl || null }),
      })
    );
  }

  async function runExtraction(recipe: RecipeDraft) {
    if (!recipe.file) return;
    setExtractions((prev) => ({ ...prev, [recipe.id]: { status: "loading" } }));
    try {
      const extracted = await extractIngredients(recipe.file);
      const recipeId = await getRecipeId(recipe.id);
      const saved = await saveIngredients(sessionId, recipeId, extracted);
      setExtractions((prev) => ({
        ...prev,
        [recipe.id]: { status: "done", ingredients: saved },
      }));
    } catch (err) {
      setExtractions((prev) => ({
        ...prev,
        [recipe.id]: {
          status: "error",
          message: err instanceof Error ? err.message : "Extraction failed",
        },
      }));
    }
  }

  function runAllExtractions() {
    recipes
      .filter((r) => r.file && extractions[r.id]?.status !== "done")
      .forEach((recipe) => runExtraction(recipe));
  }

  function updateIngredient(
    recipeId: string,
    ingredientId: string,
    field: "name" | "quantity" | "unit",
    value: string
  ) {
    setExtractions((prev) => {
      const current = prev[recipeId];
      if (current?.status !== "done") return prev;
      return {
        ...prev,
        [recipeId]: {
          status: "done",
          ingredients: current.ingredients.map((ingredient) =>
            ingredient.id === ingredientId
              ? { ...ingredient, [field]: value || null }
              : ingredient
          ),
        },
      };
    });
    fetch(`/api/sessions/${sessionId}/ingredients/${ingredientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
  }

  function removeIngredient(recipeId: string, ingredientId: string) {
    setExtractions((prev) => {
      const current = prev[recipeId];
      if (current?.status !== "done") return prev;
      return {
        ...prev,
        [recipeId]: {
          status: "done",
          ingredients: current.ingredients.filter(
            (ingredient) => ingredient.id !== ingredientId
          ),
        },
      };
    });
    fetch(`/api/sessions/${sessionId}/ingredients/${ingredientId}`, {
      method: "DELETE",
    });
  }

  function toggleHave(key: string) {
    let nowHave = false;
    setHaveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        nowHave = false;
      } else {
        next.add(key);
        nowHave = true;
      }
      return next;
    });
    fetch(`/api/sessions/${sessionId}/have`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, have: nowHave }),
    });
  }

  return {
    recipes,
    extractions,
    haveKeys,
    loading,
    addFiles,
    removeRecipe,
    renameRecipe,
    updateRecipeSourceUrl,
    runExtraction,
    runAllExtractions,
    updateIngredient,
    removeIngredient,
    toggleHave,
  };
}

export type RecipeSession = ReturnType<typeof useRecipeSession>;
