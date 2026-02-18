import { useState, useCallback } from 'react';
import { api } from '../services/api.js';

/**
 * Database-specific Query Assistant Agent IDs (seeded in database)
 * These match the UUIDs in tas-agent-builder migrations 008-014
 */
export const QUERY_ASSISTANT_AGENTS = {
  // PostgreSQL - support both frontend config name and backend name
  postgresql: '00000000-0000-0000-0000-000000000002',
  postgres: '00000000-0000-0000-0000-000000000002',
  // MySQL
  mysql: '00000000-0000-0000-0000-000000000003',
  // MariaDB
  mariadb: '00000000-0000-0000-0000-000000000004',
  // SQL Server
  sqlserver: '00000000-0000-0000-0000-000000000005',
  mssql: '00000000-0000-0000-0000-000000000005',
  // SQLite
  sqlite: '00000000-0000-0000-0000-000000000006',
  // DuckDB
  duckdb: '00000000-0000-0000-0000-000000000007',
  // Neo4j
  neo4j: '00000000-0000-0000-0000-000000000008',
};

/**
 * Get the Query Assistant Agent ID for a given database type
 * @param {string} databaseType - Database type ID (e.g., 'postgresql', 'mysql')
 * @returns {string|null} Agent UUID or null if not supported
 */
export const getQueryAssistantId = (databaseType) => {
  const normalizedType = databaseType?.toLowerCase();
  return QUERY_ASSISTANT_AGENTS[normalizedType] || null;
};

/**
 * Check if a database type has a Query Assistant agent
 * @param {string} databaseType - Database type ID
 * @returns {boolean}
 */
export const hasQueryAssistant = (databaseType) => {
  return getQueryAssistantId(databaseType) !== null;
};

/**
 * Hook for AI-assisted SQL query authoring using database-specific agents
 * Provides conversation-based assistance for writing, optimizing, and debugging queries
 *
 * @param {string} databaseType - The database type (e.g., 'postgresql', 'mysql', 'neo4j')
 */
export const useQueryAssist = (databaseType) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const agentId = getQueryAssistantId(databaseType);

  /**
   * Send a message to the Query Assistant
   * @param {string} input - User's message
   * @param {object} context - Context about the query being written
   * @param {string} context.currentQuery - Current SQL/Cypher query text
   * @param {string[]} context.tables - Available table names
   * @param {object} context.schema - Schema information (optional)
   * @param {string} context.connectionName - Name of the database connection
   */
  const sendMessage = useCallback(async (input, context = null) => {
    if (!agentId) {
      setError(`No Query Assistant available for database type: ${databaseType}`);
      return { success: false, error: 'Unsupported database type' };
    }

    try {
      setLoading(true);
      setError(null);

      // Add user message to history
      const userMessage = {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Convert message history to the format expected by the API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Execute the database-specific Query Assistant agent
      const response = await api.internalAgents.executeById(
        agentId,
        input,
        history,
        sessionId,
        context
      );

      // Update session ID if returned
      if (response.conversation_id) {
        setSessionId(response.conversation_id);
      }

      // Add assistant message to history
      const assistantMessage = {
        role: 'assistant',
        content: response.output,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      return {
        success: true,
        output: response.output,
        metadata: response.metadata
      };
    } catch (err) {
      console.error('Failed to send message to Query Assistant:', err);
      setError(err.message || 'Failed to get assistance');

      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [agentId, databaseType, messages, sessionId]);

  /**
   * Build schema context string with tables and columns
   * @param {object} context - Context containing tables and schemaInfo
   */
  const buildSchemaContext = (context) => {
    // If we have detailed schema info with columns, use that
    if (context.schemaInfo && context.schemaInfo.length > 0) {
      const tablesWithColumns = context.schemaInfo
        .filter(t => t.columns && t.columns.length > 0)
        .slice(0, 10); // Limit to 10 tables

      if (tablesWithColumns.length > 0) {
        const schemaLines = tablesWithColumns.map(table => {
          const columnList = table.columns
            .slice(0, 15)
            .map(col => `${col.name} (${col.type})`)
            .join(', ');
          const moreColumns = table.columns.length > 15 ? ` +${table.columns.length - 15} more` : '';
          return `- ${table.name}: ${columnList}${moreColumns}`;
        });

        const tablesWithoutColumns = context.schemaInfo
          .filter(t => !t.columns || t.columns.length === 0)
          .slice(0, 20)
          .map(t => t.name);

        let result = `Database schema:\n${schemaLines.join('\n')}`;
        if (tablesWithoutColumns.length > 0) {
          result += `\n\nOther tables: ${tablesWithoutColumns.join(', ')}`;
        }
        return result;
      }
    }

    // Fallback to simple table list
    if (context.tables && context.tables.length > 0) {
      return `Available tables: ${context.tables.join(', ')}`;
    }

    return null;
  };

  /**
   * Start a new conversation with initial context
   * @param {object} context - Context about what needs assistance
   */
  const startConversation = useCallback(async (context) => {
    if (!agentId) {
      setError(`No Query Assistant available for database type: ${databaseType}`);
      return { success: false, error: 'Unsupported database type' };
    }

    // Clear previous conversation
    setMessages([]);
    setSessionId(null);
    setError(null);

    // Build initial prompt based on context
    let initialPrompt = '';
    const dbLabel = databaseType === 'neo4j' ? 'Cypher' : 'SQL';
    const schemaContext = buildSchemaContext(context);

    if (context.currentQuery && context.currentQuery.trim()) {
      initialPrompt = `I need help with this ${dbLabel} query:\n\n\`\`\`${databaseType === 'neo4j' ? 'cypher' : 'sql'}\n${context.currentQuery}\n\`\`\``;

      if (schemaContext) {
        initialPrompt += `\n\n${schemaContext}`;
      }

      if (context.connectionName) {
        initialPrompt += `\n\nDatabase: ${context.connectionName}`;
      }

      initialPrompt += '\n\nCan you help me improve, optimize, or fix this query?';
    } else {
      initialPrompt = `I need help writing a ${dbLabel} query.`;

      if (schemaContext) {
        initialPrompt += `\n\n${schemaContext}`;
      }

      if (context.connectionName) {
        initialPrompt += `\n\nDatabase: ${context.connectionName}`;
      }

      initialPrompt += '\n\nWhat kind of query would you like to create?';
    }

    // Send the initial message
    return sendMessage(initialPrompt, context);
  }, [agentId, databaseType, sendMessage]);

  /**
   * Extract the suggested query from assistant messages
   * Prioritizes JSON recommendations (which contain reasoning), then SQL code blocks
   * Returns: { recommendation: string, reasoning: string|null, comments: string|null }
   */
  const extractSuggestion = useCallback(() => {
    // Get all assistant messages in reverse order (most recent first)
    const assistantMessages = [...messages].reverse().filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) return null;

    // Helper to create a structured result
    const createResult = (recommendation, reasoning = null, comments = null) => ({
      recommendation,
      reasoning,
      comments
    });

    // Helper to check if content looks like JSON (starts with { or [)
    const looksLikeJSON = (text) => {
      const trimmed = text.trim();
      return trimmed.startsWith('{') || trimmed.startsWith('[');
    };

    // Helper to check if text looks like a raw query (not natural language explanation)
    const looksLikeQuery = (text) => {
      if (!text || typeof text !== 'string') return false;
      const trimmed = text.trim();
      // Starts with a SQL/Cypher keyword
      return /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|MATCH|MERGE|WITH|CALL|UNWIND|OPTIONAL|LOAD|FOREACH)\b/i.test(trimmed);
    };

    // Helper to extract a query from within text that may contain code blocks
    const extractQueryFromText = (text) => {
      if (!text || typeof text !== 'string') return null;
      // Check for cypher/sql code blocks within the text
      const codeBlockMatch = text.match(/```(?:cypher|sql|postgresql|mysql|pgsql)?\s*\n?([\s\S]+?)\n?```/i);
      if (codeBlockMatch) {
        const block = codeBlockMatch[1].trim();
        if (block.length >= 10 && !looksLikeJSON(block)) return block;
      }
      return null;
    };

    // Helper to try parsing JSON from content
    const tryParseJSON = (text) => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed) return null;

        const reasoning = parsed.reasoning || null;
        const comments = parsed.comments || null;

        // Prefer explicit query/sql/cypher fields over recommendation
        const queryField = parsed.query || parsed.sql || parsed.cypher;
        if (queryField && typeof queryField === 'string' && queryField.trim().length > 0) {
          return createResult(queryField.trim(), reasoning, comments);
        }

        if (parsed.recommendation) {
          const rec = parsed.recommendation;
          if (typeof rec === 'string') {
            // If recommendation looks like a raw query, use it directly
            if (looksLikeQuery(rec)) {
              return createResult(rec, reasoning, comments);
            }
            // If recommendation contains embedded code blocks, extract the query
            const embeddedQuery = extractQueryFromText(rec);
            if (embeddedQuery) {
              return createResult(embeddedQuery, reasoning, comments);
            }
            // Fallback: use recommendation as-is
            return createResult(rec, reasoning, comments);
          }
        }
      } catch {
        // Not valid JSON
      }
      return null;
    };

    // Helper to extract SQL/Cypher from explicitly tagged code blocks
    const tryExtractSQLCodeBlock = (content) => {
      if (!content) return null;

      // Only match code blocks with explicit SQL/Cypher language tags
      const sqlBlockMatch = content.match(/```(sql|cypher|postgresql|mysql|pgsql)\s*\n?([\s\S]+?)\n?```/i);
      if (sqlBlockMatch) {
        const query = sqlBlockMatch[2].trim();
        // Verify it looks like a query and NOT like JSON
        if (query.length >= 10 && !looksLikeJSON(query) &&
            /(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|MATCH|MERGE|WITH|CALL)\b/i.test(query)) {
          return query;
        }
      }

      return null;
    };

    // Helper to extract inline SQL statements
    const tryExtractInlineSQL = (content) => {
      if (!content) return null;

      // Look for SQL statements that span multiple lines or end with semicolon
      const sqlPatterns = [
        // SELECT statement (greedy, multiline)
        /\b(SELECT\s+[\s\S]*?(?:;|$))/i,
        // INSERT statement
        /\b(INSERT\s+INTO\s+[\s\S]*?(?:;|$))/i,
        // UPDATE statement
        /\b(UPDATE\s+[\s\S]*?(?:;|$))/i,
        // DELETE statement
        /\b(DELETE\s+FROM\s+[\s\S]*?(?:;|$))/i,
        // Cypher MATCH
        /\b(MATCH\s+[\s\S]*?RETURN\s+[\s\S]*?(?:;|$))/i,
        // CREATE TABLE/INDEX
        /\b(CREATE\s+(?:TABLE|INDEX|VIEW)\s+[\s\S]*?(?:;|$))/i,
      ];

      for (const pattern of sqlPatterns) {
        const match = content.match(pattern);
        if (match && match[1].trim().length >= 15) {
          return match[1].trim();
        }
      }

      return null;
    };

    // 1. FIRST priority: Try JSON with recommendation field (includes reasoning/comments)
    for (const message of assistantMessages) {
      const content = message.content;
      if (!content) continue;

      // Try parsing content directly as JSON
      let result = tryParseJSON(content);
      if (result) return result;

      // Try extracting JSON from ```json blocks
      const jsonBlockMatch = content.match(/```json\s*\n?([\s\S]+?)\n?```/);
      if (jsonBlockMatch) {
        result = tryParseJSON(jsonBlockMatch[1].trim());
        if (result) return result;
      }

      // Try extracting JSON from generic ``` blocks (if content looks like JSON)
      const genericBlockMatch = content.match(/```\s*\n?([\s\S]+?)\n?```/);
      if (genericBlockMatch && looksLikeJSON(genericBlockMatch[1])) {
        result = tryParseJSON(genericBlockMatch[1].trim());
        if (result) return result;
      }

      // Try finding embedded JSON object with recommendation
      const jsonMatch = content.match(/\{[\s\S]*"recommendation"[\s\S]*?\}/);
      if (jsonMatch) {
        result = tryParseJSON(jsonMatch[0]);
        if (result) return result;
      }
    }

    // 2. Second priority: Look for explicitly tagged SQL/Cypher code blocks
    for (const message of assistantMessages) {
      const codeBlock = tryExtractSQLCodeBlock(message.content);
      if (codeBlock) {
        return createResult(codeBlock);
      }
    }

    // 3. Third priority: Extract inline SQL from the most recent message
    const lastContent = assistantMessages[0]?.content;
    if (lastContent) {
      const inlineSQL = tryExtractInlineSQL(lastContent);
      if (inlineSQL) {
        return createResult(inlineSQL);
      }
    }

    // 4. Fourth priority: Any code block that doesn't look like JSON
    for (const message of assistantMessages) {
      const content = message.content;
      if (!content) continue;

      const anyCodeBlock = content.match(/```\s*\n?([\s\S]+?)\n?```/);
      if (anyCodeBlock) {
        const blockContent = anyCodeBlock[1].trim();
        // Only use if it doesn't look like JSON and has reasonable length
        if (blockContent.length >= 10 && !looksLikeJSON(blockContent)) {
          return createResult(blockContent);
        }
      }
    }

    // 5. Last resort: Look for SQL-like content in plain text
    if (lastContent) {
      // Look for multi-line content that looks like SQL
      const lines = lastContent.split('\n');
      const sqlLines = [];
      let inSql = false;

      for (const line of lines) {
        const trimmed = line.trim();
        // Start capturing if we see a SQL keyword
        if (!inSql && /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(trimmed)) {
          inSql = true;
        }
        if (inSql) {
          sqlLines.push(line);
          // Stop if we hit a semicolon at end of line or empty line after content
          if (trimmed.endsWith(';') || (sqlLines.length > 1 && trimmed === '')) {
            break;
          }
        }
      }

      if (sqlLines.length > 0) {
        const sql = sqlLines.join('\n').trim();
        if (sql.length >= 15) {
          return createResult(sql);
        }
      }
    }

    return null;
  }, [messages]);

  /**
   * Clear the conversation and start fresh
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    messages,
    sessionId,
    agentId,
    databaseType,
    hasAssistant: !!agentId,
    sendMessage,
    startConversation,
    extractSuggestion,
    clearConversation
  };
};

export default useQueryAssist;
