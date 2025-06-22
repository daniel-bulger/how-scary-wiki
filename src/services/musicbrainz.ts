import axios from 'axios';

const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2';
const COVERART_API_BASE = 'https://coverartarchive.org';
const USER_AGENT = 'HowScaryWiki/1.0 (https://howscary.com)';

export interface MusicBrainzArtist {
  id: string;
  name: string;
  'sort-name': string;
  disambiguation?: string;
  score?: number;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  date?: string;
  country?: string;
  'release-group'?: {
    id: string;
    'primary-type'?: string;
  };
  'track-count'?: number;
  score?: number;
}

export interface MusicBrainzRecording {
  id: string;
  title: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  length?: number; // Duration in milliseconds
  score?: number;
}

export interface CoverArtImage {
  image: string;
  thumbnails: {
    '250'?: string;
    '500'?: string;
    '1200'?: string;
    small?: string;
    large?: string;
  };
  approved: boolean;
  front: boolean;
  back: boolean;
}

export interface MusicBrainzMusic {
  id: string;
  title: string;
  artists: { name: string; id: string }[];
  releaseDate?: string;
  albumArt?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  trackCount?: number;
  type?: string; // album, single, ep, etc.
  mbid?: string; // MusicBrainz ID
}

export class MusicBrainzService {
  private headers = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json'
  };

  async searchReleases(query: string, artist?: string): Promise<MusicBrainzRelease[]> {
    try {
      // Build the search query
      let searchQuery = `release:"${query}"`;
      if (artist) {
        searchQuery += ` AND artist:"${artist}"`;
      }

      const params = {
        query: searchQuery,
        limit: 10,
        fmt: 'json'
      };

      const response = await axios.get(`${MUSICBRAINZ_API_BASE}/release`, {
        params,
        headers: this.headers
      });

      return response.data.releases || [];
    } catch (error) {
      console.error('MusicBrainz search releases error:', error);
      return [];
    }
  }

  async searchArtists(query: string): Promise<MusicBrainzArtist[]> {
    try {
      const params = {
        query: `artist:"${query}"`,
        limit: 10,
        fmt: 'json'
      };

      const response = await axios.get(`${MUSICBRAINZ_API_BASE}/artist`, {
        params,
        headers: this.headers
      });

      return response.data.artists || [];
    } catch (error) {
      console.error('MusicBrainz search artists error:', error);
      return [];
    }
  }

  async searchRecordings(query: string, artist?: string): Promise<MusicBrainzRecording[]> {
    try {
      let searchQuery = `recording:"${query}"`;
      if (artist) {
        searchQuery += ` AND artist:"${artist}"`;
      }

      const params = {
        query: searchQuery,
        limit: 10,
        fmt: 'json'
      };

      const response = await axios.get(`${MUSICBRAINZ_API_BASE}/recording`, {
        params,
        headers: this.headers
      });

      return response.data.recordings || [];
    } catch (error) {
      console.error('MusicBrainz search recordings error:', error);
      return [];
    }
  }

  async getCoverArt(releaseId: string): Promise<CoverArtImage[] | null> {
    try {
      const response = await axios.get(`${COVERART_API_BASE}/release/${releaseId}`, {
        headers: this.headers
      });

      return response.data.images || [];
    } catch (error) {
      // 404 is common when no cover art exists
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      console.error('Cover Art Archive error:', error);
      return null;
    }
  }

  async findMusicByTitle(title: string, artist?: string): Promise<MusicBrainzMusic | null> {
    try {
      // First try to find as an album/release
      const releases = await this.searchReleases(title, artist);
      
      if (releases.length > 0) {
        // Get the most relevant result
        let bestMatch = releases[0];
        
        if (artist && releases.length > 1) {
          const artistLower = artist.toLowerCase();
          const artistMatch = releases.find(release => 
            release['artist-credit']?.some(credit => 
              credit.artist.name.toLowerCase().includes(artistLower)
            )
          );
          if (artistMatch) {
            bestMatch = artistMatch;
          }
        }

        // Get cover art
        const coverArt = await this.getCoverArt(bestMatch.id);
        const albumArt = this.extractCoverUrls(coverArt);

        return {
          id: bestMatch.id,
          title: bestMatch.title,
          artists: bestMatch['artist-credit']?.map(credit => ({
            name: credit.artist.name,
            id: credit.artist.id
          })) || [],
          releaseDate: bestMatch.date,
          albumArt,
          trackCount: bestMatch['track-count'],
          type: bestMatch['release-group']?.['primary-type']?.toLowerCase(),
          mbid: bestMatch.id
        };
      }

      // If no album found, try as a recording/song
      const recordings = await this.searchRecordings(title, artist);
      
      if (recordings.length > 0) {
        const recording = recordings[0];
        
        return {
          id: recording.id,
          title: recording.title,
          artists: recording['artist-credit']?.map(credit => ({
            name: credit.artist.name,
            id: credit.artist.id
          })) || [],
          type: 'recording',
          mbid: recording.id
        };
      }

      return null;
    } catch (error) {
      console.error('MusicBrainz find music error:', error);
      return null;
    }
  }

  private extractCoverUrls(images: CoverArtImage[] | null): MusicBrainzMusic['albumArt'] {
    if (!images || images.length === 0) return undefined;

    // Prefer front cover, or first approved image
    const preferredImage = images.find(img => img.front) || 
                          images.find(img => img.approved) || 
                          images[0];

    if (!preferredImage) return undefined;

    return {
      small: preferredImage.thumbnails['250'] || preferredImage.thumbnails.small,
      medium: preferredImage.thumbnails['500'],
      large: preferredImage.thumbnails['1200'] || preferredImage.image
    };
  }

  getMusicBrainzUrl(mbid: string, type: 'release' | 'recording' | 'artist' = 'release'): string {
    return `https://musicbrainz.org/${type}/${mbid}`;
  }

  getLastFmUrl(artist: string, album?: string): string {
    const artistSlug = artist.replace(/ /g, '+');
    if (album) {
      const albumSlug = album.replace(/ /g, '+');
      return `https://www.last.fm/music/${artistSlug}/${albumSlug}`;
    }
    return `https://www.last.fm/music/${artistSlug}`;
  }
}

// Create singleton instance
export const musicBrainzService = new MusicBrainzService();