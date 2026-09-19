import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Catalog, VerdictLabel } from "../types";
import { VERDICT_COPY } from "../lib/catalog";
import { AladinSky } from "../components/AladinSky";
import { Seo } from "../components/Seo";
import { fmtMjup } from "../lib/format";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";

export function Home({ catalog }: { catalog: Catalog }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | VerdictLabel>("all");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.objects.filter((o) => {
      if (filter !== "all" && o.verdict.label !== filter) return false;
      if (!needle) return true;
      return (
        o.name.toLowerCase().includes(needle) ||
        String(o.id) === needle ||
        o.verdict.label.includes(needle)
      );
    });
  }, [catalog.objects, q, filter]);

  const counts = catalog.counts;

  return (
    <div className="home">
      <Seo
        title="42 claimed Jupiter-mass binaries in Orion"
        description={SITE_DESCRIPTION}
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          description: SITE_DESCRIPTION,
        }}
      />
      <header className="mast">
        <div>
          <p className="eyebrow">Trapezium Cluster · JWST GTO 1256</p>
          <h1>The JuMBO Tribunal</h1>
          <p className="lede">
            Forty-two claimed Jupiter-mass binaries in Orion. An automatic case
            file on public JWST data — not a discovery machine, a place where
            the claim has to sit next to the spectrum.
          </p>
        </div>
        <dl className="tally">
          <div>
            <dt>Claimed</dt>
            <dd>{catalog.survey.claimedJumbos}</dd>
          </div>
          <div>
            <dt>Unconfirmed</dt>
            <dd>{counts.unconfirmed ?? 0}</dd>
          </div>
          <div>
            <dt>Background</dt>
            <dd>{counts.background ?? 0}</dd>
          </div>
          <div>
            <dt>Too massive</dt>
            <dd>{counts["too-massive"] ?? 0}</dd>
          </div>
        </dl>
      </header>

      <div className="viewport">
        <AladinSky
          targetRa={83.82}
          targetDec={-5.39}
          fovDeg={0.16}
          objects={catalog.objects}
          onSelect={(slug) => navigate(`/case/${slug}`)}
        />
      </div>
      <p className="credit">
        JWST/NIRCam imaging via ESASky HiPS · Pearson & McCaughrean mosaic,
        program 1256
      </p>

      <section className="index">
        <div className="index-bar">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search JuMBO 24, background, 11…"
            aria-label="Search systems"
          />
          <div className="pills" role="tablist">
            {(["all", "unconfirmed", "background", "too-massive"] as const).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  className={filter === key ? "on" : ""}
                  onClick={() => setFilter(key)}
                >
                  {key === "all" ? "All" : VERDICT_COPY[key].title}
                </button>
              ),
            )}
          </div>
        </div>

        <ul className="cards">
          {list.map((o) => (
            <li key={o.id}>
              <Link to={`/case/${o.slug}`} className={`card card-${o.verdict.label}`}>
                <span className="card-id">{o.name}</span>
                <span className="card-mass">
                  {fmtMjup(o.primary.massMjup)} + {fmtMjup(o.secondary.massMjup)} MJup
                  {o.tertiary ? ` + ${fmtMjup(o.tertiary.massMjup)}` : ""}
                </span>
                <span className="card-sep">{o.projectedSepAu} au</span>
                <span className="card-verdict">{VERDICT_COPY[o.verdict.label].title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
