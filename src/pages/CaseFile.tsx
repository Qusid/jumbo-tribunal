import { Link, Navigate } from "react-router-dom";
import type { Catalog } from "../types";
import { bySlug, VERDICT_COPY } from "../lib/catalog";
import { fmtMjup, sexagesimalDec, sexagesimalRa } from "../lib/format";
import { JwstStamp } from "../components/JwstStamp";
import { ClaimScale } from "../components/ClaimScale";
import { VerdictMark } from "../components/VerdictMark";
import { Seo } from "../components/Seo";
import { SITE_URL } from "../lib/site";

export function CaseFile({
  catalog,
  slug,
}: {
  catalog: Catalog;
  slug: string;
}) {
  const object = bySlug(catalog, slug);
  if (!object) return <Navigate to="/" replace />;

  const prev = catalog.objects.find((o) => o.id === object.id - 1);
  const next = catalog.objects.find((o) => o.id === object.id + 1);

  const verdict = VERDICT_COPY[object.verdict.label];
  const description = `${object.name}: ${verdict.short}. Pearson masses ${fmtMjup(object.primary.massMjup)} + ${fmtMjup(object.secondary.massMjup)} MJup at ${object.projectedSepAu} au (if a 1 Myr Orion member). JWST GTO 1256.`;

  return (
    <article className="case">
      <Seo
        title={`${object.name} — ${verdict.title}`}
        description={description}
        path={`/case/${object.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          headline: `${object.name} case file`,
          description,
          url: `${SITE_URL}/case/${object.slug}`,
          about: "Jupiter-mass binary object candidate",
          citation: "Pearson & McCaughrean 2023, arXiv:2310.01231",
        }}
      />
      <nav className="case-nav">
        <Link to="/">All systems</Link>
        <span>
          {prev ? <Link to={`/case/${prev.slug}`}>← {prev.name}</Link> : <span />}
          {next ? <Link to={`/case/${next.slug}`}>{next.name} →</Link> : <span />}
        </span>
      </nav>

      <header className="case-head">
        <div>
          <p className="eyebrow">
            {sexagesimalRa(object.ra)} · {sexagesimalDec(object.dec)}
          </p>
          <h1>{object.name}</h1>
          <p className="lede">{VERDICT_COPY[object.verdict.label].short}</p>
        </div>
        <VerdictMark
          label={object.verdict.label}
          score={object.verdict.score}
          confidence={object.verdict.confidence}
        />
      </header>

      <div className="case-grid">
        <div className="viewport case-sky">
          <JwstStamp object={object} />
        </div>
        <div className="viewport">
          <ClaimScale object={object} />
        </div>
      </div>
      <p className="credit">
        Tight JWST/NIRCam stamp, locally stretched so the point source pops.
        Red ring is the companion’s projected separation — position angle is
        unpublished, so the second body sits somewhere on that ring. Drag and
        zoom. Right: the same numbers against the solar system — drag to tilt.
      </p>

      <section className="nums">
        <Metric
          label="Primary (if member)"
          value={`${fmtMjup(object.primary.massMjup)} MJup`}
          hint={`AV ${object.primary.av} · Teff ~${object.primary.teffKIfMember} K`}
        />
        <Metric
          label="Secondary (if member)"
          value={`${fmtMjup(object.secondary.massMjup)} MJup`}
          hint={`AV ${object.secondary.av} · Teff ~${object.secondary.teffKIfMember} K`}
        />
        <Metric
          label="Projected separation"
          value={`${object.projectedSepAu} au`}
          hint={`${object.projectedSepArcsec}″ at 390 pc`}
        />
        <Metric
          label="Mass ratio q"
          value={object.massRatio.toFixed(2)}
          hint={object.nComponents === 3 ? "visual triple" : "binary"}
        />
        <Metric
          label="Chance neighbor"
          value={object.chanceAlignment.pRandomNeighbor.toExponential(1)}
          hint="p(random PMO this close)"
        />
        <Metric
          label="Deuterium limit"
          value={object.ifMember.belowDeuteriumLimit ? "below 13 MJup" : "at/above"}
          hint="only if the member assumption holds"
        />
      </section>

      <section className="reasons">
        <h2>Why this verdict</h2>
        <ol>
          {object.verdict.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ol>
      </section>

      <section className="evidence">
        <h2>Evidence</h2>
        <ul>
          {object.verdict.evidence.map((item) => (
            <li key={item.title}>
              <span className="ev-kind">{item.kind}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <em>leans {item.leans}</em>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="assumption">
        Pearson masses assume {object.ifMember.assumption}. They are not
        independent of membership.
      </p>
    </article>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
