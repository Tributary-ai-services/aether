// Development Token Helper
// Utilities for easier token management during development
// WARNING: This file should only be used in development environments

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

// Prevent usage in production
if (import.meta.env.PROD && typeof window !== 'undefined') {
  console.warn('⚠️ DevTokenHelper should not be used in production builds');
}

class DevTokenHelper {
  // Mock token refresh for development (simulates successful refresh)
  static async mockTokenRefresh() {
    if (!DEV_MODE) {
      console.warn('DevTokenHelper should only be used in development mode');
      return false;
    }

    console.log('🔄 [DEV] Simulating token refresh...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ [DEV] Token refresh simulated successfully');
    return true;
  }

  // Get current dev token info
  static getDevTokenInfo() {
    if (!DEV_MODE) return null;

    // Extract from environment or use generic dev data
    const devUsername = import.meta.env.VITE_DEV_USERNAME || 'dev-user';
    const devEmail = import.meta.env.VITE_DEV_EMAIL || 'dev@example.com';
    
    return {
      user: devUsername,
      name: 'Development User',
      email: devEmail,
      roles: ['offline_access', 'uma_authorization', 'default-roles-aether'],
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
      iat: Math.floor(Date.now() / 1000),
    };
  }

  // Force token expiry for testing (development only)
  static forceTokenExpiry() {
    if (!DEV_MODE) {
      console.warn('DevTokenHelper should only be used in development mode');
      return;
    }

    console.log('⚠️ [DEV] Forcing token expiry for testing...');
    localStorage.setItem('aether_token_expiry', (Date.now() - 1000).toString());
  }

  // Reset token expiry for testing (development only)
  static resetTokenExpiry() {
    if (!DEV_MODE) {
      console.warn('DevTokenHelper should only be used in development mode');
      return;
    }

    console.log('🔄 [DEV] Resetting token expiry...');
    const expiryTime = Date.now() + (300 * 1000); // 5 minutes from now
    localStorage.setItem('aether_token_expiry', expiryTime.toString());
  }

  // Log current token status
  static logTokenStatus() {
    if (!DEV_MODE) return;

    const tokenInfo = this.getDevTokenInfo();
    const expiryTime = localStorage.getItem('aether_token_expiry');
    
    console.log('📊 [DEV] Token Status:');
    console.log('- Token Info:', tokenInfo);
    console.log('- Expiry Time:', expiryTime ? new Date(parseInt(expiryTime)) : 'Not set');
    console.log('- Time Remaining:', expiryTime ? Math.max(0, parseInt(expiryTime) - Date.now()) / 1000 + 's' : 'N/A');
  }

  // Test token refresh flow
  static async testTokenRefresh() {
    if (!DEV_MODE) {
      console.warn('DevTokenHelper should only be used in development mode');
      return;
    }

    console.log('🧪 [DEV] Testing token refresh flow...');
    
    // Force expiry
    this.forceTokenExpiry();
    
    // Try to make an API call (should trigger refresh)
    try {
      const { aetherApi } = await import('../services/aetherApi.js');
      await aetherApi.checkHealth();
      console.log('✅ [DEV] Token refresh test completed');
    } catch (error) {
      console.error('❌ [DEV] Token refresh test failed:', error);
    }
  }
}

// Export for development use
export default DevTokenHelper;

// Attach to window for easy console access in development
if (DEV_MODE && typeof window !== 'undefined') {
  window.devTokenHelper = DevTokenHelper;
  console.log('🛠️ [DEV] DevTokenHelper available at window.devTokenHelper');
}