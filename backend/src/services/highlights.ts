import type { ModelStats } from '../types/domain';

/** Ratings are shown once a model has this many reviews. */
export const MIN_REVIEWS_TO_SHOW = 3;
/** "Most liked" needs enough reviews to mean something. */
export const MIN_REVIEWS_FOR_MOST_LIKED = 10;
/** "Most rented" needs some real rentals behind it. */
export const MIN_RENTALS_FOR_MOST_RENTED = 3;

export type Badge = 'MostRented' | 'MostLiked';

export interface CarHighlights {
  rating: { average: number; count: number; sample: boolean } | null;
  badges: Badge[];
}

/** Picks the single best model by `score`, ignoring models that fail `eligible`. */
function best(stats: ModelStats[], eligible: (s: ModelStats) => boolean, score: (s: ModelStats) => number[]): number | null {
  let winner: ModelStats | null = null;
  for (const s of stats.filter(eligible)) {
    if (!winner) {
      winner = s;
      continue;
    }
    const [a, b] = [score(s), score(winner)];
    const i = a.findIndex((v, k) => v !== b[k]);
    if (i >= 0 && a[i] > b[i]) winner = s;
  }
  return winner?.carModelId ?? null;
}

/**
 * Rating and badges per model. "Most rented" counts confirmed rentals of the last 12 months;
 * "Most liked" is the best average among models with enough reviews (more reviews wins a tie).
 */
export function computeHighlights(stats: ModelStats[]): Map<number, CarHighlights> {
  const mostRented = best(stats, (s) => s.rentalsLastYear >= MIN_RENTALS_FOR_MOST_RENTED, (s) => [s.rentalsLastYear, s.reviewCount]);
  const mostLiked = best(
    stats,
    (s) => s.reviewCount >= MIN_REVIEWS_FOR_MOST_LIKED && s.averageRating !== null,
    (s) => [Math.round((s.averageRating ?? 0) * 100), s.reviewCount],
  );

  const result = new Map<number, CarHighlights>();
  for (const s of stats) {
    const badges: Badge[] = [];
    if (s.carModelId === mostRented) badges.push('MostRented');
    if (s.carModelId === mostLiked) badges.push('MostLiked');
    result.set(s.carModelId, {
      rating:
        s.reviewCount >= MIN_REVIEWS_TO_SHOW && s.averageRating !== null
          ? { average: Math.round(s.averageRating * 10) / 10, count: s.reviewCount, sample: s.sampleReviewCount > 0 }
          : null,
      badges,
    });
  }
  return result;
}
