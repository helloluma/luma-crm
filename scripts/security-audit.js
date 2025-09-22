#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Security audit script for the Real Estate CRM
 * Checks for common security vulnerabilities and best practices
 */

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addIssue(message, severity = 'medium') {
    this.issues.push({ message, severity, timestamp: new Date().toISOString() });
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push({ message, timestamp: new Date().toISOString() });
    this.log(message, 'warning');
  }

  addPassed(message) {
    this.passed.push({ message, timestamp: new Date().toISOString() });
    this.log(message, 'info');
  }

  /**
   * Check for hardcoded secrets and sensitive data
   */
  checkHardcodedSecrets() {
    this.log('Checking for hardcoded secrets...');
    
    const sensitivePatterns = [
      /password\s*=\s*['"][^'"]+['"]/gi,
      /secret\s*=\s*['"][^'"]+['"]/gi,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
      /token\s*=\s*['"][^'"]+['"]/gi,
      /sk_live_[a-zA-Z0-9]+/gi,
      /pk_live_[a-zA-Z0-9]+/gi,
      /AKIA[0-9A-Z]{16}/gi, // AWS Access Key
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi // UUIDs that might be secrets
    ];

    const excludePatterns = [
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      /node_modules/,
      /\.git/,
      /\.next/
    ];

    const checkFile = (filePath) => {
      if (excludePatterns.some(pattern => pattern.test(filePath))) {
        return;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        sensitivePatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.addIssue(`Potential hardcoded secret in ${filePath}: ${match}`, 'high');
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    };

    const walkDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            walkDir(filePath);
          } else if (stat.isFile() && /\.(js|ts|tsx|jsx|json|env)$/.test(file)) {
            checkFile(filePath);
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };

    walkDir('./src');
    walkDir('./scripts');
    
    if (fs.existsSync('.env.local')) {
      this.addWarning('.env.local file exists - ensure it\'s in .gitignore');
    }

    this.addPassed('Hardcoded secrets check completed');
  }

  /**
   * Check environment variable security
   */
  checkEnvironmentVariables() {
    this.log('Checking environment variables...');
    
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    const exampleEnvPath = '.env.example';
    const localEnvPath = '.env.local';

    // Check if .env.example exists
    if (!fs.existsSync(exampleEnvPath)) {
      this.addWarning('.env.example file missing - should document required environment variables');
    } else {
      this.addPassed('.env.example file exists');
    }

    // Check if sensitive env vars are properly configured
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.addWarning(`Environment variable ${envVar} is not set`);
      }
    });

    // Check .gitignore for env files
    if (fs.existsSync('.gitignore')) {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      if (!gitignoreContent.includes('.env.local')) {
        this.addIssue('.env.local not in .gitignore - sensitive data may be committed', 'high');
      } else {
        this.addPassed('.env.local properly ignored in git');
      }
    }

    this.addPassed('Environment variables check completed');
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  checkSQLInjection() {
    this.log('Checking for SQL injection vulnerabilities...');
    
    const sqlPatterns = [
      /\$\{[^}]*\}/g, // Template literals in SQL
      /['"][^'"]*\+[^'"]*['"]/g, // String concatenation
      /query\s*\(\s*['"][^'"]*\+/gi, // Direct query concatenation
    ];

    const checkFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Skip if file uses parameterized queries (Supabase style)
        if (content.includes('.select(') || content.includes('.from(') || content.includes('.eq(')) {
          return; // Supabase uses parameterized queries
        }

        sqlPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.addWarning(`Potential SQL injection risk in ${filePath}: ${match}`);
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    };

    const walkDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
            walkDir(filePath);
          } else if (stat.isFile() && /\.(js|ts|tsx|jsx)$/.test(file)) {
            checkFile(filePath);
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };

    walkDir('./src');
    this.addPassed('SQL injection check completed');
  }

  /**
   * Check for XSS vulnerabilities
   */
  checkXSSVulnerabilities() {
    this.log('Checking for XSS vulnerabilities...');
    
    const xssPatterns = [
      /dangerouslySetInnerHTML/g,
      /innerHTML\s*=/g,
      /document\.write/g,
      /eval\s*\(/g,
      /Function\s*\(/g
    ];

    const checkFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        xssPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.addWarning(`Potential XSS vulnerability in ${filePath}: ${match}`);
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    };

    const walkDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
            walkDir(filePath);
          } else if (stat.isFile() && /\.(js|ts|tsx|jsx)$/.test(file)) {
            checkFile(filePath);
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };

    walkDir('./src');
    this.addPassed('XSS vulnerability check completed');
  }

  /**
   * Check dependencies for known vulnerabilities
   */
  checkDependencyVulnerabilities() {
    this.log('Checking dependencies for vulnerabilities...');
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          const severity = vuln.severity || 'unknown';
          this.addIssue(`Vulnerability in ${pkg}: ${vuln.title || 'Unknown'} (${severity})`, severity);
        });
      } else {
        this.addPassed('No known vulnerabilities in dependencies');
      }
    } catch (error) {
      this.addWarning('Could not run npm audit - ensure npm is available');
    }
  }

  /**
   * Check security headers implementation
   */
  checkSecurityHeaders() {
    this.log('Checking security headers implementation...');
    
    const middlewarePath = './src/middleware.ts';
    const securityLibPath = './src/lib/security.ts';
    
    if (!fs.existsSync(middlewarePath)) {
      this.addIssue('middleware.ts not found - security headers may not be implemented', 'medium');
      return;
    }

    if (!fs.existsSync(securityLibPath)) {
      this.addIssue('security.ts not found - security utilities may not be implemented', 'medium');
      return;
    }

    try {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      const securityContent = fs.readFileSync(securityLibPath, 'utf8');
      
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Content-Security-Policy',
        'Strict-Transport-Security'
      ];

      requiredHeaders.forEach(header => {
        if (securityContent.includes(header)) {
          this.addPassed(`Security header ${header} implemented`);
        } else {
          this.addWarning(`Security header ${header} may not be implemented`);
        }
      });

      // Check for CSRF protection
      if (securityContent.includes('CSRF') || securityContent.includes('csrf')) {
        this.addPassed('CSRF protection implemented');
      } else {
        this.addWarning('CSRF protection may not be implemented');
      }

      // Check for rate limiting
      if (middlewareContent.includes('rate') || middlewareContent.includes('limit')) {
        this.addPassed('Rate limiting implemented');
      } else {
        this.addWarning('Rate limiting may not be implemented');
      }

    } catch (error) {
      this.addWarning('Could not analyze security implementation files');
    }
  }

  /**
   * Check file permissions and access controls
   */
  checkFilePermissions() {
    this.log('Checking file permissions...');
    
    const sensitiveFiles = [
      '.env.local',
      'supabase/config.toml',
      'scripts/setup-database.js'
    ];

    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          const mode = stats.mode & parseInt('777', 8);
          
          if (mode & parseInt('044', 8)) { // World readable
            this.addWarning(`File ${file} is world-readable - consider restricting permissions`);
          } else {
            this.addPassed(`File ${file} has appropriate permissions`);
          }
        } catch (error) {
          this.addWarning(`Could not check permissions for ${file}`);
        }
      }
    });
  }

  /**
   * Generate security report
   */
  generateReport() {
    this.log('\n=== SECURITY AUDIT REPORT ===');
    
    console.log(`\n📊 Summary:`);
    console.log(`   Issues: ${this.issues.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Passed: ${this.passed.length}`);

    if (this.issues.length > 0) {
      console.log(`\n❌ Issues Found:`);
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message}`);
      });
    }

    // Write detailed report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        issues: this.issues.length,
        warnings: this.warnings.length,
        passed: this.passed.length
      },
      issues: this.issues,
      warnings: this.warnings,
      passed: this.passed
    };

    fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
    this.log('Detailed report saved to security-audit-report.json');

    // Exit with error code if critical issues found
    const criticalIssues = this.issues.filter(issue => issue.severity === 'high');
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 ${criticalIssues.length} critical security issues found!`);
      process.exit(1);
    }

    console.log('\n✅ Security audit completed');
  }

  /**
   * Run all security checks
   */
  async runAudit() {
    this.log('Starting security audit...\n');
    
    this.checkHardcodedSecrets();
    this.checkEnvironmentVariables();
    this.checkSQLInjection();
    this.checkXSSVulnerabilities();
    this.checkDependencyVulnerabilities();
    this.checkSecurityHeaders();
    this.checkFilePermissions();
    
    this.generateReport();
  }
}

// Run the audit
const auditor = new SecurityAuditor();
auditor.runAudit().catch(error => {
  console.error('Security audit failed:', error);
  process.exit(1);
});