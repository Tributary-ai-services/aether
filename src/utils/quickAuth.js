// Quick authentication helper for development
export async function quickAuth() {
  console.log('🔐 Attempting to authenticate with Keycloak...');
  
  try {
    // Try with the test user from the backend logs - using relative URL to go through Vite proxy
    const response = await fetch('/realms/aether/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'aether-backend',
        client_secret: 'e78dEfml7xy6YKyHyiQWMMmw7fDs6Kz8',
        username: 'test',
        password: 'test',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Authentication failed:', error);
      
      // Try client credentials as fallback
      console.log('🔄 Trying client credentials grant...');
      const clientResponse = await fetch('/realms/aether/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'aether-backend',
          client_secret: 'e78dEfml7xy6YKyHyiQWMMmw7fDs6Kz8',
        }),
      });
      
      if (clientResponse.ok) {
        const data = await clientResponse.json();
        storeTokens(data);
        console.log('✅ Authenticated with client credentials!');
        console.log('Refresh the page to use the new token.');
        return data;
      } else {
        console.error('❌ Client credentials also failed:', await clientResponse.text());
        console.log('💡 You may need to create a user in Keycloak:');
        console.log('   1. Go to http://localhost:8081/admin');
        console.log('   2. Login with admin/admin');
        console.log('   3. Select "aether" realm');
        console.log('   4. Create a user with username "test" and password "test"');
        return null;
      }
    }

    const data = await response.json();
    storeTokens(data);
    console.log('✅ Authentication successful!');
    console.log('Refresh the page to use the new token.');
    return data;
    
  } catch (error) {
    console.error('❌ Network error:', error);
    console.log('Make sure Keycloak is running on http://localhost:8081');
    return null;
  }
}

function storeTokens(tokenData) {
  if (tokenData.access_token) {
    sessionStorage.setItem('aether_access_token', tokenData.access_token);
    sessionStorage.setItem('aether_token_expiry', (Date.now() + tokenData.expires_in * 1000).toString());
    
    if (tokenData.refresh_token) {
      sessionStorage.setItem('aether_refresh_token', tokenData.refresh_token);
      sessionStorage.setItem('aether_refresh_expiry', (Date.now() + (tokenData.refresh_expires_in || 1800) * 1000).toString());
    }
    
    // Log token info
    const decoded = parseJWT(tokenData.access_token);
    console.log('Token info:', {
      username: decoded.preferred_username,
      email: decoded.email,
      roles: decoded.realm_access?.roles,
      expires: new Date(decoded.exp * 1000).toLocaleString()
    });
  }
}

function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.quickAuth = quickAuth;
}