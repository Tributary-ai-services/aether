// Token Storage Service
// Provides secure storage for JWT tokens and refresh tokens

const TOKEN_KEY = 'aether_access_token';
const REFRESH_TOKEN_KEY = 'aether_refresh_token';
const TOKEN_EXPIRY_KEY = 'aether_token_expiry';
const REFRESH_EXPIRY_KEY = 'aether_refresh_expiry';

class TokenStorageService {
  constructor() {
    // Use sessionStorage for more security (cleared when tab closes)
    // localStorage persists across browser sessions
    this.storage = sessionStorage;
    
    // Basic XSS protection - validate environment
    this.validateSecurityContext();
  }

  // Validate that we're running in a secure context
  validateSecurityContext() {
    // Warn if not running over HTTPS in production
    if (typeof window !== 'undefined' && window.location) {
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      if (!isHttps && !isLocalhost) {
        console.warn('⚠️ Security Warning: Token storage should be used over HTTPS in production');
      }
    }

    // Check for basic storage availability
    try {
      const testKey = '__aether_storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
    } catch (error) {
      console.error('Storage not available:', error);
      throw new Error('Secure storage is not available');
    }
  }

  // Sanitize input to prevent XSS
  sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    
    // Basic sanitization - remove potentially dangerous characters
    // Note: JWT tokens should only contain base64url-safe characters anyway
    return value.replace(/[<>"'&]/g, '');
  }

  // Store access token with expiry
  setAccessToken(token, expiresIn) {
    if (!token) {
      console.warn('Attempted to store empty access token');
      return;
    }
    
    const sanitizedToken = this.sanitizeInput(token);
    this.storage.setItem(TOKEN_KEY, sanitizedToken);
    
    // Calculate expiry timestamp
    const expiryTime = Date.now() + (expiresIn * 1000);
    this.storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    console.log('Access token stored securely');
  }

  // Store refresh token with expiry
  setRefreshToken(refreshToken, expiresIn) {
    if (!refreshToken) {
      console.warn('Attempted to store empty refresh token');
      return;
    }
    
    const sanitizedToken = this.sanitizeInput(refreshToken);
    this.storage.setItem(REFRESH_TOKEN_KEY, sanitizedToken);
    
    // Calculate expiry timestamp
    const expiryTime = Date.now() + (expiresIn * 1000);
    this.storage.setItem(REFRESH_EXPIRY_KEY, expiryTime.toString());
    
    console.log('Refresh token stored securely');
  }

  // Get access token
  getAccessToken() {
    return this.storage.getItem(TOKEN_KEY);
  }

  // Get refresh token
  getRefreshToken() {
    return this.storage.getItem(REFRESH_TOKEN_KEY);
  }

  // Check if access token is expired or will expire soon
  isAccessTokenExpired(bufferMinutes = 1) {
    const expiryTime = this.storage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() + bufferMs >= parseInt(expiryTime);
  }

  // Check if refresh token is expired
  isRefreshTokenExpired() {
    const expiryTime = this.storage.getItem(REFRESH_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return Date.now() >= parseInt(expiryTime);
  }

  // Get time until access token expires (in seconds)
  getAccessTokenTimeRemaining() {
    const expiryTime = this.storage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return 0;
    
    const remaining = Math.max(0, parseInt(expiryTime) - Date.now());
    return Math.floor(remaining / 1000);
  }

  // Clear all tokens with security logging
  clearTokens() {
    const hadTokens = this.hasValidTokens();
    
    this.storage.removeItem(TOKEN_KEY);
    this.storage.removeItem(REFRESH_TOKEN_KEY);
    this.storage.removeItem(TOKEN_EXPIRY_KEY);
    this.storage.removeItem(REFRESH_EXPIRY_KEY);
    
    if (hadTokens) {
      console.log('🔐 All tokens cleared securely');
    }
  }

  // Check if we have valid tokens
  hasValidTokens() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    return accessToken && refreshToken && !this.isRefreshTokenExpired();
  }

  // Security method: Check for potential tampering
  validateTokenIntegrity() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    // Basic JWT format validation
    const isValidJWT = (token) => {
      if (!token) return false;
      const parts = token.split('.');
      return parts.length === 3 && parts.every(part => part.length > 0);
    };
    
    const accessTokenValid = !accessToken || isValidJWT(accessToken);
    const refreshTokenValid = !refreshToken || isValidJWT(refreshToken);
    
    if (!accessTokenValid || !refreshTokenValid) {
      console.warn('⚠️ Security Warning: Token integrity check failed');
      this.clearTokens();
      return false;
    }
    
    return true;
  }

  // Get security status report
  getSecurityStatus() {
    return {
      storageType: this.storage === sessionStorage ? 'sessionStorage' : 'localStorage',
      hasTokens: this.hasValidTokens(),
      isHttps: typeof window !== 'undefined' ? window.location?.protocol === 'https:' : false,
      tokenIntegrity: this.validateTokenIntegrity(),
      accessTokenTimeRemaining: this.getAccessTokenTimeRemaining(),
      isAccessTokenExpired: this.isAccessTokenExpired(),
      isRefreshTokenExpired: this.isRefreshTokenExpired(),
    };
  }
}

// Create singleton instance
export const tokenStorage = new TokenStorageService();