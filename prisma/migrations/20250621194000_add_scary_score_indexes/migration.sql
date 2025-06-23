-- Add averageAIScore column to scary_entities
ALTER TABLE "scary_entities" ADD COLUMN "averageAIScore" DOUBLE PRECISION DEFAULT 0;

-- Create index on averageAIScore for efficient sorting
CREATE INDEX "scary_entities_averageAIScore_idx" ON "scary_entities"("averageAIScore");

-- Create indexes on analysis_dimension_scores for efficient queries
CREATE INDEX "analysis_dimension_scores_score_idx" ON "analysis_dimension_scores"("score");
CREATE INDEX "analysis_dimension_scores_analysisId_score_idx" ON "analysis_dimension_scores"("analysisId", "score");

-- Update existing entities with calculated average scores
UPDATE "scary_entities" e
SET "averageAIScore" = (
  SELECT AVG(ads.score)::DOUBLE PRECISION
  FROM "scary_analyses" sa
  JOIN "analysis_dimension_scores" ads ON ads."analysisId" = sa."id"
  WHERE sa."entityId" = e."id"
)
WHERE EXISTS (
  SELECT 1
  FROM "scary_analyses" sa
  WHERE sa."entityId" = e."id"
);