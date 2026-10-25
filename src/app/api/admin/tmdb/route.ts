import { NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.tmdb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p';

// TMDB v3 API key — free, no secret value (read-only public metadata).
// This is the publicly-documented "demo" key from TMDB docs.
// Users can replace it with their own key via TMDB_API_KEY env var.
const API_KEY = process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get('tmdbId');
  const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });
  }

  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const res = await fetch(
      `${TMDB_BASE}/${endpoint}/${tmdbId}?api_key=${API_KEY}&append_to_response=credits,images,reviews,release_dates,content_ratings&include_image_language=en,null`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.status_message || `TMDB returned ${res.status}` },
        { status: res.status }
      );
    }

    const d = await res.json();

    // Find the best logo image (English, highest vote_average)
    let logoUrl: string | null = null;
    if (d.images?.logos?.length) {
      const best = d.images.logos
        .filter((l: any) => l.iso_639_1 === 'en' || !l.iso_639_1)
        .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))[0];
      if (best) logoUrl = `${TMDB_IMAGE}/w500${best.file_path}`;
    }

    // Extract Cast, Directors, and Reviews
    const cast = d.credits?.cast ? d.credits.cast.slice(0, 10).map((c: any) => c.name) : [];
    const directors = d.credits?.crew ? d.credits.crew.filter((c: any) => c.job === 'Director').map((c: any) => c.name) : [];
    const reviews = d.reviews?.results ? d.reviews.results.slice(0, 5).map((r: any) => ({ author: r.author, content: r.content, rating: r.author_details?.rating })) : [];

    let maturityRating = null;
    if (type === 'movie' && d.release_dates?.results) {
      const usRelease = d.release_dates.results.find((r: any) => r.iso_3166_1 === 'US');
      if (usRelease && usRelease.release_dates.length > 0) {
        maturityRating = usRelease.release_dates[0].certification || null;
      }
    } else if (type === 'tv' && d.content_ratings?.results) {
      const usRating = d.content_ratings.results.find((r: any) => r.iso_3166_1 === 'US');
      if (usRating) {
        maturityRating = usRating.rating || null;
      }
    }


    const mapped = {
      tmdbId: d.id,
      imdbId: d.imdb_id || null,
      title: d.title || d.name || '',
      originalTitle: d.original_title || d.original_name || '',
      overview: d.overview || '',
      tagline: d.tagline || '',
      posterPath: d.poster_path ? `${TMDB_IMAGE}/w500${d.poster_path}` : null,
      backdropPath: d.backdrop_path ? `${TMDB_IMAGE}/original${d.backdrop_path}` : null,
      logoPath: logoUrl,
      releaseYear: d.release_date
        ? parseInt(d.release_date.substring(0, 4))
        : d.first_air_date
          ? parseInt(d.first_air_date.substring(0, 4))
          : null,
      runtime: d.runtime || (d.episode_run_time?.[0]) || null,
      rating: d.vote_average || null,
      voteCount: d.vote_count || null,
      maturityRating: maturityRating,
      genres: d.genres ? JSON.stringify(d.genres.map((g: any) => g.name)) : '[]',
      cast: JSON.stringify(cast),
      directors: JSON.stringify(directors),
      tmdbReviews: JSON.stringify(reviews),
      type: type === 'tv' ? 'SERIES' : 'MOVIE',
      category: type === 'tv' ? 'TV_SERIES' : 'MOVIE',
    };

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('TMDB fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}
