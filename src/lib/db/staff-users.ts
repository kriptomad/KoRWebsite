import { randomUUID } from "crypto";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore } from "@/lib/db/file-store";
import { hashPasscode, verifyPasscodeHash } from "@/lib/auth/password";
import type { StaffUser } from "@/types";

interface StaffUserRow {
  id: string;
  email: string;
  display_name: string;
  role_id: string;
  passcode_hash: string;
  must_change_passcode: boolean;
  created_at: string;
}

function rowToStaffUser(row: StaffUserRow): StaffUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    roleId: row.role_id,
    mustChangePasscode: row.must_change_passcode,
    createdAt: row.created_at,
  };
}

function toPublicUser(user: StaffUser & { passcodeHash: string }): StaffUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roleId: user.roleId,
    mustChangePasscode: user.mustChangePasscode,
    createdAt: user.createdAt,
  };
}

const PUBLIC_COLUMNS = "id,email,display_name,role_id,must_change_passcode,created_at";

export async function listStaffUsers(): Promise<StaffUser[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .select(PUBLIC_COLUMNS)
      .order("created_at");
    if (error) throw error;
    return (data as StaffUserRow[]).map(rowToStaffUser);
  }
  const { staffUsers } = await readStore();
  return staffUsers.map(toPublicUser);
}

export async function getStaffUserById(id: string): Promise<StaffUser | undefined> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .select(PUBLIC_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToStaffUser(data as StaffUserRow) : undefined;
  }
  const { staffUsers } = await readStore();
  const user = staffUsers.find((u) => u.id === id);
  return user ? toPublicUser(user) : undefined;
}

export async function createStaffUser(input: {
  email: string;
  displayName: string;
  roleId: string;
  passcode: string;
}): Promise<StaffUser> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!email || !displayName || !input.roleId) {
    throw new Error("Email, name, and role are required.");
  }
  if (input.passcode.length < 8) {
    throw new Error("Passcode must be at least 8 characters.");
  }
  const passcodeHash = hashPasscode(input.passcode);

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .insert({ email, display_name: displayName, role_id: input.roleId, passcode_hash: passcodeHash })
      .select(PUBLIC_COLUMNS)
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("A staff user with this email already exists.");
      throw error;
    }
    return rowToStaffUser(data as StaffUserRow);
  }

  const { staffUsers } = await readStore();
  if (staffUsers.some((u) => u.email === email)) {
    throw new Error("A staff user with this email already exists.");
  }
  const user = {
    id: randomUUID(),
    email,
    displayName,
    roleId: input.roleId,
    passcodeHash,
    mustChangePasscode: false,
    createdAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.staffUsers.push(user);
  });
  return toPublicUser(user);
}

/** Owner-only: sets a staff member's passcode directly, or hands them a
 * temporary one via `requireChange` so they must set their own on next login. */
export async function resetStaffPasscode(
  id: string,
  newPasscode: string,
  options: { requireChange: boolean },
): Promise<StaffUser> {
  if (newPasscode.length < 8) {
    throw new Error("Passcode must be at least 8 characters.");
  }
  const passcodeHash = hashPasscode(newPasscode);

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .update({ passcode_hash: passcodeHash, must_change_passcode: options.requireChange })
      .eq("id", id)
      .select(PUBLIC_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Staff user not found.");
    return rowToStaffUser(data as StaffUserRow);
  }

  let updated: StaffUser | undefined;
  await writeStore((store) => {
    const target = store.staffUsers.find((u) => u.id === id);
    if (!target) return;
    target.passcodeHash = passcodeHash;
    target.mustChangePasscode = options.requireChange;
    updated = toPublicUser(target);
  });
  if (!updated) throw new Error("Staff user not found.");
  return updated;
}

/** Self-service passcode change: requires the caller to already know their
 * current passcode. Always clears mustChangePasscode on success. */
export async function changeOwnPasscode(
  id: string,
  currentPasscode: string,
  newPasscode: string,
): Promise<StaffUser | null> {
  if (newPasscode.length < 8) {
    throw new Error("Passcode must be at least 8 characters.");
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .select(`${PUBLIC_COLUMNS},passcode_hash`)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as StaffUserRow;
    if (!verifyPasscodeHash(currentPasscode, row.passcode_hash)) return null;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("staff_users")
      .update({ passcode_hash: hashPasscode(newPasscode), must_change_passcode: false })
      .eq("id", id)
      .select(PUBLIC_COLUMNS)
      .single();
    if (updateError) throw updateError;
    return rowToStaffUser(updated as StaffUserRow);
  }

  const { staffUsers } = await readStore();
  const existing = staffUsers.find((u) => u.id === id);
  if (!existing || !verifyPasscodeHash(currentPasscode, existing.passcodeHash)) return null;

  let updated: StaffUser | undefined;
  await writeStore((store) => {
    const target = store.staffUsers.find((u) => u.id === id);
    if (!target) return;
    target.passcodeHash = hashPasscode(newPasscode);
    target.mustChangePasscode = false;
    updated = toPublicUser(target);
  });
  return updated ?? null;
}

export async function deleteStaffUser(id: string): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("staff_users").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await writeStore((store) => {
    store.staffUsers = store.staffUsers.filter((u) => u.id !== id);
  });
}

/** Verifies email + passcode for the admin login flow; returns the public
 * staff user record (never the hash) on success. */
export async function verifyStaffCredentials(email: string, passcode: string): Promise<StaffUser | null> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("staff_users")
      .select(`${PUBLIC_COLUMNS},passcode_hash`)
      .eq("email", normalized)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as StaffUserRow;
    if (!verifyPasscodeHash(passcode, row.passcode_hash)) return null;
    return rowToStaffUser(row);
  }

  const { staffUsers } = await readStore();
  const user = staffUsers.find((u) => u.email === normalized);
  if (!user) return null;
  if (!verifyPasscodeHash(passcode, user.passcodeHash)) return null;
  return toPublicUser(user);
}
