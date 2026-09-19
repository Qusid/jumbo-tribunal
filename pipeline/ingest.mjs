import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MSUN_TO_MJUP = 1047.35;
const DISTANCE_PC = 390;
const AGE_MYR = 1;
const SURVEY_ARCMIN = { w: 11, h: 7.5 };
const N_PMO = 540;
const N_JUMBOS_CLAIMED = 42;
const EXPECTED_CHANCE_PAIRS_1AS = 3.1;
const DEUTERIUM_BURNING_MJUP = 13;

function parseCsv(text) {
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const keys = header.split(",");
  return rows.map((line) => {
    const cols = line.split(",");
    const row = {};
    keys.forEach((k, i) => {
      row[k] = cols[i] === "" || cols[i] === undefined ? null : cols[i];
    });
    return row;
  });
}

function num(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function teffK(massMsun) {
  const mj = massMsun * MSUN_TO_MJUP;
  const t1 = 890;
  const t13 = 2520;
  const t = t1 + (Math.min(Math.max(mj, 0.6), 13) - 1) * ((t13 - t1) / 12);
  return Math.round(t);
}

function chanceAlignment(sepAu) {
  const thetaAs = sepAu / DISTANCE_PC;
  const surveyAs2 = SURVEY_ARCMIN.w * SURVEY_ARCMIN.h * 3600;
  const sigma = N_PMO / surveyAs2;
  const pNeighbor = 1 - Math.exp(-Math.PI * thetaAs * thetaAs * sigma);
  return {
    sepArcsec: Number(thetaAs.toFixed(4)),
    pRandomNeighbor: Number(pNeighbor.toFixed(5)),
    surveyExpectedPairsWithin1as: EXPECTED_CHANCE_PAIRS_1AS,
    note: `If 540 planetary-mass candidates are sprinkled at random over the ${SURVEY_ARCMIN.w}×${SURVEY_ARCMIN.h} arcmin mosaic, Pearson & McCaughrean expect ${EXPECTED_CHANCE_PAIRS_1AS} chance pairs inside 1 arcsec. This system's separation is ${thetaAs.toFixed(2)}". p(a random PMO has a neighbor this close) ≈ ${pNeighbor.toFixed(4)}.`,
  };
}

function angularSizeCompanionArcsec(sepAu) {
  const rJupM = 1.5 * 7.1492e7;
  const dM = sepAu * 1.495978707e11;
  return Number(((2 * rJupM) / dM) * 206265).toFixed(2);
}

function verdictFor(row, priors) {
  const id = row.id;
  const reasons = [];
  const evidence = [];
  let score = 48;
  let label = "unconfirmed";
  let confidence = "photometry only";

  const bg = priors.nirspecBackground.find((p) => p.id === id);
  const spec = priors.opticalSpectra.find((p) => p.id === id);
  const radio = priors.radio.find((p) => p.id === id);

  if (bg) {
    score = 8;
    label = "background";
    confidence = "high — spectrum";
    reasons.push(
      `NIRSpec of the ${bg.component} component shows no young-brown-dwarf H2O bands. Classified as a reddened background star.`,
    );
    evidence.push({
      kind: "spectrum",
      title: "JWST/NIRSpec (program 2770)",
      detail: bg.ref,
      leans: "background",
    });
  } else if (spec && spec.massMjup > DEUTERIUM_BURNING_MJUP) {
    score = 22;
    label = "too-massive";
    confidence = "high — spectrum";
    reasons.push(spec.note);
    evidence.push({
      kind: "spectrum",
      title: `${spec.spt} (${spec.component})`,
      detail: spec.ref,
      leans: "member, not planetary",
    });
  } else {
    reasons.push(
      "No published NIRSpec classification for this system in the text of Luhman (2025). Pearson masses assume a 1 Myr ONC member at 390 pc — they are not independent confirmation.",
    );
    evidence.push({
      kind: "photometry",
      title: "NIRCam SED fit (Pearson & McCaughrean 2023)",
      detail: "Mass and AV from 1 Myr evolutionary models at 390 pc.",
      leans: "claimed PMO binary",
    });
    const meanAv = (row.av_pri + row.av_sec) / 2;
    if (meanAv >= 30) {
      score -= 12;
      reasons.push(
        `Mean AV ≈ ${meanAv.toFixed(1)}. Heavy reddening is where background giants most easily mimic faint planetary-mass SEDs (Luhman 2024).`,
      );
    } else if (meanAv <= 6) {
      score += 6;
      reasons.push(
        `Mean AV ≈ ${meanAv.toFixed(1)}. Low extinction makes a background-giant impersonation harder, though still not a spectrum.`,
      );
    }
    if (row.proj_sep_au >= 300) {
      score -= 6;
      reasons.push(
        `Projected separation ${row.proj_sep_au} au is at the wide end of the 1" selection. Chance alignment is more plausible here than for the tightest pairs.`,
      );
    } else if (row.proj_sep_au <= 50) {
      score += 7;
      reasons.push(
        `Projected separation ${row.proj_sep_au} au (${(row.proj_sep_au / DISTANCE_PC).toFixed(2)}") is tight for this survey. Random pairing is unlikely.`,
      );
    }
    if (row.m_ter) {
      score -= 4;
      reasons.push(
        "Visual triple. Three faint red sources aligned is a stronger chance-alignment worry unless all three are spectroscopically members.",
      );
    }
    score = Math.max(18, Math.min(62, score));
    label = "unconfirmed";
    confidence = "medium — photometry only";
  }

  if (radio) {
    evidence.push({
      kind: "radio",
      title: "VLA 10 GHz counterpart",
      detail: radio.ref,
      leans: "real on-sky source",
    });
    reasons.push(radio.note);
    if (label === "unconfirmed") score = Math.min(score + 4, 64);
  }

  if (!bg && !spec) {
    evidence.push({
      kind: "context",
      title: "Luhman (2024, 2025) photometric challenge",
      detail:
        "Independent NIRCam colors and seven NIRSpec JuMBO components argue that most claimed JuMBOs are reddened background stars, not a new binary population.",
      leans: "against planetary binary",
    });
  }

  return { label, score, confidence, reasons, evidence };
}

async function main() {
  const csv = readFileSync(join(root, "data/jumbos.csv"), "utf8");
  const priors = JSON.parse(readFileSync(join(root, "data/priors.json"), "utf8"));
  const rows = parseCsv(csv).map((r) => ({
    id: Number(r.id),
    ra: num(r.ra),
    dec: num(r.dec),
    m_pri: num(r.m_pri),
    av_pri: num(r.av_pri),
    m_sec: num(r.m_sec),
    av_sec: num(r.av_sec),
    proj_sep_au: num(r.proj_sep_au),
    m_ter: num(r.m_ter),
    av_ter: num(r.av_ter),
  }));

  const objects = rows.map((row) => {
    const priMj = row.m_pri * MSUN_TO_MJUP;
    const secMj = row.m_sec * MSUN_TO_MJUP;
    const terMj = row.m_ter ? row.m_ter * MSUN_TO_MJUP : null;
    const q = secMj / priMj;
    const chance = chanceAlignment(row.proj_sep_au);
    const v = verdictFor(row, priors);
    const nComp = row.m_ter ? 3 : 2;

    return {
      id: row.id,
      name: `JuMBO ${row.id}`,
      slug: `jumbo-${row.id}`,
      ra: row.ra,
      dec: row.dec,
      nComponents: nComp,
      primary: {
        massMsun: row.m_pri,
        massMjup: Number(priMj.toFixed(2)),
        av: row.av_pri,
        teffKIfMember: teffK(row.m_pri),
      },
      secondary: {
        massMsun: row.m_sec,
        massMjup: Number(secMj.toFixed(2)),
        av: row.av_sec,
        teffKIfMember: teffK(row.m_sec),
      },
      tertiary: row.m_ter
        ? {
            massMsun: row.m_ter,
            massMjup: Number(terMj.toFixed(2)),
            av: row.av_ter,
            teffKIfMember: teffK(row.m_ter),
          }
        : null,
      massRatio: Number(q.toFixed(3)),
      projectedSepAu: row.proj_sep_au,
      projectedSepArcsec: chance.sepArcsec,
      companionAngularSizeArcsec: Number(angularSizeCompanionArcsec(row.proj_sep_au)),
      chanceAlignment: chance,
      verdict: v,
      ifMember: {
        assumption: `${AGE_MYR} Myr, ${DISTANCE_PC} pc, Pearson & McCaughrean 2023 evolutionary-model fit`,
        belowDeuteriumLimit: priMj < DEUTERIUM_BURNING_MJUP && secMj < DEUTERIUM_BURNING_MJUP,
        noStar: true,
        sky: "The Orion Nebula fills the sky. There is no host star. The companion is a second self-luminous world.",
      },
      cutout: `/cutouts/jumbo-${row.id}.png`,
      cutoutFovDeg: cutoutFovDeg(chance.sepArcsec),
    };
  });

  const counts = objects.reduce(
    (acc, o) => {
      acc[o.verdict.label] = (acc[o.verdict.label] || 0) + 1;
      return acc;
    },
    {},
  );

  const catalog = {
    generatedAt: new Date().toISOString(),
    engine: {
      name: "JuMBO tribunal",
      version: "0.1.0",
      rules: [
        "A JWST/NIRSpec background classification wins over photometric masses.",
        "A spectral type that implies mass ≫ 13 MJup at ONC age means the system is not a JuMBO, even if it is a cluster member.",
        "Pearson masses are conditional: they assume the source is a 1 Myr member at 390 pc.",
        "Photometry-only systems remain unconfirmed. High AV and wide separation lower the planetary-binary score; tight, lightly reddened pairs raise it.",
        "This engine does not discover JuMBOs. It assembles public evidence.",
      ],
    },
    sources: [
      {
        id: "PM23",
        title: "Jupiter Mass Binary Objects in the Trapezium Cluster",
        authors: "Pearson & McCaughrean 2023",
        arxiv: "2310.01231",
        data: "JWST GTO 1256, MAST 10.17909/vjys-x251",
      },
      {
        id: "Luhman2024",
        title: "Independent NIRCam analysis of ONC JuMBO candidates",
        authors: "Luhman 2024",
      },
      {
        id: "Luhman2025",
        title: "JWST spectra of brown dwarf candidates in the Orion Nebula Cluster",
        authors: "Luhman 2025",
        arxiv: "2507.03679",
        data: "JWST program 2770",
      },
      {
        id: "Rodriguez",
        title: "Radio counterpart and proper-motion limit for JuMBO 24",
        authors: "Rodríguez et al. 2024, 2025",
      },
    ],
    priorsNote: priors.nirspecBackgroundNote,
    survey: {
      region: "Inner Orion Nebula / Trapezium Cluster",
      distancePc: DISTANCE_PC,
      ageMyr: AGE_MYR,
      fovArcmin: SURVEY_ARCMIN,
      pmoCandidates: N_PMO,
      claimedJumbos: N_JUMBOS_CLAIMED,
      expectedChancePairsWithin1as: EXPECTED_CHANCE_PAIRS_1AS,
      jwstProgram: "GTO 1256",
      hips: "https://skies.esac.esa.int/JWST/NIRCam_Imaging/",
    },
    counts,
    objects,
  };

  await fetchCutouts(objects);

  const outDir = join(root, "public");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "catalog.json");
  writeFileSync(outPath, JSON.stringify(catalog, null, 2));
  writeSitemap(objects);
  console.log(`Wrote ${objects.length} case files → ${outPath}`);
  console.log("Verdicts", counts);
}

const SITE_URL = "https://qusid.github.io/jumbo-tribunal";

function writeSitemap(objects) {
  const urls = ["/", "/method", "/control", ...objects.map((o) => `/case/${o.slug}`)];
  const body = urls
    .map(
      (path) => `  <url>
    <loc>${SITE_URL}${path === "/" ? "/" : path}</loc>
    <changefreq>monthly</changefreq>
  </url>`,
    )
    .join("\n");
  writeFileSync(
    join(root, "public/sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`,
  );
}

function cutoutFovDeg(sepArcsec) {
  const min = 4.3 / 3600;
  const max = 12 / 3600;
  return Math.min(max, Math.max(min, (sepArcsec * 8) / 3600));
}

const STAMP_VERSION = "3";

async function fetchCutouts(objects) {
  const dir = join(root, "public/cutouts");
  mkdirSync(dir, { recursive: true });
  const versionPath = join(dir, "VERSION");
  const versionOk = existsSync(versionPath) && readFileSync(versionPath, "utf8").trim() === STAMP_VERSION;
  const pending = objects.filter((o) => {
    const dest = join(dir, `${o.slug}.png`);
    return !versionOk || !(existsSync(dest) && statSync(dest).size > 2000);
  });
  console.log(`Cutouts to fetch: ${pending.length} (stamp v${STAMP_VERSION})`);
  const queue = [...pending];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const o = queue.shift();
      if (!o) return;
      const dest = join(dir, `${o.slug}.png`);
      const url =
        "https://alasky.cds.unistra.fr/hips-image-services/hips2fits?" +
        new URLSearchParams({
          hips: "https://skies.esac.esa.int/JWST/NIRCam_Imaging/",
          width: "512",
          height: "512",
          fov: String(o.cutoutFovDeg),
          projection: "TAN",
          coordsys: "icrs",
          ra: String(o.ra),
          dec: String(o.dec),
          format: "png",
          stretch: "asinh",
        });
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        console.log("cutout", o.slug);
      } catch (err) {
        console.warn("cutout failed", o.slug, err);
      }
    }
  });
  await Promise.all(workers);
  writeFileSync(versionPath, STAMP_VERSION);
}

main();
