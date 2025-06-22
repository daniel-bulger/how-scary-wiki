// Simple in-memory rate limiting for entity creation
// In production, consider using Redis for distributed rate limiting

type RateLimitEntry = {
  timestamps: number[];
  lastCleanup: number;
};

// Store rate limit data per user
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up old entries every 5 minutes

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    // Remove entries that haven't been used in the last hour
    if (now - entry.lastCleanup > 60 * 60 * 1000) {
      rateLimitStore.delete(userId);
    }
  }
}, CLEANUP_INTERVAL);

export async function checkEntityCreationLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Get or create entry for this user
  let entry = rateLimitStore.get(userId);
  if (!entry) {
    entry = { timestamps: [], lastCleanup: now };
    rateLimitStore.set(userId, entry);
  }

  // Update last cleanup time
  entry.lastCleanup = now;

  // Filter out timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(timestamp => timestamp > windowStart);

  // Check if limit is exceeded
  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = Math.min(...entry.timestamps);
    const resetAt = oldestTimestamp + RATE_LIMIT_WINDOW;
    const retryAfter = Math.ceil((resetAt - now) / 1000); // seconds until retry

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  // Add current timestamp
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - entry.timestamps.length,
    resetAt: now + RATE_LIMIT_WINDOW,
  };
}

// Helper to reset rate limit for a user (useful for testing or admin actions)
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}