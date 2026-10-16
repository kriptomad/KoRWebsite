"use client";

import { useState } from "react";
import type { CommentTargetType } from "@/types";

export function CommentForm({ targetType, targetId }: { targetType: CommentTargetType; targetId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, name, email, body }),
    });

    if (response.ok) {
      setStatus("success");
      setName("");
      setEmail("");
      setBody("");
    } else {
      const data = await response.json().catch(() => ({}));
      setErrorMessage(data.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="rounded-lg bg-brand-deep/10 p-4 text-brand-deep">
        Thanks — your comment has been submitted and will appear once approved by our team.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={errorMessage ? "comment-form-error" : undefined}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Name</span>
          <input
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-brand-deep/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Email (not published)</span>
          <input
            required
            type="email"
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-brand-deep/20 px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span>Comment</span>
        <textarea
          required
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded border border-brand-deep/20 px-3 py-2"
        />
      </label>

      {errorMessage ? (
        <p id="comment-form-error" role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full bg-brand-deep px-6 py-2 font-semibold text-brand-cream transition-colors hover:bg-brand-deep-light disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Post comment"}
      </button>
    </form>
  );
}
