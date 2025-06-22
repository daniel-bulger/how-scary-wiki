'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ghost, TrendingUp, Star, Users } from 'lucide-react';

interface PopularEntity {
  id: string;
  googleKgId: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  entityType: string;
  averageAIScore: number;
  averageUserScore: number;
  totalRatings: number;
  whyScary: string;
  dimensionScores: {
    dimensionId: string;
    dimensionName: string;
    score: number;
    reasoning: string;
  }[];
}

export default function MostPopularPage() {
  const [entities, setEntities] = useState<PopularEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMostPopular();
  }, []);

  const fetchMostPopular = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/entities/most-popular');
      
      if (!response.ok) {
        throw new Error('Failed to fetch most popular entities');
      }

      const data = await response.json();
      setEntities(data.entities);
    } catch (err) {
      console.error('Error fetching most popular entities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Most Popular</h1>
          </div>
          <p className="text-lg text-gray-600">
            The most rated entities in our scary wiki, based on community engagement.
          </p>
        </div>


        <div className="space-y-6">
          {entities.map((entity, index) => (
            <Link
              key={entity.id}
              href={`/wiki/${entity.slug || entity.googleKgId}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {entity.imageUrl && (
                    <img
                      src={entity.imageUrl}
                      alt={entity.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl font-bold text-gray-400">
                            #{index + 1}
                          </span>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {entity.name}
                          </h2>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {entity.entityType}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{entity.description}</p>
                        
                        {/* Ratings info */}
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">{entity.totalRatings} ratings</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Ghost className="h-4 w-4 text-orange-500" />
                            <span>AI Score: <strong className="text-orange-600">{entity.averageAIScore}/10</strong></span>
                          </div>
                          
                          {entity.averageUserScore > 0 && (
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-blue-500" />
                              <span>User Score: <strong className="text-blue-600">{entity.averageUserScore}/10</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-gray-700 line-clamp-2">{entity.whyScary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {entities.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Rated Entities Yet</h2>
            <p className="text-gray-600">
              Be the first to rate entities and they&apos;ll appear here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}