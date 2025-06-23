-- Add music-specific fields to scary_entities
ALTER TABLE "scary_entities" ADD COLUMN "musicBrainzId" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "albumArtUrl" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "musicArtists" TEXT[];
ALTER TABLE "scary_entities" ADD COLUMN "musicReleaseDate" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "trackCount" INTEGER;
ALTER TABLE "scary_entities" ADD COLUMN "musicType" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "musicBrainzUrl" TEXT;
ALTER TABLE "scary_entities" ADD COLUMN "lastFmUrl" TEXT;