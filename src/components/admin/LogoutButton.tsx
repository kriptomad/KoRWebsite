"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-brand-deep/30 px-4 py-1.5 text-sm font-semibold text-brand-deep hover:bg-brand-deep/10"
    >
      Sign out
    </button>
  );
}
