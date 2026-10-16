import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { createRecipe, listRecipes } from "@/lib/db/content-store";

export const recipeSchema = z.object({
  slug: z.string().max(80).optional(),
  title: z.string().min(1).max(140),
  summary: z.string().min(1).max(400),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1).max(200),
  prepTimeMinutes: z.number().int().min(0).max(600),
  cookTimeMinutes: z.number().int().min(0).max(600),
  difficulty: z.enum(["easy", "medium", "advanced"]),
  servings: z.number().int().min(1).max(50),
  cuisine: z.string().min(1).max(60),
  ingredients: z
    .array(z.object({ label: z.string().min(1).max(160), productSlug: z.string().max(80).optional() }))
    .min(1),
  steps: z.array(z.object({ title: z.string().min(1).max(120), body: z.string().min(1).max(2000) })).min(1),
  productSlugs: z.array(z.string().max(80)).max(50),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function GET() {
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "recipes.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ recipes: await listRecipes() });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "recipes.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = recipeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recipe data.", issues: parsed.error.issues }, { status: 400 });
  }

  const created = await createRecipe(parsed.data);
  await logAuditEvent({
    actorRole: role!.name,
    action: "RECIPE_CREATED",
    targetSummary: `recipe:${created.slug}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/recipes");
  revalidatePath("/");
  return NextResponse.json({ recipe: created }, { status: 201 });
}
