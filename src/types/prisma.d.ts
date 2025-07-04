// Type declarations for Prisma enums used before Prisma generates them

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export enum ModeratorAction {
  EDIT_DESCRIPTION = 'EDIT_DESCRIPTION',
  EDIT_POSTER_URL = 'EDIT_POSTER_URL',
  EDIT_AI_SUMMARY = 'EDIT_AI_SUMMARY',
  TRIGGER_INTEGRATION = 'TRIGGER_INTEGRATION',
  REGENERATE_ANALYSIS = 'REGENERATE_ANALYSIS',
  EDIT_DIMENSION_SCORE = 'EDIT_DIMENSION_SCORE',
  DELETE_ENTITY = 'DELETE_ENTITY',
  MERGE_ENTITIES = 'MERGE_ENTITIES',
  EDIT_METADATA = 'EDIT_METADATA'
}