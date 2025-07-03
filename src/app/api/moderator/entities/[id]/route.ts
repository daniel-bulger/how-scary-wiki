import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';
import { getModeratorAction } from '@/lib/prisma-enums';
import { entityAnalysisGenerator } from '@/services/entity-analysis-generator';
import { integrationProcessor } from '@/services/integrations/processor';

export const dynamic = 'force-dynamic';

// PATCH /api/moderator/entities/[id] - Update entity fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireModerator(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id: entityId } = await params;
    const updates = await request.json();
    
    // Get current entity state for logging
    const currentEntity = await prisma.scaryEntity.findUnique({
      where: { id: entityId },
      include: {
        analysis: true
      }
    });
    
    if (!currentEntity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }
    
    const updateData: any = {};
    const logDetails: any = { changes: {} };
    
    // Handle description update
    if (updates.description !== undefined && updates.description !== currentEntity.description) {
      updateData.description = updates.description;
      logDetails.changes.description = {
        before: currentEntity.description,
        after: updates.description
      };
    }
    
    // Handle poster URL update
    if (updates.posterUrl !== undefined && updates.posterUrl !== currentEntity.posterUrl) {
      updateData.posterUrl = updates.posterUrl;
      logDetails.changes.posterUrl = {
        before: currentEntity.posterUrl,
        after: updates.posterUrl
      };
    }
    
    // Handle image URL update
    if (updates.imageUrl !== undefined && updates.imageUrl !== currentEntity.imageUrl) {
      updateData.imageUrl = updates.imageUrl;
      logDetails.changes.imageUrl = {
        before: currentEntity.imageUrl,
        after: updates.imageUrl
      };
    }
    
    // Update entity
    const updatedEntity = await prisma.scaryEntity.update({
      where: { id: entityId },
      data: updateData
    });
    
    // Log the moderation action
    if (Object.keys(logDetails.changes).length > 0) {
      await prisma.moderatorLog.create({
        data: {
          userId: authResult.dbUser.id,
          entityId: entityId,
          action: getModeratorAction().EDIT_METADATA,
          details: {
            ...logDetails,
            performedBy: authResult.dbUser.email,
            timestamp: new Date().toISOString()
          }
        }
      });
    }
    
    return NextResponse.json({
      entity: updatedEntity,
      message: 'Entity updated successfully'
    });
  } catch (error) {
    console.error('Failed to update entity:', error);
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    );
  }
}

// POST /api/moderator/entities/[id]/edit-summary - Edit AI summary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireModerator(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const { id: entityId } = await params;
  
  if (action === 'edit-summary') {
    return handleEditSummary(request, entityId, authResult);
  } else if (action === 'trigger-integration') {
    return handleTriggerIntegration(request, entityId, authResult);
  } else if (action === 'regenerate-analysis') {
    return handleRegenerateAnalysis(request, entityId, authResult);
  }
  
  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}

// Handle AI summary editing
async function handleEditSummary(
  request: NextRequest,
  entityId: string,
  authResult: any
) {
  try {
    const { whyScary, dimensionScores } = await request.json();
    
    if (!whyScary) {
      return NextResponse.json(
        { error: 'whyScary is required' },
        { status: 400 }
      );
    }
    
    // Get current analysis
    const currentAnalysis = await prisma.scaryAnalysis.findUnique({
      where: { entityId },
      include: {
        dimensionScores: {
          include: {
            dimension: true
          }
        }
      }
    });
    
    if (!currentAnalysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }
    
    // Store original if this is the first edit
    const updateData: any = {
      whyScary,
      isHumanEdited: true,
      lastEditedById: authResult.dbUser.id,
      lastEditedAt: new Date()
    };
    
    if (!currentAnalysis.whyScaryOriginal) {
      updateData.whyScaryOriginal = currentAnalysis.whyScary;
    }
    
    // Update analysis
    const updatedAnalysis = await prisma.scaryAnalysis.update({
      where: { id: currentAnalysis.id },
      data: updateData
    });
    
    // Update dimension scores if provided
    if (dimensionScores && Array.isArray(dimensionScores)) {
      for (const score of dimensionScores) {
        const dimensionScore = currentAnalysis.dimensionScores.find(
          ds => ds.dimension.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === score.dimensionId
        );
        
        if (dimensionScore) {
          await prisma.analysisDimensionScore.update({
            where: { id: dimensionScore.id },
            data: {
              score: score.score,
              reasoning: score.reasoning
            }
          });
        }
      }
    }
    
    // Log the action
    await prisma.moderatorLog.create({
      data: {
        userId: authResult.dbUser.id,
        entityId: entityId,
        action: getModeratorAction().EDIT_AI_SUMMARY,
        details: {
          originalSummary: currentAnalysis.whyScary,
          newSummary: whyScary,
          dimensionScoresEdited: dimensionScores ? dimensionScores.length : 0,
          performedBy: authResult.dbUser.email,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    // Fetch the complete analysis with dimension scores
    const completeAnalysis = await prisma.scaryAnalysis.findUnique({
      where: { id: currentAnalysis.id },
      include: {
        dimensionScores: {
          include: {
            dimension: true
          }
        }
      }
    });
    
    // Format the response to match frontend expectations
    const formattedAnalysis = {
      whyScary: completeAnalysis!.whyScary,
      isHumanEdited: completeAnalysis!.isHumanEdited,
      dimensionScores: completeAnalysis!.dimensionScores.map((score: any) => ({
        dimensionId: score.dimension.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        score: score.score,
        reasoning: score.reasoning
      }))
    };
    
    return NextResponse.json({
      analysis: formattedAnalysis,
      message: 'AI summary updated successfully'
    });
  } catch (error) {
    console.error('Failed to update AI summary:', error);
    return NextResponse.json(
      { error: 'Failed to update AI summary' },
      { status: 500 }
    );
  }
}

// Handle integration triggering
async function handleTriggerIntegration(
  request: NextRequest,
  entityId: string,
  authResult: any
) {
  try {
    const { integration, integrationId } = await request.json();
    
    if (!integration) {
      return NextResponse.json(
        { error: 'integration name is required' },
        { status: 400 }
      );
    }
    
    // Get entity with current data
    const entity = await prisma.scaryEntity.findUnique({
      where: { id: entityId }
    });
    
    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }
    
    // Create KnowledgeGraphResult from entity
    const kgEntity = {
      id: entity.googleKgId,
      name: entity.name,
      description: entity.description,
      types: [entity.entityType],
      imageUrl: entity.imageUrl || undefined,
      score: 1
    };
    
    // Create integration request with appropriate hints for manual trigger
    const hints: Record<string, any> = {
      // For Wikipedia
      articleTitle: entity.name,
      // For Google Books  
      author: undefined, // Will use fallback extraction
      // For MusicBrainz
      artist: undefined, // Will use fallback extraction
    };
    
    // If a specific ID was provided, add it to hints
    if (integrationId) {
      switch (integration) {
        case 'tmdb':
          hints.tmdbId = integrationId;
          break;
        case 'wikipedia':
          // Check if it's a numeric ID or a page title
          if (/^\d+$/.test(integrationId)) {
            hints.wikipediaPageId = integrationId;
          } else {
            hints.wikipediaTitle = integrationId;
          }
          break;
        case 'googleBooks':
          hints.googleBooksId = integrationId;
          break;
        case 'musicbrainz':
          hints.musicBrainzId = integrationId;
          break;
      }
    }
    
    const integrationRequest = {
      integration: integration,
      confidence: 1.0, // Full confidence since it's manually triggered
      reasoning: 'Manually triggered by moderator', // Required field
      hints: hints // Note: 'hints' not 'hint'
    };
    
    // Process the integration
    const integrationData = await integrationProcessor.processIntegrations(
      kgEntity,
      [integrationRequest]
    );
    
    // Update entity with new integration data
    await prisma.scaryEntity.update({
      where: { id: entityId },
      data: integrationData
    });
    
    // Log the action
    await prisma.moderatorLog.create({
      data: {
        userId: authResult.dbUser.id,
        entityId: entityId,
        action: getModeratorAction().TRIGGER_INTEGRATION,
        details: JSON.parse(JSON.stringify({
          integration: integration,
          integrationData: integrationData,
          performedBy: authResult.dbUser.email,
          timestamp: new Date().toISOString()
        }))
      }
    });
    
    return NextResponse.json({
      integrationData,
      message: `${integration} integration triggered successfully`
    });
  } catch (error) {
    console.error('Failed to trigger integration:', error);
    return NextResponse.json(
      { error: 'Failed to trigger integration' },
      { status: 500 }
    );
  }
}

// Handle analysis regeneration
async function handleRegenerateAnalysis(
  request: NextRequest,
  entityId: string,
  authResult: any
) {
  try {
    const entity = await prisma.scaryEntity.findUnique({
      where: { id: entityId },
      include: {
        analysis: true
      }
    });
    
    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }
    
    // Delete existing analysis
    if (entity.analysis) {
      await prisma.scaryAnalysis.delete({
        where: { id: entity.analysis.id }
      });
    }
    
    // Regenerate analysis
    const analysisSuccessful = await entityAnalysisGenerator.generateAnalysis({
      entityId: entity.id,
      googleKgId: entity.googleKgId,
      name: entity.name,
      description: entity.description,
      entityType: entity.entityType,
      imageUrl: entity.imageUrl,
      wikipediaExtract: entity.wikipediaExtract
    });
    
    if (!analysisSuccessful) {
      return NextResponse.json(
        { error: 'Failed to regenerate analysis' },
        { status: 500 }
      );
    }
    
    // Log the action
    await prisma.moderatorLog.create({
      data: {
        userId: authResult.dbUser.id,
        entityId: entityId,
        action: getModeratorAction().REGENERATE_ANALYSIS,
        details: {
          reason: 'Manual regeneration by moderator',
          performedBy: authResult.dbUser.email,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    // Fetch the updated analysis
    const updatedEntity = await prisma.scaryEntity.findUnique({
      where: { id: entityId },
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
    
    return NextResponse.json({
      entity: updatedEntity,
      message: 'Analysis regenerated successfully'
    });
  } catch (error) {
    console.error('Failed to regenerate analysis:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate analysis' },
      { status: 500 }
    );
  }
}

// GET /api/moderator/entities/[id]/history - Get moderation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireModerator(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id: entityId } = await params;
    const logs = await prisma.moderatorLog.findMany({
      where: { entityId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch moderation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation history' },
      { status: 500 }
    );
  }
}