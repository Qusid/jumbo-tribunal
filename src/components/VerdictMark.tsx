import type { VerdictLabel } from "../types";
import { VERDICT_COPY } from "../lib/catalog";

export function VerdictMark({
  label,
  score,
  confidence,
}: {
  label: VerdictLabel;
  score: number;
  confidence: string;
}) {
  const copy = VERDICT_COPY[label];
  return (
    <div className={`stamp stamp-${label}`}>
      <span className="stamp-kicker">{confidence}</span>
      <strong>{copy.title}</strong>
      <span className="stamp-score">score {score}</span>
    </div>
  );
}
