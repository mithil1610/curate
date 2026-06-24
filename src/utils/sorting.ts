import { Place } from '../services/placesApi';

type UserPrefs = Record<string, number>;

export function sortRestaurantsByRelevance(restaurants: Place[], userPrefs: UserPrefs): Place[] {
  return [...restaurants].sort((a, b) => {
    // 1. Calculate Quality Multiplier
    // Ratings > 4.5 give a massive boost, effectively treating 4.6+ as highly premium
    const qualityA = a.rating > 4.5 ? a.rating + ((a.rating - 4.5) * 5) : a.rating;
    const qualityB = b.rating > 4.5 ? b.rating + ((b.rating - 4.5) * 5) : b.rating;

    // 2. Calculate Personalization Multiplier based on Firebase search/click history
    let matchScoreA = 0;
    a.tags.forEach(tag => {
      const loweredTag = tag.toLowerCase();
      if (userPrefs[loweredTag]) {
        matchScoreA += userPrefs[loweredTag];
      }
    });

    let matchScoreB = 0;
    b.tags.forEach(tag => {
      const loweredTag = tag.toLowerCase();
      if (userPrefs[loweredTag]) {
        matchScoreB += userPrefs[loweredTag];
      }
    });

    // Final scores heavily weight the personalization clicks while still keeping high rating restaurants somewhat buoyant
    const scoreA = qualityA + (matchScoreA * 2);
    const scoreB = qualityB + (matchScoreB * 2);

    return scoreB - scoreA; // Descending
  });
}
