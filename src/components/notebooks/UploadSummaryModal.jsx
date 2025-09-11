import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Sparkles, 
  BarChart3,
  X
} from 'lucide-react';
// Note: Analysis features will be implemented in Aether backend in the future

export default function UploadSummaryModal({ isOpen, onClose, uploadResults, notebookName }) {
  const [fileAnalyses, setFileAnalyses] = useState({});
  const [overallInsights, setOverallInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (isOpen && uploadResults.length > 0) {
      fetchAnalysisData();
    }
  }, [isOpen, uploadResults]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    try {
      // Get overall insights (placeholder - will be implemented in Aether backend)
      const insights = {
        data: {
          summary: 'Document analysis features are being migrated to Aether backend',
          total_files: uploadResults.filter(r => r.status === 'fulfilled').length,
          insights: ['Upload successful via Aether backend', 'Documents stored in tenant-scoped storage']
        }
      };
      setOverallInsights(insights.data);

      // Get individual file analyses for all successful uploads
      const analyses = {};
      for (const result of uploadResults) {
        if (result.status === 'fulfilled' && result.value?.id) {
          try {
            // Placeholder for document analysis (to be implemented in Aether backend)
            const summary = { data: { analysis: 'Analysis pending - will be available in future Aether backend update' } };
            analyses[result.value.id] = {
              ...summary.data,
              fileName: result.value.filename || result.value.metadata?.original_name || result.value.original_name || result.value.name || 'Unknown file',
              fileSize: result.value.size,
              uploadedAt: result.value.created_at || new Date().toISOString()
            };
          } catch (error) {
            console.warn(`Failed to get analysis for file ${result.value.id}:`, error);
            // Still store basic info even if analysis fails
            analyses[result.value.id] = {
              fileName: result.value.filename || result.value.metadata?.original_name || result.value.original_name || result.value.name || 'Unknown file',
              fileSize: result.value.size,
              uploadedAt: result.value.created_at || new Date().toISOString(),
              error: 'Analysis not available'
            };
          }
        }
      }
      setFileAnalyses(analyses);
    } catch (error) {
      console.error('Failed to fetch analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const successCount = uploadResults.filter(r => r.status === 'fulfilled').length;
  const failCount = uploadResults.filter(r => r.status === 'rejected').length;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          Upload Summary for {notebookName}
        </div>
      }
      size="large"
    >
      <div>
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6 pt-4">
          <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'insights'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Insights
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'files'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  File Details
                </button>
              </nav>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Analyzing content...</span>
              </div>
            ) : (
              <>
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold text-green-900">{successCount}</p>
                            <p className="text-sm text-green-700">Successfully Processed</p>
                          </div>
                        </div>
                      </div>
                      {failCount > 0 && (
                        <div className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-8 w-8 text-red-600" />
                            <div>
                              <p className="text-2xl font-bold text-red-900">{failCount}</p>
                              <p className="text-sm text-red-700">Failed</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {overallInsights?.summary && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h3 className="font-medium text-gray-900 mb-2">Processing Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Average Processing Time:</span>
                            <span className="ml-2 font-medium">{overallInsights.summary.avg_processing_time_ms}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence Score:</span>
                            <span className="ml-2 font-medium">{(overallInsights.summary.confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && overallInsights && (
                  <div className="space-y-6">
                    {/* Content Insights */}
                    {overallInsights.content_insights && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h3 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Content Analysis
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Dominant Language</p>
                            <p className="font-medium">{overallInsights.content_insights.dominant_language}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Readability Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${overallInsights.content_insights.avg_readability * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{(overallInsights.content_insights.avg_readability * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          {overallInsights.content_insights.key_topics && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Key Topics</p>
                              <div className="flex flex-wrap gap-2">
                                {overallInsights.content_insights.key_topics.map((topic, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quality Metrics */}
                    {overallInsights.quality_metrics && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-3">Quality Metrics</h3>
                        <div className="space-y-2">
                          {Object.entries(overallInsights.quality_metrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className="font-medium text-green-700">
                                {(value * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {overallInsights.recommendations && overallInsights.recommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3">AI Recommendations</h3>
                        <ul className="space-y-2">
                          {overallInsights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* File Details Tab */}
                {activeTab === 'files' && (
                  <div className="space-y-4">
                    {uploadResults.map((result, idx) => {
                      const analysis = result.status === 'fulfilled' && result.value?.id ? fileAnalyses[result.value.id] : null;
                      return (
                        <div key={idx} className={`border rounded-lg p-4 ${
                          result.status === 'fulfilled' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <FileText className={`h-5 w-5 mt-0.5 ${
                                result.status === 'fulfilled' ? 'text-green-600' : 'text-red-600'
                              }`} />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {analysis?.fileName || result.value?.filename || result.value?.metadata?.original_name || result.value?.original_name || result.value?.name || `File ${idx + 1}`}
                                </p>
                                {result.status === 'fulfilled' ? (
                                  <>
                                    <div className="mt-1 text-sm text-gray-600">
                                      <p>File ID: {result.value?.id}</p>
                                      <p>Size: {result.value?.size_bytes ? `${(result.value.size_bytes / 1024).toFixed(1)} KB` : (analysis?.fileSize ? `${(analysis.fileSize / 1024).toFixed(1)} KB` : 'Unknown')}</p>
                                      <p>Status: Successfully uploaded and processed</p>
                                      {(result.value?.created_at || analysis?.uploadedAt) && (
                                        <p>Uploaded: {(() => {
                                          const dateStr = result.value?.created_at || analysis?.uploadedAt;
                                          const date = new Date(dateStr);
                                          return isNaN(date.getTime()) ? 'Date unknown' : date.toLocaleString();
                                        })()}</p>
                                      )}
                                    </div>
                                    {analysis && !analysis.error && (
                                      <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <h4 className="text-xs font-medium text-gray-500 uppercase">Content Analysis</h4>
                                          <p className="text-sm text-gray-700">
                                            Language: {
                                              result.value?.processing_result?.language || 
                                              analysis?.dominant_language || 
                                              analysis?.language || 
                                              'Unknown'
                                            }
                                          </p>
                                          {analysis.readability_score && (
                                            <p className="text-sm text-gray-700">
                                              Readability: {(analysis.readability_score * 100).toFixed(0)}%
                                            </p>
                                          )}
                                          {analysis.confidence_score && (
                                            <p className="text-sm text-gray-700">
                                              Confidence: {(analysis.confidence_score * 100).toFixed(0)}%
                                            </p>
                                          )}
                                        </div>
                                        <div className="space-y-1">
                                          <h4 className="text-xs font-medium text-gray-500 uppercase">Quality Metrics</h4>
                                          {analysis.quality_metrics && (
                                            <>
                                              <p className="text-sm text-gray-700">
                                                Coherence: {(analysis.quality_metrics.coherence_score * 100).toFixed(0)}%
                                              </p>
                                              <p className="text-sm text-gray-700">
                                                Completeness: {(analysis.quality_metrics.completeness_score * 100).toFixed(0)}%
                                              </p>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {analysis?.error && (
                                      <p className="mt-2 text-sm text-orange-600">
                                        ⚠️ {analysis.error}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm text-red-600">
                                    Failed: {result.reason?.message || 'Unknown error'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
      </div>
    </Modal>
  );
}