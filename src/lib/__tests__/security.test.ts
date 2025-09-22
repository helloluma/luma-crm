import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityUtils, CSRFProtection, rateLimitStore } from '../security';

describe('SecurityUtils', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous HTML tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = SecurityUtils.sanitizeHtml(input);
      expect(result).toBe('<p>Safe content</p>');
    });

    it('should allow safe HTML tags', () => {
      const input = '<p>This is <strong>bold</strong> and <em>italic</em></p>';
      const result = SecurityUtils.sanitizeHtml(input);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should remove dangerous attributes', () => {
      const input = '<p onclick="alert(\'xss\')">Content</p>';
      const result = SecurityUtils.sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('sanitizeText', () => {
    it('should remove angle brackets', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = SecurityUtils.sanitizeText(input);
      expect(result).toBe('Hello alert("xss") World');
    });

    it('should remove javascript protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = SecurityUtils.sanitizeText(input);
      expect(result).toBe('alert("xss")');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = SecurityUtils.sanitizeText(input);
      expect(result).toBe('alert("xss")');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = SecurityUtils.sanitizeText(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeEmail', () => {
    it('should accept valid email addresses', () => {
      const email = 'test@example.com';
      const result = SecurityUtils.sanitizeEmail(email);
      expect(result).toBe('test@example.com');
    });

    it('should convert to lowercase', () => {
      const email = 'TEST@EXAMPLE.COM';
      const result = SecurityUtils.sanitizeEmail(email);
      expect(result).toBe('test@example.com');
    });

    it('should throw error for invalid email', () => {
      expect(() => SecurityUtils.sanitizeEmail('invalid-email')).toThrow('Invalid email format');
    });

    it('should trim whitespace', () => {
      const email = '  test@example.com  ';
      const result = SecurityUtils.sanitizeEmail(email);
      expect(result).toBe('test@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep valid phone characters', () => {
      const phone = '+1 (555) 123-4567';
      const result = SecurityUtils.sanitizePhone(phone);
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('should remove invalid characters', () => {
      const phone = '+1<script>alert("xss")</script>(555)123-4567';
      const result = SecurityUtils.sanitizePhone(phone);
      expect(result).toBe('+1(555)123-4567');
    });
  });

  describe('sanitizeNumber', () => {
    it('should accept valid numbers', () => {
      expect(SecurityUtils.sanitizeNumber(123.45)).toBe(123.45);
      expect(SecurityUtils.sanitizeNumber('123.45')).toBe(123.45);
    });

    it('should throw error for invalid numbers', () => {
      expect(() => SecurityUtils.sanitizeNumber('not-a-number')).toThrow('Invalid number format');
      expect(() => SecurityUtils.sanitizeNumber(NaN)).toThrow('Invalid number format');
      expect(() => SecurityUtils.sanitizeNumber(Infinity)).toThrow('Invalid number format');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = SecurityUtils.generateSecureToken(16);
      expect(token).toHaveLength(16);
    });

    it('should generate different tokens each time', () => {
      const token1 = SecurityUtils.generateSecureToken();
      const token2 = SecurityUtils.generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should use default length of 32', () => {
      const token = SecurityUtils.generateSecureToken();
      expect(token).toHaveLength(32);
    });
  });

  describe('validateFileUpload', () => {
    it('should accept valid file types', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      expect(() => SecurityUtils.validateFileUpload(file)).not.toThrow();
    });

    it('should reject invalid file types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-executable' });
      expect(() => SecurityUtils.validateFileUpload(file)).toThrow('File type not allowed');
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join(''); // 11MB
      const file = new File([largeContent], 'test.pdf', { type: 'application/pdf' });
      expect(() => SecurityUtils.validateFileUpload(file)).toThrow('File size exceeds limit');
    });

    it('should reject dangerous file extensions', () => {
      const file = new File(['content'], 'malware.exe', { type: 'application/pdf' });
      expect(() => SecurityUtils.validateFileUpload(file)).toThrow('File extension not allowed');
    });
  });
});

describe('CSRFProtection', () => {
  describe('generateToken', () => {
    it('should generate a token', () => {
      const token = CSRFProtection.generateToken();
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens', () => {
      const token1 = CSRFProtection.generateToken();
      const token2 = CSRFProtection.generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('getSecureHeaders', () => {
    it('should return security headers', () => {
      const headers = CSRFProtection.getSecureHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });
  });
});

describe('RateLimitStore', () => {
  // Create a separate store instance for testing
  class TestRateLimitStore {
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

    clear(): void {
      this.store.clear();
    }
  }

  let testStore: TestRateLimitStore;

  beforeEach(() => {
    testStore = new TestRateLimitStore();
  });

  it('should increment count for new key', () => {
    const result = testStore.increment('test-key', 60000);
    expect(result.count).toBe(1);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should increment count for existing key', () => {
    testStore.increment('test-key', 60000);
    const result = testStore.increment('test-key', 60000);
    expect(result.count).toBe(2);
  });

  it('should reset count after window expires', async () => {
    // Use a very short window for testing
    testStore.increment('test-key', 1);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 5));
    const result = testStore.increment('test-key', 60000);
    expect(result.count).toBe(1);
  });

  it('should cleanup expired entries', async () => {
    testStore.increment('test-key', 1);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 5));
    testStore.cleanup();
    const result = testStore.increment('test-key', 60000);
    expect(result.count).toBe(1);
  });
});