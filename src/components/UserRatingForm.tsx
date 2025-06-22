'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { STANDARD_DIMENSIONS } from '@/types';
import { Star, Save } from 'lucide-react';

interface UserRatingFormProps {
  entityId: string;
}

export function UserRatingForm({ entityId }: UserRatingFormProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing ratings when component mounts
  useEffect(() => {
    const loadExistingRatings = async () => {
      if (!user || !entityId) return;

      setLoading(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/ratings/user?entityId=${entityId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Convert ratings array to object keyed by dimension slug
          const ratingsObject: Record<string, number> = {};
          data.ratings.forEach((rating: { dimensionName: string; score: number }) => {
            // Convert dimension name back to slug
            const dimensionSlug = rating.dimensionName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            ratingsObject[dimensionSlug] = rating.score;
          });
          setRatings(ratingsObject);
        }
      } catch (error) {
        console.error('Error loading existing ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExistingRatings();
  }, [user, entityId]);

  const handleRatingChange = (dimensionId: string, score: number) => {
    setRatings(prev => ({
      ...prev,
      [dimensionId]: score
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Get Firebase ID token
      const token = await user.getIdToken();
      
      // Submit ratings to API
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entityId,
          ratings: Object.entries(ratings).map(([dimensionId, score]) => ({
            dimensionId,
            score
          }))
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await response.json();
        console.error('Failed to save ratings:', errorData);
      }
    } catch (error) {
      console.error('Error saving ratings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Sign in to rate this entity</p>
        <a
          href="/auth/signin"
          className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <span>Sign In</span>
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading your ratings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {STANDARD_DIMENSIONS.map((dimension) => (
        <div key={dimension.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-900">
              {dimension.name}
            </label>
            <span className="text-sm text-gray-500">
              {ratings[dimension.id] || 0}/10
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {dimension.description}
          </p>
          
          {/* Star Rating */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => handleRatingChange(dimension.id, score)}
                className={`p-1 rounded transition-colors ${
                  (ratings[dimension.id] || 0) >= score
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                <Star
                  className="h-5 w-5"
                  fill={(ratings[dimension.id] || 0) >= score ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={saving || Object.keys(ratings).length === 0}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Ratings'}</span>
        </button>
        
        {saved && (
          <span className="text-green-600 text-sm font-medium">
            Ratings saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}