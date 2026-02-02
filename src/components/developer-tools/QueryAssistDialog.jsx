import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Copy, Check, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { useQueryAssist, hasQueryAssistant } from '../../hooks/useQueryAssist.js';

/**
 * Get display name for database type
 */
const getDatabaseDisplayName = (databaseType) => {
  const names = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mariadb: 'MariaDB',
    sqlserver: 'SQL Server',
    sqlite: 'SQLite',
    duckdb: 'DuckDB',
    neo4j: 'Neo4j',
    mongodb: 'MongoDB',
    redis: 'Redis',
    elasticsearch: 'Elasticsearch',
    snowflake: 'Snowflake',
    bigquery: 'BigQuery',
    deeplake: 'DeepLake',
  };
  return names[databaseType?.toLowerCase()] || databaseType || 'Unknown';
};

/**
 * QueryAssistDialog - A chat dialog for AI-assisted SQL/Cypher query authoring
 * Uses database-specific internal agents to help users write, optimize, and debug queries
 */
const QueryAssistDialog = ({
  isOpen,
  onClose,
  onApply,
  databaseType,
  currentQuery = '',
  tables = [],
  schemaInfo = null,
  connectionName = ''
}) => {
  const {
    loading,
    error,
    messages,
    hasAssistant,
    sendMessage,
    startConversation,
    extractSuggestion,
    clearConversation
  } = useQueryAssist(databaseType);

  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const dbDisplayName = getDatabaseDisplayName(databaseType);
  const isSupported = hasQueryAssistant(databaseType);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Clear conversation when database type changes or dialog closes
  useEffect(() => {
    if (!isOpen) {
      clearConversation();
    }
  }, [isOpen, databaseType, clearConversation]);

  // Don't auto-start conversation - wait for user input

  // Build schema context string with tables and columns
  const buildSchemaContext = () => {
    // Use schemaInfo if available (has full schema.table names)
    if (schemaInfo && schemaInfo.length > 0) {
      const tablesWithColumns = schemaInfo
        .filter(t => t.columns && t.columns.length > 0)
        .slice(0, 10); // Limit to 10 tables with full column info

      const tablesWithoutColumns = schemaInfo
        .filter(t => !t.columns || t.columns.length === 0)
        .slice(0, 30)
        .map(t => t.name); // t.name includes schema prefix (e.g., "public.agents")

      // Build result showing tables with columns first, then others
      const resultParts = [];

      if (tablesWithColumns.length > 0) {
        const schemaLines = tablesWithColumns.map(table => {
          const columnList = table.columns
            .slice(0, 15)
            .map(col => `${col.name} (${col.type})`)
            .join(', ');
          const moreColumns = table.columns.length > 15 ? ` +${table.columns.length - 15} more` : '';
          return `- ${table.name}: ${columnList}${moreColumns}`;
        });
        resultParts.push(`Tables with schema:\n${schemaLines.join('\n')}`);
      }

      if (tablesWithoutColumns.length > 0) {
        resultParts.push(`Available tables: ${tablesWithoutColumns.join(', ')}`);
      }

      if (resultParts.length > 0) {
        return resultParts.join('\n\n');
      }
    }

    // Fallback to simple table list (should already have schema prefixes)
    if (tables && tables.length > 0) {
      return `Available tables: ${tables.join(', ')}`;
    }

    return null;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    let message = inputValue.trim();
    setInputValue('');

    // On first message, include context about available tables and current query
    if (messages.length === 0) {
      const contextParts = [];

      const schemaContext = buildSchemaContext();
      if (schemaContext) {
        contextParts.push(schemaContext);
      }

      if (currentQuery && currentQuery.trim()) {
        const lang = databaseType === 'neo4j' ? 'cypher' : 'sql';
        contextParts.push(`Current query:\n\`\`\`${lang}\n${currentQuery}\n\`\`\``);
      }

      if (contextParts.length > 0) {
        message = `${message}\n\n${contextParts.join('\n\n')}`;
      }
    }

    await sendMessage(message, {
      currentQuery,
      tables,
      schemaInfo,
      connectionName,
      databaseType
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = () => {
    const suggestion = extractSuggestion();
    if (suggestion && suggestion.recommendation) {
      onApply(suggestion.recommendation);
      onClose();
    }
  };

  const handleCopy = async () => {
    const suggestion = extractSuggestion();
    if (suggestion && suggestion.recommendation) {
      await navigator.clipboard.writeText(suggestion.recommendation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get the current suggestion for displaying reasoning/comments
  const currentSuggestion = messages.length > 0 ? extractSuggestion() : null;

  // Helper to format assistant message content for display
  const formatAssistantContent = (content) => {
    if (!content) return '';

    // Helper to check if content looks like JSON
    const looksLikeJSON = (text) => {
      const trimmed = text.trim();
      return trimmed.startsWith('{') || trimmed.startsWith('[');
    };

    // Helper to extract and format JSON recommendation
    const tryExtractRecommendation = (text) => {
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.recommendation) {
          return typeof parsed.recommendation === 'string'
            ? parsed.recommendation
            : JSON.stringify(parsed.recommendation, null, 2);
        }
      } catch {
        // Not valid JSON
      }
      return null;
    };

    // Try to parse content directly as JSON
    let result = tryExtractRecommendation(content);
    if (result) return result;

    // Try extracting JSON from ```json code blocks
    const jsonBlockMatch = content.match(/```json\s*\n?([\s\S]+?)\n?```/);
    if (jsonBlockMatch) {
      result = tryExtractRecommendation(jsonBlockMatch[1].trim());
      if (result) return result;
    }

    // Try extracting JSON from generic ``` code blocks (if content looks like JSON)
    const genericBlockMatch = content.match(/```\s*\n?([\s\S]+?)\n?```/);
    if (genericBlockMatch && looksLikeJSON(genericBlockMatch[1])) {
      result = tryExtractRecommendation(genericBlockMatch[1].trim());
      if (result) return result;
    }

    // Return original content
    return content;
  };

  const handleNewConversation = () => {
    clearConversation();
    const context = {
      currentQuery,
      tables,
      schemaInfo,
      connectionName,
      databaseType
    };
    startConversation(context);
  };

  if (!isOpen) return null;

  // Show unsupported database message
  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Query Assistant</h2>
                <p className="text-sm text-gray-500">Not available for {dbDisplayName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 text-center">
            <Database size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No AI Assistant Available
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              The Query Assistant is currently available for:
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {['PostgreSQL', 'MySQL', 'MariaDB', 'SQL Server', 'SQLite', 'DuckDB', 'Neo4j'].map(db => (
                <span key={db} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  {db}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Support for {dbDisplayName} may be added in a future update.
            </p>
          </div>

          <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Query Assistant</h2>
              <p className="text-sm text-gray-500">
                {dbDisplayName} query help
                {connectionName && <span className="ml-1">• {connectionName}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Start new conversation"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Current Query Context - show if there's a query being refined */}
        {currentQuery && currentQuery.trim() && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Working with query:</span>
            </div>
            <div className="mt-1 bg-white rounded border border-blue-200 p-2 max-h-20 overflow-auto">
              <code className="text-xs text-blue-800 whitespace-pre-wrap font-mono">
                {currentQuery.length > 200 ? currentQuery.substring(0, 200) + '...' : currentQuery}
              </code>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {/* Empty state - show helpful prompts */}
          {messages.length === 0 && !loading && (
            <div className="text-center py-8">
              <Sparkles size={32} className="mx-auto text-purple-300 mb-4" />
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                How can I help with your {dbDisplayName} query?
              </h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                {currentQuery && currentQuery.trim()
                  ? 'Ask me to improve, explain, or debug your query.'
                  : 'Describe what you want to query, or paste a query you need help with.'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {(currentQuery && currentQuery.trim() ? [
                  'Optimize this query',
                  'Explain this query',
                  'Find potential issues',
                  'Add filtering'
                ] : [
                  'Write a SELECT query',
                  'Optimize my query',
                  'Help with JOINs',
                  'Explain this query'
                ]).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {tables && tables.length > 0 && (
                <p className="text-xs text-gray-400 mt-4">
                  Available tables: {tables.slice(0, 5).join(', ')}{tables.length > 5 ? `, +${tables.length - 5} more` : ''}
                </p>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-(--color-primary-600) text-(--color-primary-contrast)'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {message.role === 'assistant'
                    ? formatAssistantContent(message.content)
                    : message.content}
                </div>
                {message.role === 'assistant' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    {/* Show reasoning if available (from JSON response) */}
                    {index === messages.length - 1 && currentSuggestion?.reasoning && (
                      <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded font-sans">
                        <span className="font-medium">Why: </span>
                        {currentSuggestion.reasoning}
                      </div>
                    )}
                    {/* Show comments/questions if available */}
                    {index === messages.length - 1 && currentSuggestion?.comments && (
                      <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded font-sans">
                        {currentSuggestion.comments}
                      </div>
                    )}
                    <button
                      onClick={handleCopy}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-sans"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy query
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to query, or ask for help..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 text-sm"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500">
            Query will be inserted into the editor
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={messages.length < 2 || !currentSuggestion?.recommendation}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
            >
              <Check size={16} />
              Apply Query
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryAssistDialog;
