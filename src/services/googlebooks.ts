import axios from 'axios';

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
}

export interface GoogleBooksSearchResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface GoogleBooksBook {
  key: string;
  title: string;
  authors: { name: string; key: string }[];
  publish_date?: string;
  publishers?: string[];
  isbn_10?: string[];
  isbn_13?: string[];
  number_of_pages?: number;
  cover?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  subjects?: string[];
  description?: string | { value: string };
  first_sentence?: string | { value: string };
  excerpts?: { text: string }[];
}

export class GoogleBooksService {
  async searchBooks(query: string, author?: string): Promise<GoogleBooksVolume[]> {
    try {
      // Build the search query
      let searchQuery = query;
      if (author) {
        searchQuery = `${query} inauthor:${author}`;
      }

      const params = {
        q: searchQuery,
        maxResults: 10,
        printType: 'books',
        orderBy: 'relevance'
      };

      const response = await axios.get<GoogleBooksSearchResponse>(`${GOOGLE_BOOKS_API_BASE}/volumes`, { params });
      
      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      return response.data.items;
    } catch (error) {
      console.error('Google Books search error:', error);
      return [];
    }
  }

  async getBookById(volumeId: string): Promise<GoogleBooksVolume | null> {
    try {
      const response = await axios.get<GoogleBooksVolume>(`${GOOGLE_BOOKS_API_BASE}/volumes/${volumeId}`);
      return response.data;
    } catch (error) {
      console.error('Google Books get book error:', error);
      return null;
    }
  }

  async findBookByTitle(title: string, author?: string): Promise<GoogleBooksBook | null> {
    try {
      // Search for the book
      const searchResults = await this.searchBooks(title, author);
      
      if (searchResults.length === 0) {
        return null;
      }

      // Get the most relevant result (first one, or one matching author if provided)
      let bestMatch = searchResults[0];
      
      if (author && searchResults.length > 1) {
        const authorLower = author.toLowerCase();
        const authorMatch = searchResults.find(book => 
          book.volumeInfo.authors?.some(a => a.toLowerCase().includes(authorLower))
        );
        if (authorMatch) {
          bestMatch = authorMatch;
        }
      }

      // Convert to our standard format
      return this.convertToStandardFormat(bestMatch);
    } catch (error) {
      console.error('Google Books find book error:', error);
      return null;
    }
  }

  private convertToStandardFormat(volume: GoogleBooksVolume): GoogleBooksBook {
    const volumeInfo = volume.volumeInfo;
    
    // Extract ISBN-10 and ISBN-13
    const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
    
    // Get the best available cover image
    const coverUrls = this.getCoverUrls(volumeInfo.imageLinks);
    
    return {
      key: volume.id,
      title: volumeInfo.title,
      authors: (volumeInfo.authors || []).map((name, index) => ({
        name,
        key: `author_${index}` // Google Books doesn't provide author IDs
      })),
      publish_date: volumeInfo.publishedDate,
      publishers: volumeInfo.publisher ? [volumeInfo.publisher] : [],
      isbn_10: isbn10 ? [isbn10] : [],
      isbn_13: isbn13 ? [isbn13] : [],
      number_of_pages: volumeInfo.pageCount,
      cover: coverUrls,
      subjects: volumeInfo.categories || [],
      description: volumeInfo.description,
      // Google Books doesn't provide first sentence or excerpts
      first_sentence: undefined,
      excerpts: []
    };
  }

  getCoverUrls(imageLinks?: GoogleBooksVolume['volumeInfo']['imageLinks']): { small?: string; medium?: string; large?: string } | undefined {
    if (!imageLinks) return undefined;

    // Clean up image URLs to use HTTPS and remove edge curl parameter for cleaner images
    const cleanUrl = (url?: string) => {
      if (!url) return undefined;
      return url.replace('http://', 'https://').replace('&edge=curl', '');
    };

    return {
      small: cleanUrl(imageLinks.smallThumbnail || imageLinks.thumbnail),
      medium: cleanUrl(imageLinks.thumbnail || imageLinks.small || imageLinks.medium),
      large: cleanUrl(imageLinks.large || imageLinks.extraLarge || imageLinks.medium || imageLinks.thumbnail)
    };
  }

  getGoogleBooksUrl(volumeId: string): string {
    return `https://books.google.com/books?id=${volumeId}`;
  }

  // Helper method to get a clean preview URL
  getPreviewUrl(volume: GoogleBooksVolume): string | undefined {
    return volume.volumeInfo.previewLink || volume.volumeInfo.infoLink;
  }
}

// Create singleton instance
export const googleBooksService = new GoogleBooksService();