import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Table,
  FileJson,
  FileText,
  Clock,
  Hash,
  AlertTriangle
} from 'lucide-react';

const QueryResults = ({
  result,
  query = '',
  connectionName = ''
}) => {
  // State for sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // State for copy feedback
  const [copied, setCopied] = useState(false);

  // Extract data from result
  const columns = result?.columns || [];
  const rows = result?.rows || [];
  const rowCount = result?.row_count || rows.length;
  const truncated = result?.truncated || false;
  const durationMs = result?.duration_ms || result?.duration || 0;

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare based on type
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [rows, sortColumn, sortDirection]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedRows.length / pageSize);

  // Handle column click for sorting
  const handleColumnClick = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Export to CSV
  const exportToCsv = () => {
    const csvContent = [
      columns.join(','),
      ...sortedRows.map(row =>
        columns.map(col => {
          const val = row[col];
          if (val == null) return '';
          const str = String(val);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Export to JSON
  const exportToJson = () => {
    const jsonContent = JSON.stringify(sortedRows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `query_results_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Copy results to clipboard
  const copyToClipboard = async () => {
    try {
      const text = [
        columns.join('\t'),
        ...sortedRows.map(row => columns.map(col => String(row[col] ?? '')).join('\t'))
      ].join('\n');

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // State for expanded cells
  const [expandedCells, setExpandedCells] = useState({});

  const toggleCellExpand = (rowIdx, column) => {
    const key = `${rowIdx}-${column}`;
    setExpandedCells(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Format cell value for display
  const formatCellValue = (value, rowIdx, column) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'object') {
      const cellKey = `${rowIdx}-${column}`;
      const isExpanded = expandedCells[cellKey];
      const jsonStr = JSON.stringify(value, null, 2);

      // Neo4j Node (has _labels array) — output clean JSON
      if (Array.isArray(value._labels)) {
        return (
          <pre
            className={`font-mono text-xs whitespace-pre-wrap cursor-pointer ${isExpanded ? '' : 'max-h-32 overflow-hidden'}`}
            onClick={() => toggleCellExpand(rowIdx, column)}
            title={isExpanded ? 'Click to collapse' : 'Click to expand'}
          >
            {jsonStr}
          </pre>
        );
      }

      // Neo4j Relationship (has _type string) — output clean JSON
      if (typeof value._type === 'string') {
        return (
          <pre
            className={`font-mono text-xs whitespace-pre-wrap cursor-pointer ${isExpanded ? '' : 'max-h-32 overflow-hidden'}`}
            onClick={() => toggleCellExpand(rowIdx, column)}
            title={isExpanded ? 'Click to collapse' : 'Click to expand'}
          >
            {jsonStr}
          </pre>
        );
      }

      // Other objects/arrays - prettified JSON
      return (
        <pre
          className={`font-mono text-xs whitespace-pre-wrap bg-gray-50 rounded p-1.5 cursor-pointer ${isExpanded ? '' : 'max-h-20 overflow-hidden'}`}
          onClick={() => toggleCellExpand(rowIdx, column)}
          title={isExpanded ? 'Click to collapse' : 'Click to expand'}
        >
          {jsonStr}
        </pre>
      );
    }
    return String(value);
  };

  // Render sort indicator
  const renderSortIndicator = (column) => {
    if (sortColumn !== column) {
      return <ChevronUp className="w-3 h-3 text-gray-300" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-(--color-primary-600)" />
      : <ChevronDown className="w-3 h-3 text-(--color-primary-600)" />;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Results header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{rowCount.toLocaleString()}</span>
            <span className="text-gray-500">rows</span>
            {truncated && (
              <span className="flex items-center space-x-1 text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs">(truncated)</span>
              </span>
            )}
          </div>

          {durationMs > 0 && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{durationMs}ms</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>

          <div className="flex items-center border-l border-gray-300 pl-2 ml-2">
            <button
              onClick={exportToCsv}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Export as CSV"
            >
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </button>

            <button
              onClick={exportToJson}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-4 h-4" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="flex-1 overflow-auto">
        {columns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Table className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data to display</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-12">
                  #
                </th>
                {columns.map(column => (
                  <th
                    key={column}
                    onClick={() => handleColumnClick(column)}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="truncate">{column}</span>
                      {renderSortIndicator(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-(--color-primary-50) transition-colors"
                >
                  <td className="px-3 py-2 text-xs text-gray-400 font-mono">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map(column => {
                    const val = row[column];
                    const isObject = val !== null && typeof val === 'object';
                    return (
                      <td
                        key={column}
                        className={`px-3 py-2 text-gray-700 ${isObject ? '' : 'max-w-xs truncate'}`}
                        title={isObject ? undefined : String(val ?? '')}
                      >
                        {formatCellValue(val, (currentPage - 1) * pageSize + idx, column)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {sortedRows.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 mr-4">
              {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length}
            </span>

            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryResults;
