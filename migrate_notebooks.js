#!/usr/bin/env node

/**
 * Script to migrate sample notebooks from localStorage to Neo4j via the backend API
 */

const sampleNotebooks = [
  {
    "id": "nb_1",
    "name": "Research Projects",
    "description": "Academic and industry research",
    "visibility": "private",
    "createdAt": "2024-01-10T09:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z",
    "documentCount": 45,
    "tags": ["research", "academic"],
    "parentId": null,
    "children": ["nb_2", "nb_4"],
    "complianceSettings": {
      "hipaaCompliant": true,
      "piiDetection": true,
      "dataRetentionDays": 365,
      "encryptionAtRest": true,
      "accessLogging": true,
      "auditTrail": true,
      "dataClassification": "confidential",
      "redactionEnabled": true,
      "complianceFrameworks": ["GDPR", "SOC2", "ISO27001", "PCI-DSS"]
    }
  },
  {
    "id": "nb_2",
    "name": "AI Ethics Research",
    "description": "Papers and studies on AI ethics",
    "visibility": "shared",
    "createdAt": "2024-01-12T10:00:00Z",
    "updatedAt": "2024-01-18T14:20:00Z",
    "documentCount": 12,
    "tags": ["ai", "ethics", "research"],
    "parentId": "nb_1",
    "children": ["nb_3"],
    "complianceSettings": {
      "hipaaCompliant": false,
      "piiDetection": true,
      "dataRetentionDays": 1095,
      "encryptionAtRest": true,
      "accessLogging": true,
      "auditTrail": true,
      "dataClassification": "restricted",
      "redactionEnabled": true,
      "complianceFrameworks": ["GDPR", "CCPA"]
    }
  },
  {
    "id": "nb_3",
    "name": "Bias in ML Models",
    "description": "Research on algorithmic bias",
    "visibility": "private",
    "createdAt": "2024-01-15T11:30:00Z",
    "updatedAt": "2024-01-19T16:45:00Z",
    "documentCount": 8,
    "tags": ["ml", "bias", "algorithms"],
    "parentId": "nb_2",
    "children": [],
    "complianceSettings": {
      "hipaaCompliant": false,
      "piiDetection": true,
      "dataRetentionDays": 730,
      "encryptionAtRest": true,
      "accessLogging": true,
      "auditTrail": true,
      "dataClassification": "internal",
      "redactionEnabled": false,
      "complianceFrameworks": ["SOC2"]
    }
  },
  {
    "id": "nb_4",
    "name": "Technical Papers",
    "description": "Latest research papers",
    "visibility": "public",
    "createdAt": "2024-01-08T08:15:00Z",
    "updatedAt": "2024-01-22T12:10:00Z",
    "documentCount": 23,
    "tags": ["technical", "papers", "research"],
    "parentId": "nb_1",
    "children": []
  },
  {
    "id": "nb_5",
    "name": "Meeting Notes",
    "description": "Company meeting recordings and notes",
    "visibility": "shared",
    "createdAt": "2024-01-05T14:00:00Z",
    "updatedAt": "2024-01-25T10:30:00Z",
    "documentCount": 67,
    "tags": ["meetings", "notes", "company"],
    "parentId": null,
    "children": ["nb_6"]
  },
  {
    "id": "nb_6",
    "name": "Q1 2024 Meetings",
    "description": "First quarter meetings",
    "visibility": "shared",
    "createdAt": "2024-01-15T09:30:00Z",
    "updatedAt": "2024-01-20T11:15:00Z",
    "documentCount": 15,
    "tags": ["q1", "2024", "meetings"],
    "parentId": "nb_5",
    "children": []
  },
  {
    "id": "nb_7",
    "name": "Personal Documents",
    "description": "Personal files and documents",
    "visibility": "private",
    "createdAt": "2024-01-03T16:20:00Z",
    "updatedAt": "2024-01-28T13:45:00Z",
    "documentCount": 34,
    "tags": ["personal", "documents"],
    "parentId": null,
    "children": []
  },
  {
    "id": "nb_8",
    "name": "Project Alpha",
    "description": "Confidential project documentation",
    "visibility": "private",
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-29T14:20:00Z",
    "documentCount": 28,
    "tags": ["project", "alpha", "confidential"],
    "parentId": null,
    "children": []
  },
  {
    "id": "nb_9",
    "name": "Training Materials",
    "description": "Educational content and tutorials",
    "visibility": "public",
    "createdAt": "2024-01-18T12:30:00Z",
    "updatedAt": "2024-01-26T09:15:00Z",
    "documentCount": 19,
    "tags": ["training", "education", "tutorials"],
    "parentId": null,
    "children": []
  },
  {
    "id": "nb_10",
    "name": "Client Communications",
    "description": "Email chains and client documents",
    "visibility": "shared",
    "createdAt": "2024-01-12T15:45:00Z",
    "updatedAt": "2024-01-27T11:30:00Z",
    "documentCount": 42,
    "tags": ["clients", "communications", "email"],
    "parentId": null,
    "children": []
  }
];

async function getAuthToken() {
  console.log('Getting authentication token...');
  
  const response = await fetch('http://localhost:8081/realms/aether/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: 'admin-cli',
      username: 'test',
      password: 'test',
      grant_type: 'password'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

async function createNotebook(notebook, token) {
  console.log(`Creating notebook: ${notebook.name}`);
  
  // Convert to the format expected by the API
  const notebookData = {
    name: notebook.name,
    description: notebook.description,
    visibility: notebook.visibility,
    tags: notebook.tags,
    parent_id: notebook.parentId || null,
    compliance_settings: notebook.complianceSettings || {}
  };

  const response = await fetch('http://localhost:8080/api/v1/notebooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(notebookData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create ${notebook.name}: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Created: ${notebook.name} (ID: ${result.id})`);
  return result;
}

async function migrateNotebooks() {
  try {
    console.log('🚀 Starting notebook migration...');
    
    // Get auth token
    const token = await getAuthToken();
    console.log('✅ Authentication successful');

    // Create notebooks in order (parents first)
    const createdNotebooks = new Map();
    
    // Sort notebooks to create parents first
    const sortedNotebooks = [...sampleNotebooks].sort((a, b) => {
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return 0;
    });

    for (const notebook of sortedNotebooks) {
      try {
        // If this notebook has a parent, find the real parent ID
        const notebookData = { ...notebook };
        if (notebook.parentId && createdNotebooks.has(notebook.parentId)) {
          notebookData.parentId = createdNotebooks.get(notebook.parentId).id;
        }
        
        const created = await createNotebook(notebookData, token);
        createdNotebooks.set(notebook.id, created);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to create ${notebook.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration completed! Created ${createdNotebooks.size} notebooks.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateNotebooks();