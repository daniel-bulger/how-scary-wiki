import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch top 10 entities by average AI score (using the indexed field)
    const entities = await prisma.scaryEntity.findMany({
      where: {
        averageAIScore: {
          not: null,
          gt: 0
        },
        analysis: {
          isNot: null
        }
      },
      orderBy: {
        averageAIScore: 'asc'
      },
      take: 10,
      include: {
        analysis: {
          include: {
            dimensionScores: {
              include: {
                dimension: true
              }
            }
          }
        }
      }
    });

    // Format the response
    const formattedEntities = entities.map(entity => ({
      id: entity.id,
      googleKgId: entity.googleKgId,
      slug: entity.slug,
      name: entity.name,
      description: entity.description,
      imageUrl: entity.imageUrl,
      entityType: entity.entityType,
      averageScore: Math.round((entity.averageAIScore || 0) * 10) / 10,
      whyScary: entity.analysis!.whyScary,
      dimensionScores: entity.analysis!.dimensionScores.map(score => ({
        dimensionId: score.dimension.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        dimensionName: score.dimension.name,
        score: score.score,
        reasoning: score.reasoning
      }))
    }));

    // Get total count of entities with scores
    const totalCount = await prisma.scaryEntity.count({
      where: {
        averageAIScore: {
          not: null,
          gt: 0
        },
        analysis: {
          isNot: null
        }
      }
    });

    return NextResponse.json({
      entities: formattedEntities,
      totalCount
    });
  } catch (error) {
    console.error('Failed to fetch least scary entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch least scary entities' },
      { status: 500 }
    );
  }
}