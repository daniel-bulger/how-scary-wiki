'use client';

import { useState, useEffect } from 'react';
import { 
  Edit3, 
  Image, 
  RefreshCw, 
  Save, 
  X, 
  Loader2, 
  AlertCircle,
  History,
  Film,
  BookOpen,
  Music,
  Globe,
  Shield
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ModeratorToolsProps {
  entity: any;
  analysis: any;
  onEntityUpdate?: (updatedEntity: any) => void;
  onAnalysisUpdate?: (updatedAnalysis: any) => void;
}

interface ModeratorLog {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export function ModeratorTools({ entity, analysis, onEntityUpdate, onAnalysisUpdate }: ModeratorToolsProps) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTools, setShowTools] = useState(false);
  
  // Edit states
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingPoster, setEditingPoster] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Form values
  const [description, setDescription] = useState(entity.description || '');
  const [posterUrl, setPosterUrl] = useState(entity.posterUrl || entity.imageUrl || '');
  const [whyScary, setWhyScary] = useState(analysis?.whyScary || '');
  
  // History
  const [history, setHistory] = useState<ModeratorLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Available integrations
  const availableIntegrations = [
    { id: 'tmdb', name: 'TMDB', icon: Film, hasData: !!(entity.tmdbUrl || entity.releaseDate || entity.runtime) },
    { id: 'googleBooks', name: 'Google Books', icon: BookOpen, hasData: !!(entity.googleBooksId || entity.googleBooksUrl || entity.bookCoverUrl) },
    { id: 'musicbrainz', name: 'MusicBrainz', icon: Music, hasData: !!(entity.musicBrainzId || entity.musicBrainzUrl || entity.albumArtUrl) },
    { id: 'wikipedia', name: 'Wikipedia', icon: Globe, hasData: !!(entity.wikipediaPageId || entity.wikipediaUrl || entity.wikipediaExtract) }
  ];

  useEffect(() => {
    checkUserRole();
  }, [user]);

  const checkUserRole = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const claims = await user.getIdTokenResult();
      
      // Check custom claims or fetch from API
      const response = await fetch('/api/admin/users?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setUserRole('ADMIN');
      } else {
        // Try moderator endpoint
        const modResponse = await fetch(`/api/moderator/entities/${entity.dbId}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (modResponse.ok) {
          setUserRole('MODERATOR');
        }
      }
    } catch (error) {
      console.error('Failed to check user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/moderator/entities/${entity.dbId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const updateEntity = async (updates: any) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/moderator/entities/${entity.dbId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onEntityUpdate) {
          onEntityUpdate(data.entity);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update entity:', error);
      return false;
    }
  };

  const updateAISummary = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/moderator/entities/${entity.dbId}?action=edit-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ whyScary })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onAnalysisUpdate) {
          onAnalysisUpdate(data.analysis);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update AI summary:', error);
      return false;
    }
  };

  const triggerIntegration = async (integration: string, integrationId?: string) => {
    if (!user) return;
    
    // If no ID provided, prompt for one (optional)
    if (!integrationId) {
      const idPrompt = getIntegrationIdPrompt(integration);
      const userInput = prompt(idPrompt);
      if (userInput && userInput.trim()) {
        integrationId = userInput.trim();
      }
    }
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/moderator/entities/${entity.dbId}?action=trigger-integration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ integration, integrationId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onEntityUpdate) {
          // Merge integration data with entity
          onEntityUpdate({ ...entity, ...data.integrationData });
        }
        alert(`${integration} integration completed successfully`);
      }
    } catch (error) {
      console.error('Failed to trigger integration:', error);
      alert(`Failed to trigger ${integration} integration`);
    }
  };

  const getIntegrationIdPrompt = (integration: string): string => {
    switch (integration) {
      case 'tmdb':
        return 'Enter TMDB ID (optional, e.g., 577922 for Tenet):';
      case 'wikipedia':
        return 'Enter Wikipedia page title or ID (optional, e.g., "Tenet (film)" or 3587606):';
      case 'googleBooks':
        return 'Enter Google Books ID (optional):';
      case 'musicbrainz':
        return 'Enter MusicBrainz ID (optional):';
      default:
        return 'Enter integration ID (optional):';
    }
  };

  const regenerateAnalysis = async () => {
    if (!user || !confirm('Are you sure you want to regenerate the AI analysis? This will overwrite any manual edits.')) {
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/moderator/entities/${entity.dbId}?action=regenerate-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onAnalysisUpdate && data.entity.analysis) {
          onAnalysisUpdate(data.entity.analysis);
        }
        alert('Analysis regenerated successfully');
      }
    } catch (error) {
      console.error('Failed to regenerate analysis:', error);
      alert('Failed to regenerate analysis');
    }
  };

  if (loading) {
    return null;
  }

  if (!userRole || (userRole !== 'MODERATOR' && userRole !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Action Button */}
      <button
        onClick={() => setShowTools(!showTools)}
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-3 shadow-lg flex items-center gap-2 transition-all"
      >
        <Shield className="h-5 w-5" />
        {showTools ? <X className="h-5 w-5" /> : <span className="pr-2">Moderator Tools</span>}
      </button>

      {/* Tools Panel */}
      {showTools && (
        <div className="absolute bottom-16 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Moderator Tools
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {userRole === 'ADMIN' ? 'Admin' : 'Moderator'} access
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Edit Description */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Description
                </h4>
                <button
                  onClick={() => setEditingDescription(!editingDescription)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {editingDescription ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                </button>
              </div>
              {editingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={async () => {
                      if (await updateEntity({ description })) {
                        setEditingDescription(false);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {entity.description || 'No description'}
                </p>
              )}
            </div>

            {/* Edit Poster URL */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Poster/Image URL
                </h4>
                <button
                  onClick={() => setEditingPoster(!editingPoster)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {editingPoster ? <X className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                </button>
              </div>
              {editingPoster ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="https://..."
                  />
                  <button
                    onClick={async () => {
                      const updates = entity.posterUrl ? { posterUrl } : { imageUrl: posterUrl };
                      if (await updateEntity(updates)) {
                        setEditingPoster(false);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {entity.posterUrl || entity.imageUrl || 'No image'}
                </p>
              )}
            </div>

            {/* Edit AI Summary */}
            {analysis && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    AI Summary
                    {analysis.isHumanEdited && (
                      <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                        (Human Edited)
                      </span>
                    )}
                  </h4>
                  <button
                    onClick={() => setEditingSummary(!editingSummary)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {editingSummary ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  </button>
                </div>
                {editingSummary ? (
                  <div className="space-y-2">
                    <textarea
                      value={whyScary}
                      onChange={(e) => setWhyScary(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      rows={6}
                    />
                    <button
                      onClick={async () => {
                        if (await updateAISummary()) {
                          setEditingSummary(false);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {analysis.whyScary}
                  </p>
                )}
              </div>
            )}

            {/* Integrations */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Integrations
              </h4>
              <div className="space-y-2">
                {availableIntegrations.map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <button
                      key={integration.id}
                      onClick={() => triggerIntegration(integration.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{integration.name}</span>
                      </div>
                      {integration.hasData ? (
                        <RefreshCw className="h-3 w-3 text-gray-500" />
                      ) : (
                        <span className="text-xs text-gray-500">Not linked</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={regenerateAnalysis}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate AI Analysis
              </button>
              
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory && history.length === 0) {
                    fetchHistory();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium"
              >
                <History className="h-4 w-4" />
                View History
              </button>
            </div>

            {/* History Panel */}
            {showHistory && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Moderation History
                </h4>
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No history</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((log) => (
                      <div key={log.id} className="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          by {log.user.name || log.user.email}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}