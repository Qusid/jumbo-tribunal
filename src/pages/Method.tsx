import type { Catalog } from "../types";
import { Seo } from "../components/Seo";

export function Method({ catalog }: { catalog: Catalog }) {
  return (
    <article className="prose">
      <Seo
        title="How the tribunal decides"
        description="The automatic verdict engine for claimed JuMBOs: NIRSpec background classifications win, spectral types that imply stellar mass void the planetary claim, photometry-only systems stay unconfirmed."
        path="/method"
      />
      <p className="eyebrow">Engine {catalog.engine.version}</p>
      <h1>How the tribunal decides</h1>
      <p className="lede">
        Every case file is generated. There is no hand-written verdict. The
        pipeline reads the Pearson & McCaughrean table, applies spectroscopic
        priors, and writes <code>catalog.json</code>.
      </p>

      <h2>Order of evidence</h2>
      <ol>
        {catalog.engine.rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>

      <h2>Chance alignment</h2>
      <p>
        The mosaic is {catalog.survey.fovArcmin.w}′ × {catalog.survey.fovArcmin.h}′
        at {catalog.survey.distancePc} pc. Pearson & McCaughrean identified{" "}
        {catalog.survey.pmoCandidates} planetary-mass candidates and expect{" "}
        {catalog.survey.expectedChancePairsWithin1as} chance pairs inside 1″.
        For each JuMBO we compute p(a random candidate has a neighbor at this
        separation) from that surface density. Tight pairs survive this test
        more easily than 300–380 au pairs. Surviving it is not a spectrum.
      </p>

      <h2>What “score” is</h2>
      <p>
        A 0–100 credibility for the <em>planetary-binary</em> claim, not for
        “this is a real source.” A background star can be a perfectly real
        JWST detection. Spectroscopic background lands near 8. A member whose
        type implies ~40–100 MJup lands near 22: the binary may be real, the
        JuMBO interpretation is not. Photometry-only systems sit in the
        middle, nudged by extinction and separation.
      </p>

      <blockquote>{catalog.priorsNote}</blockquote>

      <h2>Sources</h2>
      <ul className="sources">
        {catalog.sources.map((s) => (
          <li key={s.id}>
            <strong>{s.authors}</strong>
            <span>{s.title}</span>
            {s.arxiv ? <span>arXiv:{s.arxiv}</span> : null}
            {s.data ? <span>{s.data}</span> : null}
          </li>
        ))}
      </ul>

      <p>
        Re-run <code>npm run ingest</code> when a new table lands. The site
        does not reduce JWST ramps. It will not invent a JuMBO.
      </p>
    </article>
  );
}
