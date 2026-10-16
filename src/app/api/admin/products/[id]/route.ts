import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/current-role";
import { hasPermission } from "@/lib/rbac";
import { isSameOrigin } from "@/lib/security/same-origin";
import { logAuditEvent } from "@/lib/db/audit";
import { deleteProduct, listProducts, updateProduct } from "@/lib/db/content-store";
import { productSchema } from "../route";

const patchSchema = productSchema.partial();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "products.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product update.", issues: parsed.error.issues }, { status: 400 });
  }

  const { id } = await params;
  try {
    const before = (await listProducts()).find((p) => p._id === id);
    const updated = await updateProduct(id, parsed.data);
    await logAuditEvent({
      actorRole: role!.name,
      action: "PRODUCT_UPDATED",
      targetSummary: `product:${updated.slug}`,
      ipAddress: clientIp(request),
    });
    revalidatePath("/products");
    revalidatePath(`/products/${updated.slug}`);
    if (before && before.slug !== updated.slug) revalidatePath(`/products/${before.slug}`);
    revalidatePath("/");
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  const role = await getCurrentRole();
  if (!hasPermission(role ?? undefined, "products.manage")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const product = (await listProducts()).find((p) => p._id === id);
  await deleteProduct(id);
  await logAuditEvent({
    actorRole: role!.name,
    action: "PRODUCT_DELETED",
    targetSummary: `product:${product?.slug ?? id}`,
    ipAddress: clientIp(request),
  });
  revalidatePath("/products");
  if (product) revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
