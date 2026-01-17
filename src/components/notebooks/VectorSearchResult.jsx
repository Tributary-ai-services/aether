import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Code,
  Copy,
  Check,
  ExternalLink,
  Hash,
  Layers,
  Globe,
  Tag,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';

const VectorSearchResult = ({ result, rank, queryTerms = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const vector = result.vector || {};
  const content = vector.content || '';
  const metadata = vector.metadata || {};
  const documentName = metadata.document_name || metadata.filename || vector.document_id || 'Unknown Document';

  // Format score for display
  const formatScore = (score) => {
    if (score === undefined || score === null) return 'N/A';
    return score.toFixed(4);
  };

  // Format score as percentage
  const formatScorePercent = (score) => {
    if (score === undefined || score === null) return 0;
    return Math.round(score * 100);
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) return 'N/A';
    return distance.toFixed(4);
  };

  // Get content preview (first 300 chars for better context)
  const contentPreview = content.length > 300 ? content.substring(0, 300) + '...' : content;

  // Copy content to clipboard
  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get score color and gradient based on value
  const getScoreStyle = (score) => {
    if (score >= 0.9) return { color: 'text-emerald-700', bg: 'bg-emerald-100', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600', ring: 'ring-emerald-200' };
    if (score >= 0.7) return { color: 'text-blue-700', bg: 'bg-blue-100', bar: 'bg-gradient-to-r from-blue-400 to-blue-600', ring: 'ring-blue-200' };
    if (score >= 0.5) return { color: 'text-amber-700', bg: 'bg-amber-100', bar: 'bg-gradient-to-r from-amber-400 to-amber-600', ring: 'ring-amber-200' };
    return { color: 'text-gray-700', bg: 'bg-gray-100', bar: 'bg-gradient-to-r from-gray-400 to-gray-500', ring: 'ring-gray-200' };
  };

  // Get rank badge style based on position
  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-200';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md';
    return 'bg-gray-100 text-gray-600';
  };

  // Highlight query terms in content
  const highlightContent = useMemo(() => {
    if (!queryTerms || queryTerms.length === 0) {
      return isExpanded ? content : contentPreview;
    }

    const textToHighlight = isExpanded ? content : contentPreview;

    // Create a regex pattern from query terms (escape special chars)
    const escapedTerms = queryTerms.map(term =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).filter(term => term.length > 2); // Only highlight terms with 3+ chars

    if (escapedTerms.length === 0) {
      return textToHighlight;
    }

    const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = textToHighlight.split(pattern);

    return parts.map((part, index) => {
      if (escapedTerms.some(term => part.toLowerCase() === term.toLowerCase())) {
        return (
          <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  }, [content, contentPreview, isExpanded, queryTerms]);

  const scoreStyle = getScoreStyle(result.score);
  const scorePercent = formatScorePercent(result.score);

  // Organize metadata into categories
  const metadataCategories = useMemo(() => ({
    identification: {
      label: 'Identification',
      icon: Hash,
      items: [
        { key: 'id', value: vector.id },
        { key: 'document_id', value: vector.document_id },
        { key: 'chunk_id', value: vector.chunk_id },
      ].filter(item => item.value)
    },
    chunking: {
      label: 'Chunking',
      icon: Layers,
      items: [
        { key: 'chunk_index', value: vector.chunk_index !== undefined ? `${vector.chunk_index + 1}` : null },
        { key: 'chunk_count', value: vector.chunk_count },
      ].filter(item => item.value)
    },
    content: {
      label: 'Content Info',
      icon: FileText,
      items: [
        { key: 'content_type', value: vector.content_type },
        { key: 'language', value: vector.language },
      ].filter(item => item.value)
    },
    embedding: {
      label: 'Embedding',
      icon: Sparkles,
      items: [
        { key: 'model', value: vector.model },
        { key: 'dimensions', value: vector.dimensions },
      ].filter(item => item.value)
    },
    custom: {
      label: 'Custom Metadata',
      icon: Tag,
      items: Object.entries(metadata)
        .filter(([key]) => !['document_name', 'filename'].includes(key))
        .map(([key, value]) => ({ key, value: typeof value === 'object' ? JSON.stringify(value) : value }))
    }
  }), [vector, metadata]);

  return (
    <div
      className={`transition-all duration-200 ${isHovered ? 'bg-blue-50/50' : 'hover:bg-gray-50'} ${rank === 1 ? 'border-l-4 border-l-amber-400' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Result Row */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-4">
          {/* Rank Badge */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${getRankStyle(rank)}`}>
            #{rank}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row with Document Name and Scores */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-blue-600 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate" title={documentName}>
                  {documentName}
                </span>
                {vector.chunk_index !== undefined && vector.chunk_count && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 flex-shrink-0">
                    <Layers size={12} />
                    {vector.chunk_index + 1}/{vector.chunk_count}
                  </span>
                )}
              </div>

              {/* Score Visual */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Distance badge */}
                <span className="px-2 py-1 rounded text-xs font-medium text-gray-600 bg-gray-100">
                  Distance: {formatDistance(result.distance)}
                </span>
              </div>
            </div>

            {/* Similarity Score Bar */}
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${scoreStyle.bar} transition-all duration-500 ease-out`}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${scoreStyle.bg} ${scoreStyle.color} font-medium text-sm min-w-[100px] justify-center`}>
                  <Sparkles size={14} />
                  {scorePercent}% match
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Similarity</span>
                <span>Raw: {formatScore(result.score)}</span>
              </div>
            </div>

            {/* Content Preview */}
            <div className={`relative bg-white rounded-lg border ${isExpanded ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-200'} p-3 mb-3`}>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {highlightContent}
              </p>

              {/* Expand/Collapse Overlay Button */}
              {content.length > 300 && (
                <div className={`${isExpanded ? 'mt-3 pt-3 border-t border-gray-100' : 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-2 px-3'}`}>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isExpanded ? (
                      <>
                        <Minimize2 size={14} />
                        Show less
                      </>
                    ) : (
                      <>
                        <Maximize2 size={14} />
                        Show full content ({content.length.toLocaleString()} characters)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showMetadata
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Code size={12} />
                {showMetadata ? 'Hide' : 'Show'} Metadata
              </button>
              <button
                onClick={copyContent}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>

              {/* Content type badge */}
              {vector.content_type && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md">
                  {vector.content_type}
                </span>
              )}

              {/* Language badge */}
              {vector.language && (
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                  <Globe size={12} />
                  {vector.language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Metadata Panel - Enhanced */}
            {showMetadata && (
              <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Code size={14} />
                    Vector Metadata
                  </h5>
                </div>
                <div className="p-4 space-y-4">
                  {Object.entries(metadataCategories).map(([key, category]) => {
                    if (category.items.length === 0) return null;
                    const Icon = category.icon;
                    return (
                      <div key={key}>
                        <h6 className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          <Icon size={12} />
                          {category.label}
                        </h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {category.items.map(({ key: itemKey, value }) => (
                            <div key={itemKey} className="flex items-start gap-2 text-xs">
                              <span className="font-medium text-gray-600 min-w-[100px]">{itemKey}:</span>
                              <span className="text-gray-800 font-mono break-all">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Raw JSON view toggle */}
                <details className="border-t border-gray-200">
                  <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-100">
                    View raw JSON
                  </summary>
                  <pre className="px-4 py-3 text-xs text-gray-700 overflow-x-auto bg-gray-900 text-green-400">
                    {JSON.stringify(
                      {
                        id: vector.id,
                        document_id: vector.document_id,
                        chunk_id: vector.chunk_id,
                        chunk_index: vector.chunk_index,
                        chunk_count: vector.chunk_count,
                        content_type: vector.content_type,
                        language: vector.language,
                        model: vector.model,
                        dimensions: vector.dimensions,
                        ...metadata,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              </div>
            )}

            {/* Explanation (if provided) */}
            {result.explanation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
                  <Sparkles size={12} />
                  Search Explanation
                </h5>
                <p className="text-xs text-blue-700">{JSON.stringify(result.explanation)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VectorSearchResult;
