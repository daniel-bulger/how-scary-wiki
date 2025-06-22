'use client';

import { STANDARD_DIMENSIONS } from '@/types';

interface DimensionScore {
  dimensionId: string;
  score: number;
  reasoning: string;
}

interface ScaryDimensionChartProps {
  dimensionScores: DimensionScore[];
}

export function ScaryDimensionChart({ dimensionScores }: ScaryDimensionChartProps) {
  const getDimensionName = (id: string) => {
    const dimension = STANDARD_DIMENSIONS.find(d => d.id === id);
    return dimension?.name || id;
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'bg-emerald-500';
    if (score <= 6) return 'bg-amber-500';
    if (score <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score <= 3) return 'from-emerald-400 to-emerald-600';
    if (score <= 6) return 'from-amber-400 to-amber-600';
    if (score <= 8) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 2) return 'Mild';
    if (score <= 4) return 'Moderate';
    if (score <= 6) return 'Scary';
    if (score <= 8) return 'Very Scary';
    return 'Extremely Scary';
  };

  return (
    <div className="space-y-8">
      {dimensionScores.map((dimensionScore) => (
        <div key={dimensionScore.dimensionId} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-lg">
              {getDimensionName(dimensionScore.dimensionId)}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  {dimensionScore.score}
                </span>
                <span className="text-sm text-gray-500 font-medium">/10</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getScoreColor(dimensionScore.score)}`}>
                {getScoreLabel(dimensionScore.score)}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className={`h-4 rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${getScoreGradient(dimensionScore.score)} shadow-sm`}
              style={{ width: `${(dimensionScore.score / 10) * 100}%` }}
            />
          </div>
          
          {/* Reasoning */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {dimensionScore.reasoning}
            </p>
          </div>
        </div>
      ))}
      
      {/* Overall Scary Score */}
      <div className="pt-6 border-t-2 border-gray-200">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-gray-900">Overall Scary Score</h3>
              <p className="text-sm text-gray-600 mt-1">Average across all dimensions</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {(dimensionScores.reduce((sum, score) => sum + score.score, 0) / dimensionScores.length).toFixed(1)}
              </div>
              <div className="text-sm font-medium text-gray-500">out of 10</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}