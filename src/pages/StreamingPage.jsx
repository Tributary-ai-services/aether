import React from 'react';
import { useStreaming } from '../hooks/index.js';
import { getStatusColor, getSentimentColor, getMediaIcon } from '../utils/helpers.jsx';
import {
  Radio,
  Activity,
  Shield,
  Settings,
  Filter,
  Eye,
  Clock,
  AlertTriangle,
  Cpu,
  Workflow,
  MessageSquare,
  Wrench,
  Wifi,
  WifiOff,
  FileText
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

// Map source `type` field (set by useStreaming.buildStreamSources) to a
// Lucide icon component. Used for the Data Streams panel rows.
const TYPE_ICON = {
  document: FileText,
  llm:      MessageSquare,
  agent:    Cpu,
  workflow: Workflow,
  mcp:      Wrench,
  security: Shield,
};

const StreamingPage = () => {
  const {
    liveEvents,
    streamSources,
    eventsPerSecond,
    activeStreams,
    loading,
    error,
    wsConnected,
  } = useStreaming();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Connecting to live stream…</span>
      </div>
    );
  }
  // Compute on-panel summary numbers from the streamed events themselves
  // so every figure on the page is provably real, not seeded mock data.
  const highSeverityCount = liveEvents.filter(
    (e) => e.isComplianceEvent && (e.severity === 'critical' || e.severity === 'high')
  ).length;
  const complianceCount = liveEvents.filter((e) => e.isComplianceEvent).length;

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
              <div className="text-sm text-gray-600">Active Sources (5m)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{eventsPerSecond.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Events / sec</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 ${wsConnected ? 'bg-emerald-100' : 'bg-gray-100'} rounded-lg`}>
              {wsConnected
                ? <Wifi className="text-emerald-600" size={20} />
                : <WifiOff className="text-gray-500" size={20} />}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {wsConnected ? 'Live' : 'Off'}
              </div>
              <div className="text-sm text-gray-600">WebSocket</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="text-orange-600" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{liveEvents.length}</div>
              <div className="text-sm text-gray-600">Events on Panel</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 ${highSeverityCount > 0 ? 'bg-red-100' : 'bg-gray-100'} rounded-lg`}>
              <Shield className={`${highSeverityCount > 0 ? 'text-red-600' : 'text-gray-500'}`} size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{complianceCount}</div>
              <div className="text-sm text-gray-600">Compliance Findings</div>
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
            {streamSources.length === 0 && (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
                {wsConnected
                  ? 'Connected. Sources will appear here as events arrive.'
                  : 'Not connected — events will appear when the live stream is active.'}
              </div>
            )}
            {streamSources.map(stream => {
              const Icon = TYPE_ICON[stream.type] || Activity;
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
            {liveEvents.length === 0 && (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
                {error
                  ? error
                  : wsConnected
                    ? 'Connected. Waiting for events…'
                    : 'Not connected. Live events will appear here once the stream opens.'}
              </div>
            )}
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

          <RealtimeInsights events={liveEvents} />
        </div>
      </div>
    </div>
  );
};

// RealtimeInsights renders three at-a-glance summaries computed live from the
// events currently on the panel. Every figure is derived; nothing is mock.
const RealtimeInsights = ({ events }) => {
  const total = events.length;

  // Sentiment is set by mapCEToUIEvent based on CE severity ('critical'/'high'
  // → negative, 'low' → positive, otherwise neutral). Counting these gives a
  // real distribution rather than a hard-coded 75/18/7.
  const sentimentCounts = events.reduce((acc, e) => {
    const s = e.sentiment || 'neutral';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const sentimentPct = (k) => (total === 0 ? 0 : Math.round(((sentimentCounts[k] || 0) / total) * 100));

  // Event-type distribution replaces the hard-coded Multimodal Processing
  // section. Group by the short CE type tail (e.g. document.uploaded → uploaded).
  const typeCounts = events.reduce((acc, e) => {
    const t = e.fullType || `unknown.${e.type || 'event'}`;
    const family = t.split('.').slice(-2).join('.');
    acc[family] = (acc[family] || 0) + 1;
    return acc;
  }, {});
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentCompliance = events
    .filter((e) => e.isComplianceEvent)
    .slice(0, 3);

  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Sentiment Distribution (panel)</h3>
        {total === 0 ? (
          <div className="text-xs text-gray-500 italic">No events yet</div>
        ) : (
          <div className="space-y-2">
            {['positive', 'neutral', 'negative'].map((k) => {
              const color = k === 'positive' ? 'green' : k === 'neutral' ? 'gray' : 'red';
              const pct = sentimentPct(k);
              return (
                <div key={k} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{k}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div className={`h-2 bg-${color}-500 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-900 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Top Event Types (panel)</h3>
        {topTypes.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No events yet</div>
        ) : (
          <div className="space-y-2">
            {topTypes.map(([family, count]) => (
              <div key={family} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate" title={family}>{family}</span>
                <span className="text-sm text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Compliance Activity</h3>
        {recentCompliance.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No compliance findings on the panel</div>
        ) : (
          <div className="space-y-2">
            {recentCompliance.map((e) => {
              const bg = e.severity === 'critical' || e.severity === 'high' ? 'red' : 'amber';
              return (
                <div key={e.id} className={`p-3 bg-${bg}-50 border border-${bg}-200 rounded-lg`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className={`text-${bg}-600`} />
                    <span className={`text-sm font-medium text-${bg}-900`}>{e.severity?.toUpperCase() || 'FINDING'}</span>
                  </div>
                  <p className={`text-xs text-${bg}-700 truncate`}>{e.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default StreamingPage;