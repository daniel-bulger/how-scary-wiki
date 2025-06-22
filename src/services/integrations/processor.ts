import { KnowledgeGraphResult } from '../knowledge-graph';
import { getTMDBService } from '../tmdb';
import { googleBooksService } from '../googlebooks';
import { musicBrainzService } from '../musicbrainz';
import { wikipediaService } from '../wikipedia';
import { IntegrationResult } from './registry';

export interface ProcessedIntegrationData {
  // TMDB data
  tmdbId?: number;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  runtime?: number;
  homepage?: string;
  imdbId?: string;
  tmdbUrl?: string;
  
  // Google Books data
  googleBooksId?: string;
  bookCoverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  pageCount?: number;
  publishDate?: string;
  publishers?: string[];
  bookAuthors?: string[];
  googleBooksUrl?: string;
  
  // MusicBrainz data
  musicBrainzId?: string;
  albumArtUrl?: string;
  musicArtists?: string[];
  musicReleaseDate?: string;
  trackCount?: number;
  musicType?: string;
  musicBrainzUrl?: string;
  lastFmUrl?: string;
  
  // Wikipedia data
  wikipediaPageId?: number;
  wikipediaExtract?: string;
  wikipediaImageUrl?: string;
  wikipediaCategories?: string[];
  wikipediaUrl?: string;
}

export class IntegrationProcessor {
  async processIntegrations(
    entity: KnowledgeGraphResult,
    integrations: IntegrationResult[]
  ): Promise<ProcessedIntegrationData> {
    const data: ProcessedIntegrationData = {};

    for (const integration of integrations) {
      console.log(`Processing ${integration.integration} integration (confidence: ${integration.confidence})`);
      console.log(`Reasoning: ${integration.reasoning}`);

      try {
        switch (integration.integration) {
          case 'tmdb':
            const tmdbData = await this.processTMDB(entity, integration.hints);
            Object.assign(data, tmdbData);
            break;
          
          // Future integrations would be handled here
          case 'googleMaps':
            // const mapsData = await this.processGoogleMaps(entity, integration.hints);
            // Object.assign(data, mapsData);
            break;
          
          case 'googleBooks':
            const bookData = await this.processGoogleBooks(entity, integration.hints);
            Object.assign(data, bookData);
            break;
          
          case 'musicbrainz':
            const musicData = await this.processMusicBrainz(entity, integration.hints);
            Object.assign(data, musicData);
            break;
          
          case 'wikipedia':
            const wikiData = await this.processWikipedia(entity, integration.hints);
            Object.assign(data, wikiData);
            break;
          
          default:
            console.warn(`No processor implemented for integration: ${integration.integration}`);
        }
      } catch (error) {
        console.error(`Error processing ${integration.integration} integration:`, error);
        // Continue with other integrations even if one fails
      }
    }

    return data;
  }

  private async processTMDB(
    entity: KnowledgeGraphResult,
    hints: Record<string, any>
  ): Promise<Partial<ProcessedIntegrationData>> {
    const tmdbService = getTMDBService();
    if (!tmdbService) {
      console.warn('TMDB service not available - API key not configured');
      return {};
    }

    // Use hints from AI to improve search
    const year = hints.year || this.extractYearFromDescription(entity.description);
    
    console.log(`Searching TMDB for: ${entity.name}${year ? ` (${year})` : ''}`);
    const movieData = await tmdbService.findMovieByTitle(entity.name, year);
    
    if (!movieData) {
      console.log('No TMDB match found');
      return {};
    }

    console.log(`Found TMDB match: ${movieData.title} (${movieData.id})`);
    
    return {
      tmdbId: movieData.id,
      posterUrl: tmdbService.getPosterUrl(movieData.poster_path),
      backdropUrl: tmdbService.getBackdropUrl(movieData.backdrop_path),
      releaseDate: movieData.release_date,
      runtime: movieData.runtime,
      homepage: movieData.homepage,
      imdbId: movieData.imdb_id,
      tmdbUrl: tmdbService.getTMDbUrl(movieData.id),
    };
  }

  private extractYearFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    const yearMatch = description.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : undefined;
  }

  private async processGoogleBooks(
    entity: KnowledgeGraphResult,
    hints: Record<string, any>
  ): Promise<Partial<ProcessedIntegrationData>> {
    try {
      // Use hints from AI to improve search
      const author = hints.author || this.extractAuthorFromEntity(entity);
      
      console.log(`Searching Google Books for: ${entity.name}${author ? ` by ${author}` : ''}`);
      const bookData = await googleBooksService.findBookByTitle(entity.name, author);
      
      if (!bookData) {
        console.log('No Google Books match found');
        return {};
      }

      console.log(`Found Google Books match: ${bookData.title} (${bookData.key})`);
      
      return {
        googleBooksId: bookData.key,
        bookCoverUrl: bookData.cover?.large || bookData.cover?.medium,
        isbn10: bookData.isbn_10?.[0],
        isbn13: bookData.isbn_13?.[0],
        pageCount: bookData.number_of_pages,
        publishDate: bookData.publish_date,
        publishers: bookData.publishers || [],
        bookAuthors: bookData.authors.map(a => a.name),
        googleBooksUrl: googleBooksService.getGoogleBooksUrl(bookData.key),
      };
    } catch (error) {
      console.error('Error processing Google Books integration:', error);
      return {};
    }
  }

  private extractAuthorFromEntity(entity: KnowledgeGraphResult): string | undefined {
    // Try to extract author from description or detailed description
    const authorPatterns = [
      /by ([A-Z][a-z]+ [A-Z][a-z]+)/,
      /author ([A-Z][a-z]+ [A-Z][a-z]+)/,
      /written by ([A-Z][a-z]+ [A-Z][a-z]+)/,
    ];

    const textToSearch = `${entity.description || ''} ${entity.detailedDescription || ''}`;
    
    for (const pattern of authorPatterns) {
      const match = textToSearch.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private async processMusicBrainz(
    entity: KnowledgeGraphResult,
    hints: Record<string, any>
  ): Promise<Partial<ProcessedIntegrationData>> {
    try {
      // Use hints from AI to improve search
      const artist = hints.artist || this.extractArtistFromEntity(entity);
      const year = hints.year || this.extractYearFromDescription(entity.description);
      
      console.log(`Searching MusicBrainz for: ${entity.name}${artist ? ` by ${artist}` : ''}`);
      const musicData = await musicBrainzService.findMusicByTitle(entity.name, artist);
      
      if (!musicData) {
        console.log('No MusicBrainz match found');
        return {};
      }

      console.log(`Found MusicBrainz match: ${musicData.title} (${musicData.id})`);
      
      // Get Last.fm URL
      const primaryArtist = musicData.artists[0]?.name;
      const lastFmUrl = primaryArtist ? 
        musicBrainzService.getLastFmUrl(primaryArtist, musicData.title) : 
        undefined;
      
      return {
        musicBrainzId: musicData.id,
        albumArtUrl: musicData.albumArt?.large || musicData.albumArt?.medium,
        musicArtists: musicData.artists.map(a => a.name),
        musicReleaseDate: musicData.releaseDate,
        trackCount: musicData.trackCount,
        musicType: musicData.type,
        musicBrainzUrl: musicBrainzService.getMusicBrainzUrl(musicData.mbid || musicData.id, 
          musicData.type === 'recording' ? 'recording' : 'release'),
        lastFmUrl,
      };
    } catch (error) {
      console.error('Error processing MusicBrainz integration:', error);
      return {};
    }
  }

  private extractArtistFromEntity(entity: KnowledgeGraphResult): string | undefined {
    // Try to extract artist from description or detailed description
    const artistPatterns = [
      /by ([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /artist ([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /band ([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /performed by ([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    ];

    const textToSearch = `${entity.description || ''} ${entity.detailedDescription || ''}`;
    
    for (const pattern of artistPatterns) {
      const match = textToSearch.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private async processWikipedia(
    entity: KnowledgeGraphResult,
    hints: Record<string, any>
  ): Promise<Partial<ProcessedIntegrationData>> {
    try {
      // Use hints from AI to improve search
      const searchQuery = hints.articleTitle || entity.name;
      
      console.log(`Searching Wikipedia for: ${searchQuery}`);
      const article = await wikipediaService.findArticleByTitle(searchQuery);
      
      if (!article) {
        console.log('No Wikipedia article found');
        return {};
      }

      console.log(`Found Wikipedia article: ${article.title} (${article.pageId})`);
      
      // Extract a clean summary
      const cleanExtract = wikipediaService.extractSummary(article.extract, 1000);
      
      return {
        wikipediaPageId: article.pageId,
        wikipediaExtract: cleanExtract,
        wikipediaImageUrl: article.imageUrl,
        wikipediaCategories: article.categories,
        wikipediaUrl: article.url,
      };
    } catch (error) {
      console.error('Error processing Wikipedia integration:', error);
      return {};
    }
  }

  // Future integration processors would go here
  // private async processGoogleMaps(entity: KnowledgeGraphResult, hints: Record<string, any>) { ... }
}

export const integrationProcessor = new IntegrationProcessor();