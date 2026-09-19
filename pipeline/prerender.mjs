import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const source = readFileSync(join(dist, "index.html"), "utf8");
const catalog = JSON.parse(readFileSync(join(root, "public/catalog.json"), "utf8"));
const site = "https://qusid.github.io/jumbo-tribunal";

const VERDICT = {
  background: "Spectrum: not a young brown dwarf",
  "too-massive": "Spectrum implies a star or brown dwarf",
  unconfirmed: "Photometry only — the claim is still a claim",
};

function esc(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function page(title, description, url) {
  const t = esc(title);
  const d = esc(description);
  return source
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/name="description"\s+content="[^"]*"/, `name="description"\n      content="${d}"`)
    .replace(/rel="canonical" href="[^"]*"/, `rel="canonical" href="${url}"`)
    .replace(/property="og:title"\s+content="[^"]*"/, `property="og:title"\n      content="${t}"`)
    .replace(
      /property="og:description"\s+content="[^"]*"/,
      `property="og:description"\n      content="${d}"`,
    )
    .replace(/property="og:url" content="[^"]*"/, `property="og:url" content="${url}"`)
    .replace(/name="twitter:title"\s+content="[^"]*"/, `name="twitter:title"\n      content="${t}"`)
    .replace(
      /name="twitter:description"\s+content="[^"]*"/,
      `name="twitter:description"\n      content="${d}"`,
    );
}

function writeRoute(route, title, description) {
  const url = `${site}/${route}/`;
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page(title, description, url));
}

writeRoute(
  "method",
  "How the tribunal decides · JuMBO Tribunal",
  "The automatic verdict engine for claimed JuMBOs: NIRSpec background classifications win, spectral types that imply stellar mass void the planetary claim, photometry-only systems stay unconfirmed.",
);
writeRoute(
  "control",
  "Control sample — where else are JuMBOs? · JuMBO Tribunal",
  "If JuMBOs are a new planetary-mass binary population, they should appear outside Orion. Upper Sco, Taurus, and NGC 1333 so far have not produced a confirmed swarm.",
);

for (const o of catalog.objects) {
  const short = VERDICT[o.verdict.label];
  writeRoute(
    `case/${o.slug}`,
    `${o.name} — ${short} · JuMBO Tribunal`,
    `${o.name}: ${short}. Pearson masses ${o.primary.massMjup} + ${o.secondary.massMjup} MJup at ${o.projectedSepAu} au (if a 1 Myr Orion member). JWST GTO 1256.`,
  );
}

copyFileSync(join(dist, "index.html"), join(dist, "404.html"));
console.log(`Prerendered ${2 + catalog.objects.length} routes with unique meta`);
