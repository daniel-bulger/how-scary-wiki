'use client';

import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, Ghost, Star, Check, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  types: string[];
  imageUrl?: string;
  score: number;
  // Database fields
  inDatabase?: boolean;
  dbId?: string;
  slug?: string;
  hasAnalysis?: boolean;
  averageAIScore?: number | null;
  averageUserScore?: number | null;
  totalRatings?: number;
  isGenerating?: boolean;
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/knowledge-graph/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleResultClick = async (result: SearchResult) => {
    setError(null);
    
    // If entity already exists in database, anyone can view it
    if (result.inDatabase && result.slug) {
      router.push(`/wiki/${result.slug}`);
      onClose();
      return;
    }
    
    // For new entities, check if user is authenticated
    if (!user) {
      setError('Please sign in to create new wiki entries.');
      return;
    }
    
    // Get auth token
    let authToken = null;
    if (auth?.currentUser) {
      try {
        authToken = await auth.currentUser.getIdToken();
      } catch (err) {
        console.error('Failed to get auth token:', err);
        setError('Authentication error. Please try signing in again.');
        return;
      }
    }
    
    if (!authToken) {
      setError('Please sign in to create new wiki entries.');
      return;
    }
    
    // Trigger wiki creation BEFORE navigating
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };
    
    // Start the creation request
    const creationPromise = fetch('/api/wiki/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ entityData: result }),
    });
    
    // Race between creation response and a timeout
    Promise.race([
      creationPromise,
      new Promise(resolve => setTimeout(() => resolve('timeout'), 300))
    ]).then(async (raceResult) => {
      if (raceResult === 'timeout') {
        // Timeout reached, navigate anyway
        router.push(`/wiki/${encodeURIComponent(result.id)}`);
        onClose();
        
        // Continue handling the creation response in background
        creationPromise.then(async (response) => {
          if (response.status === 429) {
            const data = await response.json();
            const retryAfter = data.retryAfter || 60;
            sessionStorage.setItem(`rate_limit_error_${result.id}`, JSON.stringify({
              error: `Rate limit exceeded. You can create up to 5 entities per minute. Please try again in ${retryAfter} seconds.`,
              timestamp: Date.now()
            }));
          }
        }).catch(error => {
          console.error('Error creating wiki page:', error);
        });
      } else {
        // Got response before timeout
        const response = raceResult as Response;
        if (response.status === 429) {
          // Rate limited - show error immediately
          const data = await response.json();
          const retryAfter = data.retryAfter || 60;
          setError(`Rate limit exceeded. You can create up to 5 entities per minute. Please try again in ${retryAfter} seconds.`);
        } else {
          // Success or other status - navigate
          router.push(`/wiki/${encodeURIComponent(result.id)}`);
          onClose();
        }
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Search Scary Things</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-700">{error}</p>
            {!user && (
              <a
                href="/auth/signin"
                className="inline-block mt-2 text-sm text-red-800 underline hover:no-underline"
              >
                Sign in to continue
              </a>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for movies, books, games, people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Searching scary things...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt={result.name}
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Ghost className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {result.name}
                          </h3>
                          {result.inDatabase ? (
                            <span title="In database">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            </span>
                          ) : (
                            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        {result.isGenerating && (
                          <span title="Generating...">
                            <Clock className="h-4 w-4 text-orange-500 animate-pulse" />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {result.description && (
                          <p className="text-sm font-medium text-gray-700">
                            {result.description}
                          </p>
                        )}
                        {result.detailedDescription && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {result.detailedDescription}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {result.types.slice(0, 2).map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                        </div>
                        
                        {/* Scary scores */}
                        {result.inDatabase && result.hasAnalysis && (
                          <div className="flex items-center space-x-3 text-xs">
                            {result.averageAIScore !== null && (
                              <div className="flex items-center gap-1">
                                <Ghost className="h-3 w-3 text-orange-500" />
                                <span className="font-medium text-orange-600">{result.averageAIScore}/10</span>
                              </div>
                            )}
                            {result.totalRatings && result.totalRatings > 0 && result.averageUserScore !== null && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-blue-500" />
                                <span className="font-medium text-blue-600">{result.averageUserScore}/10</span>
                                <span className="text-gray-500">({result.totalRatings})</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500">
              No scary things found matching &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Start typing to search for scary movies, books, games, and more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}