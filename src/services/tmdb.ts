import axios from 'axios';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  tagline?: string;
  homepage?: string;
  imdb_id?: string;
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
}

export class TMDBService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchMovie(query: string, year?: string): Promise<TMDBSearchResult[]> {
    try {
      const params: Record<string, string | number> = {
        api_key: this.apiKey,
        query: query,
        language: 'en-US',
        page: 1,
      };

      if (year) {
        params.year = year;
      }

      const response = await axios.get(`${TMDB_API_BASE}/search/movie`, { params });
      return response.data.results || [];
    } catch (error) {
      console.error('TMDB search error:', error);
      return [];
    }
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
    try {
      const response = await axios.get(`${TMDB_API_BASE}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB movie details error:', error);
      return null;
    }
  }

  async findMovieByTitle(title: string, year?: string): Promise<TMDBMovie | null> {
    try {
      // First search for the movie
      const searchResults = await this.searchMovie(title, year);
      
      if (searchResults.length === 0) {
        return null;
      }

      // Get the most relevant result (first one)
      const bestMatch = searchResults[0];
      
      // Fetch full details
      return await this.getMovieDetails(bestMatch.id);
    } catch (error) {
      console.error('TMDB find movie error:', error);
      return null;
    }
  }

  getPosterUrl(posterPath: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500'): string | null {
    if (!posterPath) return null;
    return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
  }

  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) return null;
    return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`;
  }

  getIMDbUrl(imdbId?: string): string | null {
    if (!imdbId) return null;
    return `https://www.imdb.com/title/${imdbId}/`;
  }

  getTMDbUrl(movieId: number): string {
    return `https://www.themoviedb.org/movie/${movieId}`;
  }

  async getMovieById(movieId: number): Promise<TMDBMovie | null> {
    try {
      const response = await fetch(
        `${TMDB_API_BASE}/movie/${movieId}?api_key=${this.apiKey}`
      );
      
      if (!response.ok) {
        console.error(`TMDB API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('TMDB getMovieById error:', error);
      return null;
    }
  }
}

// Create singleton instance
let tmdbService: TMDBService | null = null;

export function getTMDBService(): TMDBService | null {
  if (!process.env.TMDB_API_KEY) {
    console.warn('TMDB_API_KEY not configured');
    return null;
  }

  if (!tmdbService) {
    tmdbService = new TMDBService(process.env.TMDB_API_KEY);
  }

  return tmdbService;
}