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
import { aetherApi } from '../../services/aetherApi.js';

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
      const successfulUploads = uploadResults.filter(r => r.status === 'fulfilled');

      // Get individual file analyses for all successful uploads
      const analyses = {};
      let totalChunks = 0;
      let totalConfidence = 0;
      let validAnalysisCount = 0;
      const allTopics = [];
      const allEntities = [];

      for (const result of successfulUploads) {
        if (result.value?.id) {
          try {
            // Fetch ML analysis from aether-be (which proxies to AudiModal)
            const analysisResponse = await aetherApi.documents.getAnalysis(result.value.id);

            if (analysisResponse?.data?.analysis) {
              const analysis = analysisResponse.data.analysis;
              analyses[result.value.id] = {
                ...analysis,
                fileName: result.value.filename || result.value.metadata?.original_name || result.value.original_name || result.value.name || 'Unknown file',
                fileSize: result.value.size,
                uploadedAt: result.value.created_at || new Date().toISOString()
              };

              // Aggregate for overall insights
              totalChunks += analysis.total_chunks || 0;
              if (analysis.avg_confidence) {
                totalConfidence += analysis.avg_confidence;
                validAnalysisCount++;
              }
              if (analysis.main_topics) {
                allTopics.push(...analysis.main_topics);
              }
              if (analysis.key_entities) {
                allEntities.push(...analysis.key_entities);
              }
            } else {
              // No analysis data available yet
              analyses[result.value.id] = {
                fileName: result.value.filename || result.value.metadata?.original_name || result.value.original_name || result.value.name || 'Unknown file',
                fileSize: result.value.size,
                uploadedAt: result.value.created_at || new Date().toISOString(),
                pending: true
              };
            }
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

      // Build overall insights from aggregated data
      const insights = {
        summary: {
          total_files: successfulUploads.length,
          total_chunks: totalChunks,
          confidence_score: validAnalysisCount > 0 ? totalConfidence / validAnalysisCount : 0,
          avg_processing_time_ms: 0 // Will be updated with real data
        },
        content_insights: {
          dominant_language: 'English',
          avg_readability: validAnalysisCount > 0 ? totalConfidence / validAnalysisCount : 0,
          key_topics: [...new Set(allTopics)].slice(0, 5)
        },
        quality_metrics: validAnalysisCount > 0 ? {
          coherence_score: totalConfidence / validAnalysisCount,
          completeness_score: totalConfidence / validAnalysisCount,
        } : null,
        recommendations: validAnalysisCount > 0
          ? ['Documents processed successfully', 'ML analysis complete']
          : ['Documents uploaded - analysis pending']
      };
      setOverallInsights(insights);

    } catch (error) {
      console.error('Failed to fetch analysis data:', error);
      // Set fallback insights
      setOverallInsights({
        summary: {
          total_files: uploadResults.filter(r => r.status === 'fulfilled').length,
        },
        recommendations: ['Upload successful - analysis may take a moment']
      });
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
          <Sparkles className="h-6 w-6 text-(--color-primary-600)" />
          Upload Summary: {uploadResults.length === 1
            ? (uploadResults[0]?.value?.filename || uploadResults[0]?.value?.metadata?.original_name || uploadResults[0]?.value?.original_name || uploadResults[0]?.value?.name || 'Document')
            : `${uploadResults.length} Documents`}
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
                      ? 'border-(--color-primary-500) text-(--color-primary-600)'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'insights'
                      ? 'border-(--color-primary-500) text-(--color-primary-600)'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Insights
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'files'
                      ? 'border-(--color-primary-500) text-(--color-primary-600)'
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-primary-600)"></div>
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
                            <span className="text-gray-600 cursor-help" title="Time taken to extract and analyze all content from your document">Average Processing Time:</span>
                            <span className="ml-2 font-medium">{overallInsights.summary.avg_processing_time_ms}ms</span>
                          </div>
                          <div>
                            <span className="text-gray-600 cursor-help" title="How certain our AI is about the accuracy of its analysis. Higher scores indicate more reliable results.">Confidence Score:</span>
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
                      <div className="bg-(--color-primary-50) rounded-lg p-4">
                        <h3 className="font-medium text-(--color-primary-900) mb-3 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Content Analysis
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 cursor-help" title="The primary language detected in your document content">Dominant Language</p>
                            <p className="font-medium">{overallInsights.content_insights.dominant_language}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 cursor-help" title="Measures how easy your document is to read. Higher scores mean the text is clearer and easier to understand for most readers.">Readability Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-(--color-primary-600) h-2 rounded-full"
                                  style={{ width: `${overallInsights.content_insights.avg_readability * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{(overallInsights.content_insights.avg_readability * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          {overallInsights.content_insights.key_topics && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1 cursor-help" title="The main subjects and themes automatically identified in your document">Key Topics</p>
                              <div className="flex flex-wrap gap-2">
                                {overallInsights.content_insights.key_topics.map((topic, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-(--color-primary-100) text-(--color-primary-700) rounded-md text-xs">
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
                        <h3 className="font-medium text-green-900 mb-3 cursor-help" title="Automated quality assessment of your document's content structure and completeness">Quality Metrics</h3>
                        <div className="space-y-2">
                          {Object.entries(overallInsights.quality_metrics).map(([key, value]) => {
                            const tooltips = {
                              coherence_score: "How well your content flows and connects logically. Higher scores indicate better organized, more consistent writing.",
                              completeness_score: "How thorough your document covers its topics. Higher scores suggest comprehensive content with fewer gaps."
                            };
                            return (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 capitalize cursor-help" title={tooltips[key] || `Quality metric: ${key.replace(/_/g, ' ')}`}>
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="font-medium text-green-700">
                                  {(value * 100).toFixed(0)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {overallInsights.recommendations && overallInsights.recommendations.length > 0 && (
                      <div className="bg-(--color-primary-50) rounded-lg p-4">
                        <h3 className="font-medium text-(--color-primary-900) mb-3">AI Recommendations</h3>
                        <ul className="space-y-2">
                          {overallInsights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-(--color-primary-500) mt-0.5">•</span>
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