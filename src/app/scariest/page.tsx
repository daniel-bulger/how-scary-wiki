'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ghost, Skull, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';

interface EntityScore {
  id: string;
  googleKgId: string;
  name: string;
  description: string;
  imageUrl?: string;
  entityType: string;
  averageScore: number;
  whyScary: string;
  dimensionScores: {
    dimensionId: string;
    dimensionName: string;
    score: number;
    reasoning: string;
  }[];
}

export default function ScariestPage() {
  const [entities, setEntities] = useState<EntityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScariestEntities = async () => {
      try {
        const response = await fetch('/api/entities/scariest');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setEntities(data.entities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchScariestEntities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading the scariest entities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Ghost className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center py-8 md:py-12 px-4">
        <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-2xl mb-4 md:mb-6">
          <Skull className="h-12 w-12 md:h-16 md:w-16 text-red-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-3 md:mb-4">The Scariest Entities</h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          These are the most terrifying entities in our database, ranked by their average scary scores across all dimensions.
        </p>
      </div>

      {/* Entities List */}
      <div className="space-y-4 md:space-y-6 mb-8 md:mb-12 px-4 md:px-0">
        {entities.map((entity, index) => (
          <Link
            key={entity.id}
            href={`/wiki/${encodeURIComponent(entity.googleKgId)}`}
            className="block group"
          >
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border-2 border-gray-100 hover:border-red-200 hover:shadow-lg transition-all overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                  {/* Top section with rank and image */}
                  <div className="flex items-start gap-4 sm:gap-0 w-full sm:w-auto">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-red-600 to-red-800' :
                        index === 1 ? 'bg-gradient-to-br from-red-500 to-red-700' :
                        index === 2 ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                        'bg-gradient-to-br from-orange-400 to-orange-600'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>

                    {/* Entity Image - shown next to rank on mobile */}
                    {entity.imageUrl && (
                      <div className="flex-shrink-0 sm:ml-4">
                        <img
                          src={entity.imageUrl}
                          alt={entity.name}
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg md:rounded-xl"
                        />
                      </div>
                    )}
                  </div>

                  {/* Entity Info */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                          {entity.name}
                        </h2>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs md:text-sm font-medium mt-1">
                          {entity.entityType.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
                        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                          {entity.averageScore}
                        </div>
                        <div className="text-xs md:text-sm font-medium text-gray-500">out of 10</div>
                      </div>
                    </div>
                    
                    <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4 line-clamp-2">
                      {entity.whyScary}
                    </p>

                    {/* Dimension Scores Preview */}
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {entity.dimensionScores.slice(0, 2).map(dimension => (
                        <div key={dimension.dimensionId} className="flex items-center gap-1 md:gap-2">
                          <span className="text-xs md:text-sm font-medium text-gray-600">{dimension.dimensionName}:</span>
                          <span className={`text-xs md:text-sm font-bold ${
                            dimension.score >= 8 ? 'text-red-600' :
                            dimension.score >= 6 ? 'text-orange-600' :
                            dimension.score >= 4 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {dimension.score}/10
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center text-xs md:text-sm text-gray-500 group-hover:text-red-600 transition-colors">
                        <span className="hidden sm:inline">View all</span>
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4 sm:ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-gray-100">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-700"
                  style={{ width: `${(entity.averageScore / 10) * 100}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8 md:mb-12 px-4">
        <Link
          href="/least-scary"
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg md:rounded-xl font-medium md:font-semibold shadow-sm hover:shadow-md transition-all text-sm md:text-base"
        >
          <TrendingUp className="h-4 w-4 md:h-5 md:w-5 rotate-180" />
          <span>View Least Scary</span>
        </Link>
        <Link
          href="/"
          className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg md:rounded-xl font-medium md:font-semibold transition-colors text-center text-sm md:text-base"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}