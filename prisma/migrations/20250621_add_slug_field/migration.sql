-- Add slug field to scary_entities
ALTER TABLE "scary_entities" ADD COLUMN "slug" TEXT;

-- Update existing entities with slugs based on their names
UPDATE "scary_entities" 
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(name),
        '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
      ),
      '\s+', '-', 'g'  -- Replace spaces with hyphens
    ),
    '-+', '-', 'g'  -- Replace multiple hyphens with single
  )
) || '-' || id  -- Append ID to ensure uniqueness for existing records
WHERE "slug" IS NULL;

-- Make slug NOT NULL and UNIQUE after populating
ALTER TABLE "scary_entities" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "scary_entities" ADD CONSTRAINT "scary_entities_slug_key" UNIQUE ("slug");