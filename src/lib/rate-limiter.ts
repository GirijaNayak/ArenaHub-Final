import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically prune expired entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.prune(), 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  private prune() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if a request exceeds rate limit
   * @param key Unique key (e.g. IP + endpoint)
   * @param maxRequests Maximum requests allowed within window
   * @param windowMs Time window in milliseconds
   */
  public check(
    key: string,
    maxRequests: number,
    windowMs: number
  ): { success: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: maxRequests - 1, resetInMs: windowMs };
    }

    if (record.count >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetInMs: Math.max(0, record.resetTime - now),
      };
    }

    record.count += 1;
    return {
      success: true,
      remaining: maxRequests - record.count,
      resetInMs: Math.max(0, record.resetTime - now),
    };
  }

  /**
   * Helper to extract client IP from NextRequest
   */
  public getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
    return "127.0.0.1";
  }

  /**
   * Reset store (useful for testing)
   */
  public reset() {
    this.store.clear();
  }
}

export const rateLimiter = new InMemoryRateLimiter();
