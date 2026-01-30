import React, { useState, useMemo } from 'react';
import {
  Table,
  ChevronRight,
  ChevronDown,
  Database,
  Search,
  RefreshCw,
  Folder,
  FolderOpen,
  Columns,
  Key,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  FileText,
  Loader2,
} from 'lucide-react';

/**
 * SchemaTree - Tree navigation component for database schema
 * Displays tables and their columns in an expandable tree structure
 */
const SchemaTree = ({
  tables = [],
  columns = {},
  loading = false,
  columnsLoading = false,
  selectedTable = null,
  expandedTables = {},
  onTableSelect,
  onTableToggle,
  onRefresh,
  connectionName = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showColumnsInTree, setShowColumnsInTree] = useState(true);

  // Filter tables based on search query
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const query = searchQuery.toLowerCase();
    return tables.filter(table => {
      const tableName = typeof table === 'string' ? table : table.name;
      return tableName.toLowerCase().includes(query);
    });
  }, [tables, searchQuery]);

  // Get icon for column type
  const getColumnTypeIcon = (columnType) => {
    const type = (columnType || '').toLowerCase();
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return <Hash className="w-3 h-3 text-(--color-primary-500)" />;
    }
    if (type.includes('char') || type.includes('text') || type.includes('string')) {
      return <Type className="w-3 h-3 text-green-500" />;
    }
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return <Calendar className="w-3 h-3 text-purple-500" />;
    }
    if (type.includes('bool')) {
      return <ToggleLeft className="w-3 h-3 text-orange-500" />;
    }
    if (type.includes('blob') || type.includes('binary')) {
      return <FileText className="w-3 h-3 text-gray-500" />;
    }
    return <Columns className="w-3 h-3 text-gray-400" />;
  };

  // Render a single table item
  const renderTableItem = (table) => {
    const tableName = typeof table === 'string' ? table : table.name;
    const tableSchema = typeof table === 'object' ? table.schema : null;
    // Use schema.table as key if schema exists
    const tableKey = tableSchema ? `${tableSchema}.${tableName}` : tableName;
    const isExpanded = expandedTables[tableKey];
    const isSelected = selectedTable === tableName;
    const tableColumns = columns[tableKey] || [];
    const isLoadingColumns = columnsLoading && isSelected;

    return (
      <div key={tableName} className="select-none">
        {/* Table row */}
        <div
          className={`
            flex items-center px-2 py-1.5 cursor-pointer rounded-md transition-colors
            ${isSelected ? 'bg-(--color-primary-100) text-(--color-primary-700)' : 'hover:bg-gray-100'}
          `}
          onClick={() => onTableSelect?.(tableName, tableSchema)}
        >
          {/* Expand/collapse toggle */}
          {showColumnsInTree && (
            <button
              className="p-0.5 hover:bg-gray-200 rounded mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onTableToggle?.(tableName, tableSchema);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          )}

          {/* Table icon */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" />
          ) : (
            <Table className="w-4 h-4 text-(--color-primary-500) mr-2 flex-shrink-0" />
          )}

          {/* Table name */}
          <span className="text-sm font-medium truncate flex-1">
            {tableName}
          </span>

          {/* Schema badge if available */}
          {tableSchema && (
            <span className="text-xs text-gray-400 ml-2">{tableSchema}</span>
          )}

          {/* Column count badge */}
          {tableColumns.length > 0 && (
            <span className="text-xs text-gray-400 ml-2 bg-gray-100 px-1.5 py-0.5 rounded">
              {tableColumns.length}
            </span>
          )}
        </div>

        {/* Expanded columns */}
        {showColumnsInTree && isExpanded && (
          <div className="ml-6 border-l border-gray-200 pl-2 mt-1 space-y-0.5">
            {isLoadingColumns ? (
              <div className="flex items-center text-xs text-gray-500 py-1">
                <Loader2 className="w-3 h-3 animate-spin mr-2" />
                Loading columns...
              </div>
            ) : tableColumns.length > 0 ? (
              tableColumns.map((column, idx) => {
                const columnName = typeof column === 'string' ? column : column.name;
                const columnType = typeof column === 'object' ? column.type : '';
                const isPrimaryKey = typeof column === 'object' && column.isPrimaryKey;
                const isNullable = typeof column === 'object' ? column.nullable : true;

                return (
                  <div
                    key={`${tableKey}-${columnName}-${idx}`}
                    className="flex items-center px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded"
                  >
                    {/* Column type icon */}
                    {getColumnTypeIcon(columnType)}

                    {/* Primary key indicator */}
                    {isPrimaryKey && (
                      <Key className="w-3 h-3 text-yellow-500 ml-1" />
                    )}

                    {/* Column name */}
                    <span className="ml-2 truncate flex-1 font-mono">
                      {columnName}
                    </span>

                    {/* Column type */}
                    {columnType && (
                      <span className="text-gray-400 ml-2 font-mono text-[10px]">
                        {columnType}
                      </span>
                    )}

                    {/* Nullable indicator */}
                    {!isNullable && (
                      <span className="text-red-400 ml-1 text-[10px]">NOT NULL</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-gray-400 py-1 italic">
                Click table to load columns
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-(--color-primary-600)" />
            <span className="font-medium text-sm text-gray-900">
              {connectionName || 'Database Schema'}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh schema"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tables..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
          />
        </div>

        {/* Toggle columns in tree */}
        <div className="flex items-center mt-2">
          <label className="flex items-center text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showColumnsInTree}
              onChange={(e) => setShowColumnsInTree(e.target.checked)}
              className="mr-1.5 rounded text-(--color-primary-600) focus:ring-(--color-primary-500)"
            />
            Show columns in tree
          </label>
        </div>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-sm">Loading tables...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Table className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-sm">
              {searchQuery ? 'No tables match your search' : 'No tables found'}
            </span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredTables.map(renderTableItem)}
          </div>
        )}
      </div>

      {/* Footer with table count */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
            {searchQuery && ` (filtered from ${tables.length})`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SchemaTree;
