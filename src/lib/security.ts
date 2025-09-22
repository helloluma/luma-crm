import { NextRequest } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import rateLimit from 'express-rate-limit';
import { headers } from 'next/headers';

// Input sanitization utilities
export class SecurityUtils {
  /**
   * Sanitize HTML input to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Sanitize text input by removing potentially dangerous characters
   */
  static sanitizeText(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags completely
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize email addresses
   */
  static sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.toLowerCase().trim();
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  /**
   * Sanitize phone numbers
   */
  static sanitizePhone(phone: string): string {
    return phone
      .replace(/<[^>]*>/g, '') // Remove HTML tags first
      .replace(/[^\d+\-\s()]/g, '') // Keep only valid phone characters
      .replace(/\(\)/g, '') // Remove empty parentheses
      .trim();
  }

  /**
   * Validate and sanitize numeric inputs
   */
  static sanitizeNumber(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid number format');
    }
    
    return num;
  }

  /**
   * Generate secure random tokens
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Validate file uploads for security
   */
  static validateFileUpload(file: File): void {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    if (file.size > maxSize) {
      throw new Error('File size exceeds limit');
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      throw new Error('File extension not allowed');
    }
  }
}

// CSRF Protection utilities
export class CSRFProtection {
  private static readonly CSRF_TOKEN_HEADER = 'x-csrf-token';
  private static readonly CSRF_COOKIE_NAME = 'csrf-token';

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return SecurityUtils.generateSecureToken(32);
  }

  /**
   * Validate CSRF token from request
   */
  static validateToken(request: NextRequest): boolean {
    const headerToken = request.headers.get(this.CSRF_TOKEN_HEADER);
    const cookieToken = request.cookies.get(this.CSRF_COOKIE_NAME)?.value;

    if (!headerToken || !cookieToken) {
      return false;
    }

    return headerToken === cookieToken;
  }

  /**
   * Set secure headers for responses
   */
  static getSecureHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://api.supabase.co wss://realtime.supabase.co",
        "frame-ancestors 'none'"
      ].join('; '),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
}

// Rate limiting configuration
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 uploads per minute
    message: 'Too many file uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

// IP-based rate limiting store (in-memory for development)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimitStore = new RateLimitStore();

// Clean up expired entries every 5 minutes
setInterval(() => {
  rateLimitStore.cleanup();
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware for API routes
 */
export function createRateLimit(config: typeof rateLimitConfig.general) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = `rate_limit:${ip}`;
    
    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);
    
    if (count > config.max) {
      return {
        blocked: true,
        resetTime,
        remaining: 0
      };
    }

    return {
      blocked: false,
      resetTime,
      remaining: config.max - count
    };
  };
}