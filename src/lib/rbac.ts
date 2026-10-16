import type { Permission, Role } from "@/types";

export const PERMISSIONS_CATALOG: { id: Permission; label: string; group: string }[] = [
  { id: "content.create", label: "Create draft content", group: "Content" },
  { id: "content.publish", label: "Publish content", group: "Content" },
  { id: "products.manage", label: "Manage products & inventory", group: "Catalog" },
  { id: "recipes.manage", label: "Manage recipes", group: "Catalog" },
  { id: "posts.manage", label: "Manage editorial journal", group: "Catalog" },
  { id: "comments.moderate", label: "Moderate community comments", group: "Community" },
  { id: "roles.manage", label: "Manage roles & permissions", group: "Administration" },
  { id: "audit.view", label: "View audit log", group: "Administration" },
  { id: "gdpr.manage", label: "Process GDPR erasure requests", group: "Administration" },
];

/** Baseline system roles, mirrored from the `roles` seed rows in schema.sql. */
export const DEFAULT_ROLES: Role[] = [
  {
    id: "owner",
    name: "Owner",
    isSystem: true,
    permissions: PERMISSIONS_CATALOG.map((p) => p.id),
  },
  {
    id: "editor",
    name: "Editor",
    isSystem: false,
    permissions: ["content.create", "content.publish", "products.manage", "recipes.manage", "posts.manage"],
  },
  {
    id: "moderator",
    name: "Moderator",
    isSystem: false,
    permissions: ["comments.moderate"],
  },
];

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return role.permissions.includes(permission);
}
