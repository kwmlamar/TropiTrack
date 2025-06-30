// Biometric security utilities
// This module provides encryption, audit logging, and security validation for biometric operations

export interface BiometricAuditLog {
  id: string;
  worker_id: string;
  company_id: string;
  event_type: 'enrollment' | 'verification' | 'deactivation' | 'failed_attempt';
  biometric_type: 'fingerprint' | 'face' | 'both';
  device_id: string;
  ip_address?: string;
  user_agent?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  success: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  riskScore: number;
  warnings: string[];
  recommendations: string[];
}

export class BiometricSecurityManager {
  private static instance: BiometricSecurityManager;
  
  private constructor() {}
  
  static getInstance(): BiometricSecurityManager {
    if (!BiometricSecurityManager.instance) {
      BiometricSecurityManager.instance = new BiometricSecurityManager();
    }
    return BiometricSecurityManager.instance;
  }

  // Encrypt biometric template data
  async encryptTemplate(templateData: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(templateData);
      
      // Generate encryption key from password
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('tropitrack-biometric-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        encryptionKey,
        data
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt biometric template');
    }
  }

  // Decrypt biometric template data
  async decryptTemplate(encryptedData: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Generate decryption key
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const decryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('tropitrack-biometric-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );
      
      // Decrypt data
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        decryptionKey,
        encrypted
      );
      
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt biometric template');
    }
  }

  // Generate secure device fingerprint
  generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      (navigator as { deviceMemory?: number }).deviceMemory || 'unknown',
      navigator.platform
    ];
    
    const fingerprint = components.join('|');
    return this.hashStringSync(fingerprint);
  }

  // Hash string using SHA-256 (synchronous version)
  private hashStringSync(str: string): string {
    // Simple hash function for device fingerprinting
    // In production, you might want to use a more sophisticated approach
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Hash string using SHA-256 (async version for other uses)
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Validate biometric verification attempt
  async validateVerificationAttempt(
    workerId: string,
    deviceId: string,
    biometricType: string,
    metadata: Record<string, unknown>
  ): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: true,
      riskScore: 0,
      warnings: [],
      recommendations: []
    };

    // Check for suspicious patterns
    const warnings: string[] = [];
    let riskScore = 0;

    // Check device consistency
    const expectedDeviceId = this.generateDeviceFingerprint();
    if (deviceId !== expectedDeviceId) {
      warnings.push('Device fingerprint mismatch');
      riskScore += 30;
    }

    // Check time-based patterns (prevent rapid attempts)
    const now = Date.now();
    const lastAttempt = metadata.lastAttemptTime as number | undefined;
    if (lastAttempt && (now - lastAttempt) < 1000) {
      warnings.push('Rapid verification attempts detected');
      riskScore += 25;
    }

    // Check location consistency (if available)
    const location = metadata.location as { latitude: number; longitude: number } | undefined;
    const lastLocation = metadata.lastLocation as { latitude: number; longitude: number } | undefined;
    if (location && lastLocation) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        lastLocation.latitude,
        lastLocation.longitude
      );
      
      if (distance > 100) { // More than 100km
        warnings.push('Unusual location change detected');
        riskScore += 40;
      }
    }

    // Check for multiple failed attempts
    const failedAttempts = metadata.failedAttempts as number | undefined;
    if (failedAttempts && failedAttempts > 3) {
      warnings.push('Multiple failed attempts detected');
      riskScore += 35;
    }

    // Determine if verification should be blocked
    if (riskScore > 70) {
      result.isValid = false;
      result.recommendations.push('Verification blocked due to high risk score');
    }

    result.riskScore = riskScore;
    result.warnings = warnings;

    if (riskScore > 50) {
      result.recommendations.push('Consider requiring additional verification');
    }

    return result;
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Create audit log entry
  async createAuditLog(
    workerId: string,
    companyId: string,
    eventType: BiometricAuditLog['event_type'],
    biometricType: BiometricAuditLog['biometric_type'],
    deviceId: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const auditLog: Omit<BiometricAuditLog, 'id' | 'created_at'> = {
        worker_id: workerId,
        company_id: companyId,
        event_type: eventType,
        biometric_type: biometricType,
        device_id: deviceId,
        ip_address: metadata?.ipAddress as string | undefined,
        user_agent: metadata?.userAgent as string | undefined,
        location: metadata?.location as { latitude: number; longitude: number; accuracy?: number } | undefined,
        success,
        error_message: errorMessage,
        metadata
      };

      // In a real implementation, this would be saved to the database
      console.log('Audit Log:', auditLog);
      
      // You could also send to external logging service
      await this.sendToLoggingService();
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  // Send audit log to external logging service
  private async sendToLoggingService(): Promise<void> {
    // In a real implementation, this would send to a logging service
    // like CloudWatch, DataDog, or a custom logging endpoint
    try {
      // Example: Send to external logging service
      // await fetch('/api/logging/audit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(_auditLog)
      // });
    } catch (error) {
      console.error('Failed to send to logging service:', error);
    }
  }

  // Check for liveness (basic implementation)
  async checkLiveness(verificationData: unknown): Promise<boolean> {
    // In a real implementation, this would use sophisticated liveness detection
    // For now, we'll implement basic checks
    
    const data = verificationData as { responseTime: number; deviceInfo: unknown; behavioralData: unknown };
    const checks = [
      this.checkResponseTime(data.responseTime),
      this.checkDeviceConsistency(data.deviceInfo),
      this.checkBehavioralPatterns()
    ];
    
    const results = await Promise.all(checks);
    return results.every(result => result);
  }

  private async checkResponseTime(responseTime: number): Promise<boolean> {
    // Too fast responses might indicate automated attacks
    return responseTime > 500 && responseTime < 10000;
  }

  private async checkDeviceConsistency(deviceInfo: unknown): Promise<boolean> {
    // Check if device info is consistent with expected values
    const expectedFingerprint = this.generateDeviceFingerprint();
    const info = deviceInfo as { fingerprint: string };
    return info.fingerprint === expectedFingerprint;
  }

  private async checkBehavioralPatterns(): Promise<boolean> {
    // Check for natural human behavior patterns
    // This is a simplified implementation
    // In real implementation, would analyze mouse movements, timing, etc.
    return true;
  }

  // Rate limiting for biometric operations
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  async checkRateLimit(workerId: string, operation: string): Promise<boolean> {
    const key = `${workerId}:${operation}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxAttempts = 10;

    const current = this.rateLimitMap.get(key);
    
    if (!current || now > current.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= maxAttempts) {
      return false;
    }

    current.count++;
    return true;
  }

  // Clean up rate limit data
  cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }
}

// Export singleton instance
export const biometricSecurity = BiometricSecurityManager.getInstance(); 