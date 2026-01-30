import React, { useState, useMemo } from 'react';
import {
  Table,
  Columns,
  Key,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  FileText,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Database,
  Info,
  Code,
  Loader2,
  AlertCircle,
  Link,
} from 'lucide-react';

/**
 * TableDetails - Display detailed information about a database table
 * Shows columns with their types, constraints, and additional metadata
 */
const TableDetails = ({
  tableName = '',
  columns = [],
  loading = false,
  error = null,
  connectionName = '',
  onGenerateSelect,
  onGenerateInsert,
  onCopyColumnNames,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [copiedItem, setCopiedItem] = useState(null);

  // Filter and sort columns
  const processedColumns = useMemo(() => {
    let result = [...columns];

    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(col => {
        const name = typeof col === 'string' ? col : col.name;
        const type = typeof col === 'object' ? (col.type || '').toLowerCase() : '';
        return name.toLowerCase().includes(query) || type.includes(query);
      });
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        let aVal = typeof a === 'string' ? a : a[sortField];
        let bVal = typeof b === 'string' ? b : b[sortField];

        if (sortField === 'isPrimaryKey') {
          aVal = aVal ? 1 : 0;
          bVal = bVal ? 1 : 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [columns, searchQuery, sortField, sortDirection]);

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 text-(--color-primary-600)" />
      : <ArrowDown className="w-3 h-3 text-(--color-primary-600)" />;
  };

  // Get icon for column type
  const getColumnTypeIcon = (columnType) => {
    const type = (columnType || '').toLowerCase();
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return <Hash className="w-4 h-4 text-(--color-primary-500)" />;
    }
    if (type.includes('char') || type.includes('text') || type.includes('string')) {
      return <Type className="w-4 h-4 text-green-500" />;
    }
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return <Calendar className="w-4 h-4 text-purple-500" />;
    }
    if (type.includes('bool')) {
      return <ToggleLeft className="w-4 h-4 text-orange-500" />;
    }
    if (type.includes('blob') || type.includes('binary')) {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
    return <Columns className="w-4 h-4 text-gray-400" />;
  };

  // Copy text to clipboard
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Copy all column names
  const handleCopyColumnNames = () => {
    const names = columns.map(col => typeof col === 'string' ? col : col.name).join(', ');
    copyToClipboard(names, 'all-columns');
    onCopyColumnNames?.(names);
  };

  // Generate SELECT query
  const generateSelectQuery = () => {
    const columnNames = columns.map(col => typeof col === 'string' ? col : col.name).join(',\n  ');
    const query = `SELECT\n  ${columnNames}\nFROM ${tableName}\nLIMIT 100;`;
    onGenerateSelect?.(query);
    return query;
  };

  // Generate INSERT template
  const generateInsertTemplate = () => {
    const columnNames = columns.map(col => typeof col === 'string' ? col : col.name);
    const placeholders = columnNames.map(() => '?').join(', ');
    const query = `INSERT INTO ${tableName}\n  (${columnNames.join(', ')})\nVALUES\n  (${placeholders});`;
    onGenerateInsert?.(query);
    return query;
  };

  // If no table selected
  if (!tableName) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <Database className="w-16 h-16 text-gray-200 mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">No Table Selected</p>
        <p className="text-sm text-center">
          Select a table from the schema tree to view its columns and details
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-(--color-primary-500) mb-4" />
        <p className="text-sm">Loading table structure...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-lg font-medium text-red-600 mb-2">Error Loading Table</p>
        <p className="text-sm text-center text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-(--color-primary-100) rounded-lg">
              <Table className="w-5 h-5 text-(--color-primary-600)" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{tableName}</h2>
              <p className="text-xs text-gray-500">
                {connectionName && `${connectionName} • `}
                {columns.length} {columns.length === 1 ? 'column' : 'columns'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyColumnNames}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              title="Copy column names"
            >
              {copiedItem === 'all-columns' ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copy Names</span>
            </button>
            <button
              onClick={() => {
                const query = generateSelectQuery();
                copyToClipboard(query, 'select-query');
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              title="Generate SELECT query"
            >
              {copiedItem === 'select-query' ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Code className="w-3.5 h-3.5" />
              )}
              <span>SELECT</span>
            </button>
            <button
              onClick={() => {
                const query = generateInsertTemplate();
                copyToClipboard(query, 'insert-query');
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              title="Generate INSERT template"
            >
              {copiedItem === 'insert-query' ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Code className="w-3.5 h-3.5" />
              )}
              <span>INSERT</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search columns..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
          />
        </div>
      </div>

      {/* Columns table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Column</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  {getSortIcon('type')}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('isPrimaryKey')}
              >
                <div className="flex items-center space-x-1">
                  <span>Key</span>
                  {getSortIcon('isPrimaryKey')}
                </div>
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nullable')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nullable</span>
                  {getSortIcon('nullable')}
                </div>
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedColumns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery ? 'No columns match your search' : 'No columns found'}
                </td>
              </tr>
            ) : (
              processedColumns.map((column, idx) => {
                const columnName = typeof column === 'string' ? column : column.name;
                const columnType = typeof column === 'object' ? column.type : '';
                const isPrimaryKey = typeof column === 'object' && column.isPrimaryKey;
                const isForeignKey = typeof column === 'object' && column.isForeignKey;
                const isNullable = typeof column === 'object' ? column.nullable !== false : true;
                const defaultValue = typeof column === 'object' ? column.defaultValue : null;

                return (
                  <tr
                    key={`${columnName}-${idx}`}
                    className="hover:bg-gray-50"
                  >
                    {/* Column name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getColumnTypeIcon(columnType)}
                        <span className="font-mono text-sm text-gray-900">{columnName}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {columnType || 'unknown'}
                      </span>
                    </td>

                    {/* Key indicators */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {isPrimaryKey && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded" title="Primary Key">
                            <Key className="w-3 h-3 mr-0.5" />
                            PK
                          </span>
                        )}
                        {isForeignKey && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-(--color-primary-100) text-(--color-primary-800) rounded" title="Foreign Key">
                            <Link className="w-3 h-3 mr-0.5" />
                            FK
                          </span>
                        )}
                        {!isPrimaryKey && !isForeignKey && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Nullable */}
                    <td className="px-4 py-3">
                      {isNullable ? (
                        <span className="text-xs text-gray-500">Yes</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">NOT NULL</span>
                      )}
                    </td>

                    {/* Default value */}
                    <td className="px-4 py-3">
                      {defaultValue != null ? (
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {String(defaultValue)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyToClipboard(columnName, `col-${columnName}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Copy column name"
                      >
                        {copiedItem === `col-${columnName}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {processedColumns.length} of {columns.length} columns
          </span>
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5" />
            <span>Click column headers to sort</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableDetails;
