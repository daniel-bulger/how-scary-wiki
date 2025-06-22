import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { entityId } = await request.json();

    if (!entityId) {
      return NextResponse.json(
        { error: 'entityId is required' },
        { status: 400 }
      );
    }

    const entity = await prisma.scaryEntity.findUnique({
      where: { googleKgId: entityId },
      select: {
        id: true,
        isGenerating: true,
        analysis: {
          select: { id: true }
        }
      }
    });

    if (!entity) {
      return NextResponse.json({
        exists: false,
        isGenerating: false,
        hasAnalysis: false
      });
    }

    return NextResponse.json({
      exists: true,
      isGenerating: entity.isGenerating,
      hasAnalysis: !!entity.analysis
    });
  } catch (error) {
    console.error('Entity status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check entity status' },
      { status: 500 }
    );
  }
}