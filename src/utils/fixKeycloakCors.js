// Fix Keycloak CORS configuration for frontend authentication
export async function fixKeycloakCors() {
  console.log('🔧 Attempting to configure Keycloak CORS settings...');
  
  try {
    const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'master';
    
    // First get admin token
    const adminResponse = await fetch(`/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123',
      }),
    });

    if (!adminResponse.ok) {
      throw new Error('Failed to get admin token');
    }

    const adminData = await adminResponse.json();
    const adminToken = adminData.access_token;

    // Update the aether-backend client to allow CORS
    const clientUpdateResponse = await fetch(`/admin/realms/${KEYCLOAK_REALM}/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    const clients = await clientUpdateResponse.json();
    const aetherClient = clients.find(c => c.clientId === 'aether-backend');

    if (aetherClient) {
      // Update client with CORS settings
      const updateResponse = await fetch(`/admin/realms/${KEYCLOAK_REALM}/clients/${aetherClient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...aetherClient,
          webOrigins: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'],
          redirectUris: ['http://localhost:3001/*', 'http://localhost:3000/*', 'http://localhost:5173/*'],
          directAccessGrantsEnabled: true,
          publicClient: false,
        }),
      });

      if (updateResponse.ok) {
        console.log('✅ Keycloak CORS configuration updated!');
        console.log('Frontend origins added: http://localhost:3001, http://localhost:3000, http://localhost:5173');
        return true;
      } else {
        console.error('❌ Failed to update client configuration');
        return false;
      }
    } else {
      console.error('❌ aether-backend client not found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error configuring Keycloak CORS:', error);
    console.log('💡 Alternative: Use admin-cli client for authentication');
    console.log('Try: await window.quickAuthWithAdminCli()');
    return false;
  }
}

// Alternative authentication using admin-cli client (should work without CORS issues)
export async function quickAuthWithAdminCli() {
  console.log('🔐 Attempting authentication with admin-cli...');
  
  try {
    const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'master';
    const response = await fetch(`/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'test',
        password: 'test',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Authentication failed:', error);
      return null;
    }

    const data = await response.json();
    
    // Store tokens
    sessionStorage.setItem('aether_access_token', data.access_token);
    sessionStorage.setItem('aether_token_expiry', (Date.now() + data.expires_in * 1000).toString());
    
    if (data.refresh_token) {
      sessionStorage.setItem('aether_refresh_token', data.refresh_token);
      sessionStorage.setItem('aether_refresh_expiry', (Date.now() + (data.refresh_expires_in || 1800) * 1000).toString());
    }
    
    console.log('✅ Authentication successful with admin-cli!');
    console.log('Refresh the page to use the new token.');
    return data;
    
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

// Make both functions globally available
if (typeof window !== 'undefined') {
  window.fixKeycloakCors = fixKeycloakCors;
  window.quickAuthWithAdminCli = quickAuthWithAdminCli;
}