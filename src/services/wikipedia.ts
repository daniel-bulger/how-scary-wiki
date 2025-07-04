import axios from 'axios';

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';

export interface WikipediaPageInfo {
  pageid: number;
  ns: number;
  title: string;
  extract?: string;
  pageimage?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  description?: string;
  descriptionsource?: string;
  pageprops?: {
    disambiguation?: string;
    [key: string]: any;
  };
}

export interface WikipediaSearchResult {
  pageid: number;
  title: string;
  snippet: string;
  size: number;
  wordcount: number;
  timestamp: string;
}

export interface WikipediaArticle {
  pageId: number;
  title: string;
  extract: string;
  url: string;
  imageUrl?: string;
  categories?: string[];
  lastModified?: string;
}

export class WikipediaService {
  async searchArticles(query: string, limit: number = 5): Promise<WikipediaSearchResult[]> {
    try {
      const params = {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: query,
        srlimit: limit,
        origin: '*' // Required for CORS
      };

      const response = await axios.get(WIKIPEDIA_API_BASE, { params });
      return response.data.query?.search || [];
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return [];
    }
  }

  async getPageInfo(title: string): Promise<WikipediaPageInfo | null> {
    try {
      const params = {
        action: 'query',
        format: 'json',
        prop: 'extracts|pageimages|description|categories|pageprops',
        exintro: false, // Get full content, not just intro
        explaintext: true,
        exsectionformat: 'plain',
        exlimit: 1,
        exchars: 2000, // Limit extract to 2000 chars
        piprop: 'thumbnail',
        pithumbsize: 500,
        titles: title,
        origin: '*'
      };

      const response = await axios.get(WIKIPEDIA_API_BASE, { params });
      const pages = response.data.query?.pages;
      
      if (!pages) return null;
      
      // Get the first page (should only be one)
      const pageId = Object.keys(pages)[0];
      if (pageId === '-1') return null; // Page doesn't exist
      
      return pages[pageId];
    } catch (error) {
      console.error('Wikipedia page info error:', error);
      return null;
    }
  }

  async getPageCategories(pageId: number): Promise<string[]> {
    try {
      const params = {
        action: 'query',
        format: 'json',
        prop: 'categories',
        pageids: pageId,
        cllimit: 20,
        clshow: '!hidden',
        origin: '*'
      };

      const response = await axios.get(WIKIPEDIA_API_BASE, { params });
      const page = response.data.query?.pages?.[pageId];
      
      if (!page?.categories) return [];
      
      return page.categories.map((cat: { title: string }) => 
        cat.title.replace('Category:', '')
      );
    } catch (error) {
      console.error('Wikipedia categories error:', error);
      return [];
    }
  }

  async findArticleByTitle(title: string): Promise<WikipediaArticle | null> {
    try {
      // First search for the article
      const searchResults = await this.searchArticles(title, 3);
      
      if (searchResults.length === 0) {
        return null;
      }

      // Find the best match (prefer exact title match)
      let bestMatch = searchResults[0];
      const exactMatch = searchResults.find(result => 
        result.title.toLowerCase() === title.toLowerCase()
      );
      if (exactMatch) {
        bestMatch = exactMatch;
      }

      // Get detailed page info
      const pageInfo = await this.getPageInfo(bestMatch.title);
      
      if (!pageInfo) {
        return null;
      }

      // Get categories
      const categories = await this.getPageCategories(pageInfo.pageid);
      
      // Check if this is a disambiguation page
      const isDisambiguation = categories.some(cat => 
        cat.toLowerCase().includes('disambiguation')
      ) || pageInfo.pageprops?.disambiguation !== undefined;
      
      // If it's a disambiguation page and we have other results, try the next one
      if (isDisambiguation && searchResults.length > 1) {
        console.log(`${bestMatch.title} is a disambiguation page, trying next result...`);
        // Try the next result that's not the disambiguation page
        for (let i = 1; i < searchResults.length; i++) {
          const altPageInfo = await this.getPageInfo(searchResults[i].title);
          if (altPageInfo && altPageInfo.extract && !altPageInfo.extract.includes('may refer to:')) {
            const altCategories = await this.getPageCategories(altPageInfo.pageid);
            return {
              pageId: altPageInfo.pageid,
              title: altPageInfo.title,
              extract: altPageInfo.extract || '',
              url: this.getWikipediaUrl(altPageInfo.title),
              imageUrl: altPageInfo.thumbnail?.source,
              categories: altCategories,
              lastModified: searchResults[i].timestamp
            };
          }
        }
      }

      return {
        pageId: pageInfo.pageid,
        title: pageInfo.title,
        extract: pageInfo.extract || '',
        url: this.getWikipediaUrl(pageInfo.title),
        imageUrl: pageInfo.thumbnail?.source,
        categories,
        lastModified: bestMatch.timestamp
      };
    } catch (error) {
      console.error('Wikipedia find article error:', error);
      return null;
    }
  }

  getWikipediaUrl(title: string): string {
    // Replace spaces with underscores for Wikipedia URLs
    const urlTitle = title.replace(/ /g, '_');
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(urlTitle)}`;
  }

  // Extract a clean summary from the extract
  extractSummary(extract: string, maxLength: number = 1000): string {
    if (!extract) return '';
    
    // Remove everything after "See also" or "References" sections
    let cleanExtract = extract.split(/\n\n(See also|References|External links|Further reading)/i)[0];
    
    // Remove disambiguation page content
    if (cleanExtract.includes('may refer to:')) {
      // For disambiguation pages, try to extract the list of options
      const parts = cleanExtract.split('may refer to:');
      if (parts.length > 1) {
        cleanExtract = parts[0] + 'may refer to multiple things. Please specify which one you meant.';
      }
    }
    
    // Clean up multiple newlines
    cleanExtract = cleanExtract.replace(/\n{3,}/g, '\n\n').trim();
    
    // If it's still too long, truncate at sentence boundary
    if (cleanExtract.length > maxLength) {
      const truncated = cleanExtract.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf('.');
      if (lastPeriod > maxLength * 0.8) {
        return truncated.substring(0, lastPeriod + 1);
      }
      return truncated + '...';
    }
    
    return cleanExtract;
  }
}

// Create singleton instance
export const wikipediaService = new WikipediaService();