import { prisma } from './prisma';

/**
 * Convert a string to a URL-friendly slug
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug for an entity
 * If the base slug already exists, try to make it more specific
 */
export async function generateUniqueSlug(
  name: string, 
  description?: string,
  entityType?: string,
  year?: string
): Promise<string> {
  // Create base slug from name
  let baseSlug = createSlug(name);
  
  // If slug is empty or too short, use name and description
  if (baseSlug.length < 3 && description) {
    baseSlug = createSlug(`${name} ${description}`);
  }
  
  // If still too short, add a default suffix
  if (baseSlug.length < 3) {
    baseSlug = `entity-${baseSlug}`;
  }
  
  // Check if slug already exists
  let slug = baseSlug;
  
  const existing = await prisma.scaryEntity.findUnique({
    where: { slug },
    select: { id: true, name: true, entityType: true }
  });
  
  if (!existing) {
    return slug;
  }
  
  // Try different strategies to make the slug unique
  const strategies = [];
  
  // Strategy 1: Add description if available
  if (description && description.toLowerCase() !== 'thing') {
    const descSlug = createSlug(description);
    if (descSlug) {
      strategies.push(`${baseSlug}-${descSlug}`);
    }
  }
  
  // Strategy 2: Add entity type if different from existing
  if (entityType && existing.entityType !== entityType) {
    const typeSlug = createSlug(entityType);
    if (typeSlug) {
      strategies.push(`${baseSlug}-${typeSlug}`);
    }
  }
  
  // Strategy 3: Add year if available (common for movies/books)
  if (year) {
    strategies.push(`${baseSlug}-${year}`);
  }
  
  // Strategy 4: Combine description and year if both available
  if (description && year) {
    const descSlug = createSlug(description);
    if (descSlug) {
      strategies.push(`${baseSlug}-${descSlug}-${year}`);
    }
  }
  
  // Try each strategy
  for (const candidateSlug of strategies) {
    const exists = await prisma.scaryEntity.findUnique({
      where: { slug: candidateSlug },
      select: { id: true }
    });
    
    if (!exists) {
      return candidateSlug;
    }
  }
  
  // If all strategies fail, fall back to numbering
  let counter = 2;
  while (true) {
    slug = `${baseSlug}-${counter}`;
    
    const exists = await prisma.scaryEntity.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!exists) {
      return slug;
    }
    
    counter++;
  }
}