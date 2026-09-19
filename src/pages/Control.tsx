import { Seo } from "../components/Seo";

export function Control() {
  return (
    <article className="prose">
      <Seo
        title="Control sample — where else are JuMBOs?"
        description="If JuMBOs are a new planetary-mass binary population, they should appear outside Orion. Upper Sco, Taurus, and NGC 1333 so far have not produced a confirmed swarm."
        path="/control"
      />
      <p className="eyebrow">Control sample</p>
      <h1>If JuMBOs are a new population, where else are they?</h1>
      <p className="lede">
        Orion is dense, young, and sitting in front of a molecular cloud.
        That is either why planetary-mass binaries can exist here — or why
        background stars are so easy to mistake for them.
      </p>

      <h2>Upper Scorpius / Ophiuchus</h2>
      <p>
        Miret-Roig et al. (2022) published 70–170 isolated planetary-mass
        candidates in a nearby association with proper motions, not just
        colors. A 2025–26 HST and VLT search for companions around 77 young
        brown dwarfs and isolated planetary-mass objects in Upper Sco and
        Taurus found no confirmed JuMBO-like planetary-mass binaries. One
        candidate sits in Taurus. The null is the point: a 9% wide-binary
        fraction at Jupiter masses should have shown up somewhere quieter
        than the Trapezium.
      </p>

      <h2>NGC 1333</h2>
      <p>
        JWST/NIRISS spectroscopy there found six free-floating objects
        between about 5 and 15 Jupiter masses, including one with a disk.
        They are loners. No claimed wide planetary-mass binary swarm.
      </p>

      <h2>What would change this page</h2>
      <p>
        A spectroscopically confirmed pair below 13 MJup in a low-extinction
        region. Until then, Orion is either special or contaminated. This
        tribunal exists so those two sentences cannot be swapped by a press
        image.
      </p>
    </article>
  );
}
