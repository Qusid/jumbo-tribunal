import { useEffect } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absUrl } from "../lib/site";

type JsonLd = Record<string, unknown>;

type Props = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  jsonLd?: JsonLd | JsonLd[];
};

function setMeta(key: string, value: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image = `${SITE_URL}/og.png`,
  jsonLd,
}: Props) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    const url = absUrl(path);
    document.title = fullTitle;
    setMeta("description", description);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:image", image, "property");
    setMeta("og:type", path === "/" ? "website" : "article", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);
    setLink("canonical", url);

    const scriptId = "json-ld-main";
    let script = document.getElementById(scriptId);
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        (script as HTMLScriptElement).type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [description, image, jsonLd, path, title]);

  return null;
}
