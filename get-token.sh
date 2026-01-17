#!/bin/bash

echo "Getting Keycloak token..."

KEYCLOAK_URL=${KEYCLOAK_URL:-http://localhost:8081}
KEYCLOAK_REALM=${KEYCLOAK_REALM:-master}

# First, get admin token
ADMIN_TOKEN=$(curl -s -X POST ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin123" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo "Failed to get admin token. Trying with client credentials..."
    
    # Try client credentials grant
    TOKEN_RESPONSE=$(curl -s -X POST ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=password" \
      -d "client_id=admin-cli" \
      -d "username=john@scharber.com" \
      -d "password=test123")
    
    ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
    
    if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
        echo "✅ Got token using client credentials!"
        echo ""
        echo "Access Token:"
        echo "$ACCESS_TOKEN"
        echo ""
        echo "To use in browser console, run:"
        echo "sessionStorage.setItem('aether_access_token', '$ACCESS_TOKEN');"
        echo "sessionStorage.setItem('aether_token_expiry', '$(( $(date +%s) + 300 ))000');"
    else
        echo "❌ Failed to get token. Response:"
        echo "$TOKEN_RESPONSE"
    fi
else
    echo "✅ Got admin token, creating test user..."
    
    # Create test user
    curl -s -X POST "http://localhost:8081/admin/realms/master/users" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d '{
        "username": "testuser",
        "enabled": true,
        "emailVerified": true,
        "firstName": "Test",
        "lastName": "User",
        "email": "testuser@example.com",
        "credentials": [{
          "type": "password",
          "value": "testpass",
          "temporary": false
        }]
      }'
    
    # Get token for test user
    TOKEN_RESPONSE=$(curl -s -X POST ${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=password" \
      -d "client_id=admin-cli" \
      -d "username=testuser" \
      -d "password=testpass")
    
    ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
    
    if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
        echo "✅ Got token for test user!"
        echo ""
        echo "Access Token:"
        echo "$ACCESS_TOKEN"
        echo ""
        echo "To use in browser console, run:"
        echo "sessionStorage.setItem('aether_access_token', '$ACCESS_TOKEN');"
        echo "sessionStorage.setItem('aether_token_expiry', '$(( $(date +%s) + 300 ))000');"
    else
        echo "❌ Failed to get token. Response:"
        echo "$TOKEN_RESPONSE"
    fi
fi