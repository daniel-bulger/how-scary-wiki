import { NextRequest, NextResponse } from 'next/server';
import { getAIContentGenerator } from '@/services/ai-content-generator';
import { knowledgeGraphService } from '@/services/knowledge-graph';
import { integrationProcessor } from '@/services/integrations/processor';
import { IntegrationResult } from '@/services/integrations/registry';
import { prisma } from '@/lib/prisma';
import { generateUniqueSlug } from '@/lib/slugify';
import { adminAuth } from '@/lib/firebase-admin';
import { checkEntityCreationLimit } from '@/lib/rate-limit';

// Force dynamic rendering to ensure authentication works correctly
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - REQUIRED
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required to create entities. Please sign in.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const token = authHeader.split(' ')[1];
      const decodedToken = await adminAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Auth verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token. Please sign in again.' },
        { status: 401 }
      );
    }

    // Apply rate limiting for authenticated users
    const rateLimitResult = await checkEntityCreationLimit(userId);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can create up to 5 entities per minute.',
          retryAfter: rateLimitResult.retryAfter,
          resetAt: new Date(rateLimitResult.resetAt).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': rateLimitResult.retryAfter!.toString()
          }
        }
      );
    }
    
    // Store rate limit headers for successful responses
    const rateLimitHeaders: Record<string, string> = {
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
    };

    const { entityData } = await request.json();

    if (!entityData || !entityData.id) {
      return NextResponse.json(
        { error: 'entityData with id is required' },
        { status: 400 }
      );
    }

    // Check if this entity already exists in our database
    const existingEntity = await prisma.scaryEntity.findUnique({
      where: { googleKgId: entityData.id },
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

    if (existingEntity) {
      if (existingEntity.analysis) {
        // Analysis completed, return cached analysis
        const analysis = {
          whyScary: existingEntity.analysis.whyScary,
          dimensionScores: existingEntity.analysis.dimensionScores.map((score: any) => ({
            dimensionId: score.dimension.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            score: score.score,
            reasoning: score.reasoning
          }))
        };

        return NextResponse.json({
          entity: {
            id: existingEntity.googleKgId,
            dbId: existingEntity.id,
            slug: existingEntity.slug,
            name: existingEntity.name,
            description: existingEntity.description,
            types: [existingEntity.entityType],
            imageUrl: existingEntity.imageUrl,
            score: 1,
            // Include movie data if available
            // Movie data
            posterUrl: existingEntity.posterUrl,
            backdropUrl: existingEntity.backdropUrl,
            releaseDate: existingEntity.releaseDate,
            runtime: existingEntity.runtime,
            homepage: existingEntity.homepage,
            imdbId: existingEntity.imdbId,
            tmdbUrl: existingEntity.tmdbUrl,
            // Book data
            googleBooksId: existingEntity.googleBooksId,
            bookCoverUrl: existingEntity.bookCoverUrl,
            isbn10: existingEntity.isbn10,
            isbn13: existingEntity.isbn13,
            pageCount: existingEntity.pageCount,
            publishDate: existingEntity.publishDate,
            publishers: existingEntity.publishers,
            bookAuthors: existingEntity.bookAuthors,
            googleBooksUrl: existingEntity.googleBooksUrl,
            // Music data
            musicBrainzId: existingEntity.musicBrainzId,
            albumArtUrl: existingEntity.albumArtUrl,
            musicArtists: existingEntity.musicArtists,
            musicReleaseDate: existingEntity.musicReleaseDate,
            trackCount: existingEntity.trackCount,
            musicType: existingEntity.musicType,
            musicBrainzUrl: existingEntity.musicBrainzUrl,
            lastFmUrl: existingEntity.lastFmUrl,
            // Wikipedia data
            wikipediaPageId: existingEntity.wikipediaPageId,
            wikipediaExtract: existingEntity.wikipediaExtract,
            wikipediaImageUrl: existingEntity.wikipediaImageUrl,
            wikipediaCategories: existingEntity.wikipediaCategories,
            wikipediaUrl: existingEntity.wikipediaUrl,
          },
          analysis,
        }, {
          headers: rateLimitHeaders
        });
      } else if (existingEntity.isGenerating) {
        // Already generating, return status
        return NextResponse.json({
          status: 'generating',
          message: 'Wiki page is being generated...'
        });
      }
    }

    // Use AI to detect relevant integrations
    const aiGenerator = getAIContentGenerator();
    console.log('Detecting relevant integrations for:', entityData.name);
    const relevantIntegrations = await aiGenerator.detectRelevantIntegrations(entityData);
    
    console.log('AI detected integrations:', relevantIntegrations.map((i: IntegrationResult) => 
      `${i.integration} (${i.confidence})`
    ).join(', '));

    // Process all relevant integrations
    const integrationData = await integrationProcessor.processIntegrations(
      entityData,
      relevantIntegrations
    );

    // Extract year from description if available
    const yearMatch = entityData.description?.match(/\b(19|20)\d{2}\b/) || 
                      entityData.detailedDescription?.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : undefined;
    
    // Generate a unique slug for this entity
    const slug = await generateUniqueSlug(
      entityData.name, 
      entityData.description,
      entityData.types[0],
      year
    );

    // Try to create entity with generation flag (atomic operation)
    try {
      await prisma.scaryEntity.create({
        data: {
          googleKgId: entityData.id,
          slug: slug,
          name: entityData.name,
          description: entityData.description || '',
          imageUrl: entityData.imageUrl,
          entityType: entityData.types[0] || 'Unknown',
          isGenerating: true,
          // Add all integration data
          ...integrationData,
        }
      });
    } catch (error) {
      // If unique constraint failed, another request is already processing this entity
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        return NextResponse.json({
          status: 'generating',
          message: 'Wiki page is being generated by another request...'
        });
      }
      throw error;
    }

    // Check if entity is suitable for scary analysis
    if (!knowledgeGraphService.isSuitableForScaryWiki(entityData)) {
      // Update entity to mark generation failed
      await prisma.scaryEntity.update({
        where: { googleKgId: entityData.id },
        data: { isGenerating: false }
      });
      
      return NextResponse.json(
        { error: 'Entity is not suitable for scary analysis' },
        { status: 400 }
      );
    }

    try {
      // Generate scary analysis using AI
      const analysis = await aiGenerator.generateScaryAnalysis(entityData);

      // Calculate average AI score
      const averageScore = analysis.dimensionScores.reduce((sum: number, score: { score: number }) => sum + score.score, 0) / analysis.dimensionScores.length;

      // Update entity with analysis and clear generation flag
      const updatedEntity = await prisma.scaryEntity.update({
        where: { googleKgId: entityData.id },
        data: {
          isGenerating: false,
          averageAIScore: averageScore,
          analysis: {
            create: {
              whyScary: analysis.whyScary,
              dimensionScores: {
                create: analysis.dimensionScores.map((score: { dimensionId: string; score: number; reasoning: string }) => ({
                  score: score.score,
                  reasoning: score.reasoning,
                  dimension: {
                    connectOrCreate: {
                      where: { name: score.dimensionId.split('-').map((word: string) => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') },
                      create: {
                        name: score.dimensionId.split('-').map((word: string) => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' '),
                        description: `Scary dimension: ${score.dimensionId}`,
                        isStandard: true
                      }
                    }
                  }
                }))
              }
            }
          }
        }
      });

      return NextResponse.json({
        entity: {
          ...entityData,
          dbId: updatedEntity.id,
          slug: updatedEntity.slug,
          // Include all integration data from the database
          // Movie data
          posterUrl: updatedEntity.posterUrl,
          backdropUrl: updatedEntity.backdropUrl,
          releaseDate: updatedEntity.releaseDate,
          runtime: updatedEntity.runtime,
          homepage: updatedEntity.homepage,
          imdbId: updatedEntity.imdbId,
          tmdbUrl: updatedEntity.tmdbUrl,
          // Book data
          googleBooksId: updatedEntity.googleBooksId,
          bookCoverUrl: updatedEntity.bookCoverUrl,
          isbn10: updatedEntity.isbn10,
          isbn13: updatedEntity.isbn13,
          pageCount: updatedEntity.pageCount,
          publishDate: updatedEntity.publishDate,
          publishers: updatedEntity.publishers,
          bookAuthors: updatedEntity.bookAuthors,
          googleBooksUrl: updatedEntity.googleBooksUrl,
          // Music data
          musicBrainzId: updatedEntity.musicBrainzId,
          albumArtUrl: updatedEntity.albumArtUrl,
          musicArtists: updatedEntity.musicArtists,
          musicReleaseDate: updatedEntity.musicReleaseDate,
          trackCount: updatedEntity.trackCount,
          musicType: updatedEntity.musicType,
          musicBrainzUrl: updatedEntity.musicBrainzUrl,
          lastFmUrl: updatedEntity.lastFmUrl,
          // Wikipedia data
          wikipediaPageId: updatedEntity.wikipediaPageId,
          wikipediaExtract: updatedEntity.wikipediaExtract,
          wikipediaImageUrl: updatedEntity.wikipediaImageUrl,
          wikipediaCategories: updatedEntity.wikipediaCategories,
          wikipediaUrl: updatedEntity.wikipediaUrl,
        },
        analysis,
        userRatings: undefined, // No user ratings yet for new entities
      }, {
        headers: rateLimitHeaders
      });
    } catch (error) {
      // Clear generation flag on error
      await prisma.scaryEntity.update({
        where: { googleKgId: entityData.id },
        data: { isGenerating: false }
      });
      throw error;
    }
  } catch (error) {
    console.error('Wiki creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create wiki page' },
      { status: 500 }
    );
  }
}