import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { withSecurity, validateFileUpload, createSecureResponse, logSecurityEvent } from '../api-security';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
}));

// Mock security utilities
vi.mock('../security', () => ({
  SecurityUtils: {
    sanitizeText: vi.fn((text) => text),
    sanitizeEmail: vi.fn((email) => email),
    sanitizePhone: vi.fn((phone) => phone),
    sanitizeNumber: vi.fn((num) => typeof num === 'string' ? parseFloat(num) : num),
    validateFileUpload: vi.fn()
  },
  CSRFProtection: {
    validateToken: vi.fn(() => true),
    getSecureHeaders: vi.fn(() => ({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }))
  }
}));

describe('withSecurity', () => {
  const mockHandler = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('should reject disallowed methods', async () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'PATCH'
    });

    const securedHandler = withSecurity(mockHandler, {
      allowedMethods: ['GET', 'POST']
    });

    const response = await securedHandler(request, {});
    expect(response.status).toBe(405);
    
    const body = await response.json();
    expect(body.error).toBe('Method not allowed');
  });

  it('should allow permitted methods', async () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET'
    });

    mockHandler.mockResolvedValue(new Response('OK'));

    const securedHandler = withSecurity(mockHandler, {
      requireAuth: false,
      requireCSRF: false,
      allowedMethods: ['GET']
    });

    await securedHandler(request, {});
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should validate CSRF token for state-changing operations', async () => {
    const { CSRFProtection } = await import('../security');
    vi.mocked(CSRFProtection.validateToken).mockReturnValue(false);

    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST'
    });

    const securedHandler = withSecurity(mockHandler, {
      requireAuth: false,
      requireCSRF: true
    });

    const response = await securedHandler(request, {});
    expect(response.status).toBe(403);
    
    const body = await response.json();
    expect(body.error).toBe('Invalid CSRF token');
  });

  it('should require authentication when specified', async () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET'
    });

    const securedHandler = withSecurity(mockHandler, {
      requireAuth: true,
      requireCSRF: false
    });

    const response = await securedHandler(request, {});
    expect(response.status).toBe(401);
  });

  it('should sanitize request body', async () => {
    const requestBody = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      price: '100.50'
    };

    const request = new NextRequest('https://example.com/api/test', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    mockHandler.mockResolvedValue(new Response('OK'));

    const securedHandler = withSecurity(mockHandler, {
      requireAuth: false,
      requireCSRF: false,
      sanitizeBody: true
    });

    await securedHandler(request, {});
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const request = new NextRequest('https://example.com/api/test', {
      method: 'GET'
    });

    mockHandler.mockRejectedValue(new Error('Handler error'));

    const securedHandler = withSecurity(mockHandler, {
      requireAuth: false,
      requireCSRF: false
    });

    const response = await securedHandler(request, {});
    expect(response.status).toBe(500);
    
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
  });
});

describe('validateFileUpload', () => {
  it('should validate file upload successfully', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock the request.formData() method
    const mockFormData = new FormData();
    mockFormData.append('file', file);
    
    const request = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { SecurityUtils } = await import('../security');
    vi.mocked(SecurityUtils.validateFileUpload).mockImplementation(() => {});

    const result = await validateFileUpload(request);
    
    expect(result.success).toBe(true);
    expect(result.file).toBeDefined();
    expect(SecurityUtils.validateFileUpload).toHaveBeenCalledWith(file);
  });

  it('should handle missing file', async () => {
    const mockFormData = new FormData();
    
    const request = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const result = await validateFileUpload(request);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('No file provided');
  });

  it('should handle file validation errors', async () => {
    const file = new File(['content'], 'test.exe', { type: 'application/x-executable' });
    const mockFormData = new FormData();
    mockFormData.append('file', file);
    
    const request = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as any;

    const { SecurityUtils } = await import('../security');
    vi.mocked(SecurityUtils.validateFileUpload).mockImplementation(() => {
      throw new Error('File type not allowed');
    });

    const result = await validateFileUpload(request);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('File type not allowed');
  });
});

describe('createSecureResponse', () => {
  it('should create response with security headers', () => {
    const data = { message: 'Success' };
    const response = createSecureResponse(data, 200);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('should use default status code', () => {
    const data = { message: 'Success' };
    const response = createSecureResponse(data);
    
    expect(response.status).toBe(200);
  });
});

describe('logSecurityEvent', () => {
  it('should log security events', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const event = {
      type: 'auth_failure' as const,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      details: { reason: 'Invalid token' }
    };

    logSecurityEvent(event);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Security Event:',
      expect.stringContaining('"type":"auth_failure"')
    );
    
    consoleSpy.mockRestore();
  });

  it('should include timestamp in log entry', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const event = {
      type: 'csrf_violation' as const,
      ip: '192.168.1.1'
    };

    logSecurityEvent(event);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Security Event:',
      expect.stringContaining('"timestamp"')
    );
    
    consoleSpy.mockRestore();
  });
});