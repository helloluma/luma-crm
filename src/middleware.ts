import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // In development, skip middleware to avoid edge/runtime issues and speed up DX
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Dynamically import heavier modules only in production
  const [{ CSRFProtection, createRateLimit, rateLimitConfig }, { createClient }] = await Promise.all([
    import('./lib/security'),
    import('@supabase/supabase-js') as any
  ]);

  const response = NextResponse.next();

  // Add security headers to all responses
  const secureHeaders = CSRFProtection.getSecureHeaders();
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip middleware for static files and internal Next.js routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return response;
  }

  // Initialize rate limiters
  const generalRateLimit = createRateLimit(rateLimitConfig.general);
  const authRateLimit = createRateLimit(rateLimitConfig.auth);
  const uploadRateLimit = createRateLimit(rateLimitConfig.upload);

  // Apply rate limiting based on route
  let rateLimitResult;
  if (request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.includes('/login') ||
      request.nextUrl.pathname.includes('/register')) {
    rateLimitResult = authRateLimit(request);
  } else if (request.nextUrl.pathname.includes('/upload') ||
             request.nextUrl.pathname.includes('/documents')) {
    rateLimitResult = uploadRateLimit(request);
  } else if (request.nextUrl.pathname.startsWith('/api/')) {
    rateLimitResult = generalRateLimit(request);
  }

  // Handle rate limiting
  if (rateLimitResult?.blocked) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        resetTime: rateLimitResult.resetTime
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Add rate limit headers
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
  }

  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Skip CSRF for auth endpoints (they have their own protection)
      if (!request.nextUrl.pathname.startsWith('/api/auth/')) {
        if (!CSRFProtection.validateToken(request)) {
          return new NextResponse(
            JSON.stringify({ error: 'Invalid CSRF token' }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                ...secureHeaders
              }
            }
          );
        }
      }
    }
  }

  // Authentication check for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/clients') ||
      request.nextUrl.pathname.startsWith('/calendar') ||
      request.nextUrl.pathname.startsWith('/revenue-analytics')) {

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { createClient: createSbClient } = await import('@supabase/supabase-js');
    const supabase = createSbClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const token = request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Add user info to request headers for API routes
      if (request.nextUrl.pathname.startsWith('/api/')) {
        response.headers.set('x-user-id', user.id);
        response.headers.set('x-user-email', user.email || '');
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // API route authentication
  if (request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/api/auth/') &&
      !request.nextUrl.pathname.startsWith('/api/calendar/public/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};