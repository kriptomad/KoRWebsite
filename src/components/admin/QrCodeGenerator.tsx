"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Recipe } from "@/types";

function RecipeQrCard({ recipe, siteUrl }: { recipe: Recipe; siteUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [version, setVersion] = useState(0);
  const url = `${siteUrl}/recipes/${recipe.slug}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 2 }).catch(() => {});
    // `version` has no effect on the QR content — it only forces this effect
    // to re-run so the "Regenerate" button can force a fresh redraw.
  }, [url, version]);

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
    if (!confirm(`Regenerate the QR code for "${recipe.title}"? Any previously printed or downloaded copies will still work, but you'll need to redownload the new image.`)) {
      return;
    }
    setVersion((v) => v + 1);
    setRegenerated(true);
    setTimeout(() => setRegenerated(false), 1500);
  }

  return (
    <li className="flex flex-col items-center gap-3 rounded-lg border border-brand-deep/15 bg-white p-4 text-center shadow-sm">
      <canvas ref={canvasRef} className="rounded" />
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
          title="Redraw this QR code"
          aria-label={`Regenerate QR code for ${recipe.title}`}
          className="rounded border border-brand-deep/30 px-3 py-1 font-semibold text-brand-deep hover:bg-brand-deep/10"
        >
          {regenerated ? "Regenerated!" : "↻ Regenerate"}
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
