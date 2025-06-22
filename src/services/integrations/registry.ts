export interface IntegrationDefinition {
  name: string;
  description: string;
  entityTypes: string[];
  requiredEnvVar?: string;
}

export interface IntegrationResult {
  integration: string;
  confidence: number;
  reasoning: string;
  hints: Record<string, string | number | boolean>;
}

export const INTEGRATION_REGISTRY: Record<string, IntegrationDefinition> = {
  tmdb: {
    name: "The Movie Database",
    description: "Provides movie posters, cast, crew, ratings, release dates, trailers",
    entityTypes: ["movies", "films", "cinema", "actors", "directors", "horror movies", "sci-fi films"],
    requiredEnvVar: "TMDB_API_KEY"
  },
  googleMaps: {
    name: "Google Maps",
    description: "Provides location data, photos, reviews, coordinates, nearby places",
    entityTypes: ["places", "locations", "landmarks", "buildings", "haunted sites", "cemeteries", "abandoned places"],
    requiredEnvVar: "GOOGLE_MAPS_API_KEY"
  },
  musicbrainz: {
    name: "MusicBrainz",
    description: "Provides album art, track listings, artist info, discography",
    entityTypes: ["music", "albums", "songs", "bands", "musicians", "horror soundtracks", "metal bands"],
    requiredEnvVar: undefined // Open API, no key required
  },
  igdb: {
    name: "Internet Game Database",
    description: "Provides game covers, screenshots, ratings, platforms, release dates",
    entityTypes: ["video games", "games", "gaming", "horror games", "survival horror"],
    requiredEnvVar: "IGDB_API_KEY"
  },
  googleBooks: {
    name: "Google Books",
    description: "Provides book covers, ISBNs, authors, publication info, editions",
    entityTypes: ["books", "novels", "literature", "authors", "horror novels", "stephen king", "gothic literature"],
    requiredEnvVar: undefined // Open API
  },
  wikipedia: {
    name: "Wikipedia",
    description: "Provides detailed articles, historical context, cultural significance",
    entityTypes: ["historical events", "mythological creatures", "urban legends", "cryptids", "folklore"],
    requiredEnvVar: undefined // Open API
  }
};

export function getAvailableIntegrations(): string[] {
  return Object.entries(INTEGRATION_REGISTRY)
    .filter(([, integration]) => {
      // Check if required environment variable is set
      if (integration.requiredEnvVar) {
        return !!process.env[integration.requiredEnvVar];
      }
      return true;
    })
    .map(([key]) => key);
}