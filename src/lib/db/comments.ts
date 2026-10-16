import { randomUUID } from "crypto";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore } from "@/lib/db/file-store";
import type { Comment, CommentStatus, CommentTargetType } from "@/types";

export interface NewComment {
  targetType: CommentTargetType;
  targetId: string;
  name: string;
  email: string;
  body: string;
}

export async function createComment(input: NewComment): Promise<Comment> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert({
        target_type: input.targetType,
        target_id: input.targetId,
        name: input.name,
        email: input.email,
        body: input.body,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return rowToComment(data);
  }

  const comment: Comment = {
    id: randomUUID(),
    targetType: input.targetType,
    targetId: input.targetId,
    name: input.name,
    email: input.email,
    body: input.body,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeStore((store) => {
    store.comments.push(comment);
  });
  return comment;
}

export async function listApprovedComments(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(rowToComment);
  }

  const { comments } = await readStore();
  return comments
    .filter((c) => c.targetType === targetType && c.targetId === targetId && c.status === "approved")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPendingComments(): Promise<Comment[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map(rowToComment);
  }

  const { comments } = await readStore();
  return comments.filter((c) => c.status === "pending");
}

export async function moderateComment(id: string, status: CommentStatus): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("comments").update({ status }).eq("id", id);
    if (error) throw error;
    return;
  }

  await writeStore((store) => {
    const comment = store.comments.find((c) => c.id === id);
    if (comment) comment.status = status;
  });
}

/** GDPR Article 17 erasure: scrub PII from all comments tied to an email address. */
export async function purgeCommentsByEmail(email: string): Promise<number> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("comments")
      .update({ name: "[erased]", email: "[erased]", body: "[removed by request]", status: "purged" })
      .eq("email", email)
      .select("id");
    if (error) throw error;
    return data.length;
  }

  let count = 0;
  await writeStore((store) => {
    for (const comment of store.comments) {
      if (comment.email === email) {
        comment.name = "[erased]";
        comment.email = "[erased]";
        comment.body = "[removed by request]";
        comment.status = "purged";
        count += 1;
      }
    }
  });
  return count;
}

function rowToComment(row: {
  id: string;
  target_type: CommentTargetType;
  target_id: string;
  name: string;
  email: string;
  body: string;
  status: CommentStatus;
  created_at: string;
}): Comment {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    name: row.name,
    email: row.email,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}
