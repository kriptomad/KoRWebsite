import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { deleteRecipe, listRecipes, updateRecipe } from "@/lib/db/content-store";
import { recipeSchema } from "../route";

const patchSchema = recipeSchema.partial();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "recipes.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recipe update.", issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  try {
    const before = (await listRecipes()).find((r) => r._id === id);
    const updated = await updateRecipe(id, parsed.data);
    await logAuditEvent({
      actorRole: role!.name,
      action: "RECIPE_UPDATED",
      targetSummary: `recipe:${updated.slug}`,
      ipAddress: clientIp(request),
    });
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${updated.slug}`);
    if (before && before.slug !== updated.slug) revalidatePath(`/recipes/${before.slug}`);
    revalidatePath("/");
    return NextResponse.json({ recipe: updated });
  } catch {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "recipes.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const recipe = (await listRecipes()).find((r) => r._id === id);
  await deleteRecipe(id);
  await logAuditEvent({
    actorRole: role!.name,
    action: "RECIPE_DELETED",
    targetSummary: `recipe:${recipe?.slug ?? id}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/recipes");
  if (recipe) revalidatePath(`/recipes/${recipe.slug}`);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
