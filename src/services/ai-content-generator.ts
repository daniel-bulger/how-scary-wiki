import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { KnowledgeGraphResult } from './knowledge-graph';
import { STANDARD_DIMENSIONS } from '@/types';
import { INTEGRATION_REGISTRY, IntegrationResult, getAvailableIntegrations } from './integrations/registry';

export interface ScaryAnalysisResult {
  whyScary: string;
  dimensionScores: {
    dimensionId: string;
    score: number;
    reasoning: string;
  }[];
}

export class AIContentGenerator {
  private vertexAI: VertexAI;
  private model: GenerativeModel;

  constructor(projectId: string, location: string) {
    this.vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
    
    this.model = this.vertexAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });
  }

  async generateScaryAnalysis(entity: KnowledgeGraphResult): Promise<ScaryAnalysisResult> {
    const prompt = this.buildScaryAnalysisPrompt(entity);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response candidates from AI model');
      }
      const text = response.candidates[0].content.parts[0].text;
      if (!text) {
        throw new Error('No text content in AI response');
      }
      
      return this.parseScaryAnalysis(text);
    } catch (error) {
      console.error('AI content generation error:', error);
      throw new Error('Failed to generate scary analysis');
    }
  }

  async detectRelevantIntegrations(entity: KnowledgeGraphResult): Promise<IntegrationResult[]> {
    const availableIntegrations = getAvailableIntegrations();
    const prompt = this.buildIntegrationDetectionPrompt(entity, availableIntegrations);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const response = result.response;
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response candidates from AI model');
      }
      const text = response.candidates[0].content.parts[0].text;
      if (!text) {
        throw new Error('No text content in AI response');
      }
      
      return this.parseIntegrationResults(text);
    } catch (error) {
      console.error('AI integration detection error:', error);
      // Return empty array on error - we can still generate content without integrations
      return [];
    }
  }

  private buildScaryAnalysisPrompt(entity: KnowledgeGraphResult): string {
    return `Analyze the following entity for its scary/frightening qualities and provide a detailed scary analysis.

Entity Information:
- Name: ${entity.name}
- Description: ${entity.description || 'N/A'}
- Types: ${entity.types.join(', ')}
- Detailed Description: ${entity.detailedDescription || 'N/A'}

Please provide a JSON response with the following structure:
{
  "whyScary": "A detailed 2-3 paragraph explanation of why this entity is scary, including psychological, visual, or thematic elements that make it frightening. Be specific about what makes it scary.",
  "dimensionScores": [
    {
      "dimensionId": "jump-scares",
      "score": 1-10,
      "reasoning": "Explanation of the score for jump scares"
    },
    {
      "dimensionId": "gore-violence", 
      "score": 1-10,
      "reasoning": "Explanation of the score for gore/violence"
    },
    {
      "dimensionId": "psychological-terror",
      "score": 1-10, 
      "reasoning": "Explanation of the score for psychological terror"
    },
    {
      "dimensionId": "suspense-tension",
      "score": 1-10,
      "reasoning": "Explanation of the score for suspense/tension"
    },
    {
      "dimensionId": "disturbing-content",
      "score": 1-10,
      "reasoning": "Explanation of the score for disturbing content"
    }
  ]
}

Guidelines:
- Scores should be 1-10 where 1 is "not scary at all" and 10 is "extremely scary"
- If the entity isn't traditionally scary, focus on any potentially unsettling or frightening aspects in the description but do not force the scores to be high
- Be objective and consider different perspectives on what might be scary
- Provide specific reasoning for each dimension score
- The analysis should be informative and help users understand the scary qualities

Return only valid JSON, no additional text.`;
  }

  private parseScaryAnalysis(response: string): ScaryAnalysisResult {
    try {
      // Clean up the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsed.whyScary || !parsed.dimensionScores) {
        throw new Error('Invalid response structure');
      }

      // Ensure all standard dimensions are included
      const dimensionScores = STANDARD_DIMENSIONS.map(dim => {
        const existing = parsed.dimensionScores.find((score: { dimensionId: string }) => score.dimensionId === dim.id);
        return existing || {
          dimensionId: dim.id,
          score: 1,
          reasoning: 'No specific scary elements identified for this dimension.'
        };
      });

      return {
        whyScary: parsed.whyScary,
        dimensionScores,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis(response);
    }
  }

  private getFallbackAnalysis(originalResponse: string): ScaryAnalysisResult {
    return {
      whyScary: originalResponse.slice(0, 500) + '...' || 'This entity may have scary or unsettling qualities that could be frightening to some viewers. The specific scary elements would depend on individual sensitivities and the context in which the entity is encountered.',
      dimensionScores: STANDARD_DIMENSIONS.map(dim => ({
        dimensionId: dim.id,
        score: 3,
        reasoning: 'Unable to analyze specific scary qualities. This is a moderate default score.'
      }))
    };
  }

  private buildIntegrationDetectionPrompt(entity: KnowledgeGraphResult, availableIntegrations: string[]): string {
    const integrationDescriptions = availableIntegrations
      .map(key => {
        const integration = INTEGRATION_REGISTRY[key];
        return `- ${key}: ${integration.description} (useful for: ${integration.entityTypes.join(', ')})`;
      })
      .join('\n');

    return `Given this entity from Google Knowledge Graph, determine which external data sources would be relevant for enriching the information:

Entity Information:
- Name: ${entity.name}
- Description: ${entity.description || 'N/A'}
- Types: ${entity.types.join(', ') || 'N/A'}
- Detailed Description: ${entity.detailedDescription || 'N/A'}

Available integrations:
${integrationDescriptions}

CRITICAL: You MUST carefully consider the entity's types and description to avoid confusion between different concepts with the same name. For example:
- "Halloween" the holiday/celebration is NOT the same as "Halloween" the movie
- "It" the pronoun is NOT the same as "It" the Stephen King novel/movie
- "The Thing" the concept is NOT the same as "The Thing" the movie

Rules for matching:
1. ONLY suggest movie integrations (tmdb) if the entity types include "Movie" or "Film", or if the description explicitly mentions it's a film
2. ONLY suggest book integrations (googleBooks) if the entity types include "Book" or if the description mentions it's a novel/book
3. If the entity is a holiday, celebration, concept, or other non-media entity, DO NOT suggest media integrations
4. Always prioritize the entity's actual type over name-based assumptions

Analyze the entity and return a JSON array of relevant integrations. Only include integrations that have a strong match (confidence > 0.7) AND match the entity type.

For each relevant integration, provide:
1. The integration key
2. A confidence score (0.0-1.0)
3. Reasoning for why this integration is relevant (must reference the entity's type or description)
4. Hints that would help the integration find the right data

Example response format:
[
  {
    "integration": "tmdb",
    "confidence": 0.95,
    "reasoning": "Entity types include 'Movie' and description mentions '2012 film'",
    "hints": {
      "year": "2012",
      "mediaType": "movie",
      "alternativeTitles": []
    }
  }
]

Return only the JSON array, no additional text.`;
  }

  private parseIntegrationResults(response: string): IntegrationResult[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in integration detection response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and filter results
      return parsed
        .filter((result: IntegrationResult) => {
          return result.integration && 
                 result.confidence >= 0.7 && 
                 result.reasoning &&
                 result.hints;
        })
        .map((result: IntegrationResult) => ({
          integration: result.integration,
          confidence: result.confidence,
          reasoning: result.reasoning,
          hints: result.hints || {}
        }));
    } catch (error) {
      console.error('Error parsing integration detection response:', error);
      return [];
    }
  }
}

// Create a singleton instance
let aiContentGenerator: AIContentGenerator | null = null;

export function getAIContentGenerator(): AIContentGenerator {
  if (!aiContentGenerator) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
    }
    
    aiContentGenerator = new AIContentGenerator(projectId, location);
  }
  
  return aiContentGenerator;
}