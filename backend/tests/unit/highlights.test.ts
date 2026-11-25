import { describe, expect, it } from 'vitest';
import { computeHighlights } from '../../src/services/highlights';
import type { ModelStats } from '../../src/types/domain';

const stat = (carModelId: number, over: Partial<ModelStats> = {}): ModelStats => ({
  carModelId,
  reviewCount: 0,
  averageRating: null,
  sampleReviewCount: 0,
  rentalsLastYear: 0,
  ...over,
});

describe('computeHighlights', () => {
  it('rounds the average to one decimal and flags sample ratings', () => {
    const h = computeHighlights([stat(1, { reviewCount: 150, averageRating: 4.26, sampleReviewCount: 150 }), stat(2, { reviewCount: 12, averageRating: 3.95 })]);
    expect(h.get(1)?.rating).toEqual({ average: 4.3, count: 150, sample: true });
    expect(h.get(2)?.rating).toEqual({ average: 4, count: 12, sample: false });
  });

  it('hides ratings until a model has at least 3 reviews', () => {
    expect(computeHighlights([stat(1, { reviewCount: 2, averageRating: 5 })]).get(1)?.rating).toBeNull();
  });

  it('gives "Most rented" to the model with the most rentals, from 3 rentals up', () => {
    const h = computeHighlights([stat(1, { rentalsLastYear: 9 }), stat(2, { rentalsLastYear: 14 }), stat(3, { rentalsLastYear: 2 })]);
    expect(h.get(2)?.badges).toEqual(['MostRented']);
    expect(h.get(1)?.badges).toEqual([]);
    expect(computeHighlights([stat(1, { rentalsLastYear: 2 })]).get(1)?.badges).toEqual([]);
  });

  it('gives "Most liked" to the best average with at least 10 reviews, more reviews winning a tie', () => {
    const h = computeHighlights([
      stat(1, { reviewCount: 9, averageRating: 5 }),
      stat(2, { reviewCount: 40, averageRating: 4.6 }),
      stat(3, { reviewCount: 120, averageRating: 4.6 }),
      stat(4, { reviewCount: 200, averageRating: 4.2 }),
    ]);
    expect(h.get(3)?.badges).toEqual(['MostLiked']);
    expect([1, 2, 4].every((id) => h.get(id)?.badges.length === 0)).toBe(true);
  });

  it('can give both badges to one model, and none when there is no data', () => {
    expect(computeHighlights([stat(1, { rentalsLastYear: 5, reviewCount: 30, averageRating: 4.8 })]).get(1)?.badges).toEqual(['MostRented', 'MostLiked']);
    expect(computeHighlights([stat(1)]).get(1)).toEqual({ rating: null, badges: [] });
  });
});
