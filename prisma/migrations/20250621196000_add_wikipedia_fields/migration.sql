-- Add Wikipedia-specific fields to scary_entities
ALTER TABLE "scary_entities" ADD COLUMN "wikipediaPageId" INTEGER;
ALTER TABLE "scary_entities" ADD COLUMN "wikipediaExtract" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "wikipediaImageUrl" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "wikipediaCategories" TEXT[];
ALTER TABLE "scary_entities" ADD COLUMN "wikipediaUrl" TEXT;