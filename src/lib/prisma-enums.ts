// Runtime-safe enum accessors for when Prisma client might not be generated yet

export const UserRoleEnum = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN'
} as const;

export const ModeratorActionEnum = {
  EDIT_DESCRIPTION: 'EDIT_DESCRIPTION',
  EDIT_POSTER_URL: 'EDIT_POSTER_URL',
  EDIT_AI_SUMMARY: 'EDIT_AI_SUMMARY',
  TRIGGER_INTEGRATION: 'TRIGGER_INTEGRATION',
  REGENERATE_ANALYSIS: 'REGENERATE_ANALYSIS',
  EDIT_DIMENSION_SCORE: 'EDIT_DIMENSION_SCORE',
  DELETE_ENTITY: 'DELETE_ENTITY',
  MERGE_ENTITIES: 'MERGE_ENTITIES',
  EDIT_METADATA: 'EDIT_METADATA'
} as const;

// Helper to get enum values safely
export function getUserRole() {
  try {
    // Try to import from Prisma client
    const { UserRole } = require('@prisma/client');
    return UserRole;
  } catch {
    // Fallback to local definition
    return UserRoleEnum;
  }
}

export function getModeratorAction() {
  try {
    // Try to import from Prisma client
    const { ModeratorAction } = require('@prisma/client');
    return ModeratorAction;
  } catch {
    // Fallback to local definition
    return ModeratorActionEnum;
  }
}