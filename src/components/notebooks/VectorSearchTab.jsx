import React, { useState, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings2,
  Filter,
  HelpCircle,
  X
} from 'lucide-react';
import { aetherApi } from '../../services/aetherApi.js';
import VectorSearchResult from './VectorSearchResult.jsx';
import Tooltip from '../ui/Tooltip.jsx';

const VectorSearchTab = ({ notebook }) => {
  // Query state
  const [queryText, setQueryText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Search options state
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState({
    topK: 10,
    minScore: 0.0,
    threshold: null,
    maxDistance: null,
    deduplicate: false,
    groupByDocument: false,
    rerank: false,
    includeContent: true,
    includeMetadata: true,
  });

  // Advanced filter state - key=value metadata pairs
  const [showFilters, setShowFilters] = useState(false);
  const [metadataFilters, setMetadataFilters] = useState([
    // { key: '', value: '' }
  ]);

  // Helper functions for metadata filters
  const updateFilter = (index, field, value) => {
    setMetadataFilters(prev => prev.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const removeFilter = (index) => {
    setMetadataFilters(prev => prev.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    setMetadataFilters(prev => [...prev, { key: '', value: '' }]);
  };

  // Build filters object for API
  const buildFilters = () => {
    const filterObject = {};
    metadataFilters.forEach(({ key, value }) => {
      if (key && value) {
        filterObject[key] = value;
      }
    });
    return Object.keys(filterObject).length > 0 ? filterObject : null;
  };

  // Reset options to defaults
  const resetOptions = useCallback(() => {
    setOptions({
      topK: 10,
      minScore: 0.0,
      threshold: null,
      maxDistance: null,
      deduplicate: false,
      groupByDocument: false,
      rerank: false,
      includeContent: true,
      includeMetadata: true,
    });
    setMetadataFilters([]);
  }, []);

  // Perform search
  const handleSearch = useCallback(async () => {
    if (!queryText.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults(null);

    try {
      const searchOptions = {
        ...options,
        filters: buildFilters(),
      };

      const response = await aetherApi.vectorSearch.textSearch(
        notebook.id,
        queryText,
        searchOptions
      );

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.data?.message || 'Search failed. Please try again.');
      }
    } catch (err) {
      console.error('Vector search error:', err);
      setError(err.message || 'An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [notebook.id, queryText, options, metadataFilters]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // Export results as JSON
  const exportJSON = useCallback(() => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-search-results-${notebook.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results, notebook.id]);

  // Export results as CSV
  const exportCSV = useCallback(() => {
    if (!results || !results.results) return;

    const headers = ['Rank', 'Score', 'Distance', 'Document', 'Content Preview'];
    const rows = results.results.map((result, index) => [
      index + 1,
      result.score?.toFixed(4) || 'N/A',
      result.distance?.toFixed(4) || 'N/A',
      result.vector?.metadata?.document_name || result.vector?.document_id || 'Unknown',
      (result.vector?.content || '').substring(0, 100).replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-search-results-${notebook.id}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results, notebook.id]);

  // Copy results to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!results) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Test Vector Search</h3>
        <p className="mt-1 text-sm text-gray-500">
          Search the indexed documents in this notebook without invoking the LLM.
          Use this to verify indexing quality and tune retrieval parameters.
        </p>
      </div>

      {/* Query Input */}
      <div className="space-y-4">
        <div>
          <label htmlFor="vector-search-query" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                id="vector-search-query"
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your search query..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                disabled={isSearching}
              />
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !queryText.trim()}
              className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Options */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings2 size={16} />
              Search Options
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetOptions();
                }}
                className="text-xs text-(--color-primary-600) hover:text-(--color-primary-700)"
              >
                Reset to Defaults
              </button>
              {showOptions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>

          {showOptions && (
            <div className="px-4 py-4 border-t border-gray-200 space-y-4">
              {/* Row 1: Core options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      Results (top_k)
                    </label>
                    <Tooltip content="Maximum number of results to return. Higher values return more matches but may include less relevant results.">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={options.topK}
                    onChange={(e) => setOptions(prev => ({ ...prev, topK: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      Min Score
                    </label>
                    <Tooltip content="Minimum similarity score (0.0-1.0). Results below this score are filtered out. Higher values mean stricter matching.">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={options.minScore}
                    onChange={(e) => setOptions(prev => ({ ...prev, minScore: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      Threshold
                    </label>
                    <Tooltip content="Similarity threshold for filtering. Unlike min_score, this is applied before ranking. Leave empty to disable.">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={options.threshold || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, threshold: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="None"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-xs font-medium text-gray-600">
                      Max Distance
                    </label>
                    <Tooltip content="Maximum vector distance allowed. Lower values mean closer/more similar matches. Leave empty for no limit.">
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={options.maxDistance || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxDistance: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="None"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                  />
                </div>
              </div>

              {/* Row 2: Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={options.deduplicate}
                      onChange={(e) => setOptions(prev => ({ ...prev, deduplicate: e.target.checked }))}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)"
                    />
                    Deduplicate
                  </label>
                  <Tooltip content="Remove duplicate content from results based on text similarity.">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={options.groupByDocument}
                      onChange={(e) => setOptions(prev => ({ ...prev, groupByDocument: e.target.checked }))}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)"
                    />
                    Group by document
                  </label>
                  <Tooltip content="Group results by source document instead of showing individual chunks.">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={options.rerank}
                      onChange={(e) => setOptions(prev => ({ ...prev, rerank: e.target.checked }))}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)"
                    />
                    Apply reranking
                  </label>
                  <Tooltip content="Use a cross-encoder model to re-rank results for better relevance (slower but more accurate).">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
              </div>

              {/* Filters Section */}
              <div className="border-t border-gray-100 pt-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  <Filter size={14} />
                  Metadata Filters
                  {metadataFilters.length > 0 && (
                    <span className="bg-(--color-primary-100) text-(--color-primary-700) text-xs px-1.5 py-0.5 rounded">
                      {metadataFilters.filter(f => f.key && f.value).length}
                    </span>
                  )}
                  {showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {showFilters && (
                  <div className="mt-3 space-y-2">
                    {/* Existing filters */}
                    {metadataFilters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Key (e.g., language)"
                          value={filter.key}
                          onChange={(e) => updateFilter(index, 'key', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                          list="metadata-keys"
                        />
                        <span className="text-gray-400">=</span>
                        <input
                          type="text"
                          placeholder="Value"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-(--color-primary-500)"
                        />
                        <button
                          onClick={() => removeFilter(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove filter"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add filter button */}
                    <button
                      onClick={addFilter}
                      className="text-xs text-(--color-primary-600) hover:text-(--color-primary-700) flex items-center gap-1"
                    >
                      + Add Filter
                    </button>

                    {/* Datalist for common key suggestions */}
                    <datalist id="metadata-keys">
                      <option value="language" />
                      <option value="content_type" />
                      <option value="document_id" />
                      <option value="chunk_id" />
                      <option value="source" />
                      <option value="author" />
                      <option value="file_type" />
                      <option value="category" />
                    </datalist>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Search Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-green-600" />
                Found <strong>{results.total_found || results.results?.length || 0}</strong> results
              </span>
              {results.query_time_ms && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {results.query_time_ms.toFixed(1)}ms
                  {results.embedding_time_ms > 0 && ` (embedding: ${results.embedding_time_ms.toFixed(1)}ms)`}
                </span>
              )}
              {results.stats?.vectors_scanned && (
                <span className="flex items-center gap-1">
                  <Database size={14} />
                  {results.stats.vectors_scanned} vectors scanned
                </span>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={exportJSON}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <Download size={14} />
                JSON
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <Download size={14} />
                CSV
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          </div>

          {/* Results List */}
          {results.results && results.results.length > 0 ? (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {results.results.map((result, index) => (
                <VectorSearchResult
                  key={result.vector?.id || index}
                  result={result}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No matches found</h4>
              <p className="text-sm text-gray-500">
                Try adjusting your search query or lowering the minimum score threshold.
              </p>
            </div>
          )}

          {/* Has More Indicator */}
          {results.has_more && (
            <div className="text-center text-sm text-gray-500">
              Showing top {results.results?.length || 0} of {results.total_found} results.
              Increase top_k to see more.
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Search Yet */}
      {!results && !error && !isSearching && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Search</h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Enter a search query above to test the vector store. Results will show
            similarity scores and matching content from indexed documents.
          </p>
        </div>
      )}
    </div>
  );
};

export default VectorSearchTab;
