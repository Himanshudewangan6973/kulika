// src/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Note: Requires UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN env vars
const redis = (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  : null;

// Different rate limits for different endpoints
const rateLimits = redis ? {
  default: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'),
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  }),
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 h'),
  }),
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
  }),
} : null;

export async function rateLimitMiddleware(request: NextRequest) {
  if (!rateLimits) return NextResponse.next();

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || request.headers.get('x-real-ip') || '127.0.0.1';
  const pathname = request.nextUrl.pathname;

  let limiter = rateLimits.default;

  if (pathname.startsWith('/api/upload')) {
    limiter = rateLimits.upload;
  } else if (pathname.startsWith('/api/auth')) {
    limiter = rateLimits.auth;
  } else if (pathname.startsWith('/api')) {
    limiter = rateLimits.api;
  }

  const { success, remaining } = await limiter.limit(ip);

  if (!success) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', remaining.toString());

  return response;
}
