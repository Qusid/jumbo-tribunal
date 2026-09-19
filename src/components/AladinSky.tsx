import { useEffect, useRef, useState } from "react";
import type { Jumbo } from "../types";

type AladinApi = {
  init: Promise<void>;
  aladin: (el: HTMLElement, opts: Record<string, unknown>) => AladinMap;
  catalog: (opts: Record<string, unknown>) => AladinCat;
  marker: (ra: number, dec: number, opts?: Record<string, unknown>) => unknown;
};

type AladinMap = {
  gotoRaDec: (ra: number, dec: number) => void;
  setFov: (fov: number) => void;
  addCatalog: (cat: AladinCat) => void;
  world2pix: (ra: number, dec: number) => number[] | null | undefined;
  on: (event: string, cb: () => void) => void;
  getBaseImageLayer: () => {
    setColormap?: (name: string, opts?: Record<string, unknown>) => void;
    setCuts?: (min: number, max: number) => void;
  } | null;
};

type AladinCat = {
  addSources: (sources: unknown[]) => void;
};

declare global {
  interface Window {
    A?: AladinApi;
  }
}

type Props = {
  targetRa: number;
  targetDec: number;
  fovDeg: number;
  objects?: Jumbo[];
  onSelect?: (slug: string) => void;
  showTarget?: boolean;
  targetLabel?: string;
};

function waitForA(): Promise<AladinApi> {
  if (window.A) return window.A.init.then(() => window.A as AladinApi);
  return new Promise((resolve) => {
    const id = window.setInterval(() => {
      if (window.A) {
        window.clearInterval(id);
        window.A.init.then(() => resolve(window.A as AladinApi));
      }
    }, 40);
  });
}

export function AladinSky({
  targetRa,
  targetDec,
  fovDeg,
  objects = [],
  onSelect,
  showTarget = false,
  targetLabel,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<AladinMap | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const objectsRef = useRef(objects);
  objectsRef.current = objects;
  const raRef = useRef(targetRa);
  const decRef = useRef(targetDec);
  raRef.current = targetRa;
  decRef.current = targetDec;
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let raf = 0;
    let lastX = Number.NaN;
    let lastY = Number.NaN;

    const project = () => {
      const aladin = map.current;
      if (!aladin) return;
      try {
        const xy = aladin.world2pix(raRef.current, decRef.current);
        if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) {
          if (Number.isFinite(lastX)) {
            lastX = Number.NaN;
            lastY = Number.NaN;
            setPin(null);
          }
          return;
        }
        if (Math.abs(xy[0] - lastX) < 0.4 && Math.abs(xy[1] - lastY) < 0.4) return;
        lastX = xy[0];
        lastY = xy[1];
        setPin({ x: xy[0], y: xy[1] });
      } catch {
        setPin(null);
      }
    };

    waitForA().then((A) => {
      if (cancelled || !host.current) return;
      const aladin = A.aladin(host.current, {
        survey: "https://skies.esac.esa.int/JWST/NIRCam_Imaging/",
        fov: fovDeg,
        target: `${targetRa} ${targetDec}`,
        cooFrame: "ICRSd",
        showReticle: false,
        showZoomControl: true,
        showFullscreenControl: false,
        showLayersControl: false,
        showGotoControl: false,
        showFrame: false,
        showCooGridControl: false,
        showProjectionControl: false,
        showSimbadPointerControl: false,
      });
      map.current = aladin;
      if (showTarget) {
        try {
          const layer = aladin.getBaseImageLayer();
          layer?.setColormap?.("grayscale", { stretch: "asinh" });
        } catch {
          /* default stretch still works at a tight FOV */
        }
      }
      aladin.on("positionChanged", project);
      aladin.on("zoomChanged", project);
      project();
      if (showTarget) {
        const tick = () => {
          project();
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }

      const current = objectsRef.current;
      if (current.length && !showTarget) {
        const overlay = A.catalog({
          name: "JuMBOs",
          sourceSize: 18,
          color: "#e8c37a",
          onClick: (source: { data?: { slug?: string } }) => {
            const slug = source?.data?.slug;
            if (slug) onSelectRef.current?.(slug);
          },
        });
        aladin.addCatalog(overlay);
        overlay.addSources(
          current.map((o) => {
            const color =
              o.verdict.label === "background"
                ? "#c47a5a"
                : o.verdict.label === "too-massive"
                  ? "#7eb0b8"
                  : "#e8c37a";
            const marker = A.marker(o.ra, o.dec, {
              popupTitle: o.name,
              popupDesc: o.verdict.confidence,
            }) as { data?: { slug: string }; color?: string };
            marker.data = { slug: o.slug };
            marker.color = color;
            return marker;
          }),
        );
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map.current = null;
      el.replaceChildren();
    };
  }, [fovDeg, showTarget, targetDec, targetRa]);

  useEffect(() => {
    map.current?.gotoRaDec(targetRa, targetDec);
    map.current?.setFov(fovDeg);
  }, [targetRa, targetDec, fovDeg]);

  return (
    <div className="sky-wrap">
      <div ref={host} className="sky" />
      {showTarget && pin ? (
        <div
          className="sky-pin"
          style={{ transform: `translate(${pin.x}px, ${pin.y}px)` }}
        >
          <i />
          <span>{targetLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
