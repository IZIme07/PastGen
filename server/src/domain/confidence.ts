// Агрегация уверенности профиля: взвешенное среднее primary-утверждений.
// Веса отражают значимость типа факта для идентичности человека.
const WEIGHTS: Record<string, number> = {
  birth_date: 3,
  birth_place: 2,
  death_date: 2,
  death_place: 1,
  marriage: 2,
  relationship: 2,
};
const DEFAULT_WEIGHT = 1;

export function profileConfidence(
  claims: { claim_type: string; confidence: number; status: string }[],
): number {
  const primary = claims.filter((c) => c.status === "primary");
  if (primary.length === 0) return 0;
  let sum = 0;
  let weight = 0;
  for (const c of primary) {
    const w = WEIGHTS[c.claim_type] ?? DEFAULT_WEIGHT;
    sum += w * c.confidence;
    weight += w;
  }
  return Math.round(sum / weight);
}
