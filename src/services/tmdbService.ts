const TMDB_API_KEY = process.env.TMDB_API_KEY || 'dummy_key';
const BASE_URL = 'https://api.themoviedb.org/3';

export const getImageUrl = (path: string | null, size: 'original' | 'w500' = 'original') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

async function fetchTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function search(query: string, type: 'MOVIE' | 'SERIES') {
  const endpoint = type === 'MOVIE' ? '/search/movie' : '/search/tv';
  const data = await fetchTmdb<any>(endpoint, { query });
  return data.results.map((r: any) => ({
    id: r.id,
    title: r.title || r.name,
    releaseDate: r.release_date || r.first_air_date,
    poster: getImageUrl(r.poster_path, 'w500'),
    overview: r.overview
  }));
}

export async function fetchDetails(tmdbId: number, type: 'MOVIE' | 'SERIES') {
  const endpoint = type === 'MOVIE' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  return await fetchTmdb<any>(endpoint, { append_to_response: 'credits,videos' });
}

export async function fetchSeriesStructure(tmdbId: number, seasonCount: number) {
  const seasons = [];
  for (let i = 1; i <= seasonCount; i++) {
    try {
      const seasonData = await fetchTmdb<any>(`/tv/${tmdbId}/season/${i}`);
      seasons.push(seasonData);
    } catch (err) {
      console.warn(`Failed to fetch season ${i} for series ${tmdbId}`);
    }
  }
  return seasons;
}
