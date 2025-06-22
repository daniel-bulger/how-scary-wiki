-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "firebaseUid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scary_entities" (
    "id" TEXT NOT NULL,
    "googleKgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "entityType" TEXT NOT NULL,
    "isGenerating" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tmdbId" INTEGER,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "releaseDate" TEXT,
    "runtime" INTEGER,
    "homepage" TEXT,
    "imdbId" TEXT,
    "tmdbUrl" TEXT,

    CONSTRAINT "scary_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scary_dimensions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scary_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scary_ratings" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "scary_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scary_analyses" (
    "id" TEXT NOT NULL,
    "whyScary" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "scary_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_dimension_scores" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,

    CONSTRAINT "analysis_dimension_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "scary_entities_googleKgId_key" ON "scary_entities"("googleKgId");

-- CreateIndex
CREATE UNIQUE INDEX "scary_dimensions_name_key" ON "scary_dimensions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "scary_ratings_entityId_dimensionId_userId_key" ON "scary_ratings"("entityId", "dimensionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "scary_analyses_entityId_key" ON "scary_analyses"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_dimension_scores_analysisId_dimensionId_key" ON "analysis_dimension_scores"("analysisId", "dimensionId");

-- AddForeignKey
ALTER TABLE "scary_ratings" ADD CONSTRAINT "scary_ratings_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "scary_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scary_ratings" ADD CONSTRAINT "scary_ratings_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "scary_dimensions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scary_ratings" ADD CONSTRAINT "scary_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scary_analyses" ADD CONSTRAINT "scary_analyses_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "scary_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_dimension_scores" ADD CONSTRAINT "analysis_dimension_scores_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "scary_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_dimension_scores" ADD CONSTRAINT "analysis_dimension_scores_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "scary_dimensions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "scary_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
