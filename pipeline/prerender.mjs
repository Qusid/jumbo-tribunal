import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const index = join(dist, "index.html");
const catalog = JSON.parse(readFileSync(join(root, "public/catalog.json"), "utf8"));

const routes = [
  "method",
  "control",
  ...catalog.objects.map((o) => `case/${o.slug}`),
];

for (const route of routes) {
  const dir = join(dist, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(index, join(dir, "index.html"));
}
copyFileSync(index, join(dist, "404.html"));
console.log(`Prerendered ${routes.length} routes + 404.html`);
