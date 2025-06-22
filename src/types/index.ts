// Core entity types
export interface ScaryEntity {
  id: string;
  googleKgId: string;
  name: string;
  description: string;
  imageUrl?: string;
  entityType: string;
  createdAt: Date;
  updatedAt: Date;
}

// Scary dimensions
export interface ScaryDimension {
  id: string;
  name: string;
  description: string;
  isStandard: boolean;
}

// Ratings
export interface ScaryRating {
  id: string;
  entityId: string;
  dimensionId: string;
  userId: string;
  score: number; // 1-10
  createdAt: Date;
}

// AI-generated content
export interface ScaryAnalysis {
  id: string;
  entityId: string;
  whyScary: string;
  dimensionScores: {
    dimensionId: string;
    score: number;
    reasoning: string;
  }[];
  generatedAt: Date;
}

// Google Knowledge Graph types
export interface GoogleKgEntity {
  '@context': string | Record<string, unknown>;
  '@type': string;
  itemListElement?: {
    '@type': string;
    result: {
      '@id': string;
      name: string;
      '@type': string[];
      description?: string;
      image?: {
        contentUrl: string;
      };
      detailedDescription?: {
        articleBody: string;
      };
    };
    resultScore: number;
  }[];
}

// Standard scary dimensions
export const STANDARD_DIMENSIONS = [
  {
    id: 'jump-scares',
    name: 'Jump Scares',
    description: 'Sudden startling moments designed to frighten'
  },
  {
    id: 'gore-violence',
    name: 'Gore/Violence',
    description: 'Graphic depictions of violence and blood'
  },
  {
    id: 'psychological-terror',
    name: 'Psychological Terror',
    description: 'Mental anguish, paranoia, and psychological horror'
  },
  {
    id: 'suspense-tension',
    name: 'Suspense/Tension',
    description: 'Building dread and anticipation'
  },
  {
    id: 'disturbing-content',
    name: 'Disturbing Content',
    description: 'Unsettling imagery or themes'
  }
];