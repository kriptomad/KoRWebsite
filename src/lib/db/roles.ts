import { randomUUID } from "crypto";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore } from "@/lib/db/file-store";
import type { Role } from "@/types";

export async function listRoles(): Promise<Role[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from("roles").select("*").order("name");
    if (error) throw error;
    return data.map(rowToRole);
  }
  const { roles } = await readStore();
  return roles;
}

export async function createRole(name: string): Promise<Role> {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) throw new Error("Role name is required");

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .insert({ name: trimmed, is_system: false, permissions: [] })
      .select()
      .single();
    if (error) throw error;
    return rowToRole(data);
  }

  const role: Role = { id: randomUUID(), name: trimmed, isSystem: false, permissions: [] };
  await writeStore((store) => {
    store.roles.push(role);
  });
  return role;
}

export async function updateRolePermissions(roleId: string, permissions: string[]): Promise<Role> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .update({ permissions })
      .eq("id", roleId)
      .select()
      .single();
    if (error) throw error;
    return rowToRole(data);
  }

  let updated: Role | undefined;
  await writeStore((store) => {
    const role = store.roles.find((r) => r.id === roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("The Owner role cannot be modified");
    role.permissions = permissions as Role["permissions"];
    updated = role;
  });
  return updated!;
}

export async function getRoleByName(name: string): Promise<Role | undefined> {
  const roles = await listRoles();
  return roles.find((role) => role.name.toLowerCase() === name.toLowerCase());
}

export async function getRoleById(id: string): Promise<Role | undefined> {
  const roles = await listRoles();
  return roles.find((role) => role.id === id);
}

function rowToRole(row: {
  id: string;
  name: string;
  is_system: boolean;
  permissions: string[];
}): Role {
  return {
    id: row.id,
    name: row.name,
    isSystem: row.is_system,
    permissions: row.permissions as Role["permissions"],
  };
}
