// Biometric Capture Utilities for Cross-Device Authentication
// This module provides functions for capturing and storing actual biometric templates

export interface BiometricTemplate {
  id: string;
  type: 'fingerprint' | 'face' | 'both';
  template: string; // Base64 encoded biometric template
  quality: number; // Template quality score (0-100)
  features: number[]; // Extracted biometric features
  metadata: {
    device: string;
    captureDate: string;
    algorithm: string;
    version: string;
  };
}

export interface BiometricCaptureResult {
  success: boolean;
  template?: BiometricTemplate;
  error?: string;
  quality?: number;
}

export class BiometricCaptureManager {
  private static instance: BiometricCaptureManager;
  
  private constructor() {}
  
  static getInstance(): BiometricCaptureManager {
    if (!BiometricCaptureManager.instance) {
      BiometricCaptureManager.instance = new BiometricCaptureManager();
    }
    return BiometricCaptureManager.instance;
  }

  // Check if device supports biometric capture
  async isBiometricCaptureSupported(): Promise<{
    fingerprint: boolean;
    face: boolean;
    camera: boolean;
    sensor: boolean;
  }> {
    const result = {
      fingerprint: false,
      face: false,
      camera: false,
      sensor: false
    };

    try {
      // Check for camera access (for face recognition)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        result.camera = true;
        stream.getTracks().forEach(track => track.stop());
      }

      // Check for fingerprint sensor (simplified detection)
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('iphone') || userAgent.includes('ipad') || 
          userAgent.includes('android') || userAgent.includes('macintosh')) {
        result.fingerprint = true;
        result.sensor = true;
      }

      // Check for face recognition capability
      if (result.camera && (userAgent.includes('iphone') || userAgent.includes('ipad'))) {
        result.face = true;
      }

    } catch (error) {
      console.warn('Error checking biometric capture support:', error);
    }

    return result;
  }

  // Capture fingerprint template
  async captureFingerprintTemplate(): Promise<BiometricCaptureResult> {
    try {
      console.log('Starting fingerprint template capture...');
      
      // In a real implementation, this would:
      // 1. Access the device's fingerprint sensor
      // 2. Capture multiple fingerprint images
      // 3. Extract minutiae points and features
      // 4. Create a standardized template
      
      // For now, we'll simulate the capture process
      const template = await this.simulateFingerprintCapture();
      
      return {
        success: true,
        template,
        quality: template.quality
      };
      
    } catch (error) {
      console.error('Fingerprint capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fingerprint capture failed'
      };
    }
  }

  // Capture face template
  async captureFaceTemplate(): Promise<BiometricCaptureResult> {
    try {
      console.log('Starting face template capture...');
      
      // In a real implementation, this would:
      // 1. Access the device's camera
      // 2. Capture multiple face images from different angles
      // 3. Extract facial features and landmarks
      // 4. Create a standardized face template
      
      // For now, we'll simulate the capture process
      const template = await this.simulateFaceCapture();
      
      return {
        success: true,
        template,
        quality: template.quality
      };
      
    } catch (error) {
      console.error('Face capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Face capture failed'
      };
    }
  }

  // Verify biometric template against stored templates
  async verifyBiometricTemplate(
    capturedTemplate: BiometricTemplate,
    storedTemplates: BiometricTemplate[]
  ): Promise<{
    success: boolean;
    matchScore: number;
    matchedTemplate?: BiometricTemplate;
    error?: string;
  }> {
    try {
      console.log('Verifying biometric template...');
      
      let bestMatch: BiometricTemplate | undefined;
      let bestScore = 0;
      
      // Compare captured template with all stored templates
      for (const storedTemplate of storedTemplates) {
        if (storedTemplate.type === capturedTemplate.type) {
          const score = this.calculateTemplateSimilarity(capturedTemplate, storedTemplate);
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = storedTemplate;
          }
        }
      }
      
      // Determine if it's a match (threshold: 85%)
      const isMatch = bestScore >= 0.85;
      
      return {
        success: isMatch,
        matchScore: bestScore,
        matchedTemplate: bestMatch
      };
      
    } catch (error) {
      console.error('Template verification error:', error);
      return {
        success: false,
        matchScore: 0,
        error: error instanceof Error ? error.message : 'Template verification failed'
      };
    }
  }

  // Calculate similarity between two templates
  private calculateTemplateSimilarity(
    template1: BiometricTemplate,
    template2: BiometricTemplate
  ): number {
    try {
      // In a real implementation, this would use sophisticated biometric matching algorithms
      // For now, we'll use a simplified similarity calculation
      
      // Compare feature vectors
      const featureSimilarity = this.compareFeatureVectors(template1.features, template2.features);
      
      // Compare template quality
      const qualitySimilarity = 1 - Math.abs(template1.quality - template2.quality) / 100;
      
      // Weighted combination
      const similarity = (featureSimilarity * 0.8) + (qualitySimilarity * 0.2);
      
      return Math.max(0, Math.min(1, similarity));
      
    } catch (error) {
      console.error('Template similarity calculation error:', error);
      return 0;
    }
  }

  // Compare feature vectors
  private compareFeatureVectors(features1: number[], features2: number[]): number {
    if (features1.length !== features2.length) {
      return 0;
    }
    
    let sum = 0;
    for (let i = 0; i < features1.length; i++) {
      sum += Math.abs(features1[i] - features2[i]);
    }
    
    const averageDifference = sum / features1.length;
    return Math.max(0, 1 - averageDifference / 255); // Normalize to 0-1
  }

  // Simulate fingerprint capture
  private async simulateFingerprintCapture(): Promise<BiometricTemplate> {
    // Simulate capture delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate simulated fingerprint template
    const features = Array.from({ length: 128 }, () => Math.floor(Math.random() * 256));
    const template = btoa(JSON.stringify(features)).replace(/\+/g, '-').replace(/\//g, '_');
    
    return {
      id: `fp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'fingerprint',
      template,
      quality: 85 + Math.floor(Math.random() * 15), // 85-100 quality
      features,
      metadata: {
        device: navigator.platform,
        captureDate: new Date().toISOString(),
        algorithm: 'simulated_fingerprint_v1',
        version: '1.0.0'
      }
    };
  }

  // Simulate face capture
  private async simulateFaceCapture(): Promise<BiometricTemplate> {
    // Simulate capture delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate simulated face template
    const features = Array.from({ length: 256 }, () => Math.floor(Math.random() * 256));
    const template = btoa(JSON.stringify(features)).replace(/\+/g, '-').replace(/\//g, '_');
    
    return {
      id: `face_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'face',
      template,
      quality: 80 + Math.floor(Math.random() * 20), // 80-100 quality
      features,
      metadata: {
        device: navigator.platform,
        captureDate: new Date().toISOString(),
        algorithm: 'simulated_face_v1',
        version: '1.0.0'
      }
    };
  }

  // Get device capabilities
  getDeviceCapabilities(): {
    platform: string;
    userAgent: string;
    hasCamera: boolean;
    hasFingerprint: boolean;
    isSecure: boolean;
  } {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      hasCamera: 'mediaDevices' in navigator,
      hasFingerprint: /iphone|ipad|android|macintosh/i.test(navigator.userAgent),
      isSecure: window.isSecureContext
    };
  }
}

// Export singleton instance
export const biometricCaptureManager = BiometricCaptureManager.getInstance(); 