"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PERMISSIONS_CATALOG } from "@/lib/rbac";
import type { Permission, Role } from "@/types";

export function PermissionMatrix({ roles: initialRoles }: { roles: Role[] }) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoles[0]?.id);
  const [newRoleName, setNewRoleName] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const groups = Array.from(new Set(PERMISSIONS_CATALOG.map((p) => p.group)));

  async function togglePermission(permission: Permission) {
    if (!selectedRole || selectedRole.isSystem) return;
    const hasIt = selectedRole.permissions.includes(permission);
    const nextPermissions = hasIt
      ? selectedRole.permissions.filter((p) => p !== permission)
      : [...selectedRole.permissions, permission];

    setSaving(true);
    const response = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId: selectedRole.id, permissions: nextPermissions }),
    });
    if (response.ok) {
      const { role } = await response.json();
      setRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)));
    }
    setSaving(false);
    router.refresh();
  }

  async function handleCreateRole(event: React.FormEvent) {
    event.preventDefault();
    if (!newRoleName.trim()) return;
    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoleName }),
    });
    if (response.ok) {
      const { role } = await response.json();
      setRoles((prev) => [...prev, role]);
      setNewRoleName("");
      setSelectedRoleId(role.id);
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRoleId(role.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              role.id === selectedRoleId
                ? "bg-brand-deep text-brand-cream"
                : "border border-brand-deep/30 text-brand-deep hover:bg-brand-deep/10"
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateRole} className="mt-4 flex gap-2">
        <input
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          placeholder="New role name"
          className="rounded border border-brand-deep/20 px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded-full border border-brand-deep/30 px-4 py-1.5 text-sm font-semibold text-brand-deep hover:bg-brand-deep/10">
          Add role
        </button>
      </form>

      {selectedRole ? (
        <div className="mt-8 space-y-6">
          {selectedRole.isSystem ? (
            <p className="text-sm text-brand-ink/60">The Owner role always has full access and cannot be modified.</p>
          ) : null}

          {groups.map((group) => (
            <fieldset key={group} className="rounded-lg border border-brand-deep/15 p-4">
              <legend className="px-1 text-sm font-semibold text-brand-deep">{group}</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {PERMISSIONS_CATALOG.filter((p) => p.group === group).map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRole.permissions.includes(permission.id)}
                      disabled={selectedRole.isSystem || saving}
                      onChange={() => togglePermission(permission.id)}
                      className="h-4 w-4 accent-brand-deep"
                    />
                    {permission.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}
    </div>
  );
}
