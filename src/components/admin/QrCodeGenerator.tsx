"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Recipe } from "@/types";

function RecipeQrCard({ recipe, siteUrl }: { recipe: Recipe; siteUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [version, setVersion] = useState(0);
  const url = `${siteUrl}/recipes/${recipe.slug}`;

  useEffect(() => {
    if (!canvasRef.current || isRegenerating) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 2 }).catch(() => {});
    // `version` has no effect on the QR content (same link = same pixels) — it only
    // forces this effect to re-run so the "Regenerate" button visibly redraws the canvas.
  }, [url, version, isRegenerating]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${recipe.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleRegenerate() {
    if (!confirm(`Regenerate the QR code for "${recipe.title}"? The image encodes the same link, so it will look identical, but it will be redrawn fresh — useful if the current one looks corrupted or blank.`)) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsRegenerating(true);
    setTimeout(() => {
      setVersion((v) => v + 1);
      setIsRegenerating(false);
      setRegenerated(true);
      setTimeout(() => setRegenerated(false), 1500);
    }, 400);
  }

  return (
    <li className="flex flex-col items-center gap-3 rounded-lg border border-brand-deep/15 bg-white p-4 text-center shadow-sm">
      <div className="relative flex h-[220px] w-[220px] items-center justify-center">
        <canvas ref={canvasRef} className="rounded" />
        {isRegenerating && (
          <span className="absolute inset-0 flex items-center justify-center rounded bg-white/80 text-xs font-semibold text-brand-deep">
            Regenerating…
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-brand-deep">{recipe.title}</p>
        <p className="truncate text-xs text-brand-ink/60">{url}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          title="Redraw this QR code"
          aria-label={`Regenerate QR code for ${recipe.title}`}
          className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10 disabled:opacity-60"
        >
          {regenerated ? "Regenerated!" : isRegenerating ? "Regenerating…" : "↻ Regenerate"}
        </button>
      </div>
    </li>
  );
}

export function QrCodeGenerator({ recipes, siteUrl }: { recipes: Recipe[]; siteUrl: string }) {
  if (recipes.length === 0) {
    return <p className="text-sm text-brand-ink/60">No recipes yet — add one first to generate a QR code.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeQrCard key={recipe._id} recipe={recipe} siteUrl={siteUrl} />
      ))}
    </ul>
  );
}
