import type { Catalog, Jumbo, VerdictLabel } from "../types";
import { withBase } from "./site";

let cached: Catalog | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (cached) return cached;
  const res = await fetch(withBase("catalog.json"));
  if (!res.ok) throw new Error("Catalog failed to load");
  cached = (await res.json()) as Catalog;
  return cached;
}

export function bySlug(catalog: Catalog, slug: string): Jumbo | undefined {
  return catalog.objects.find((o) => o.slug === slug);
}

export const VERDICT_COPY: Record<
  VerdictLabel,
  { title: string; short: string }
> = {
  background: {
    title: "Background star",
    short: "Spectrum: not a young brown dwarf",
  },
  "too-massive": {
    title: "Member, not planetary",
    short: "Spectrum implies a star or brown dwarf",
  },
  unconfirmed: {
    title: "Unconfirmed",
    short: "Photometry only — the claim is still a claim",
  },
};
