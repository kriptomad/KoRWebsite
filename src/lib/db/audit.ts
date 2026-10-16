import { randomUUID } from "crypto";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore } from "@/lib/db/file-store";
import type { AuditLogEntry } from "@/types";

export interface NewAuditEvent {
  actorRole: string;
  action: string;
  targetSummary: string;
  ipAddress: string;
}

export async function logAuditEvent(event: NewAuditEvent): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("audit_log").insert({
      actor_role: event.actorRole,
      action: event.action,
      target_summary: event.targetSummary,
      ip_address: event.ipAddress,
    });
    if (error) throw error;
    return;
  }

  await writeStore((store) => {
    store.auditLog.unshift({
      id: randomUUID(),
      actorRole: event.actorRole,
      action: event.action,
      targetSummary: event.targetSummary,
      ipAddress: event.ipAddress,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function listAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      actorRole: row.actor_role,
      action: row.action,
      targetSummary: row.target_summary,
      ipAddress: row.ip_address,
      createdAt: row.created_at,
    }));
  }

  const { auditLog } = await readStore();
  return auditLog.slice(0, limit);
}
