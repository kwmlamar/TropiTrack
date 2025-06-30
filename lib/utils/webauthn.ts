// WebAuthn utilities for biometric authentication
// This module provides functions for WebAuthn enrollment and verification

export interface WebAuthnCredential {
  id: string;
  type: 'public-key';
  transports?: AuthenticatorTransport[];
}

export interface WebAuthnEnrollmentOptions {
  challenge: ArrayBuffer;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: ArrayBuffer;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment;
    userVerification?: UserVerificationRequirement;
    requireResidentKey?: boolean;
  };
}

export interface WebAuthnVerificationOptions {
  challenge: ArrayBuffer;
  rpId: string;
  allowCredentials: Array<{
    type: string;
    id: ArrayBuffer;
    transports?: AuthenticatorTransport[];
  }>;
  userVerification?: UserVerificationRequirement;
  timeout?: number;
}

export interface BiometricEnrollmentResult {
  credentialId: string;
  publicKey: string;
  attestationObject: string;
  clientDataJSON: string;
  rawId: string;
}

export interface BiometricVerificationResult {
  credentialId: string;
  authenticatorData: string;
  signature: string;
  clientDataJSON: string;
  userHandle?: string;
}

export class WebAuthnManager {
  private static instance: WebAuthnManager;
  
  private constructor() {}
  
  static getInstance(): WebAuthnManager {
    if (!WebAuthnManager.instance) {
      WebAuthnManager.instance = new WebAuthnManager();
    }
    return WebAuthnManager.instance;
  }

  // Check if WebAuthn is supported
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'PublicKeyCredential' in window &&
           'credentials' in navigator;
  }

  // Check if biometric authentication is available
  async isBiometricAvailable(): Promise<{
    fingerprint: boolean;
    face: boolean;
    webauthn: boolean;
  }> {
    if (!this.isSupported()) {
      return { fingerprint: false, face: false, webauthn: false };
    }

    const result = {
      fingerprint: false,
      face: false,
      webauthn: true
    };

    try {
      // Check for biometric authentication support
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (available) {
        // Try to detect specific biometric types
        const authTypes = await this.detectBiometricTypes();
        result.fingerprint = authTypes.includes('fingerprint');
        result.face = authTypes.includes('face');
      }
    } catch (error) {
      console.warn('Error checking biometric availability:', error);
    }

    return result;
  }

  // Detect available biometric types
  private async detectBiometricTypes(): Promise<string[]> {
    const types: string[] = [];
    
    try {
      // Enhanced detection for real biometric capabilities
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Check for Touch ID / Face ID (iOS)
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        types.push('fingerprint', 'face');
      }
      
      // Check for Android biometrics
      if (userAgent.includes('android')) {
        types.push('fingerprint', 'face');
      }
      
      // Check for Windows Hello
      if (userAgent.includes('windows')) {
        types.push('fingerprint', 'face');
      }
      
      // Check for macOS Touch ID
      if (userAgent.includes('macintosh')) {
        types.push('fingerprint');
      }

      // Additional checks for WebAuthn capabilities
      if (await this.checkWebAuthnBiometricSupport()) {
        types.push('fingerprint', 'face');
      }
    } catch (error) {
      console.warn('Error detecting biometric types:', error);
    }
    
    return types;
  }

  // Check WebAuthn biometric support
  private async checkWebAuthnBiometricSupport(): Promise<boolean> {
    try {
      // Test if platform authenticator is available
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (isAvailable) {
        // Test if user verification is supported
        const isUserVerifying = await PublicKeyCredential.isConditionalMediationAvailable();
        return isUserVerifying;
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking WebAuthn biometric support:', error);
      return false;
    }
  }

  // Generate enrollment options for real biometric capture
  async generateEnrollmentOptions(
    userId: string,
    userName: string,
    userDisplayName: string
  ): Promise<PublicKeyCredentialCreationOptions> {
    const challenge = this.generateChallenge();
    
    return {
      challenge,
      rp: {
        name: 'TropiTrack',
        id: window.location.hostname
      },
      user: {
        id: this.stringToArrayBuffer(userId),
        name: userName,
        displayName: userDisplayName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false
      },
      extensions: {
        // Request biometric authentication
        appid: window.location.origin
      }
    };
  }

  // Enroll a new biometric credential with real device capture
  async enroll(
    options: PublicKeyCredentialCreationOptions
  ): Promise<BiometricEnrollmentResult> {
    try {
      console.log('Starting WebAuthn enrollment...');
      
      const credential = await navigator.credentials.create({
        publicKey: options
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create credential');
      }

      if (credential.type !== 'public-key') {
        throw new Error('Invalid credential type');
      }

      const publicKeyCredential = credential as PublicKeyCredential & {
        response: AuthenticatorAttestationResponse;
      };

      // Convert to transportable format
      const result: BiometricEnrollmentResult = {
        credentialId: credential.id,
        publicKey: this.arrayBufferToBase64(publicKeyCredential.rawId),
        attestationObject: this.arrayBufferToBase64(publicKeyCredential.response.attestationObject),
        clientDataJSON: this.arrayBufferToBase64(publicKeyCredential.response.clientDataJSON),
        rawId: this.arrayBufferToBase64(publicKeyCredential.rawId)
      };

      console.log('WebAuthn enrollment successful');
      return result;
    } catch (error) {
      console.error('WebAuthn enrollment error:', error);
      throw new Error(`Enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate verification options for real biometric verification
  async generateVerificationOptions(
    credentialIds: string[]
  ): Promise<PublicKeyCredentialRequestOptions> {
    const challenge = this.generateChallenge();
    
    console.log('Generating verification options with credential IDs:', credentialIds);
    
    return {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: credentialIds.map(id => {
        console.log('Processing credential ID:', id);
        try {
          const arrayBuffer = this.base64ToArrayBuffer(id);
          console.log('Successfully converted credential ID to ArrayBuffer');
          return {
            type: 'public-key',
            id: arrayBuffer,
            transports: ['internal']
          };
        } catch (error) {
          console.error('Failed to convert credential ID:', id, error);
          throw error;
        }
      }),
      userVerification: 'required',
      timeout: 60000,
      extensions: {
        // Request biometric authentication
        appid: window.location.origin
      }
    };
  }

  // Verify a biometric credential with real device verification
  async verify(
    options: PublicKeyCredentialRequestOptions
  ): Promise<BiometricVerificationResult> {
    try {
      console.log('Starting WebAuthn verification...');
      
      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to get credential');
      }

      if (credential.type !== 'public-key') {
        throw new Error('Invalid credential type');
      }

      const publicKeyCredential = credential as PublicKeyCredential & {
        response: AuthenticatorAssertionResponse;
      };

      // Convert to transportable format
      const result: BiometricVerificationResult = {
        credentialId: credential.id,
        authenticatorData: this.arrayBufferToBase64(publicKeyCredential.response.authenticatorData),
        signature: this.arrayBufferToBase64(publicKeyCredential.response.signature),
        clientDataJSON: this.arrayBufferToBase64(publicKeyCredential.response.clientDataJSON),
        userHandle: publicKeyCredential.response.userHandle ? 
          this.arrayBufferToBase64(publicKeyCredential.response.userHandle) : undefined
      };

      console.log('WebAuthn verification successful');
      return result;
    } catch (error) {
      console.error('WebAuthn verification error:', error);
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert credential to transportable format
  credentialToJSON(credential: PublicKeyCredential): unknown {
    if (credential.type !== 'public-key') {
      throw new Error('Invalid credential type');
    }

    const publicKeyCredential = credential as PublicKeyCredential & {
      response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
    };

    return {
      id: credential.id,
      type: credential.type,
      rawId: this.arrayBufferToBase64(publicKeyCredential.rawId),
      response: {
        clientDataJSON: this.arrayBufferToBase64(publicKeyCredential.response.clientDataJSON),
        ...(publicKeyCredential.response instanceof AuthenticatorAttestationResponse && {
          attestationObject: this.arrayBufferToBase64(publicKeyCredential.response.attestationObject)
        }),
        ...(publicKeyCredential.response instanceof AuthenticatorAssertionResponse && {
          authenticatorData: this.arrayBufferToBase64(publicKeyCredential.response.authenticatorData),
          signature: this.arrayBufferToBase64(publicKeyCredential.response.signature),
          userHandle: publicKeyCredential.response.userHandle ? 
            this.arrayBufferToBase64(publicKeyCredential.response.userHandle) : undefined
        })
      }
    };
  }

  // Get device information for enrollment
  getDeviceInfo(): {
    userAgent: string;
    platform: string;
    isSecure: boolean;
    hasWebAuthn: boolean;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isSecure: window.isSecureContext,
      hasWebAuthn: this.isSupported()
    };
  }

  // Utility functions
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return new Uint8Array(array).buffer;
  }

  private stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    return new Uint8Array(uint8Array).buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Use URL-safe base64 encoding (replace + with - and / with _)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      // Handle URL-safe base64 (replace - with + and _ with /)
      const normalizedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const paddedBase64 = normalizedBase64 + '='.repeat((4 - normalizedBase64.length % 4) % 4);
      
      // Validate base64 string
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(paddedBase64)) {
        throw new Error('Invalid base64 string');
      }
      
      const binary = atob(paddedBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('Error converting base64 to ArrayBuffer:', error);
      console.error('Base64 string:', base64);
      throw new Error(`Failed to convert base64 to ArrayBuffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const webauthnManager = WebAuthnManager.getInstance(); 