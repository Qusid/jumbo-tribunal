# JuMBO Tribunal

Automatic case files for the 42 claimed Jupiter-mass binary objects (JuMBOs) in the Orion Nebula Cluster.

**Live site:** https://qusid.github.io/jumbo-tribunal/

Pearson & McCaughrean (2023) reported a 9% binary fraction among planetary-mass candidates in JWST GTO 1256 NIRCam of the Trapezium. Later NIRSpec work (Luhman 2025) finds that several claimed components are reddened background stars, and that JuMBO 24 is too massive to be a JuMBO if it is a cluster member. This site does not discover JuMBOs. It puts the public table next to the public spectra.

## Sources

- Pearson & McCaughrean 2023, [arXiv:2310.01231](https://arxiv.org/abs/2310.01231)
- Luhman 2025, [arXiv:2507.03679](https://arxiv.org/abs/2507.03679)
- JWST GTO 1256 NIRCam via [ESASky HiPS](https://skies.esac.esa.int/JWST/NIRCam_Imaging/)

## Run locally

```bash
npm install
npm run ingest
npm run dev
```

`npm run ingest` rebuilds `public/catalog.json`, JWST cutouts, and `sitemap.xml` from `data/jumbos.csv` and `data/priors.json`.
