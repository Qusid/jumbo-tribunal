export function fmtMjup(n: number): string {
  if (n < 10) return n.toFixed(1);
  return n.toFixed(0);
}

export function sexagesimalRa(deg: number): string {
  const hours = deg / 15;
  const h = Math.floor(hours);
  const mFloat = (hours - h) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${s.toFixed(2)}s`;
}

export function sexagesimalDec(deg: number): string {
  const sign = deg < 0 ? "−" : "+";
  const a = Math.abs(deg);
  const d = Math.floor(a);
  const mFloat = (a - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${sign}${d}° ${String(m).padStart(2, "0")}′ ${s.toFixed(1)}″`;
}
