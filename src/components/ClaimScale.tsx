import { useEffect, useRef, useState } from "react";
import type { Jumbo } from "../types";
import { isResolved, resolutionElements, trueSepAu } from "../lib/skyMath";
import { fmtMjup } from "../lib/format";

const MARKS = [
  { au: 1, label: "Earth" },
  { au: 5.2, label: "Jupiter" },
  { au: 30, label: "Neptune" },
];

export function ClaimScale({ object }: { object: Jumbo }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; pa: number; tilt: number } | null>(
    null,
  );
  const [pa, setPa] = useState(28);
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    setPa(12 + (object.id * 17) % 140);
    setTilt(0);
  }, [object.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#0c0a0b";
      ctx.fillRect(0, 0, w, h);

      const projected = object.projectedSepAu;
      const inferred = trueSepAu(projected, tilt);
      const maxR = Math.max(inferred * 0.62, 40);
      const scale = Math.min(w, h) * 0.38 / maxR;
      const cx = w * 0.5;
      const cy = h * 0.48;
      const dim = Math.exp(-object.primary.av / 14);
      const voided = object.verdict.label === "background";
      const stellar = object.verdict.label === "too-massive";

      ctx.strokeStyle = "rgba(244, 228, 198, 0.12)";
      ctx.lineWidth = 1;
      for (const mark of MARKS) {
        const r = mark.au * scale;
        if (r < 8) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const orbitA = (inferred / 2) * scale;
      const orbitB = orbitA * Math.cos((tilt * Math.PI) / 180);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((pa * Math.PI) / 180);
      ctx.strokeStyle = "rgba(226, 181, 106, 0.55)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitA, Math.max(orbitB, 2), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const x1 = -projected * 0.5 * scale;
      const x2 = projected * 0.5 * scale;
      const r1 = 7 + Math.sqrt(object.primary.massMjup) * 1.15;
      const r2 = 6 + Math.sqrt(object.secondary.massMjup) * 1.05;
      world(ctx, x1, 0, r1, object.primary.teffKIfMember, dim, voided, stellar);
      world(ctx, x2, 0, r2, object.secondary.teffKIfMember, dim, voided, stellar);
      if (object.tertiary) {
        world(
          ctx,
          x2 + 14,
          10,
          5 + Math.sqrt(object.tertiary.massMjup),
          object.tertiary.teffKIfMember,
          dim,
          voided,
          stellar,
        );
      }
      ctx.restore();

      ctx.fillStyle = "rgba(244, 228, 198, 0.4)";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      for (const mark of MARKS) {
        const r = mark.au * scale;
        if (r < 14 || r > maxR * scale * 1.02) continue;
        ctx.fillText(mark.label, cx, cy - r - 5);
      }

      ctx.fillStyle = "#f4e4c6";
      ctx.font = "12px 'IBM Plex Mono', monospace";
      ctx.fillText(`${projected} au projected`, cx, h - 36);
      ctx.fillStyle = "rgba(244, 228, 198, 0.62)";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      const split = isResolved(object.projectedSepArcsec)
        ? `NIRCam can split this (${resolutionElements(object.projectedSepArcsec).toFixed(1)} FWHM)`
        : "NIRCam sees one blended source";
      const masses = voided
        ? "spectrum voids the planet masses"
        : stellar
          ? `spectra → star/BD, not ${fmtMjup(object.primary.massMjup)} MJup`
          : `if members · AV ${object.primary.av} dims them`;
      ctx.fillText(
        tilt < 1
          ? `${split} · drag to tilt`
          : `if tilted ${tilt.toFixed(0)}° from the sky, ≥ ${inferred.toFixed(0)} au`,
        cx,
        h - 18,
      );
      ctx.fillText(masses, cx, 20);
    };

    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [object, pa, tilt]);

  return (
    <div className="stamp-stage">
      <canvas
        ref={canvasRef}
        className="claim-scale"
        aria-label="If-member scale compared with the solar system. Drag to tilt."
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, pa, tilt };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const nextPa = drag.current.pa + (e.clientX - drag.current.x) * 0.45;
          const nextTilt = Math.min(
            75,
            Math.max(0, drag.current.tilt - (e.clientY - drag.current.y) * 0.22),
          );
          setPa(nextPa);
          setTilt(nextTilt);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      />
    </div>
  );
}

function world(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  teff: number,
  dim: number,
  voided: boolean,
  stellar: boolean,
) {
  const t = Math.min(1, Math.max(0, (teff - 800) / 1800));
  let col = t > 0.55 ? "#f3d7a0" : t > 0.3 ? "#e8a56a" : "#d4784a";
  if (voided) col = "#8a7d70";
  if (stellar) col = "#d8e4e8";
  ctx.globalAlpha = 0.25 + 0.75 * dim;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
  halo.addColorStop(0, col);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (stellar) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - r * 3.2, y);
    ctx.lineTo(x + r * 3.2, y);
    ctx.moveTo(x, y - r * 3.2);
    ctx.lineTo(x, y + r * 3.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
