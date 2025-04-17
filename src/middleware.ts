import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms
const MAX_REQUESTS = 5;

type RateLimitRecord = {
  count: number;
  timestamp: number;
};

const rateLimitStore: Map<string, RateLimitRecord> = new Map();

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname !== "/api/ask") {
    return NextResponse.next(); // Allow other paths
  }

  // Simple auth check - customize this to fit your actual auth system

  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthenticated = Boolean(token);

  if (!isAuthenticated) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized access to /api/ask" }),
      { status: 401 }
    );
  }

  // Use cookie/session-based user ID or fallback to IP
  const identifier = token || "unknown";

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (record) {
    const timePassed = now - record.timestamp;

    if (timePassed < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_REQUESTS) {
        return new NextResponse(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429 }
        );
      } else {
        record.count += 1;
        rateLimitStore.set(identifier, record);
      }
    } else {
      // Reset after time window
      rateLimitStore.set(identifier, { count: 1, timestamp: now });
    }
  } else {
    rateLimitStore.set(identifier, { count: 1, timestamp: now });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/ask"],
};
