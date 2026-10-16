"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, StaffUser } from "@/types";

function generatePasscode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

export function StaffUserManager({
  initialStaffUsers,
  roles,
}: {
  initialStaffUsers: StaffUser[];
  roles: Role[];
}) {
  const router = useRouter();
  const [staffUsers, setStaffUsers] = useState(initialStaffUsers);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  function roleName(id: string): string {
    return roles.find((r) => r.id === id)?.name ?? "Unknown role";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCreatedNotice(null);
    if (!email.trim() || !displayName.trim() || !roleId || passcode.length < 8) {
      setError("Fill in email, name, a role, and a passcode of at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/staff-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, roleId, passcode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not create the staff user.");
        return;
      }
      setStaffUsers((prev) => [...prev, payload.staffUser]);
      setCreatedNotice(
        `Account created for ${email}. Share this passcode with them securely — it won't be shown again: ${passcode}`,
      );
      setEmail("");
      setDisplayName("");
      setPasscode("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string, label: string) {
    if (!confirm(`Revoke access for ${label}? They will be signed out immediately and can no longer log in.`)) return;
    const response = await fetch(`/api/admin/staff-users/${id}`, { method: "DELETE" });
    if (response.ok) {
      setStaffUsers((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    } else {
      const payload = await response.json().catch(() => ({}));
      alert(payload.error ?? "Could not revoke access.");
    }
  }

  return (
    <div className="space-y-10">
      <ul className="space-y-3">
        {staffUsers.map((user) => (
          <li
            key={user.id}
            className="flex flex-col gap-3 rounded-lg border border-brand-deep/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-brand-deep">{user.displayName}</p>
              <p className="truncate text-sm text-brand-ink/60">
                {user.email} · {roleName(user.roleId)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(user.id, user.displayName)}
              className="shrink-0 rounded border border-red-700/30 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Revoke access
            </button>
          </li>
        ))}
        {staffUsers.length === 0 ? (
          <p className="text-sm text-brand-ink/60">No staff accounts yet — add the first one below.</p>
        ) : null}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-brand-deep/15 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-brand-deep">Add a staff account</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Full name *</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Email *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Role *</span>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="mt-1 w-full rounded border border-brand-deep/20 px-3 py-1.5"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-deep">Passcode * (min. 8 characters)</span>
            <div className="mt-1 flex gap-2">
              <input
                type={showPasscode ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="min-w-0 flex-1 rounded border border-brand-deep/20 px-3 py-1.5"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode((v) => !v)}
                className="shrink-0 rounded border border-brand-deep/30 px-2 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
              >
                {showPasscode ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasscode(generatePasscode());
                  setShowPasscode(true);
                }}
                className="shrink-0 rounded border border-brand-deep/30 px-2 text-xs font-semibold text-brand-deep hover:bg-brand-deep/10"
              >
                Generate
              </button>
            </div>
          </label>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {createdNotice ? <p className="rounded bg-brand-cream p-3 text-sm text-brand-ink">{createdNotice}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-deep px-5 py-2 text-sm font-semibold text-brand-cream hover:bg-brand-deep-dark disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
