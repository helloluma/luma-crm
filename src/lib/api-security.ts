import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SecurityUtils, CSRFProtection } from './security';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export interface SecurityValidationOptions {
  requireAuth?: boolean;
  requireCSRF?: boolean;
  allowedMethods?: string[];
  requireRole?: string[];
  sanitizeBody?: boolean;
}

/**
 * Security wrapper for API routes
 */
export function withSecurity(
  handler: (
    request: NextRequest,
    context: { params?: any; user?: AuthenticatedUser }
  ) => Promise<NextResponse>,
  options: SecurityValidationOptions = {}
) {
  return async (request: NextRequest, context: { params?: any }) => {
    const {
      requireAuth = true,
      requireCSRF = true,
      allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
      requireRole = [],
      sanitizeBody = true
    } = options;

    try {
      // Method validation
      if (!allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // CSRF validation for state-changing operations
      if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        if (!CSRFProtection.validateToken(request)) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      let user: AuthenticatedUser | undefined;

      // Authentication validation
      if (requireAuth) {
        const authResult = await validateAuthentication(request);
        if (!authResult.success) {
          return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
          );
        }
        user = authResult.user;

        // Role validation
        if (requireRole.length > 0 && user?.role) {
          if (!requireRole.includes(user.role)) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
      }

      // Body sanitization
      if (sanitizeBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          const sanitizedBody = sanitizeRequestBody(body);
          
          // Create new request with sanitized body
          const sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(sanitizedBody)
          });

          return await handler(sanitizedRequest, { ...context, user });
        } catch (error) {
          // If body parsing fails, continue with original request
          return await handler(request, { ...context, user });
        }
      }

      return await handler(request, { ...context, user });
    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validate authentication from request
 */
async function validateAuthentication(request: NextRequest): Promise<{
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header',
      status: 401
    };
  }

  const token = authHeader.substring(7);
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
        status: 401
      };
    }

    // Get user profile for role information
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: profile?.role
      }
    };
  } catch (error) {
    console.error('Authentication validation error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}

/**
 * Sanitize request body recursively
 */
function sanitizeRequestBody(body: any): any {
  if (typeof body === 'string') {
    return SecurityUtils.sanitizeText(body);
  }
  
  if (typeof body === 'number' || typeof body === 'boolean') {
    return body;
  }
  
  if (Array.isArray(body)) {
    return body.map(item => sanitizeRequestBody(item));
  }
  
  if (body && typeof body === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(body)) {
      // Sanitize key
      const sanitizedKey = SecurityUtils.sanitizeText(key);
      
      // Special handling for known fields
      if (key === 'email' && typeof value === 'string') {
        try {
          sanitized[sanitizedKey] = SecurityUtils.sanitizeEmail(value);
        } catch {
          sanitized[sanitizedKey] = value; // Keep original if validation fails
        }
      } else if (key === 'phone' && typeof value === 'string') {
        sanitized[sanitizedKey] = SecurityUtils.sanitizePhone(value);
      } else if ((key.includes('price') || key.includes('commission') || key.includes('amount')) && 
                 (typeof value === 'string' || typeof value === 'number')) {
        try {
          sanitized[sanitizedKey] = SecurityUtils.sanitizeNumber(value);
        } catch {
          sanitized[sanitizedKey] = value; // Keep original if validation fails
        }
      } else {
        sanitized[sanitizedKey] = sanitizeRequestBody(value);
      }
    }
    
    return sanitized;
  }
  
  return body;
}

/**
 * Validate file upload security
 */
export async function validateFileUpload(request: NextRequest): Promise<{
  success: boolean;
  error?: string;
  file?: File;
}> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided'
      };
    }

    SecurityUtils.validateFileUpload(file);
    
    return {
      success: true,
      file
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File validation failed'
    };
  }
}

/**
 * Create secure response with headers
 */
export function createSecureResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Add security headers
  const secureHeaders = CSRFProtection.getSecureHeaders();
  Object.entries(secureHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Log security events
 */
export function logSecurityEvent(event: {
  type: 'auth_failure' | 'csrf_violation' | 'rate_limit' | 'file_upload_blocked' | 'suspicious_activity';
  ip?: string;
  userAgent?: string;
  userId?: string;
  details?: any;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  
  // In production, this should be sent to a proper logging service
  console.warn('Security Event:', JSON.stringify(logEntry));
  
  // TODO: Integrate with logging service (e.g., Winston, Datadog, etc.)
}