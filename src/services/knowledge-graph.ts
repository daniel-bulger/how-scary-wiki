import axios from 'axios';
import { GoogleKgEntity } from '@/types';

const ENTERPRISE_KG_API_BASE = 'https://enterpriseknowledgegraph.googleapis.com/v1';

export interface KnowledgeGraphSearchParams {
  query: string;
  limit?: number;
  types?: string[];
  languages?: string[];
}

export interface KnowledgeGraphResult {
  id: string;
  name: string;
  description?: string;
  types: string[];
  imageUrl?: string;
  detailedDescription?: string;
  score: number;
}

export class KnowledgeGraphService {
  private projectId: string;
  private location: string;

  constructor(projectId: string, location: string = 'global') {
    this.projectId = projectId;
    this.location = location;
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { GoogleAuth } = require('google-auth-library');
      
      const auth = new GoogleAuth({
        credentials: {
          client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      
      if (!tokenResponse.token) {
        throw new Error('No access token received');
      }
      
      return tokenResponse.token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to get access token using service account credentials.');
    }
  }

  async searchEntities(params: KnowledgeGraphSearchParams): Promise<KnowledgeGraphResult[]> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${ENTERPRISE_KG_API_BASE}/projects/${this.projectId}/locations/${this.location}/cloudKnowledgeGraphEntities:Search`;
      
      const searchParams = new URLSearchParams({
        query: params.query,
        limit: (params.limit || 10).toString(),
        ...(params.languages && { languages: params.languages.join(',') }),
        ...(params.types && { types: params.types.join(',') }),
      });

      const response = await axios.get(`${url}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return this.parseSearchResults(response.data);
    } catch (error: any) {
      console.error('Enterprise Knowledge Graph API error:', error);
      console.error('API Response:', error.response?.data);
      console.error('API Status:', error.response?.status);
      
      throw new Error(`Failed to search Enterprise Knowledge Graph: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getEntityById(id: string): Promise<KnowledgeGraphResult | null> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${ENTERPRISE_KG_API_BASE}/projects/${this.projectId}/locations/${this.location}/cloudKnowledgeGraphEntities:Search`;
      
      // Use search to find entities and filter by exact ID match
      const searchParams = new URLSearchParams({
        query: '*', // Search all entities
        limit: '50', // Get more results to find our match
      });

      const response = await axios.get(`${url}?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const results = this.parseSearchResults(response.data);
      
      // Find the exact match by ID
      const exactMatch = results.find(entity => entity.id === id);
      return exactMatch || null;
    } catch (error: any) {
      console.error('Enterprise Knowledge Graph search error:', error);
      console.error('API Response:', error.response?.data);
      return null;
    }
  }

  private parseSearchResults(data: any): KnowledgeGraphResult[] {
    if (!data.itemListElement) {
      return [];
    }

    return data.itemListElement.map((item: any) => {
      const result = item.result;
      
      return {
        id: result['@id'],
        name: result.name || 'Unknown',
        description: result.description || '',
        types: result['@type'] || [],
        imageUrl: result.image?.contentUrl,
        detailedDescription: result.detailedDescription?.articleBody,
        score: 1, // Enterprise API doesn't provide scores like the old API
      };
    });
  }


  // Check if an entity is suitable for our scary wiki
  isSuitableForScaryWiki(entity: KnowledgeGraphResult): boolean {
    const scaryTypes = [
      'Movie',
      'Book',
      'TVSeries',
      'VideoGame',
      'Person', // Horror authors, actors, etc.
      'Place', // Haunted locations
      'Event', // Historical scary events
      'Thing', // General entities that could be scary
    ];

    const scaryKeywords = [
      'horror',
      'scary',
      'frightening',
      'terrifying',
      'creepy',
      'spooky',
      'haunted',
      'ghost',
      'monster',
      'demon',
      'vampire',
      'zombie',
      'thriller',
      'supernatural',
      'paranormal',
    ];

    // Check if entity type is suitable
    const hasSuitableType = entity.types.some(type => 
      scaryTypes.some(scaryType => type.includes(scaryType))
    );

    // Check if description contains scary keywords
    const description = (entity.description || '').toLowerCase();
    const detailedDescription = (entity.detailedDescription || '').toLowerCase();
    const name = entity.name.toLowerCase();
    
    const hasScaryContent = scaryKeywords.some(keyword => 
      description.includes(keyword) || 
      detailedDescription.includes(keyword) ||
      name.includes(keyword)
    );

    return hasSuitableType || hasScaryContent;
  }
}

// Create a singleton instance
export const knowledgeGraphService = new KnowledgeGraphService(
  process.env.FIREBASE_ADMIN_PROJECT_ID || '',
  'global'
);