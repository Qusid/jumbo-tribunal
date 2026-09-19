export const SITE_NAME = "JuMBO Tribunal";
export const SITE_URL = "https://qusid.github.io/jumbo-tribunal";
export const SITE_DESCRIPTION =
  "Automatic case files for the 42 claimed Jupiter-mass binary objects (JuMBOs) in the Orion Nebula Cluster, assembled from public JWST NIRCam data.";

export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}

export function absUrl(path = "/"): string {
  if (path === "/") return `${SITE_URL}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}
