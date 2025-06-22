import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name,
        },
      });
    }

    const { entityId, ratings } = await request.json();

    if (!entityId || !ratings || !Array.isArray(ratings)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Create or update ratings
    const ratingPromises = ratings.map(async (rating: { dimensionId: string; score: number }) => {
      // Convert dimension slug to dimension name for lookup
      const dimensionName = rating.dimensionId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      // Find the dimension in the database
      const dimension = await prisma.scaryDimension.findUnique({
        where: { name: dimensionName }
      });
      
      if (!dimension) {
        throw new Error(`Dimension not found: ${dimensionName}`);
      }
      
      return prisma.scaryRating.upsert({
        where: {
          entityId_dimensionId_userId: {
            entityId,
            dimensionId: dimension.id,
            userId: user.id,
          },
        },
        update: {
          score: rating.score,
        },
        create: {
          entityId,
          dimensionId: dimension.id,
          userId: user.id,
          score: rating.score,
        },
      });
    });

    await Promise.all(ratingPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rating submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit ratings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get('entityId');

    if (!entityId) {
      return NextResponse.json(
        { error: 'Entity ID is required' },
        { status: 400 }
      );
    }

    const ratings = await prisma.scaryRating.findMany({
      where: { entityId },
      include: {
        dimension: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate average ratings per dimension
    const averageRatings = ratings.reduce((acc, rating) => {
      const dimensionId = rating.dimensionId;
      if (!acc[dimensionId]) {
        acc[dimensionId] = {
          dimensionId,
          dimensionName: rating.dimension.name,
          scores: [],
          average: 0,
          count: 0,
        };
      }
      acc[dimensionId].scores.push(rating.score);
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.values(averageRatings).forEach((dimension: any) => {
      dimension.average = dimension.scores.reduce((sum: number, score: number) => sum + score, 0) / dimension.scores.length;
      dimension.count = dimension.scores.length;
      delete dimension.scores; // Don't send individual scores to client
    });

    return NextResponse.json({
      ratings: Object.values(averageRatings),
    });
  } catch (error) {
    console.error('Ratings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}