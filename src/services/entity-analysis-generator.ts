import { prisma } from '@/lib/prisma';
import { getAIContentGenerator } from './ai-content-generator';
import { knowledgeGraphService } from './knowledge-graph';
import { KnowledgeGraphResult } from './knowledge-graph';

export interface EntityAnalysisData {
  entityId: string;
  googleKgId: string;
  name: string;
  description: string;
  entityType: string;
  imageUrl?: string | null;
  wikipediaExtract?: string | null;
}

export class EntityAnalysisGenerator {
  /**
   * Generate AI analysis for an entity
   * This is shared by both initial creation and regeneration flows
   */
  async generateAnalysis(data: EntityAnalysisData): Promise<boolean> {
    try {
      // Prepare entity data for AI
      const entityData: KnowledgeGraphResult = {
        id: data.googleKgId,
        name: data.name,
        description: data.description || '',
        types: [data.entityType],
        imageUrl: data.imageUrl || undefined,
        detailedDescription: data.wikipediaExtract || undefined,
        score: 1
      };

      // Check if entity is suitable for scary analysis
      if (!knowledgeGraphService.isSuitableForScaryWiki(entityData)) {
        await prisma.scaryEntity.update({
          where: { id: data.entityId },
          data: { isGenerating: false }
        });
        console.log(`Entity ${data.name} is not suitable for scary analysis`);
        return false;
      }

      // Generate scary analysis using AI
      const aiGenerator = getAIContentGenerator();
      const analysis = await aiGenerator.generateScaryAnalysis(entityData);

      // Calculate average AI score
      const averageScore = analysis.dimensionScores.reduce(
        (sum: number, score: { score: number }) => sum + score.score, 0
      ) / analysis.dimensionScores.length;

      // Update entity with analysis
      await prisma.scaryEntity.update({
        where: { id: data.entityId },
        data: {
          isGenerating: false,
          averageAIScore: averageScore,
          analysis: {
            create: {
              whyScary: analysis.whyScary,
              dimensionScores: {
                create: analysis.dimensionScores.map((score: { 
                  dimensionId: string; 
                  score: number; 
                  reasoning: string 
                }) => ({
                  score: score.score,
                  reasoning: score.reasoning,
                  dimension: {
                    connectOrCreate: {
                      where: { 
                        name: score.dimensionId.split('-').map((word: string) => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ') 
                      },
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

      console.log(`Successfully generated analysis for ${data.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to generate analysis for ${data.name}:`, error);
      
      // Mark generation as failed
      await prisma.scaryEntity.update({
        where: { id: data.entityId },
        data: { isGenerating: false }
      });
      
      return false;
    }
  }

  /**
   * Check if an entity needs regeneration and start it if needed
   * Returns true if regeneration was started, false otherwise
   */
  async checkAndRegenerateIfNeeded(entity: any): Promise<boolean> {
    // Skip if already has analysis
    if (entity.analysis) {
      return false;
    }

    // Check if generation is stale (more than 5 minutes old)
    const isStale = entity.isGenerating && 
      entity.updatedAt && 
      new Date().getTime() - new Date(entity.updatedAt).getTime() > 5 * 60 * 1000;
    
    // Check if entity has no analysis and is not generating (failed suitability check)
    const needsRegeneration = isStale || (!entity.isGenerating && !entity.analysis);
    
    if (!needsRegeneration) {
      return false;
    }

    console.log(`${isStale ? 'Stale generation' : 'Failed entity'} detected for ${entity.name}, regenerating...`);
    
    // Update to reset generation timestamp
    await prisma.scaryEntity.update({
      where: { id: entity.id },
      data: { 
        isGenerating: true,
        updatedAt: new Date()
      }
    });

    // Kick off async generation (don't await)
    this.generateAnalysis({
      entityId: entity.id,
      googleKgId: entity.googleKgId,
      name: entity.name,
      description: entity.description,
      entityType: entity.entityType,
      imageUrl: entity.imageUrl,
      wikipediaExtract: entity.wikipediaExtract
    }).catch(error => console.error(`Regeneration failed for ${entity.name}:`, error));

    return true;
  }
}

// Export singleton instance
export const entityAnalysisGenerator = new EntityAnalysisGenerator();