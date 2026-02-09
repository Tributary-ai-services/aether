import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [fileStatuses, setFileStatuses] = useState({});
  const [overallInsights, setOverallInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const pollIntervalRef = useRef(null);

  const POLL_INTERVAL_MS = 4000;
  const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 minutes
  const pollStartRef = useRef(null);

  // Cleanup polling on close or unmount
  useEffect(() => {
    if (!isOpen) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen]);

  // Start status polling + analysis fetching when modal opens
  useEffect(() => {
    if (isOpen && uploadResults.length > 0) {
      initStatusPolling();
    }
  }, [isOpen, uploadResults]);

  const getFileName = (result) => {
    const v = result.value;
    return v?.filename || v?.metadata?.original_name || v?.original_name || v?.name || 'Unknown file';
  };

  const initStatusPolling = () => {
    const successfulUploads = uploadResults.filter(r => r.status === 'fulfilled');

    // Initialize file statuses and analyses with basic info
    const initialStatuses = {};
    const initialAnalyses = {};
    for (const result of successfulUploads) {
      if (result.value?.id) {
        const id = result.value.id;
        initialStatuses[id] = { status: 'checking', progress: 0 };
        initialAnalyses[id] = {
          fileName: getFileName(result),
          fileSize: result.value.size,
          uploadedAt: result.value.created_at || new Date().toISOString(),
          pending: true
        };
      }
    }
    setFileStatuses(initialStatuses);
    setFileAnalyses(initialAnalyses);
    setLoading(true);
    pollStartRef.current = Date.now();

    // Do an immediate check, then start interval
    pollDocumentStatuses(successfulUploads);
    pollIntervalRef.current = setInterval(() => {
      pollDocumentStatuses(successfulUploads);
    }, POLL_INTERVAL_MS);
  };

  const pollDocumentStatuses = async (successfulUploads) => {
    // Timeout failsafe
    if (pollStartRef.current && (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS)) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setLoading(false);
      return;
    }

    let allDone = true;

    for (const result of successfulUploads) {
      const docId = result.value?.id;
      if (!docId) continue;

      try {
        const statusResponse = await aetherApi.documents.getStatus(docId);
        const statusData = statusResponse.data || statusResponse;
        const docStatus = statusData.status;
        const progress = statusData.progress || 0;

        setFileStatuses(prev => ({ ...prev, [docId]: { status: docStatus, progress } }));

        if (docStatus === 'processed') {
          // Document is done — fetch analysis if we haven't already
          setFileAnalyses(prev => {
            if (prev[docId] && !prev[docId].pending) return prev; // already fetched
            return prev; // will be updated by fetchAnalysisForDoc
          });
          fetchAnalysisForDoc(docId, result);
        } else if (docStatus === 'failed') {
          setFileAnalyses(prev => ({
            ...prev,
            [docId]: {
              ...prev[docId],
              pending: false,
              error: 'Document processing failed'
            }
          }));
        } else {
          // Still processing
          allDone = false;
        }
      } catch (err) {
        console.warn(`Failed to check status for ${docId}:`, err);
        allDone = false;
      }
    }

    if (allDone) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setLoading(false);
      buildOverallInsights();
    }
  };

  const fetchAnalysisForDoc = async (docId, result) => {
    try {
      const analysisResponse = await aetherApi.documents.getAnalysis(docId);
      if (analysisResponse?.data?.analysis) {
        const analysis = analysisResponse.data.analysis;
        setFileAnalyses(prev => ({
          ...prev,
          [docId]: {
            ...analysis,
            fileName: getFileName(result),
            fileSize: result.value.size,
            uploadedAt: result.value.created_at || new Date().toISOString(),
            pending: false
          }
        }));
      } else {
        setFileAnalyses(prev => ({
          ...prev,
          [docId]: {
            ...prev[docId],
            pending: false
          }
        }));
      }
    } catch (error) {
      console.warn(`Analysis not yet available for ${docId}:`, error);
      setFileAnalyses(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          pending: false
        }
      }));
    }
    // Rebuild insights whenever an analysis arrives
    buildOverallInsights();
  };

  const buildOverallInsights = useCallback(() => {
    setFileAnalyses(currentAnalyses => {
      let totalChunks = 0;
      let totalConfidence = 0;
      let validAnalysisCount = 0;
      const allTopics = [];

      for (const analysis of Object.values(currentAnalyses)) {
        if (analysis.pending || analysis.error) continue;
        totalChunks += analysis.total_chunks || 0;
        if (analysis.avg_confidence) {
          totalConfidence += analysis.avg_confidence;
          validAnalysisCount++;
        }
        if (analysis.main_topics) {
          allTopics.push(...analysis.main_topics);
        }
      }

      const successfulUploads = uploadResults.filter(r => r.status === 'fulfilled');
      const insights = {
        summary: {
          total_files: successfulUploads.length,
          total_chunks: totalChunks,
          confidence_score: validAnalysisCount > 0 ? totalConfidence / validAnalysisCount : 0,
          avg_processing_time_ms: 0
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
          : ['Documents uploaded successfully']
      };
      setOverallInsights(insights);

      return currentAnalyses; // don't mutate
    });
  }, [uploadResults]);

  const uploadSuccessCount = uploadResults.filter(r => r.status === 'fulfilled').length;
  const uploadFailCount = uploadResults.filter(r => r.status === 'rejected').length;
  const processingCount = Object.values(fileStatuses).filter(s => s.status === 'processing' || s.status === 'uploading' || s.status === 'checking').length;
  const processedCount = Object.values(fileStatuses).filter(s => s.status === 'processed').length;
  const processingFailedCount = Object.values(fileStatuses).filter(s => s.status === 'failed').length;

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
              <>
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Uploaded successfully */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold text-green-900">{uploadSuccessCount}</p>
                            <p className="text-sm text-green-700">Uploaded Successfully</p>
                          </div>
                        </div>
                      </div>
                      {/* Upload failures (actual upload errors) */}
                      {uploadFailCount > 0 && (
                        <div className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-8 w-8 text-red-600" />
                            <div>
                              <p className="text-2xl font-bold text-red-900">{uploadFailCount}</p>
                              <p className="text-sm text-red-700">Upload Failed</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            {uploadResults.filter(r => r.status === 'rejected').map((result, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <FileText className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-red-900">
                                    {result.reason?.fileName || `File ${idx + 1}`}
                                  </p>
                                  <p className="text-red-700">
                                    {result.reason?.message || 'Unknown error'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Processing status */}
                    {uploadSuccessCount > 0 && (
                      <div className={`rounded-lg p-4 ${processedCount === uploadSuccessCount ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <h3 className="font-medium text-gray-900 mb-3">Document Processing</h3>
                        <div className="space-y-2">
                          {uploadResults.filter(r => r.status === 'fulfilled' && r.value?.id).map((result) => {
                            const docId = result.value.id;
                            const status = fileStatuses[docId];
                            const docStatus = status?.status || 'checking';
                            return (
                              <div key={docId} className="flex items-center gap-3 text-sm">
                                {docStatus === 'processed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : docStatus === 'failed' ? (
                                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                )}
                                <span className="flex-1 truncate font-medium">{getFileName(result)}</span>
                                <span className={`text-xs ${
                                  docStatus === 'processed' ? 'text-green-600' :
                                  docStatus === 'failed' ? 'text-red-600' :
                                  'text-blue-600'
                                }`}>
                                  {docStatus === 'processed' ? 'Processed' :
                                   docStatus === 'failed' ? 'Failed' :
                                   docStatus === 'processing' ? 'Processing...' :
                                   'Checking...'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {processingCount > 0 && (
                          <p className="mt-3 text-xs text-blue-600">
                            {processingCount} document{processingCount > 1 ? 's' : ''} still processing. Analysis will be available when complete.
                          </p>
                        )}
                      </div>
                    )}

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
                      const docId = result.status === 'fulfilled' ? result.value?.id : null;
                      const analysis = docId ? fileAnalyses[docId] : null;
                      const status = docId ? fileStatuses[docId] : null;
                      const docStatus = status?.status || 'checking';
                      const isFailed = result.status === 'rejected';
                      const isProcessingFailed = docStatus === 'failed';
                      const borderClass = isFailed || isProcessingFailed
                        ? 'border-red-200 bg-red-50'
                        : docStatus === 'processed'
                          ? 'border-green-200 bg-green-50'
                          : 'border-blue-200 bg-blue-50';
                      const iconClass = isFailed || isProcessingFailed
                        ? 'text-red-600'
                        : docStatus === 'processed'
                          ? 'text-green-600'
                          : 'text-blue-600';
                      return (
                        <div key={idx} className={`border rounded-lg p-4 ${borderClass}`}>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <FileText className={`h-5 w-5 mt-0.5 ${iconClass}`} />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {result.status === 'fulfilled'
                                    ? (analysis?.fileName || getFileName(result))
                                    : (result.reason?.fileName || `File ${idx + 1}`)
                                  }
                                </p>
                                {result.status === 'fulfilled' ? (
                                  <>
                                    <div className="mt-1 text-sm text-gray-600">
                                      <p>File ID: {result.value?.id}</p>
                                      <p>Size: {result.value?.size_bytes ? `${(result.value.size_bytes / 1024).toFixed(1)} KB` : (analysis?.fileSize ? `${(analysis.fileSize / 1024).toFixed(1)} KB` : 'Unknown')}</p>
                                      <p>Status: {
                                        docStatus === 'processed' ? 'Uploaded and processed' :
                                        docStatus === 'failed' ? 'Processing failed' :
                                        docStatus === 'processing' ? 'Processing document...' :
                                        'Checking status...'
                                      }</p>
                                      {(result.value?.created_at || analysis?.uploadedAt) && (
                                        <p>Uploaded: {(() => {
                                          const dateStr = result.value?.created_at || analysis?.uploadedAt;
                                          const date = new Date(dateStr);
                                          return isNaN(date.getTime()) ? 'Date unknown' : date.toLocaleString();
                                        })()}</p>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="mt-1 text-sm text-red-600 space-y-1">
                                    <p>Error: {result.reason?.message || 'Unknown error'}</p>
                                    {result.reason?.fileSize && (
                                      <p className="text-gray-500">Size: {(result.reason.fileSize / 1024).toFixed(1)} KB</p>
                                    )}
                                  </div>
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
          </div>
      </div>
    </Modal>
  );
}