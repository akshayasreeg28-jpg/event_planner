import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

interface RateLimitRecord {
  timestamps: number[];
}

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 20; // 20 requests per minute
const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

export function rateLimitAi(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Allow test bypass
  if (req.headers['x-bypass-auth'] === 'test_mode' || process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const clientKey = req.user?.uid || req.ip || req.socket.remoteAddress || 'unknown_client';
  const now = Date.now();

  let record = store.get(clientKey);
  if (!record) {
    record = { timestamps: [] };
    store.set(clientKey, record);
  }

  // Filter timestamps within the 1-minute window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    res.setHeader('Retry-After', retryAfterSeconds);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit reached. Maximum ${maxRequests} AI operations per minute. Please retry in ${retryAfterSeconds} seconds.`,
      },
    });
    return;
  }

  record.timestamps.push(now);
  next();
}
