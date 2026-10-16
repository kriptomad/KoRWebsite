import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { createProduct, listProducts } from "@/lib/db/content-store";

const nutritionSchema = z.object({
  caloriesKcal: z.number().min(0).max(2000),
  proteinG: z.number().min(0).max(200),
  saturatedFatG: z.number().min(0).max(200),
  unsaturatedFatG: z.number().min(0).max(200),
  omega3G: z.number().min(0).max(200),
  servingSizeG: z.literal(100),
});

export const productSchema = z.object({
  slug: z.string().max(80).optional(),
  name: z.string().min(1).max(100),
  scientificName: z.string().min(1).max(120),
  portOfOrigin: z.string().min(1).max(120),
  seasonStart: z.number().int().min(1).max(12),
  seasonEnd: z.number().int().min(1).max(12),
  allergens: z.array(z.string().max(40)).max(20),
  pricePerKg: z.number().min(0).max(10000),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  nutrition: nutritionSchema,
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function GET() {
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "products.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ products: await listProducts() });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "products.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data.", issues: parsed.error.issues }, { status: 400 });
  }

  const created = await createProduct(parsed.data);
  await logAuditEvent({
    actorRole: role!.name,
    action: "PRODUCT_CREATED",
    targetSummary: `product:${created.slug}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/products");
  revalidatePath("/");
  return NextResponse.json({ product: created }, { status: 201 });
}
