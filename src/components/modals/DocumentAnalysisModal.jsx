import React from 'react';
import { X, BarChart3, Brain, Hash, Tag, Clock, CheckCircle } from 'lucide-react';

const DocumentAnalysisModal = ({ 
  isOpen, 
  onClose, 
  document, 
  analysis 
}) => {
  if (!isOpen) return null;

  const formatProcessingTime = (timeMs) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Document Analysis</h2>
              <p className="text-sm text-gray-500 mt-1">
                {document?.filename || document?.metadata?.original_name || 'Document'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {analysis?.data ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Confidence</span>
                  </div>
                  <div className={`text-lg font-bold px-2 py-1 rounded ${getConfidenceColor(analysis.data.avg_confidence)}`}>
                    {Math.round(analysis.data.avg_confidence * 100)}%
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Sentiment</span>
                  </div>
                  <div className={`text-sm font-medium px-2 py-1 rounded capitalize ${getSentimentColor(analysis.data.dominant_sentiment)}`}>
                    {analysis.data.dominant_sentiment || 'Unknown'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Chunks</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {analysis.data.total_chunks}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Processing</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatProcessingTime(analysis.data.processing_time_ms || 0)}
                  </div>
                </div>
              </div>

              {/* Topics */}
              {analysis.data.main_topics && analysis.data.main_topics.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Main Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.data.main_topics.map((topic, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Entities */}
              {analysis.data.key_entities && analysis.data.key_entities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Entities</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.data.key_entities.map((entity, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Document Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Document ID:</span>
                    <span className="ml-2 text-gray-600 font-mono text-xs break-all">
                      {analysis.data.document_id}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Analysis Timestamp:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(analysis.data.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-green-600 font-medium">
                      {document?.status || 'Analyzed'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">File Size:</span>
                    <span className="ml-2 text-gray-600">
                      {(document?.size_bytes || document?.size)
                        ? `${((document.size_bytes || document.size) / 1024).toFixed(1)} KB`
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Analysis Timestamp */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                Analysis completed on {new Date(document.created_at || document.updated_at || analysis.data.timestamp).toLocaleDateString()} at {new Date(document.created_at || document.updated_at || analysis.data.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
              <p className="text-gray-600">
                Analysis data is not available for this document yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalysisModal;