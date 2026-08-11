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
  file: File;
  previewUrl: string;
  name: string;
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

async function extractIngredients(file: File): Promise<IngredientLine[]> {
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
  return data.ingredients.map((ingredient, i) => ({
    ...ingredient,
    id: `${Date.now()}-${i}`,
  }));
}

export function useRecipeSession() {
  const [recipes, setRecipes] = useState<RecipeDraft[]>([]);
  const [extractions, setExtractions] = useState<
    Record<string, ExtractionState>
  >({});
  const [haveKeys, setHaveKeys] = useState<Set<string>>(new Set());
  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;

  useEffect(() => {
    return () => {
      recipesRef.current.forEach((recipe) =>
        URL.revokeObjectURL(recipe.previewUrl)
      );
    };
  }, []);

  function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setRecipes((prev) => [
      ...prev,
      ...imageFiles.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: nameFromFile(file, prev.length + i),
      })),
    ]);
  }

  function removeRecipe(id: string) {
    setRecipes((prev) => {
      const target = prev.find((recipe) => recipe.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((recipe) => recipe.id !== id);
    });
    setExtractions((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function renameRecipe(id: string, name: string) {
    setRecipes((prev) =>
      prev.map((recipe) => (recipe.id === id ? { ...recipe, name } : recipe))
    );
  }

  async function runExtraction(recipe: RecipeDraft) {
    setExtractions((prev) => ({ ...prev, [recipe.id]: { status: "loading" } }));
    try {
      const ingredients = await extractIngredients(recipe.file);
      setExtractions((prev) => ({
        ...prev,
        [recipe.id]: { status: "done", ingredients },
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
    recipes.forEach((recipe) => runExtraction(recipe));
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
  }

  function toggleHave(key: string) {
    setHaveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return {
    recipes,
    extractions,
    haveKeys,
    addFiles,
    removeRecipe,
    renameRecipe,
    runExtraction,
    runAllExtractions,
    updateIngredient,
    removeIngredient,
    toggleHave,
  };
}

export type RecipeSession = ReturnType<typeof useRecipeSession>;
