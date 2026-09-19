import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import type { Catalog } from "./types";
import { loadCatalog } from "./lib/catalog";
import { Home } from "./pages/Home";
import { CaseFile } from "./pages/CaseFile";
import { Method } from "./pages/Method";
import { Control } from "./pages/Control";

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="boot">
        <p>Catalog failed to load. Run npm run ingest.</p>
      </div>
    );
  }
  if (!catalog) {
    return (
      <div className="boot">
        <p>Opening the mosaic…</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="top">
        <Link to="/" className="brand">
          JuMBO Tribunal
        </Link>
        <nav>
          <Link to="/">Cases</Link>
          <Link to="/method">Engine</Link>
          <Link to="/control">Control</Link>
        </nav>
      </div>
      <div id="main">
      <Routes>
        <Route path="/" element={<Home catalog={catalog} />} />
        <Route path="/method" element={<Method catalog={catalog} />} />
        <Route path="/control" element={<Control />} />
        <Route path="/case/:slug" element={<CaseRoute catalog={catalog} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </div>
  );
}

function CaseRoute({ catalog }: { catalog: Catalog }) {
  const { slug } = useParams();
  return <CaseFile catalog={catalog} slug={slug ?? ""} />;
}
