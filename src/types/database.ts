/**
 * TypeScript definitions for Database Connection models
 * Generated from Go models in aether-be service
 */

// Database Types
export type DatabaseType = 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'sqlite';
export type DatabaseStatus = 'Pending' | 'Connected' | 'Failed' | 'Degraded';

// Database Connection Model
export interface Database {
  id: string;
  name: string;
  tenant_id: string;
  space_id: string;
  owner_id: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  ssl_mode?: string;
  secret_name: string;
  secret_namespace: string;
  crd_name: string;
  crd_namespace: string;
  readonly: boolean;
  max_rows: number;
  connection_timeout: number;
  query_timeout: number;
  status: DatabaseStatus;
  status_message?: string;
  last_checked?: string;  // ISO date string
  labels?: Record<string, string>;
  description?: string;
  created_at: string;     // ISO date string
  updated_at: string;     // ISO date string
}

// Database Create Request
export interface DatabaseCreateRequest {
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode?: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  readonly?: boolean;
  max_rows?: number;
  labels?: Record<string, string>;
  description?: string;
}

// Database Update Request
export interface DatabaseUpdateRequest {
  name?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl_mode?: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  readonly?: boolean;
  max_rows?: number;
  labels?: Record<string, string>;
  description?: string;
}

// Database Response (single)
export interface DatabaseResponse {
  id: string;
  name: string;
  tenant_id: string;
  space_id: string;
  owner_id: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  ssl_mode?: string;
  secret_name: string;
  secret_namespace: string;
  crd_name: string;
  crd_namespace: string;
  readonly: boolean;
  max_rows: number;
  connection_timeout: number;
  query_timeout: number;
  status: DatabaseStatus;
  status_message?: string;
  last_checked?: string;
  labels?: Record<string, string>;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Database List Response
export interface DatabaseListResponse {
  databases: Database[];
  total: number;
  page: number;
  page_size: number;
}

// Query Request
export interface QueryRequest {
  query: string;
  parameters?: unknown[];
}

// Query Response
export interface QueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  truncated: boolean;
  duration_ms: number;
}

// Schema Response
export interface SchemaResponse {
  databases?: string[];
  schemas?: string[];
  tables?: TableInfo[];
}

// Table Info
export interface TableInfo {
  name: string;
  schema?: string;
  row_count?: number;
  columns?: ColumnInfo[];
}

// Column Info
export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  default?: string;
}

// Connection Test Response
export interface ConnectionTestResponse {
  status: 'connected' | 'failed';
  message: string;
}

// Database Type Display Info (for UI)
export interface DatabaseTypeInfo {
  type: DatabaseType;
  name: string;
  icon: string;
  defaultPort: number;
  sslModes: string[];
}

// Database Type Configuration
export const DATABASE_TYPE_INFO: Record<DatabaseType, DatabaseTypeInfo> = {
  postgres: {
    type: 'postgres',
    name: 'PostgreSQL',
    icon: 'Database',
    defaultPort: 5432,
    sslModes: ['disable', 'require', 'verify-ca', 'verify-full'],
  },
  mysql: {
    type: 'mysql',
    name: 'MySQL',
    icon: 'Database',
    defaultPort: 3306,
    sslModes: ['disable', 'require'],
  },
  mariadb: {
    type: 'mariadb',
    name: 'MariaDB',
    icon: 'Database',
    defaultPort: 3306,
    sslModes: ['disable', 'require'],
  },
  sqlserver: {
    type: 'sqlserver',
    name: 'SQL Server',
    icon: 'Database',
    defaultPort: 1433,
    sslModes: ['disable', 'require'],
  },
  sqlite: {
    type: 'sqlite',
    name: 'SQLite',
    icon: 'Database',
    defaultPort: 0,
    sslModes: [],
  },
};

// Get default port for database type
export function getDefaultPort(type: DatabaseType): number {
  return DATABASE_TYPE_INFO[type]?.defaultPort ?? 0;
}

// Get display name for database type
export function getDatabaseTypeName(type: DatabaseType): string {
  return DATABASE_TYPE_INFO[type]?.name ?? type;
}

// Get status badge color
export function getStatusColor(status: DatabaseStatus): string {
  switch (status) {
    case 'Connected':
      return 'green';
    case 'Pending':
      return 'yellow';
    case 'Degraded':
      return 'orange';
    case 'Failed':
      return 'red';
    default:
      return 'gray';
  }
}
