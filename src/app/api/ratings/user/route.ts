import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const entityId = searchParams.get('entityId');

    if (!entityId) {
      return NextResponse.json(
        { error: 'Entity ID is required' },
        { status: 400 }
      );
    }

    // Get user's ratings for this entity
    const userRatings = await prisma.scaryRating.findMany({
      where: { 
        entityId,
        userId: user.id 
      },
      include: {
        dimension: true,
      },
    });

    const ratings = userRatings.map(rating => ({
      dimensionId: rating.dimensionId,
      dimensionName: rating.dimension.name,
      score: rating.score,
    }));

    return NextResponse.json({
      ratings,
    });
  } catch (error) {
    console.error('User ratings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user ratings' },
      { status: 500 }
    );
  }
}