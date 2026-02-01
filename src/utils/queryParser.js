/**
 * SQL Query Parser Utility
 *
 * Parses SQL queries to extract table names and detect parameters.
 * Used by the Add Data dialog to:
 * - Link saved queries to their referenced tables
 * - Detect parameters for substitution before execution
 */

/**
 * Extract table names from a SQL query
 * Handles:
 * - FROM clause (single and multiple tables)
 * - JOIN clauses (INNER, LEFT, RIGHT, FULL, CROSS)
 * - Schema-qualified names (e.g., public.users)
 * - Table aliases (e.g., users u)
 * - Subqueries (skipped, only top-level tables extracted)
 *
 * @param {string} query - SQL query text
 * @returns {string[]} - Array of unique table names
 */
export function extractTableNames(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const tables = new Set();

  // Normalize query: remove comments and extra whitespace
  let normalizedQuery = query
    // Remove single-line comments
    .replace(/--.*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Regex to match table names after FROM or JOIN keywords
  // Captures: schema.table or just table, followed by optional alias
  const tablePattern = /(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\s*(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)?/gi;

  let match;
  while ((match = tablePattern.exec(normalizedQuery)) !== null) {
    const tableName = match[1];
    // Skip if it looks like a subquery (would start with '(')
    const beforeMatch = normalizedQuery.substring(0, match.index);
    const afterKeyword = normalizedQuery.substring(match.index + match[0].indexOf(tableName));

    // Check if this is a subquery by looking for '(' immediately after FROM/JOIN
    if (afterKeyword.trim().startsWith('(')) {
      continue;
    }

    tables.add(tableName.toLowerCase());
  }

  // Also check for UPDATE and INSERT INTO statements
  const updatePattern = /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi;
  while ((match = updatePattern.exec(normalizedQuery)) !== null) {
    tables.add(match[1].toLowerCase());
  }

  const insertPattern = /INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi;
  while ((match = insertPattern.exec(normalizedQuery)) !== null) {
    tables.add(match[1].toLowerCase());
  }

  // DELETE FROM pattern
  const deletePattern = /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)/gi;
  while ((match = deletePattern.exec(normalizedQuery)) !== null) {
    tables.add(match[1].toLowerCase());
  }

  return Array.from(tables);
}

/**
 * Extract just the table name without schema prefix
 *
 * @param {string} qualifiedName - Potentially schema-qualified table name
 * @returns {string} - Just the table name
 */
export function getTableNameWithoutSchema(qualifiedName) {
  if (!qualifiedName) return '';
  const parts = qualifiedName.split('.');
  return parts[parts.length - 1];
}

/**
 * Extract schema from a qualified table name
 *
 * @param {string} qualifiedName - Potentially schema-qualified table name
 * @returns {string|null} - Schema name or null if not qualified
 */
export function getSchemaFromTableName(qualifiedName) {
  if (!qualifiedName) return null;
  const parts = qualifiedName.split('.');
  return parts.length > 1 ? parts[0] : null;
}

/**
 * Detect parameters in a SQL query
 * Supports multiple parameter formats:
 * - :paramName (standard named parameters)
 * - ${paramName} (template-style)
 * - {{paramName}} (mustache-style)
 *
 * @param {string} query - SQL query text
 * @returns {Object[]} - Array of parameter objects with name and type inference
 */
export function detectParameters(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const params = new Map();

  // Pattern for :paramName (e.g., :user_id, :start_date)
  const colonPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = colonPattern.exec(query)) !== null) {
    const paramName = match[1];
    if (!params.has(paramName)) {
      params.set(paramName, {
        name: paramName,
        type: inferParameterType(paramName),
        format: 'colon',
        placeholder: `:${paramName}`,
      });
    }
  }

  // Pattern for ${paramName}
  const dollarPattern = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  while ((match = dollarPattern.exec(query)) !== null) {
    const paramName = match[1];
    if (!params.has(paramName)) {
      params.set(paramName, {
        name: paramName,
        type: inferParameterType(paramName),
        format: 'dollar',
        placeholder: `\${${paramName}}`,
      });
    }
  }

  // Pattern for {{paramName}}
  const mustachePattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  while ((match = mustachePattern.exec(query)) !== null) {
    const paramName = match[1];
    if (!params.has(paramName)) {
      params.set(paramName, {
        name: paramName,
        type: inferParameterType(paramName),
        format: 'mustache',
        placeholder: `{{${paramName}}}`,
      });
    }
  }

  return Array.from(params.values());
}

/**
 * Infer parameter type from its name
 * Uses common naming conventions to suggest input type
 *
 * @param {string} paramName - Parameter name
 * @returns {string} - Inferred type: 'date', 'number', 'boolean', or 'text'
 */
export function inferParameterType(paramName) {
  const name = paramName.toLowerCase();

  // Date patterns
  if (
    name.includes('date') ||
    name.includes('time') ||
    name.includes('_at') ||
    name.endsWith('_on') ||
    name === 'from' ||
    name === 'to' ||
    name === 'start' ||
    name === 'end' ||
    name.includes('created') ||
    name.includes('updated') ||
    name.includes('deleted')
  ) {
    return 'date';
  }

  // Number patterns
  if (
    name.includes('id') ||
    name.includes('count') ||
    name.includes('num') ||
    name.includes('amount') ||
    name.includes('price') ||
    name.includes('quantity') ||
    name.includes('total') ||
    name.includes('limit') ||
    name.includes('offset') ||
    name.includes('page') ||
    name.includes('size') ||
    name.includes('age') ||
    name.includes('year') ||
    name.includes('month') ||
    name.includes('day')
  ) {
    return 'number';
  }

  // Boolean patterns
  if (
    name.includes('is_') ||
    name.includes('has_') ||
    name.includes('can_') ||
    name.includes('should_') ||
    name.includes('active') ||
    name.includes('enabled') ||
    name.includes('visible') ||
    name.includes('deleted') ||
    name === 'flag' ||
    name === 'status'
  ) {
    return 'boolean';
  }

  // Default to text
  return 'text';
}

/**
 * Substitute parameters in a query with actual values
 *
 * @param {string} query - SQL query with parameters
 * @param {Object} values - Object mapping parameter names to values
 * @returns {string} - Query with parameters replaced by values
 */
export function substituteParameters(query, values) {
  if (!query || typeof query !== 'string') {
    return query;
  }

  let result = query;

  Object.entries(values).forEach(([name, value]) => {
    // Format value based on type
    let formattedValue;
    if (value === null || value === undefined || value === '') {
      formattedValue = 'NULL';
    } else if (typeof value === 'number') {
      formattedValue = String(value);
    } else if (typeof value === 'boolean') {
      formattedValue = value ? 'TRUE' : 'FALSE';
    } else {
      // String - escape single quotes and wrap in quotes
      formattedValue = `'${String(value).replace(/'/g, "''")}'`;
    }

    // Replace all formats of this parameter
    result = result
      .replace(new RegExp(`:${name}\\b`, 'g'), formattedValue)
      .replace(new RegExp(`\\$\\{${name}\\}`, 'g'), formattedValue)
      .replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), formattedValue);
  });

  return result;
}

/**
 * Check if a saved query references a specific table
 *
 * @param {string} query - SQL query text
 * @param {string} tableName - Table name to check for
 * @returns {boolean} - True if query references the table
 */
export function queryReferencesTable(query, tableName) {
  const tables = extractTableNames(query);
  const normalizedTableName = tableName.toLowerCase();

  return tables.some((table) => {
    // Check exact match
    if (table === normalizedTableName) return true;

    // Check without schema prefix
    const tableOnly = getTableNameWithoutSchema(table);
    const searchTableOnly = getTableNameWithoutSchema(normalizedTableName);
    return tableOnly === searchTableOnly;
  });
}

/**
 * Find all saved queries that reference a specific table
 *
 * @param {Object[]} queries - Array of saved query objects
 * @param {string} tableName - Table name to search for
 * @returns {Object[]} - Queries that reference the table
 */
export function findQueriesForTable(queries, tableName) {
  if (!queries || !tableName) return [];

  return queries.filter((query) => {
    const queryText = query.query || query.sql || query.content;
    return queryReferencesTable(queryText, tableName);
  });
}

/**
 * Generate a quick action query for a table
 *
 * @param {string} tableName - Table name
 * @param {string} action - Action type: 'sample', 'count', 'stats'
 * @param {string[]} columns - Optional column names for stats query
 * @returns {string} - Generated SQL query
 */
export function generateQuickActionQuery(tableName, action, columns = []) {
  switch (action) {
    case 'sample':
      return `SELECT * FROM ${tableName} LIMIT 100`;

    case 'count':
      return `SELECT COUNT(*) as row_count FROM ${tableName}`;

    case 'stats':
      if (columns.length === 0) {
        // Generic stats without column info
        return `SELECT COUNT(*) as total_rows FROM ${tableName}`;
      }

      // Generate column statistics
      const statsExpressions = columns
        .slice(0, 10) // Limit to first 10 columns to avoid huge queries
        .map((col) => {
          // For each column, get count of non-null, distinct count
          return `
          COUNT(${col.name}) as ${col.name}_count,
          COUNT(DISTINCT ${col.name}) as ${col.name}_distinct`;
        })
        .join(',');

      return `SELECT
  COUNT(*) as total_rows,${statsExpressions}
FROM ${tableName}`;

    default:
      return `SELECT * FROM ${tableName} LIMIT 100`;
  }
}

export default {
  extractTableNames,
  getTableNameWithoutSchema,
  getSchemaFromTableName,
  detectParameters,
  inferParameterType,
  substituteParameters,
  queryReferencesTable,
  findQueriesForTable,
  generateQuickActionQuery,
};
