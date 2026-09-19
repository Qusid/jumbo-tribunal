import { useEffect, useRef, useState } from "react";
import type { Jumbo } from "../types";
import {
  cutoutFovArcsec,
  isResolved,
  niceScaleArcsec,
  resolutionElements,
} from "../lib/skyMath";
import { withBase } from "../lib/site";

type Props = { object: Jumbo };

export function JwstStamp({ object }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const srcRef = useRef<HTMLCanvasElement | null>(null);
  const pan = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.35);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const [, bump] = useState(0);
  const [ready, setReady] = useState(false);
  const fov = object.cutoutFovDeg || cutoutFovArcsec(object.projectedSepArcsec) / 3600;
  const fovArcsec = fov * 3600;

  const paint = () => {
    const canvas = canvasRef.current;
    const src = srcRef.current;
    if (!canvas || !src) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);

    const zoom = zoomRef.current;
    const size = Math.min(w, h) * zoom;
    const cx = w / 2 + pan.current.x;
    const cy = h / 2 + pan.current.y;
    ctx.imageSmoothingEnabled = zoom < 2.6;
    ctx.drawImage(src, cx - size / 2, cy - size / 2, size, size);

    const pxPerArcsec = size / fovArcsec;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = "rgba(226, 75, 58, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(object.projectedSepArcsec * pxPerArcsec, 7), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const bar = niceScaleArcsec(fovArcsec);
    const barPx = bar * pxPerArcsec;
    const bx = 16;
    const by = h - 28;
    ctx.strokeStyle = "#f4e4c6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + barPx, by);
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + barPx, by - 4);
    ctx.lineTo(bx + barPx, by + 4);
    ctx.stroke();
    ctx.fillStyle = "#f4e4c6";
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${bar}″   ${(bar * 390).toFixed(0)} au`, bx, by - 8);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(244, 228, 198, 0.75)";
    const split = isResolved(object.projectedSepArcsec)
      ? `resolved · ${resolutionElements(object.projectedSepArcsec).toFixed(1)}× FWHM`
      : "blended inside NIRCam FWHM";
    ctx.fillText(`${fovArcsec.toFixed(1)}″ across`, w - 14, 18);
    ctx.fillText(split, w - 14, 34);
    ctx.fillText("ring = companion radius, PA unknown", w - 14, h - 14);
  };

  useEffect(() => {
    let dead = false;
    const img = new Image();
    img.onload = () => {
      if (dead) return;
      srcRef.current = localStretch(img);
      pan.current = { x: 0, y: 0 };
      zoomRef.current = 1.35;
      setReady(true);
      bump((n) => n + 1);
    };
    img.onerror = () => {
      if (!dead) setReady(false);
    };
    setReady(false);
    img.src = withBase(object.cutout);
    return () => {
      dead = true;
    };
  }, [object.cutout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    paint();
    const ro = new ResizeObserver(() => paint());
    ro.observe(canvas);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.min(
        8,
        Math.max(1, zoomRef.current * (e.deltaY < 0 ? 1.12 : 0.89)),
      );
      paint();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      canvas.removeEventListener("wheel", onWheel);
    };
  });

  return (
    <div className="stamp-stage">
      <canvas
        ref={canvasRef}
        className="jwst-stamp"
        aria-label={`${object.name} JWST NIRCam stamp, ${fovArcsec.toFixed(1)} arcseconds`}
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            px: pan.current.x,
            py: pan.current.y,
          };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          pan.current = {
            x: drag.current.px + (e.clientX - drag.current.x),
            y: drag.current.py + (e.clientY - drag.current.y),
          };
          paint();
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      />
      <p className="stamp-hud">drag to pan · scroll to zoom</p>
    </div>
  );
}

function localStretch(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.drawImage(img, 0, 0);
  const blur = document.createElement("canvas");
  blur.width = Math.max(16, Math.floor(c.width / 10));
  blur.height = Math.max(16, Math.floor(c.height / 10));
  const bctx = blur.getContext("2d");
  if (!bctx) return c;
  bctx.imageSmoothingEnabled = true;
  bctx.drawImage(c, 0, 0, blur.width, blur.height);
  const sharp = document.createElement("canvas");
  sharp.width = c.width;
  sharp.height = c.height;
  const sctx = sharp.getContext("2d");
  if (!sctx) return c;
  sctx.drawImage(blur, 0, 0, c.width, c.height);
  const a = ctx.getImageData(0, 0, c.width, c.height);
  const b = sctx.getImageData(0, 0, c.width, c.height);
  const n = a.data.length / 4;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const o = i * 4;
    const raw = 0.3 * a.data[o] + 0.59 * a.data[o + 1] + 0.11 * a.data[o + 2];
    const sm = 0.3 * b.data[o] + 0.59 * b.data[o + 1] + 0.11 * b.data[o + 2];
    lum[i] = raw - 0.62 * sm;
  }
  const sample: number[] = [];
  const step = Math.max(1, Math.floor(n / 8000));
  for (let i = 0; i < n; i += step) sample.push(lum[i]);
  sample.sort((x, y) => x - y);
  const lo = sample[Math.floor(sample.length * 0.08)] ?? 0;
  const hi = sample[Math.floor(sample.length * 0.98)] ?? 1;
  const span = Math.max(hi - lo, 1e-3);
  const k = Math.asinh(10);
  for (let i = 0; i < n; i += 1) {
    let x = (lum[i] - lo) / span;
    x = Math.asinh(Math.max(0, x) * 10) / k;
    const v = Math.max(0, Math.min(255, Math.round(x * 255)));
    const o = i * 4;
    a.data[o] = v;
    a.data[o + 1] = v;
    a.data[o + 2] = v;
  }
  ctx.putImageData(a, 0, 0);
  return c;
}
