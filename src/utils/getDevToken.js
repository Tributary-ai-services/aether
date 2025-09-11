// Helper to get a real development token from Keycloak
export async function getDevToken() {
  // Use the actual Keycloak URL
  const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || window.location.origin;
  const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'master';
  const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'aether-frontend';
  // admin-cli doesn't need a client secret
  
  // admin-cli client doesn't support client credentials, skip directly to password grant
  
  // Get ID token using password grant with test user
  try {
    console.log('Getting ID token with admin-cli client and test user...');
    const response = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        // No client_secret needed for admin-cli
        username: 'john@scharber.com',
        password: 'test123',
        scope: 'openid profile email', // Request ID token with proper scopes
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Got development tokens with test user!');
      console.log('Access Token:', data.access_token ? 'Present' : 'Missing');
      console.log('ID Token:', data.id_token ? 'Present' : 'Missing');
      console.log('Expires in:', data.expires_in, 'seconds');
      
      // Store tokens in session storage - use ID token for authentication
      if (data.id_token) {
        sessionStorage.setItem('aether_access_token', data.id_token); // Use ID token as access token
        sessionStorage.setItem('aether_token_type', 'id_token');
        console.log('✅ Stored ID token for authentication');
      } else {
        sessionStorage.setItem('aether_access_token', data.access_token);
        sessionStorage.setItem('aether_token_type', 'access_token');
        console.log('⚠️ Using access token (ID token not available)');
      }
      
      sessionStorage.setItem('aether_refresh_token', data.refresh_token || 'none');
      sessionStorage.setItem('aether_token_expiry', (Date.now() + data.expires_in * 1000).toString());
      sessionStorage.setItem('aether_refresh_expiry', (Date.now() + (data.refresh_expires_in || 3600) * 1000).toString());
      
      return data;
    } else {
      console.error('Failed to get token with test user:', await response.text());
    }
  } catch (error) {
    console.error('Error getting dev token with test user:', error);
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