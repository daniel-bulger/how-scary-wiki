import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch entities with rating counts and analysis
    const entities = await prisma.scaryEntity.findMany({
      where: {
        analysis: {
          isNot: null
        }
      },
      include: {
        analysis: {
          include: {
            dimensionScores: {
              include: {
                dimension: true
              }
            }
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

    // Calculate ratings data for each entity
    const entitiesWithRatings = entities.map(entity => {
      // Get unique users who rated this entity
      const uniqueUserIds = new Set(entity.ratings.map(r => r.userId));
      const totalRatings = uniqueUserIds.size;
      
      // Calculate average user rating if there are ratings
      let averageUserScore = 0;
      if (totalRatings > 0) {
        // Group ratings by user and average each user's ratings
        const userRatings = new Map<string, number[]>();
        entity.ratings.forEach(rating => {
          if (!userRatings.has(rating.userId)) {
            userRatings.set(rating.userId, []);
          }
          userRatings.get(rating.userId)!.push(rating.score);
        });
        
        // Calculate average for each user, then overall average
        const userAverages = Array.from(userRatings.values()).map(
          scores => scores.reduce((sum, score) => sum + score, 0) / scores.length
        );
        averageUserScore = userAverages.reduce((sum, avg) => sum + avg, 0) / userAverages.length;
      }

      return {
        id: entity.id,
        googleKgId: entity.googleKgId,
        slug: entity.slug,
        name: entity.name,
        description: entity.description,
        imageUrl: entity.imageUrl,
        entityType: entity.entityType,
        averageAIScore: Math.round((entity.averageAIScore || 0) * 10) / 10,
        averageUserScore: Math.round(averageUserScore * 10) / 10,
        totalRatings,
        whyScary: entity.analysis!.whyScary,
        dimensionScores: entity.analysis!.dimensionScores.map(score => ({
          dimensionId: score.dimension.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          dimensionName: score.dimension.name,
          score: score.score,
          reasoning: score.reasoning
        }))
      };
    });

    // Sort by total ratings descending and take top 10
    const mostPopular = entitiesWithRatings
      .filter(entity => entity.totalRatings > 0)
      .sort((a, b) => b.totalRatings - a.totalRatings)
      .slice(0, 10);

    return NextResponse.json({
      entities: mostPopular,
      totalCount: entitiesWithRatings.filter(e => e.totalRatings > 0).length
    });
  } catch (error) {
    console.error('Failed to fetch most popular entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch most popular entities' },
      { status: 500 }
    );
  }
}