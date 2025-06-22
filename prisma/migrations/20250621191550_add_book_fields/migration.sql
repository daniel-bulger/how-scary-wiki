-- AlterTable
ALTER TABLE "scary_entities" ADD COLUMN     "bookAuthors" TEXT[],
ADD COLUMN     "bookCoverUrl" TEXT,
ADD COLUMN     "isbn10" TEXT,
ADD COLUMN     "isbn13" TEXT,
ADD COLUMN     "openLibraryKey" TEXT,
ADD COLUMN     "openLibraryUrl" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "publishDate" TEXT,
ADD COLUMN     "publishers" TEXT[];
