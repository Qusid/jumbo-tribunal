export const DISTANCE_PC = 390;
export const NIRCAM_FWHM_ARCSEC = 0.07;

export function cutoutFovDeg(sepArcsec: number): number {
  const min = 4.3 / 3600;
  const max = 12 / 3600;
  return Math.min(max, Math.max(min, (sepArcsec * 8) / 3600));
}

export function cutoutFovArcsec(sepArcsec: number): number {
  return cutoutFovDeg(sepArcsec) * 3600;
}

export function resolutionElements(sepArcsec: number): number {
  return sepArcsec / NIRCAM_FWHM_ARCSEC;
}

export function isResolved(sepArcsec: number): boolean {
  return resolutionElements(sepArcsec) >= 1;
}

/** Projected sep is a lower bound. Tilt 0° = in the plane of the sky. */
export function trueSepAu(projectedAu: number, tiltFromSkyDeg: number): number {
  const c = Math.cos((tiltFromSkyDeg * Math.PI) / 180);
  return projectedAu / Math.max(c, 0.08);
}

export function niceScaleArcsec(fovArcsec: number): number {
  const raw = fovArcsec / 5;
  const cands = [0.1, 0.2, 0.5, 1, 2, 4];
  const hit = [...cands].reverse().find((c) => c <= raw);
  return hit ?? 0.1;
}
