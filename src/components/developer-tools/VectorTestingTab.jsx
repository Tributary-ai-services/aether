import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Database,
  FileText,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  Hash,
  BarChart3,
  Settings,
  Download,
  Copy,
  Filter,
  X
} from 'lucide-react';
import { selectNotebooks, fetchNotebooks } from '../../store/slices/notebooksSlice';
import { aetherApi } from '../../services/aetherApi';

const VectorTestingTab = () => {
  const dispatch = useDispatch();
  const notebooks = useSelector(selectNotebooks);

  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [queryMode, setQueryMode] = useState('text'); // 'text' | 'hybrid'
  const [queryText, setQueryText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [vectorStoreInfo, setVectorStoreInfo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    topK: 10,
    minScore: 0.0,
    threshold: null,
    maxDistance: null,
    deduplicate: false,
    groupByDocument: false,
    rerank: false,
    includeContent: true,
    includeMetadata: true,
    vectorWeight: 0.5,
    textWeight: 0.5,
    fusionMethod: 'weighted_sum'
  });

  // Load notebooks on mount
  useEffect(() => {
    dispatch(fetchNotebooks());
  }, [dispatch]);

  // Load vector store info when notebook is selected
  useEffect(() => {
    if (selectedNotebook) {
      loadVectorStoreInfo();
    }
  }, [selectedNotebook]);

  const loadVectorStoreInfo = async () => {
    if (!selectedNotebook) return;
    try {
      const response = await aetherApi.vectorSearch.getInfo(selectedNotebook);
      setVectorStoreInfo(response.data);
    } catch (error) {
      console.error('Failed to load vector store info:', error);
      setVectorStoreInfo(null);
    }
  };

  const handleSearch = async () => {
    if (!selectedNotebook || !queryText.trim()) return;

    setIsSearching(true);
    try {
      let response;
      if (queryMode === 'hybrid') {
        response = await aetherApi.vectorSearch.hybridSearch(selectedNotebook, queryText, {
          topK: searchParams.topK,
          minScore: searchParams.minScore,
          threshold: searchParams.threshold,
          maxDistance: searchParams.maxDistance,
          deduplicate: searchParams.deduplicate,
          groupByDocument: searchParams.groupByDocument,
          rerank: searchParams.rerank,
          includeContent: searchParams.includeContent,
          includeMetadata: searchParams.includeMetadata,
          vectorWeight: searchParams.vectorWeight,
          textWeight: searchParams.textWeight,
          fusionMethod: searchParams.fusionMethod
        });
      } else {
        response = await aetherApi.vectorSearch.textSearch(selectedNotebook, queryText, {
          topK: searchParams.topK,
          minScore: searchParams.minScore,
          threshold: searchParams.threshold,
          maxDistance: searchParams.maxDistance,
          deduplicate: searchParams.deduplicate,
          groupByDocument: searchParams.groupByDocument,
          rerank: searchParams.rerank,
          includeContent: searchParams.includeContent,
          includeMetadata: searchParams.includeMetadata
        });
      }
      setSearchResults(response.data);
    } catch (error) {
      console.error('Vector search failed:', error);
      setSearchResults({ error: error.message });
    } finally {
      setIsSearching(false);
    }
  };

  const formatScore = (score) => {
    if (score === undefined || score === null) return '-';
    return (score * 100).toFixed(2) + '%';
  };

  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) return '-';
    return distance.toFixed(4);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Configuration */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Vector Search Testing</h3>

          {/* Notebook Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notebook</label>
            <select
              value={selectedNotebook || ''}
              onChange={(e) => setSelectedNotebook(e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
            >
              <option value="">Select notebook...</option>
              {notebooks.map(nb => (
                <option key={nb.id} value={nb.id}>{nb.name}</option>
              ))}
            </select>
          </div>

          {/* Vector Store Info */}
          {vectorStoreInfo && (
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-(--color-primary-600)" />
                <span className="text-sm font-medium text-gray-700">Vector Store Info</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Documents:</span>
                  <span className="ml-1 font-medium">{vectorStoreInfo.document_count || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Vectors:</span>
                  <span className="ml-1 font-medium">{vectorStoreInfo.vector_count || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Embedding:</span>
                  <span className="ml-1 font-medium">{vectorStoreInfo.embedding_model || 'Default'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Dimensions:</span>
                  <span className="ml-1 font-medium">{vectorStoreInfo.dimensions || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Query Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setQueryMode('text')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  queryMode === 'text'
                    ? 'border-(--color-primary-500) bg-(--color-primary-50) text-(--color-primary-700)'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Text Search
              </button>
              <button
                onClick={() => setQueryMode('hybrid')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  queryMode === 'hybrid'
                    ? 'border-(--color-primary-500) bg-(--color-primary-50) text-(--color-primary-700)'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Hybrid
              </button>
            </div>
          </div>
        </div>

        {/* Search Parameters */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Parameters</span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <Settings size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Top K Results</label>
              <input
                type="number"
                value={searchParams.topK}
                onChange={(e) => setSearchParams(p => ({ ...p, topK: parseInt(e.target.value) || 10 }))}
                min={1}
                max={100}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500)"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Score (0-1)</label>
              <input
                type="number"
                value={searchParams.minScore}
                onChange={(e) => setSearchParams(p => ({ ...p, minScore: parseFloat(e.target.value) || 0 }))}
                min={0}
                max={1}
                step={0.1}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500)"
              />
            </div>

            {queryMode === 'hybrid' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vector Weight</label>
                  <input
                    type="range"
                    value={searchParams.vectorWeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSearchParams(p => ({ ...p, vectorWeight: val, textWeight: 1 - val }));
                    }}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Text: {(searchParams.textWeight * 100).toFixed(0)}%</span>
                    <span>Vector: {(searchParams.vectorWeight * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fusion Method</label>
                  <select
                    value={searchParams.fusionMethod}
                    onChange={(e) => setSearchParams(p => ({ ...p, fusionMethod: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500)"
                  >
                    <option value="weighted_sum">Weighted Sum</option>
                    <option value="rrf">Reciprocal Rank Fusion</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchParams.deduplicate}
                  onChange={(e) => setSearchParams(p => ({ ...p, deduplicate: e.target.checked }))}
                  className="rounded border-gray-300 text-(--color-primary-600)"
                />
                <span className="text-sm text-gray-700">Deduplicate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchParams.groupByDocument}
                  onChange={(e) => setSearchParams(p => ({ ...p, groupByDocument: e.target.checked }))}
                  className="rounded border-gray-300 text-(--color-primary-600)"
                />
                <span className="text-sm text-gray-700">Group by Document</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={searchParams.rerank}
                  onChange={(e) => setSearchParams(p => ({ ...p, rerank: e.target.checked }))}
                  className="rounded border-gray-300 text-(--color-primary-600)"
                />
                <span className="text-sm text-gray-700">Rerank Results</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Query & Results */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        {/* Query Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter your search query..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!selectedNotebook || !queryText.trim() || isSearching}
              className="flex items-center gap-2 px-6 py-3 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto p-4">
          {!searchResults && !isSearching && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Search Results Yet</p>
              <p className="text-sm text-center max-w-md">
                Select a notebook and enter a query to search through your vector-indexed documents.
              </p>
            </div>
          )}

          {searchResults?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <strong>Error:</strong> {searchResults.error}
            </div>
          )}

          {searchResults?.results && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  Found <strong>{searchResults.results.length}</strong> results
                  {searchResults.execution_time_ms && (
                    <span className="ml-2">({searchResults.execution_time_ms}ms)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="Copy Results">
                    <Copy size={14} />
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="Download">
                    <Download size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {searchResults.results.map((result, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {result.document_name || result.metadata?.document_name || `Result ${idx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <BarChart3 size={14} className="text-green-500" />
                          <span className="text-green-700 font-medium">{formatScore(result.score)}</span>
                        </div>
                        {result.distance !== undefined && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Hash size={14} />
                            <span>{formatDistance(result.distance)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {result.content && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-2">{result.content}</p>
                    )}
                    {result.metadata && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(result.metadata).slice(0, 5).map(([key, value]) => (
                          <span key={key} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                            {key}: {typeof value === 'string' ? value.substring(0, 30) : String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VectorTestingTab;
