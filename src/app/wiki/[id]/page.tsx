'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ghost, Star, Loader2, Calendar, Clock, ExternalLink, Film, BookOpen, User, Music, Globe, LogIn } from 'lucide-react';
import { ScaryDimensionChart } from '@/components/ScaryDimensionChart';
import { UserRatingForm } from '@/components/UserRatingForm';
import { WikiStructuredData } from '@/components/WikiStructuredData';

interface WikiEntity {
  id: string;
  dbId: string;
  slug?: string;
  name: string;
  description?: string;
  types: string[];
  imageUrl?: string;
  detailedDescription?: string;
  // Movie-specific fields
  posterUrl?: string | null;
  backdropUrl?: string | null;
  releaseDate?: string | null;
  runtime?: number | null;
  homepage?: string | null;
  imdbId?: string | null;
  tmdbUrl?: string | null;
  // Book-specific fields
  googleBooksId?: string | null;
  bookCoverUrl?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  pageCount?: number | null;
  publishDate?: string | null;
  publishers?: string[] | null;
  bookAuthors?: string[] | null;
  googleBooksUrl?: string | null;
  // Music-specific fields
  musicBrainzId?: string | null;
  albumArtUrl?: string | null;
  musicArtists?: string[] | null;
  musicReleaseDate?: string | null;
  trackCount?: number | null;
  musicType?: string | null;
  musicBrainzUrl?: string | null;
  lastFmUrl?: string | null;
  // Wikipedia-specific fields
  wikipediaPageId?: number | null;
  wikipediaExtract?: string | null;
  wikipediaImageUrl?: string | null;
  wikipediaCategories?: string[] | null;
  wikipediaUrl?: string | null;
}

interface ScaryAnalysis {
  whyScary: string;
  dimensionScores: {
    dimensionId: string;
    score: number;
    reasoning: string;
  }[];
}

interface WikiPageData {
  entity: WikiEntity;
  analysis?: ScaryAnalysis;
  userRatings?: {
    averageScore: number;
    totalRatings: number;
  };
  // Optional fields for partial responses
  exists?: boolean;
  isGenerating?: boolean;
  hasAnalysis?: boolean;
}

// Calculate overall AI scary score from dimension scores
const calculateOverallAIScore = (dimensionScores: ScaryAnalysis['dimensionScores']): number => {
  if (dimensionScores.length === 0) return 0;
  const totalScore = dimensionScores.reduce((sum, score) => sum + score.score, 0);
  return Math.round((totalScore / dimensionScores.length) * 10) / 10;
};

export default function WikiPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);
  
  const [data, setData] = useState<WikiPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) return;

    // Check for rate limit error from creation attempt
    const rateLimitError = sessionStorage.getItem(`rate_limit_error_${id}`);
    if (rateLimitError) {
      const errorData = JSON.parse(rateLimitError);
      sessionStorage.removeItem(`rate_limit_error_${id}`); // Clean up
      
      // Only show if error is recent (within last 10 seconds)
      if (Date.now() - errorData.timestamp < 10000) {
        setError(errorData.error);
        setLoading(false);
        return;
      }
    }

    const fetchWikiData = async () => {
      try {
        const response = await fetch(`/api/wiki/${encodeURIComponent(id)}`);
        console.log('Fetching wiki data, status:', response.status);

        if (response.status === 200) {
          const wikiData = await response.json();
          console.log('Got complete data with analysis');
          
          setData(wikiData);
          setLoading(false);
          setIsPolling(false);
          
          // Clear interval - we have complete data
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // If we loaded by googleKgId but have a slug, update the URL
          if (wikiData.entity.slug && id !== wikiData.entity.slug) {
            router.replace(`/wiki/${wikiData.entity.slug}`, { scroll: false });
          }
        } else if (response.status === 202) {
          // Entity exists but analysis is still generating
          const partialData = await response.json();
          console.log('Got partial data, analysis still generating');
          
          setData(partialData);
          setLoading(false); // Show the partial data
          setIsPolling(true); // But indicate we're still polling for analysis
          // Keep polling - don't clear interval
        } else if (response.status === 404) {
          // Just keep polling - entity might still be generating
          console.log('Entity not found yet, will keep polling');
          // Don't set error, just keep loading state
        } else if (response.status === 401) {
          // Authentication required
          setAuthError(true);
          setError('Please sign in to create new wiki entries.');
          setLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else if (response.status === 429) {
          // Rate limit exceeded
          const errorData = await response.json();
          const retryAfter = errorData.retryAfter || 60;
          setError(`Rate limit exceeded. You can create up to 5 entities per minute. Please try again in ${retryAfter} seconds.`);
          setLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          // For other errors, stop polling
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load entity data');
          setLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        // Network errors - keep polling
        console.error('Fetch error, will retry:', err);
        // Don't stop polling on network errors
      }
    };

    // Initial fetch
    setLoading(true);
    setError(null);
    fetchWikiData();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchWikiData();
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading entity data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Ghost className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {authError ? 'Authentication Required' : 'Entity Not Found'}
        </h1>
        <p className="text-gray-600 mb-4">{error}</p>
        {authError ? (
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <LogIn className="h-5 w-5" />
              Sign In to Continue
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Creating new wiki entries requires an account to prevent abuse.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            This entity may not be suitable for scary analysis or doesn&apos;t exist in the Knowledge Graph.
          </p>
        )}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { entity, analysis, userRatings } = data;
  const overallAIScore = analysis ? calculateOverallAIScore(analysis.dimensionScores) : null;

  return (
    <>
      <WikiStructuredData 
        entity={entity}
        averageAIScore={overallAIScore}
        averageUserScore={userRatings?.averageScore}
        totalRatings={userRatings?.totalRatings}
        analysis={analysis}
      />
      <div className="max-w-5xl mx-auto">
      {/* Wiki-style header */}
      <div className="bg-gray-50 border-b border-gray-200 -mx-4 px-4 py-6 md:py-8 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Image/Poster */}
            {(entity.posterUrl || entity.bookCoverUrl || entity.albumArtUrl || entity.imageUrl) && (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={entity.posterUrl || entity.bookCoverUrl || entity.albumArtUrl || entity.imageUrl}
                  alt={entity.name}
                  className={(entity.posterUrl || entity.bookCoverUrl || entity.albumArtUrl)
                    ? "w-48 md:w-56 h-auto rounded-lg shadow-md border-2 border-white" 
                    : "w-40 h-40 md:w-48 md:h-48 object-cover rounded-lg shadow-md border-2 border-white"
                  }
                />
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{entity.name}</h1>
              
              {/* Entity types */}
              {entity.types && entity.types.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  {entity.types.map((type) => (
                    <span
                      key={type}
                      className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium border border-gray-200"
                    >
                      {type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Description */}
              {entity.description && (
                <p className="text-gray-700 mb-5 text-lg leading-relaxed">{entity.description}</p>
              )}
              
              {/* Scary Scores - inline */}
              {analysis ? (
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Scary Score:</span>
                  </div>
                  <a href="#scary-dimensions" className="flex items-center gap-2 hover:text-orange-700 transition-colors">
                    <Ghost className="h-4 w-4 text-orange-500" />
                    <span>AI Analysis: <strong className="text-orange-600">{overallAIScore}/10</strong></span>
                  </a>
                  <a href="#user-rating" className="flex items-center gap-2 hover:text-blue-700 transition-colors">
                    <Star className="h-4 w-4 text-blue-500" />
                    <span>Community: <strong className="text-blue-600">{userRatings ? `${userRatings.averageScore}/10` : 'No ratings'}</strong></span>
                    {userRatings && (
                      <span className="text-xs text-gray-500">({userRatings.totalRatings})</span>
                    )}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-200 pt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isPolling ? 'Generating scary analysis...' : 'Loading analysis...'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Loading message when analysis is being generated */}
        {!analysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Scary Analysis</h3>
            <p className="text-gray-600">
              Our AI is analyzing {entity.name} to determine how scary it is across multiple dimensions.
            </p>
            <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds...</p>
            {isPolling && (
              <p className="text-xs text-gray-400 mt-1">Checking for updates...</p>
            )}
          </div>
        )}

        {/* Movie Information - Show when movie data is available */}
        {(entity.releaseDate || entity.runtime || entity.homepage || entity.imdbId || entity.tmdbUrl) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-serif font-bold flex items-center text-gray-900">
                <Film className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600" />
                Movie Information
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entity.releaseDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Release Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(entity.releaseDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {entity.runtime && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Runtime</p>
                      <p className="font-medium text-gray-900">
                        {Math.floor(entity.runtime / 60)}h {entity.runtime % 60}m
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* External Links */}
              <div className="flex flex-wrap gap-3 mt-6">
                {entity.homepage && (
                  <a
                    href={entity.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Official Website
                  </a>
                )}
                {entity.imdbId && (
                  <a
                    href={`https://www.imdb.com/title/${entity.imdbId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    IMDb
                  </a>
                )}
                {entity.tmdbUrl && (
                  <a
                    href={entity.tmdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    TMDb
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Book Information - Only show for books */}
        {((entity.bookAuthors && entity.bookAuthors.length > 0) || entity.isbn13 || entity.pageCount || entity.publishDate || entity.googleBooksUrl) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-serif font-bold flex items-center text-gray-900">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 mr-2 text-purple-600" />
                Book Information
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entity.bookAuthors && entity.bookAuthors.length > 0 && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Author{entity.bookAuthors.length > 1 ? 's' : ''}</p>
                      <p className="font-medium text-gray-900">
                        {entity.bookAuthors.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {entity.publishDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">First Published</p>
                      <p className="font-medium text-gray-900">{entity.publishDate}</p>
                    </div>
                  </div>
                )}
                {entity.pageCount && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Pages</p>
                      <p className="font-medium text-gray-900">{entity.pageCount}</p>
                    </div>
                  </div>
                )}
                {(entity.isbn13 || entity.isbn10) && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 text-xs font-bold">
                      ISBN
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ISBN</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {entity.isbn13 || entity.isbn10}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Publishers */}
              {entity.publishers && entity.publishers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Publisher{entity.publishers.length > 1 ? 's' : ''}</p>
                  <p className="text-gray-900">{entity.publishers.join(', ')}</p>
                </div>
              )}
              
              {/* External Links */}
              {entity.googleBooksUrl && (
                <div className="flex flex-wrap gap-3 mt-6">
                  <a
                    href={entity.googleBooksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Google Books
                  </a>
                  {entity.isbn13 && (
                    <a
                      href={`https://www.goodreads.com/search?q=${entity.isbn13}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Goodreads
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Music Information - Only show for music */}
        {((entity.musicArtists && entity.musicArtists.length > 0) || entity.musicReleaseDate || entity.trackCount || entity.musicType || entity.musicBrainzUrl) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-serif font-bold flex items-center text-gray-900">
                <Music className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-600" />
                Music Information
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entity.musicArtists && entity.musicArtists.length > 0 && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Artist{entity.musicArtists.length > 1 ? 's' : ''}</p>
                      <p className="font-medium text-gray-900">
                        {entity.musicArtists.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {entity.musicReleaseDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Release Date</p>
                      <p className="font-medium text-gray-900">{entity.musicReleaseDate}</p>
                    </div>
                  </div>
                )}
                {entity.trackCount && (
                  <div className="flex items-center gap-3">
                    <Music className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Tracks</p>
                      <p className="font-medium text-gray-900">{entity.trackCount}</p>
                    </div>
                  </div>
                )}
                {entity.musicType && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 text-xs font-bold">
                      <Music className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{entity.musicType}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* External Links */}
              {(entity.musicBrainzUrl || entity.lastFmUrl) && (
                <div className="flex flex-wrap gap-3 mt-6">
                  {entity.musicBrainzUrl && (
                    <a
                      href={entity.musicBrainzUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      MusicBrainz
                    </a>
                  )}
                  {entity.lastFmUrl && (
                    <a
                      href={entity.lastFmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Last.fm
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Why It's Scary */}
        {analysis && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-serif font-bold flex items-center text-gray-900">
                <Ghost className="h-4 w-4 md:h-5 md:w-5 mr-2 text-orange-600" />
                Why It&apos;s Scary
              </h2>
            </div>
            <div className="px-4 md:px-6 py-4 md:py-6">
              <div className="prose prose-base md:prose-lg max-w-none text-gray-700">
                {analysis.whyScary.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 md:mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wikipedia Extract - Show if available */}
        {(entity.wikipediaExtract || (entity.wikipediaCategories && entity.wikipediaCategories.length > 0)) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <h2 className="text-lg md:text-xl font-serif font-bold flex items-center text-gray-900">
                <Globe className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600" />
                Encyclopedia Information
              </h2>
            </div>
            <div className="p-4 md:p-6">
              {entity.wikipediaExtract && (
                <div className="prose prose-base max-w-none text-gray-700 mb-4">
                  <p className="leading-relaxed">{entity.wikipediaExtract}</p>
                </div>
              )}
              
              {entity.wikipediaCategories && entity.wikipediaCategories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {entity.wikipediaCategories.slice(0, 10).map((category) => (
                      <span
                        key={category}
                        className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {entity.wikipediaUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={entity.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Read Full Wikipedia Article
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scary Dimensions */}
        {analysis && (
          <div id="scary-dimensions" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Scary Dimensions</h2>
            </div>
            <div className="p-6">
              <ScaryDimensionChart dimensionScores={analysis.dimensionScores} />
            </div>
          </div>
        )}

        {/* User Rating Form */}
        <div id="user-rating" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-serif font-bold text-gray-900">Rate This Entity</h2>
          </div>
          <div className="p-6">
            <UserRatingForm entityId={entity.dbId} />
          </div>
        </div>

      </div>
    </div>
    </>
  );
}