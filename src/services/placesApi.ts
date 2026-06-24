const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'DUMMY_KEY';

export type Place = {
  id: string;
  name: string;
  rating: number;
  tags: string[];
  imageUrl: string;
  orderingUrl: string;
};

export async function fetchNearbyRestaurants(lat: number, lng: number): Promise<Place[]> {
  if (API_KEY === 'DUMMY_KEY' || !API_KEY) {
    console.warn("Using mock data because EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is not set.");
    return getMockData();
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Error fetching places:', data.error_message || data.status);
      return getMockData();
    }

    return data.results.map((result: any) => ({
      id: result.place_id,
      name: result.name,
      rating: result.rating || 0,
      tags: result.types ? result.types.map((t: string) => t.replace(/_/g, ' ')) : [],
      imageUrl: result.photos && result.photos.length > 0
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${API_KEY}`
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
      orderingUrl: 'https://toasttab.com/mock-restaurant' // Fallback or mock ordering URL
    }));
  } catch (error) {
    console.error('Fetch error:', error);
    return getMockData();
  }
}

function getMockData(): Place[] {
  return [
    {
      id: '1',
      name: 'Le Bernardin',
      rating: 4.9,
      tags: ['french', 'seafood', 'fine dining'],
      imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop',
      orderingUrl: 'https://toasttab.com/le-bernardin',
    },
    {
      id: '2',
      name: 'Osteria Francescana',
      rating: 4.8,
      tags: ['italian', 'contemporary', 'vegetarian options'],
      imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
      orderingUrl: 'https://toasttab.com/osteria-francescana',
    },
    {
      id: '3',
      name: 'Gaggan Anand',
      rating: 4.7,
      tags: ['indian', 'progressive', 'gluten-free options'],
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
      orderingUrl: 'https://toasttab.com/gaggan-anand',
    },
    {
      id: '4',
      name: 'Noma',
      rating: 4.6,
      tags: ['nordic', 'foraged', 'organic'],
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop',
      orderingUrl: 'https://toasttab.com/noma',
    }
  ];
}
