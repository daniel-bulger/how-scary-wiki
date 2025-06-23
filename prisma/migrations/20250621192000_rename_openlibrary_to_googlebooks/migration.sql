-- Rename openLibraryKey to googleBooksId
ALTER TABLE "scary_entities" RENAME COLUMN "openLibraryKey" TO "googleBooksId";

-- Rename openLibraryUrl to googleBooksUrl
ALTER TABLE "scary_entities" RENAME COLUMN "openLibraryUrl" TO "googleBooksUrl";