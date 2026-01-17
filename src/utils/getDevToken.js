// Helper to get a real development token from Keycloak
export async function getDevToken() {
  // Use the actual Keycloak URL
  const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
  const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'aether';
  const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'aether-frontend';
  // aether-frontend is a public client, doesn't need a client secret
  
  // Get ID token using password grant with environment-provided credentials
  const devUsername = import.meta.env.VITE_DEV_USERNAME;
  const devPassword = import.meta.env.VITE_DEV_PASSWORD;
  
  if (!devUsername || !devPassword) {
    console.error('❌ Development credentials not configured. Please set VITE_DEV_USERNAME and VITE_DEV_PASSWORD environment variables.');
    return null;
  }
  
  try {
    console.log('Getting ID token with admin-cli client and dev user...');
    const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        // No client_secret needed for aether-frontend (public client)
        username: devUsername,
        password: devPassword,
        scope: 'openid profile email', // Request ID token with proper scopes
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Got development tokens with dev user!');
      console.log('Access Token:', data.access_token ? 'Present' : 'Missing');
      console.log('ID Token:', data.id_token ? 'Present' : 'Missing');
      console.log('Expires in:', data.expires_in, 'seconds');
      
      // Use aetherApi.setTokens to properly initialize tokens and start automatic rotation
      const tokenToUse = data.id_token || data.access_token;
      const { aetherApi } = await import('../services/aetherApi.js');
      
      aetherApi.setTokens(
        tokenToUse,
        data.refresh_token || '',
        data.expires_in,
        data.refresh_expires_in || 1800
      );
      
      if (data.id_token) {
        console.log('✅ Using ID token for authentication');
      } else {
        console.log('⚠️ Using access token (ID token not available)');
      }
      
      console.log('🔄 Automatic token rotation started');
      return data;
    } else {
      console.error('Failed to get token with dev user:', await response.text());
    }
  } catch (error) {
    console.error('Error getting dev token with dev user:', error);
  }
  
  return null;
}

// Logout helper function
export function devLogout() {
  // Clear all stored tokens
  sessionStorage.removeItem('aether_access_token');
  sessionStorage.removeItem('aether_refresh_token');
  sessionStorage.removeItem('aether_token_type');
  sessionStorage.removeItem('aether_token_expiry');
  sessionStorage.removeItem('aether_refresh_expiry');
  localStorage.clear();
  
  console.log('🚪 Logged out - all tokens cleared');
  
  // Reload page to reset authentication state
  window.location.reload();
}

// Make it available globally in dev mode
if (import.meta.env.VITE_DEV_MODE === 'true' && typeof window !== 'undefined') {
  window.getDevToken = getDevToken;
  window.devLogout = devLogout;
  console.log('🔑 Dev token helper available. Run window.getDevToken() to get a fresh token.');
  console.log('🚪 Dev logout helper available. Run window.devLogout() to clear all tokens.');
}