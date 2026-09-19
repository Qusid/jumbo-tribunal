export type VerdictLabel = "background" | "too-massive" | "unconfirmed";

export type Evidence = {
  kind: string;
  title: string;
  detail: string;
  leans: string;
};

export type Component = {
  massMsun: number;
  massMjup: number;
  av: number;
  teffKIfMember: number;
};

export type Jumbo = {
  id: number;
  name: string;
  slug: string;
  ra: number;
  dec: number;
  cutout: string;
  cutoutFovDeg: number;
  nComponents: number;
  primary: Component;
  secondary: Component;
  tertiary: Component | null;
  massRatio: number;
  projectedSepAu: number;
  projectedSepArcsec: number;
  companionAngularSizeArcsec: number;
  chanceAlignment: {
    sepArcsec: number;
    pRandomNeighbor: number;
    surveyExpectedPairsWithin1as: number;
    note: string;
  };
  verdict: {
    label: VerdictLabel;
    score: number;
    confidence: string;
    reasons: string[];
    evidence: Evidence[];
  };
  ifMember: {
    assumption: string;
    belowDeuteriumLimit: boolean;
    noStar: boolean;
    sky: string;
  };
};

export type Catalog = {
  generatedAt: string;
  engine: { name: string; version: string; rules: string[] };
  sources: { id: string; title: string; authors: string; arxiv?: string; data?: string }[];
  priorsNote: string;
  survey: {
    region: string;
    distancePc: number;
    ageMyr: number;
    fovArcmin: { w: number; h: number };
    pmoCandidates: number;
    claimedJumbos: number;
    expectedChancePairsWithin1as: number;
    jwstProgram: string;
    hips: string;
  };
  counts: Partial<Record<VerdictLabel, number>>;
  objects: Jumbo[];
};
