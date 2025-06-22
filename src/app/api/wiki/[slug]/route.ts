import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Try to find entity by slug first
    let entity = await prisma.scaryEntity.findUnique({
      where: { slug: decodeURIComponent(slug) },
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

    // If not found by slug, try by googleKgId for backwards compatibility
    if (!entity) {
      entity = await prisma.scaryEntity.findUnique({
        where: { googleKgId: decodeURIComponent(slug) },
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
    }

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // If entity exists but analysis is not complete
    if (!entity.analysis) {
      return NextResponse.json(
        { 
          exists: true,
          isGenerating: entity.isGenerating,
          hasAnalysis: false,
          entity: {
            id: entity.googleKgId,
            dbId: entity.id,
            slug: entity.slug,
            name: entity.name,
            description: entity.description,
            types: [entity.entityType],
            imageUrl: entity.imageUrl,
            // Integration data
            posterUrl: entity.posterUrl,
            backdropUrl: entity.backdropUrl,
            releaseDate: entity.releaseDate,
            runtime: entity.runtime,
            homepage: entity.homepage,
            imdbId: entity.imdbId,
            tmdbUrl: entity.tmdbUrl,
            googleBooksId: entity.googleBooksId,
            bookCoverUrl: entity.bookCoverUrl,
            isbn10: entity.isbn10,
            isbn13: entity.isbn13,
            pageCount: entity.pageCount,
            publishDate: entity.publishDate,
            publishers: entity.publishers,
            bookAuthors: entity.bookAuthors,
            googleBooksUrl: entity.googleBooksUrl,
            musicBrainzId: entity.musicBrainzId,
            albumArtUrl: entity.albumArtUrl,
            musicArtists: entity.musicArtists,
            musicReleaseDate: entity.musicReleaseDate,
            trackCount: entity.trackCount,
            musicType: entity.musicType,
            musicBrainzUrl: entity.musicBrainzUrl,
            lastFmUrl: entity.lastFmUrl,
            wikipediaPageId: entity.wikipediaPageId,
            wikipediaExtract: entity.wikipediaExtract,
            wikipediaImageUrl: entity.wikipediaImageUrl,
            wikipediaCategories: entity.wikipediaCategories,
            wikipediaUrl: entity.wikipediaUrl,
          }
        },
        { status: 202 }
      );
    }

    // Format the response
    const analysis = {
      whyScary: entity.analysis.whyScary,
      dimensionScores: entity.analysis.dimensionScores.map((score: any) => ({
        dimensionId: score.dimension.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        score: score.score,
        reasoning: score.reasoning
      }))
    };

    // Calculate user ratings average
    const userRatings = await prisma.scaryRating.findMany({
      where: { entityId: entity.id },
      include: { dimension: true }
    });

    let userRatingsData = undefined;
    if (userRatings.length > 0) {
      const totalScore = userRatings.reduce((sum: number, rating: any) => sum + rating.score, 0);
      const averageScore = totalScore / userRatings.length;
      const uniqueUsers = new Set(userRatings.map((rating: any) => rating.userId)).size;
      
      userRatingsData = {
        averageScore: Math.round(averageScore * 10) / 10,
        totalRatings: uniqueUsers
      };
    }

    return NextResponse.json({
      entity: {
        id: entity.googleKgId,
        dbId: entity.id,
        slug: entity.slug,
        name: entity.name,
        description: entity.description,
        types: [entity.entityType],
        imageUrl: entity.imageUrl,
        // Integration data
        posterUrl: entity.posterUrl,
        backdropUrl: entity.backdropUrl,
        releaseDate: entity.releaseDate,
        runtime: entity.runtime,
        homepage: entity.homepage,
        imdbId: entity.imdbId,
        tmdbUrl: entity.tmdbUrl,
        googleBooksId: entity.googleBooksId,
        bookCoverUrl: entity.bookCoverUrl,
        isbn10: entity.isbn10,
        isbn13: entity.isbn13,
        pageCount: entity.pageCount,
        publishDate: entity.publishDate,
        publishers: entity.publishers,
        bookAuthors: entity.bookAuthors,
        googleBooksUrl: entity.googleBooksUrl,
        musicBrainzId: entity.musicBrainzId,
        albumArtUrl: entity.albumArtUrl,
        musicArtists: entity.musicArtists,
        musicReleaseDate: entity.musicReleaseDate,
        trackCount: entity.trackCount,
        musicType: entity.musicType,
        musicBrainzUrl: entity.musicBrainzUrl,
        lastFmUrl: entity.lastFmUrl,
        wikipediaPageId: entity.wikipediaPageId,
        wikipediaExtract: entity.wikipediaExtract,
        wikipediaImageUrl: entity.wikipediaImageUrl,
        wikipediaCategories: entity.wikipediaCategories,
        wikipediaUrl: entity.wikipediaUrl,
      },
      analysis,
      userRatings: userRatingsData,
    });
  } catch (error) {
    console.error('Wiki lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to load entity data' },
      { status: 500 }
    );
  }
}