/**
 * Database Types Configuration
 *
 * Defines all supported database types with their connection parameters,
 * MCP server mappings, and environment-specific endpoint configurations.
 */

// ============================================================================
// Environment Detection Helpers
// ============================================================================

/**
 * Detect the current runtime environment
 * @returns {'docker' | 'kubernetes' | 'external'}
 */
export const detectEnvironment = () => {
  // Check for Kubernetes environment variables
  if (typeof process !== 'undefined') {
    if (process.env.KUBERNETES_SERVICE_HOST) {
      return 'kubernetes';
    }
    if (process.env.DOCKER_CONTAINER === 'true') {
      return 'docker';
    }
  }

  // Check for browser environment hints
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // K8s ingress patterns
    if (hostname.endsWith('.svc.cluster.local') ||
        hostname.includes('.tas.scharber.com')) {
      return 'kubernetes';
    }

    // Docker patterns
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'docker';
    }
  }

  return 'external';
};

// ============================================================================
// Connection Field Types
// ============================================================================

export const FIELD_TYPES = {
  TEXT: 'text',
  PASSWORD: 'password',
  NUMBER: 'number',
  SELECT: 'select',
  TOGGLE: 'toggle',
  FILE: 'file',
  JSON: 'json',
  TEXTAREA: 'textarea',
};

// ============================================================================
// Database Categories
// ============================================================================

export const DATABASE_CATEGORIES = {
  RELATIONAL: 'relational',
  GRAPH: 'graph',
  VECTOR: 'vector',
  DOCUMENT: 'document',
  KEY_VALUE: 'key_value',
  WAREHOUSE: 'warehouse',
  SEARCH: 'search',
  EMBEDDED: 'embedded',
};

// ============================================================================
// Database Type Definitions
// ============================================================================

export const DATABASE_TYPES = [
  // ========================================
  // PostgreSQL
  // ========================================
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Open-source relational database',
    category: DATABASE_CATEGORIES.RELATIONAL,
    icon: 'Database',
    color: '#336791',

    // MCP Server Configuration
    mcpServer: {
      name: 'mcp__postgres',
      dockerEndpoint: 'tas-postgres-shared:5432',
      kubernetesEndpoint: 'postgres-shared.tas-shared.svc.cluster.local:5432',
      externalPort: 5432,
    },

    // Default connection parameters
    defaults: {
      port: 5432,
      ssl: false,
      sslMode: 'prefer',
    },

    // Connection form fields
    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 5432 },
      { name: 'database', label: 'Database', type: FIELD_TYPES.TEXT, required: true, placeholder: 'mydb' },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: true },
      {
        name: 'sslMode',
        label: 'SSL Mode',
        type: FIELD_TYPES.SELECT,
        required: false,
        default: 'prefer',
        options: [
          { value: 'disable', label: 'Disable' },
          { value: 'allow', label: 'Allow' },
          { value: 'prefer', label: 'Prefer' },
          { value: 'require', label: 'Require' },
          { value: 'verify-ca', label: 'Verify CA' },
          { value: 'verify-full', label: 'Verify Full' },
        ],
      },
    ],

    // Build connection string
    buildConnectionString: (params) => {
      const ssl = params.sslMode && params.sslMode !== 'disable' ? `?sslmode=${params.sslMode}` : '';
      return `postgresql://${params.username}:${encodeURIComponent(params.password)}@${params.host}:${params.port}/${params.database}${ssl}`;
    },
  },

  // ========================================
  // Neo4j
  // ========================================
  {
    id: 'neo4j',
    name: 'Neo4j',
    description: 'Graph database for connected data',
    category: DATABASE_CATEGORIES.GRAPH,
    icon: 'GitBranch',
    color: '#018BFF',

    mcpServer: {
      name: 'mcp__neo4j',
      dockerEndpoint: 'tas-neo4j-shared:7687',
      kubernetesEndpoint: 'neo4j-shared.tas-shared.svc.cluster.local:7687',
      externalPort: 7687,
    },

    defaults: {
      port: 7687,
      protocol: 'bolt',
      encrypted: true,
    },

    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 7687 },
      {
        name: 'protocol',
        label: 'Protocol',
        type: FIELD_TYPES.SELECT,
        required: true,
        default: 'bolt',
        options: [
          { value: 'bolt', label: 'Bolt' },
          { value: 'bolt+s', label: 'Bolt (TLS)' },
          { value: 'bolt+ssc', label: 'Bolt (Self-signed TLS)' },
          { value: 'neo4j', label: 'Neo4j' },
          { value: 'neo4j+s', label: 'Neo4j (TLS)' },
        ],
      },
      { name: 'database', label: 'Database', type: FIELD_TYPES.TEXT, required: false, placeholder: 'neo4j', default: 'neo4j' },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true, default: 'neo4j' },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: true },
    ],

    buildConnectionString: (params) => {
      return `${params.protocol}://${params.host}:${params.port}`;
    },
  },

  // ========================================
  // DeepLake (Vector Database)
  // ========================================
  {
    id: 'deeplake',
    name: 'DeepLake',
    description: 'Vector database for AI/ML workloads',
    category: DATABASE_CATEGORIES.VECTOR,
    icon: 'Layers',
    color: '#00A4DC',

    mcpServer: {
      name: 'mcp__deeplake',
      dockerEndpoint: 'tas-deeplake-api:8000',
      kubernetesEndpoint: 'deeplake-api.aether-be.svc.cluster.local:8000',
      externalPort: 8000,
    },

    defaults: {
      port: 8000,
    },

    fields: [
      { name: 'host', label: 'API Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 8000 },
      { name: 'apiKey', label: 'API Key', type: FIELD_TYPES.PASSWORD, required: false, placeholder: 'Optional API key' },
      { name: 'dataset', label: 'Default Dataset', type: FIELD_TYPES.TEXT, required: false, placeholder: 'my-dataset' },
    ],

    buildConnectionString: (params) => {
      return `http://${params.host}:${params.port}`;
    },
  },

  // ========================================
  // Redis
  // ========================================
  {
    id: 'redis',
    name: 'Redis',
    description: 'In-memory data store for caching and messaging',
    category: DATABASE_CATEGORIES.KEY_VALUE,
    icon: 'Zap',
    color: '#DC382D',

    mcpServer: {
      name: 'mcp__redis',
      dockerEndpoint: 'tas-redis-shared:6379',
      kubernetesEndpoint: 'redis-shared.tas-shared.svc.cluster.local:6379',
      externalPort: 6379,
    },

    defaults: {
      port: 6379,
      db: 0,
    },

    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 6379 },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: false },
      { name: 'db', label: 'Database Number', type: FIELD_TYPES.NUMBER, required: false, default: 0 },
      { name: 'tls', label: 'Use TLS', type: FIELD_TYPES.TOGGLE, required: false, default: false },
    ],

    buildConnectionString: (params) => {
      const auth = params.password ? `:${encodeURIComponent(params.password)}@` : '';
      const protocol = params.tls ? 'rediss' : 'redis';
      return `${protocol}://${auth}${params.host}:${params.port}/${params.db || 0}`;
    },
  },

  // ========================================
  // MySQL
  // ========================================
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    category: DATABASE_CATEGORIES.RELATIONAL,
    icon: 'Database',
    color: '#4479A1',

    mcpServer: null, // No dedicated MCP server yet - uses generic SQL MCP

    defaults: {
      port: 3306,
    },

    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 3306 },
      { name: 'database', label: 'Database', type: FIELD_TYPES.TEXT, required: true },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: true },
      { name: 'ssl', label: 'Use SSL', type: FIELD_TYPES.TOGGLE, required: false, default: false },
    ],

    buildConnectionString: (params) => {
      const ssl = params.ssl ? '?ssl=true' : '';
      return `mysql://${params.username}:${encodeURIComponent(params.password)}@${params.host}:${params.port}/${params.database}${ssl}`;
    },
  },

  // ========================================
  // MongoDB
  // ========================================
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Document-oriented NoSQL database',
    category: DATABASE_CATEGORIES.DOCUMENT,
    icon: 'FileText',
    color: '#47A248',

    mcpServer: null,

    defaults: {
      port: 27017,
    },

    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 27017 },
      { name: 'database', label: 'Database', type: FIELD_TYPES.TEXT, required: true },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: false },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: false },
      { name: 'authSource', label: 'Auth Source', type: FIELD_TYPES.TEXT, required: false, default: 'admin' },
      { name: 'replicaSet', label: 'Replica Set', type: FIELD_TYPES.TEXT, required: false },
      { name: 'tls', label: 'Use TLS', type: FIELD_TYPES.TOGGLE, required: false, default: false },
    ],

    buildConnectionString: (params) => {
      const auth = params.username && params.password
        ? `${params.username}:${encodeURIComponent(params.password)}@`
        : '';
      let options = [];
      if (params.authSource) options.push(`authSource=${params.authSource}`);
      if (params.replicaSet) options.push(`replicaSet=${params.replicaSet}`);
      if (params.tls) options.push('tls=true');
      const queryString = options.length > 0 ? `?${options.join('&')}` : '';
      return `mongodb://${auth}${params.host}:${params.port}/${params.database}${queryString}`;
    },
  },

  // ========================================
  // Snowflake
  // ========================================
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data warehouse',
    category: DATABASE_CATEGORIES.WAREHOUSE,
    icon: 'Snowflake',
    color: '#29B5E8',

    mcpServer: null,

    defaults: {},

    fields: [
      { name: 'account', label: 'Account Identifier', type: FIELD_TYPES.TEXT, required: true, placeholder: 'org-account' },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: true },
      { name: 'warehouse', label: 'Warehouse', type: FIELD_TYPES.TEXT, required: true },
      { name: 'database', label: 'Database', type: FIELD_TYPES.TEXT, required: true },
      { name: 'schema', label: 'Schema', type: FIELD_TYPES.TEXT, required: false, default: 'PUBLIC' },
      { name: 'role', label: 'Role', type: FIELD_TYPES.TEXT, required: false },
    ],

    buildConnectionString: (params) => {
      return `snowflake://${params.username}:${encodeURIComponent(params.password)}@${params.account}/${params.database}/${params.schema || 'PUBLIC'}?warehouse=${params.warehouse}${params.role ? `&role=${params.role}` : ''}`;
    },
  },

  // ========================================
  // BigQuery
  // ========================================
  {
    id: 'bigquery',
    name: 'BigQuery',
    description: 'Google Cloud data warehouse',
    category: DATABASE_CATEGORIES.WAREHOUSE,
    icon: 'CloudLightning',
    color: '#4285F4',

    mcpServer: null,

    defaults: {},

    fields: [
      { name: 'projectId', label: 'Project ID', type: FIELD_TYPES.TEXT, required: true, placeholder: 'my-gcp-project' },
      { name: 'dataset', label: 'Default Dataset', type: FIELD_TYPES.TEXT, required: false },
      { name: 'credentials', label: 'Service Account JSON', type: FIELD_TYPES.FILE, required: true, accept: '.json' },
      { name: 'location', label: 'Location', type: FIELD_TYPES.TEXT, required: false, default: 'US' },
    ],

    buildConnectionString: (params) => {
      return `bigquery://${params.projectId}${params.dataset ? `/${params.dataset}` : ''}`;
    },
  },

  // ========================================
  // SQL Server
  // ========================================
  {
    id: 'sqlserver',
    name: 'SQL Server',
    description: 'Microsoft SQL Server',
    category: DATABASE_CATEGORIES.RELATIONAL,
    icon: 'Database',
    color: '#CC2927',

    mcpServer: null,

    defaults: {
      port: 1433,
    },

    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 1433 },
      { name: 'database', label: 'Database', type: FIELD_TYPES.TEXT, required: true },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: true },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: true },
      { name: 'encrypt', label: 'Encrypt Connection', type: FIELD_TYPES.TOGGLE, required: false, default: true },
      { name: 'trustServerCertificate', label: 'Trust Server Certificate', type: FIELD_TYPES.TOGGLE, required: false, default: false },
    ],

    buildConnectionString: (params) => {
      return `sqlserver://${params.username}:${encodeURIComponent(params.password)}@${params.host}:${params.port}/${params.database}?encrypt=${params.encrypt}&trustServerCertificate=${params.trustServerCertificate}`;
    },
  },

  // ========================================
  // Elasticsearch
  // ========================================
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    description: 'Distributed search and analytics engine',
    category: DATABASE_CATEGORIES.SEARCH,
    icon: 'Search',
    color: '#FEC514',

    mcpServer: null,

    defaults: {
      port: 9200,
    },

    fields: [
      { name: 'host', label: 'Host', type: FIELD_TYPES.TEXT, required: true, placeholder: 'localhost' },
      { name: 'port', label: 'Port', type: FIELD_TYPES.NUMBER, required: true, default: 9200 },
      { name: 'username', label: 'Username', type: FIELD_TYPES.TEXT, required: false },
      { name: 'password', label: 'Password', type: FIELD_TYPES.PASSWORD, required: false },
      { name: 'apiKey', label: 'API Key', type: FIELD_TYPES.PASSWORD, required: false, placeholder: 'Alternative to user/password' },
      { name: 'cloudId', label: 'Cloud ID', type: FIELD_TYPES.TEXT, required: false, placeholder: 'For Elastic Cloud' },
      { name: 'tls', label: 'Use TLS', type: FIELD_TYPES.TOGGLE, required: false, default: true },
    ],

    buildConnectionString: (params) => {
      if (params.cloudId) {
        return `elastic+cloud://${params.cloudId}`;
      }
      const protocol = params.tls ? 'https' : 'http';
      const auth = params.username && params.password
        ? `${params.username}:${encodeURIComponent(params.password)}@`
        : '';
      return `${protocol}://${auth}${params.host}:${params.port}`;
    },
  },

  // ========================================
  // DuckDB
  // ========================================
  {
    id: 'duckdb',
    name: 'DuckDB',
    description: 'In-process OLAP database',
    category: DATABASE_CATEGORIES.EMBEDDED,
    icon: 'HardDrive',
    color: '#FFF000',

    mcpServer: null,

    defaults: {},

    fields: [
      { name: 'path', label: 'Database File Path', type: FIELD_TYPES.TEXT, required: true, placeholder: '/path/to/database.duckdb' },
      { name: 'readOnly', label: 'Read Only', type: FIELD_TYPES.TOGGLE, required: false, default: false },
      { name: 'accessMode', label: 'Access Mode', type: FIELD_TYPES.SELECT, required: false, default: 'automatic',
        options: [
          { value: 'automatic', label: 'Automatic' },
          { value: 'read_write', label: 'Read/Write' },
          { value: 'read_only', label: 'Read Only' },
        ],
      },
    ],

    buildConnectionString: (params) => {
      return params.path || ':memory:';
    },
  },

  // ========================================
  // SQLite
  // ========================================
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Lightweight embedded SQL database',
    category: DATABASE_CATEGORIES.EMBEDDED,
    icon: 'HardDrive',
    color: '#003B57',

    mcpServer: null,

    defaults: {},

    fields: [
      { name: 'path', label: 'Database File Path', type: FIELD_TYPES.TEXT, required: true, placeholder: '/path/to/database.sqlite' },
      { name: 'mode', label: 'Mode', type: FIELD_TYPES.SELECT, required: false, default: 'rwc',
        options: [
          { value: 'rwc', label: 'Read/Write/Create' },
          { value: 'rw', label: 'Read/Write' },
          { value: 'ro', label: 'Read Only' },
          { value: 'memory', label: 'In Memory' },
        ],
      },
    ],

    buildConnectionString: (params) => {
      if (params.mode === 'memory') {
        return ':memory:';
      }
      return `sqlite://${params.path}?mode=${params.mode || 'rwc'}`;
    },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get database type by ID
 * @param {string} id - Database type ID
 * @returns {object|undefined} Database type configuration
 */
export const getDatabaseTypeById = (id) => {
  return DATABASE_TYPES.find(db => db.id === id);
};

/**
 * Get all database types by category
 * @param {string} category - Category ID
 * @returns {array} Filtered database types
 */
export const getDatabaseTypesByCategory = (category) => {
  return DATABASE_TYPES.filter(db => db.category === category);
};

/**
 * Get database types that have MCP server support
 * @returns {array} Database types with MCP servers
 */
export const getDatabaseTypesWithMcp = () => {
  return DATABASE_TYPES.filter(db => db.mcpServer !== null);
};

/**
 * Get the appropriate endpoint for a database type based on environment
 * @param {string} dbTypeId - Database type ID
 * @param {string} environment - 'docker' | 'kubernetes' | 'external'
 * @returns {string|null} Endpoint URL or null if not applicable
 */
export const getEndpointForEnvironment = (dbTypeId, environment) => {
  const dbType = getDatabaseTypeById(dbTypeId);
  if (!dbType?.mcpServer) return null;

  switch (environment) {
    case 'docker':
      return dbType.mcpServer.dockerEndpoint;
    case 'kubernetes':
      return dbType.mcpServer.kubernetesEndpoint;
    case 'external':
      return `localhost:${dbType.mcpServer.externalPort}`;
    default:
      return null;
  }
};

/**
 * Validate connection parameters for a database type
 * @param {string} dbTypeId - Database type ID
 * @param {object} params - Connection parameters
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateConnectionParams = (dbTypeId, params) => {
  const dbType = getDatabaseTypeById(dbTypeId);
  if (!dbType) {
    return { valid: false, errors: ['Unknown database type'] };
  }

  const errors = [];

  for (const field of dbType.fields) {
    if (field.required && (!params[field.name] || params[field.name] === '')) {
      errors.push(`${field.label} is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Build a connection string for a database type
 * @param {string} dbTypeId - Database type ID
 * @param {object} params - Connection parameters
 * @returns {string|null} Connection string or null if build fails
 */
export const buildConnectionString = (dbTypeId, params) => {
  const dbType = getDatabaseTypeById(dbTypeId);
  if (!dbType?.buildConnectionString) return null;

  try {
    return dbType.buildConnectionString(params);
  } catch (error) {
    console.error(`Failed to build connection string for ${dbTypeId}:`, error);
    return null;
  }
};

export default DATABASE_TYPES;
