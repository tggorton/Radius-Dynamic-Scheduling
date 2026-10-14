/*
 * Creative weighting under scheduling (D28). Pure — no React.
 *
 * Weights split delivery only among the creatives that are Serving right now.
 * The split is computed, never stored: as creatives start and end (or the demo
 * clock moves) the shares re-balance on their own. What *is* stored is the
 * weight a user typed (`customWeight`); it's kept until reset, including while
 * its creative isn't Serving, so it applies again when that creative returns.
 *
 * The split follows the multi-creative demo (Line-Item-Multi-Creative):
 * - one Serving creative gets 100%;
 * - no typed weights → an even split;
 * - typed weights are honored, and the rest is shared evenly by the others;
 * - typed weights over 100% (or all typed, under 100%) scale to fit.
 * Shares are whole percents that always total exactly 100 (largest remainder,
 * ties to the lower id).
 */

export interface WeightInput {
  id: number;
  customWeight: number | null;
  serving: boolean;
}

/** id → applied share in whole percent; `null` for a creative that isn't Serving. */
export type WeightShares = Map<number, number | null>;

const toWholePercents = (raw: Map<number, number>): Map<number, number> => {
  const entries = [...raw.entries()].sort((a, b) => a[0] - b[0]);
  const floors = entries.map(([id, v]) => [id, Math.floor(v), v - Math.floor(v)] as const);
  let left = 100 - floors.reduce((n, [, f]) => n + f, 0);
  const order = [...floors].sort((a, b) => b[2] - a[2] || a[0] - b[0]);
  const bump = new Set<number>();
  for (const [id] of order) {
    if (left <= 0) break;
    bump.add(id);
    left -= 1;
  }
  return new Map(floors.map(([id, f]) => [id, f + (bump.has(id) ? 1 : 0)]));
};

export const weightShares = (creatives: WeightInput[]): WeightShares => {
  const shares: WeightShares = new Map(creatives.map((c) => [c.id, null]));
  const serving = creatives.filter((c) => c.serving);
  if (serving.length === 0) return shares;
  if (serving.length === 1) {
    shares.set(serving[0].id, 100);
    return shares;
  }

  const custom = serving.filter((c) => c.customWeight !== null);
  const auto = serving.filter((c) => c.customWeight === null);
  const customTotal = custom.reduce((n, c) => n + (c.customWeight ?? 0), 0);
  const raw = new Map<number, number>();

  if (custom.length === 0 || (auto.length === 0 && customTotal === 0)) {
    serving.forEach((c) => raw.set(c.id, 100 / serving.length));
  } else if (customTotal >= 100 || auto.length === 0) {
    // Over-committed, or every share typed: scale the typed weights to 100.
    custom.forEach((c) => raw.set(c.id, ((c.customWeight ?? 0) * 100) / customTotal));
    auto.forEach((c) => raw.set(c.id, 0));
  } else {
    custom.forEach((c) => raw.set(c.id, c.customWeight ?? 0));
    auto.forEach((c) => raw.set(c.id, (100 - customTotal) / auto.length));
  }

  toWholePercents(raw).forEach((v, id) => shares.set(id, v));
  return shares;
};
