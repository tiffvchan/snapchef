import { prisma } from "@/lib/prisma";

type IngredientInput = {
  rawText: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  category: string;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const { recipeId } = await params;
  const { ingredients }: { ingredients: IngredientInput[] } =
    await request.json();

  const saved = await prisma.$transaction(async (tx) => {
    await tx.ingredientLine.deleteMany({ where: { recipeId } });
    if (ingredients.length === 0) return [];
    await tx.ingredientLine.createMany({
      data: ingredients.map((ingredient) => ({ ...ingredient, recipeId })),
    });
    return tx.ingredientLine.findMany({ where: { recipeId } });
  });

  return Response.json({ ingredients: saved });
}
