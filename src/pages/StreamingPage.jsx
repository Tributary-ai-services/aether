import React from 'react';
import { useStreaming } from '../hooks/index.js';
import { getStatusColor, getSentimentColor, getMediaIcon } from '../utils/helpers.jsx';
import {
  Radio,
  Activity,
  Camera,
  Volume2,
  Shield,
  Settings,
  Filter,
  Eye,
  Play,
  Pause,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Image,
  Video,
  Mic,
  FileText,
  AlertTriangle
} from 'lucide-react';

// Helper to get severity badge styles
const getSeverityBadgeStyles = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const StreamingPage = () => {
  const { 
    liveEvents, 
    streamSources, 
    eventsPerSecond, 
    activeStreams, 
    loading, 
    error 
  } = useStreaming();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading streaming data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading streaming data</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }
  return (
    <div className="h-full">
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Radio className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeStreams}</div>
              <div className="text-sm text-gray-600">Live Streams</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">2.4M</div>
              <div className="text-sm text-gray-600">Media Processed</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Camera className="text-purple-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">847</div>
              <div className="text-sm text-gray-600">Video Analysis</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Volume2 className="text-orange-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">1.2K</div>
              <div className="text-sm text-gray-600">Audio Hours</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="text-red-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">99.1%</div>
              <div className="text-sm text-gray-600">Audit Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Data Streams</h2>
            <Settings size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
          
          <div className="space-y-3">
            {streamSources.map(stream => {
              const Icon = stream.icon;
              return (
                <div 
                  key={stream.id} 
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={`text-${stream.color}-600`} />
                      <span className="font-medium text-gray-900">{stream.name}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(stream.status)}`}></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{stream.events.toLocaleString()} events</span>
                    <span>{stream.rate}/min</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 capitalize">{stream.type}</span>
                    <div className="flex gap-1">
                      {stream.status === 'active' ? (
                        <Pause size={12} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                      ) : (
                        <Play size={12} className="text-gray-400 cursor-pointer hover:text-green-600" />
                      )}
                      <Settings size={12} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Live Events</h2>
            <div className="flex gap-2">
              <Filter size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
              <Eye size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveEvents.map(event => (
              <div
                key={event.id}
                className={`p-3 border rounded-lg hover:bg-gray-50 ${
                  event.isComplianceEvent
                    ? event.severity === 'critical'
                      ? 'border-red-200 bg-red-50/50'
                      : event.severity === 'high'
                      ? 'border-orange-200 bg-orange-50/50'
                      : 'border-amber-200 bg-amber-50/50'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.isComplianceEvent ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Shield size={14} className="text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Compliance</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getSeverityBadgeStyles(event.severity)}`}>
                          {event.severity?.toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-gray-900">{event.source}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{event.type}</span>
                      </>
                    )}
                    <div className="flex items-center gap-1">
                      {event.isComplianceEvent ? (
                        <AlertTriangle size={12} className="text-amber-500" />
                      ) : (
                        getMediaIcon(event.mediaType)
                      )}
                      <span className="text-xs text-gray-500">{event.isComplianceEvent ? 'DLP' : event.mediaType}</span>
                    </div>
                    {event.hasAuditTrail && !event.isComplianceEvent && (
                      <div className="flex items-center gap-1">
                        <Shield size={10} className="text-green-600" />
                        <span className="text-xs text-green-600">Audited</span>
                      </div>
                    )}
                    {!event.isComplianceEvent && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(event.sentiment)}`}>
                        {event.sentiment}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {event.timestamp}
                  </div>
                </div>
                <p className={`text-sm ${event.isComplianceEvent ? 'text-gray-800' : 'text-gray-700'}`}>
                  {event.content}
                </p>
                {event.isComplianceEvent && event.confidence && (
                  <div className="mt-1 text-xs text-gray-500">
                    Confidence: {(event.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Real-Time Insights</h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Sentiment Trend</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Positive</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div className="w-12 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-900">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Neutral</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div className="w-3 h-2 bg-gray-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-900">18%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Negative</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div className="w-1 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-gray-900">7%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Multimodal Processing</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image size={14} className="text-blue-600" />
                  <span className="text-sm text-gray-600">Images</span>
                </div>
                <span className="text-sm text-gray-900">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-purple-600" />
                  <span className="text-sm text-gray-600">Videos</span>
                </div>
                <span className="text-sm text-gray-900">89</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mic size={14} className="text-green-600" />
                  <span className="text-sm text-gray-600">Audio</span>
                </div>
                <span className="text-sm text-gray-900">456</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Documents</span>
                </div>
                <span className="text-sm text-gray-900">2,341</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Audit & Compliance</h3>
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-sm font-medium text-green-900">Compliance Check</span>
                </div>
                <p className="text-xs text-green-700">All PII properly redacted in video transcript</p>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={14} className="text-red-600" />
                  <span className="text-sm font-medium text-red-900">Audit Flag</span>
                </div>
                <p className="text-xs text-red-700">Sensitive data detected in image upload</p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 size={14} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Quality Review</span>
                </div>
                <p className="text-xs text-yellow-700">Low OCR confidence on handwritten form</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingPage;