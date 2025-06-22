import { NextRequest, NextResponse } from 'next/server';
import { knowledgeGraphService } from '@/services/knowledge-graph';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const results = await knowledgeGraphService.searchEntities({
      query,
      limit: 10,
    });

    // Filter results to only include entities suitable for our scary wiki
    const suitableResults = results.filter(entity => 
      knowledgeGraphService.isSuitableForScaryWiki(entity)
    );

    // Get all Google KG IDs from search results
    const kgIds = suitableResults.map(r => r.id);
    
    // Look up which entities already exist in our database
    const existingEntities = await prisma.scaryEntity.findMany({
      where: {
        googleKgId: {
          in: kgIds
        }
      },
      include: {
        analysis: {
          include: {
            dimensionScores: true
          }
        },
        ratings: {
          select: {
            userId: true,
            score: true
          }
        }
      }
    });

    // Create a map for quick lookup
    const existingMap = new Map(
      existingEntities.map(entity => [entity.googleKgId, entity])
    );

    // Enhance search results with database info
    const enhancedResults = suitableResults.map(result => {
      const dbEntity = existingMap.get(result.id);
      
      if (dbEntity) {
        // Calculate average AI score
        let averageAIScore = null;
        if (dbEntity.analysis && dbEntity.analysis.dimensionScores.length > 0) {
          const totalScore = dbEntity.analysis.dimensionScores.reduce(
            (sum, score) => sum + score.score, 0
          );
          averageAIScore = Math.round((totalScore / dbEntity.analysis.dimensionScores.length) * 10) / 10;
        }
        
        // Calculate user ratings
        let averageUserScore = null;
        let totalRatings = 0;
        if (dbEntity.ratings.length > 0) {
          const uniqueUsers = new Set(dbEntity.ratings.map(r => r.userId));
          totalRatings = uniqueUsers.size;
          
          // Group ratings by user and average
          const userRatings = new Map<string, number[]>();
          dbEntity.ratings.forEach(rating => {
            if (!userRatings.has(rating.userId)) {
              userRatings.set(rating.userId, []);
            }
            userRatings.get(rating.userId)!.push(rating.score);
          });
          
          const userAverages = Array.from(userRatings.values()).map(
            scores => scores.reduce((sum, score) => sum + score, 0) / scores.length
          );
          averageUserScore = Math.round(
            (userAverages.reduce((sum, avg) => sum + avg, 0) / userAverages.length) * 10
          ) / 10;
        }
        
        return {
          ...result,
          inDatabase: true,
          dbId: dbEntity.id,
          slug: dbEntity.slug,
          hasAnalysis: !!dbEntity.analysis,
          averageAIScore,
          averageUserScore,
          totalRatings,
          isGenerating: dbEntity.isGenerating
        };
      }
      
      return {
        ...result,
        inDatabase: false,
        hasAnalysis: false
      };
    });

    return NextResponse.json({ results: enhancedResults });
  } catch (error) {
    console.error('Knowledge Graph search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Knowledge Graph' },
      { status: 500 }
    );
  }
}