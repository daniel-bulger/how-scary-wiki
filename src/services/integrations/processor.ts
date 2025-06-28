import { KnowledgeGraphResult } from '../knowledge-graph';
import { getTMDBService } from '../tmdb';
import { googleBooksService } from '../googlebooks';
import { musicBrainzService } from '../musicbrainz';
import { wikipediaService, WikipediaArticle } from '../wikipedia';
import { IntegrationResult } from './registry';
import { getAIContentGenerator } from '../ai-content-generator';

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
    hints: Record<string, string | number | boolean>
  ): Promise<Partial<ProcessedIntegrationData>> {
    const tmdbService = getTMDBService();
    if (!tmdbService) {
      console.warn('TMDB service not available - API key not configured');
      return {};
    }

    // Check if a specific TMDB ID was provided
    if (hints.tmdbId) {
      console.log(`Fetching TMDB movie by ID: ${hints.tmdbId}`);
      const movieData = await tmdbService.getMovieById(Number(hints.tmdbId));
      
      if (movieData) {
        return this.formatTMDBData(movieData);
      }
    }

    // Use hints from AI to improve search
    const yearHint = hints.year || this.extractYearFromDescription(entity.description);
    const year = yearHint ? String(yearHint) : undefined;
    
    console.log(`Searching TMDB for: ${entity.name}${year ? ` (${year})` : ''}`);
    const movieData = await tmdbService.findMovieByTitle(entity.name, year);
    
    if (!movieData) {
      console.log('No TMDB match found');
      return {};
    }

    console.log(`Found TMDB match: ${movieData.title} (${movieData.id})`);
    
    return this.formatTMDBData(movieData);
  }

  private formatTMDBData(movieData: any): Partial<ProcessedIntegrationData> {
    const tmdbService = getTMDBService();
    if (!tmdbService) return {};
    
    return {
      tmdbId: movieData.id,
      posterUrl: tmdbService.getPosterUrl(movieData.poster_path) || undefined,
      backdropUrl: tmdbService.getBackdropUrl(movieData.backdrop_path) || undefined,
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
    hints: Record<string, string | number | boolean>
  ): Promise<Partial<ProcessedIntegrationData>> {
    try {
      // Use hints from AI to improve search
      const authorHint = hints.author || this.extractAuthorFromEntity(entity);
      const author = authorHint ? String(authorHint) : undefined;
      
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
    hints: Record<string, string | number | boolean>
  ): Promise<Partial<ProcessedIntegrationData>> {
    try {
      // Use hints from AI to improve search
      const artistHint = hints.artist || this.extractArtistFromEntity(entity);
      const artist = artistHint ? String(artistHint) : undefined;
      
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
    hints: Record<string, string | number | boolean>
  ): Promise<Partial<ProcessedIntegrationData>> {
    try {
      // Check if a specific Wikipedia page title was provided
      if (hints.wikipediaTitle) {
        console.log(`Fetching Wikipedia page by title: ${hints.wikipediaTitle}`);
        const pageInfo = await wikipediaService.getPageInfo(String(hints.wikipediaTitle));
        
        if (pageInfo) {
          const categories = await wikipediaService.getPageCategories(pageInfo.pageid);
          const cleanExtract = wikipediaService.extractSummary(pageInfo.extract || '', 1500);
          
          return {
            wikipediaPageId: pageInfo.pageid,
            wikipediaExtract: cleanExtract,
            wikipediaImageUrl: pageInfo.thumbnail?.source,
            wikipediaCategories: categories,
            wikipediaUrl: wikipediaService.getWikipediaUrl(pageInfo.title),
          };
        }
      }
      
      // Check if a specific Wikipedia page ID was provided
      if (hints.wikipediaPageId) {
        console.log(`Fetching Wikipedia page by ID: ${hints.wikipediaPageId}`);
        const pageInfo = await this.getWikipediaPageById(Number(hints.wikipediaPageId));
        
        if (pageInfo) {
          const categories = await wikipediaService.getPageCategories(pageInfo.pageid);
          const cleanExtract = wikipediaService.extractSummary(pageInfo.extract || '', 1500);
          
          return {
            wikipediaPageId: pageInfo.pageid,
            wikipediaExtract: cleanExtract,
            wikipediaImageUrl: pageInfo.thumbnail?.source,
            wikipediaCategories: categories,
            wikipediaUrl: wikipediaService.getWikipediaUrl(pageInfo.title),
          };
        }
      }
      
      // Use hints from AI to improve search
      const searchQueryHint = hints.articleTitle || entity.name;
      const searchQuery = String(searchQueryHint);
      
      console.log(`Searching Wikipedia for: ${searchQuery}`);
      
      // Get multiple search results
      const searchResults = await wikipediaService.searchArticles(searchQuery, 5);
      
      if (searchResults.length === 0) {
        console.log('No Wikipedia articles found');
        return {};
      }
      
      // If we have entity context (from moderator trigger), use AI to select best match
      let selectedArticle: WikipediaArticle | null = null;
      
      if (searchResults.length > 1 && entity.description) {
        console.log(`Found ${searchResults.length} Wikipedia results, using AI to select best match...`);
        
        // Get page info for top results
        const articlesWithInfo = await Promise.all(
          searchResults.slice(0, 3).map(async (result) => {
            const pageInfo = await wikipediaService.getPageInfo(result.title);
            return {
              title: result.title,
              snippet: result.snippet,
              extract: pageInfo?.extract?.substring(0, 200) || result.snippet
            };
          })
        );
        
        // Use AI to select the best match
        const aiGenerator = getAIContentGenerator();
        const selection = await aiGenerator.selectBestWikipediaMatch(
          entity,
          articlesWithInfo
        );
        
        if (selection && selection.title) {
          console.log(`AI selected: ${selection.title} (reason: ${selection.reason})`);
          selectedArticle = await wikipediaService.findArticleByTitle(selection.title);
        }
      }
      
      // Fallback to original logic if AI selection didn't work
      if (!selectedArticle) {
        selectedArticle = await wikipediaService.findArticleByTitle(searchQuery);
      }
      
      if (!selectedArticle) {
        console.log('No suitable Wikipedia article found');
        return {};
      }

      console.log(`Using Wikipedia article: ${selectedArticle.title} (${selectedArticle.pageId})`);
      
      // Extract a clean summary (increased limit for better content)
      const cleanExtract = wikipediaService.extractSummary(selectedArticle.extract, 1500);
      
      return {
        wikipediaPageId: selectedArticle.pageId,
        wikipediaExtract: cleanExtract,
        wikipediaImageUrl: selectedArticle.imageUrl,
        wikipediaCategories: selectedArticle.categories,
        wikipediaUrl: selectedArticle.url,
      };
    } catch (error) {
      console.error('Error processing Wikipedia integration:', error);
      return {};
    }
  }

  private async getWikipediaPageById(pageId: number) {
    try {
      const params = {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages|description|categories|pageprops',
        pageids: pageId,
        exintro: false,
        explaintext: true,
        exsectionformat: 'plain',
        exlimit: 1,
        exchars: 2000,
        piprop: 'thumbnail',
        pithumbsize: 500,
        origin: '*'
      };

      const response = await fetch(`https://en.wikipedia.org/w/api.php?${new URLSearchParams(params)}`);
      const data = await response.json();
      
      if (data.query?.pages?.[pageId]) {
        return data.query.pages[pageId];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Wikipedia page by ID:', error);
      return null;
    }
  }

  // Future integration processors would go here
  // private async processGoogleMaps(entity: KnowledgeGraphResult, hints: Record<string, any>) { ... }
}

export const integrationProcessor = new IntegrationProcessor();