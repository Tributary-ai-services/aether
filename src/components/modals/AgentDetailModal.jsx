import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Comments from '../collaboration/Comments.jsx';
import ShareDialog from '../collaboration/ShareDialog.jsx';
import { getMediaIcon } from '../../utils/helpers.jsx';
import { 
  Bot, 
  Play, 
  Pause,
  Settings,
  Download,
  Edit,
  Trash2,
  Brain,
  Zap,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Share2
} from 'lucide-react';

const AgentDetailModal = ({ isOpen, onClose, agent }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  if (!agent) return null;

  const performanceMetrics = [
    { label: 'Accuracy', value: agent.accuracy + '%', trend: '+2.1%', color: 'text-green-600' },
    { label: 'Total Runs', value: agent.runs.toLocaleString(), trend: '+15%', color: 'text-blue-600' },
    { label: 'Avg Response Time', value: '1.2s', trend: '-0.3s', color: 'text-purple-600' },
    { label: 'Success Rate', value: '97.8%', trend: '+1.2%', color: 'text-green-600' }
  ];

  const recentRuns = [
    { id: 1, input: 'Legal contract analysis', output: 'Contract terms extracted successfully', time: '2 min ago', status: 'success' },
    { id: 2, input: 'Invoice data extraction', output: 'Invoice processed, $2,450.00 total', time: '5 min ago', status: 'success' },
    { id: 3, input: 'Medical record review', output: 'HIPAA compliance verified', time: '12 min ago', status: 'success' },
    { id: 4, input: 'Complex document scan', output: 'Processing timeout error', time: '1 hour ago', status: 'error' }
  ];

  const trainingHistory = [
    { version: 'v2.1', accuracy: agent.accuracy, date: '2 days ago', notes: 'Improved document classification' },
    { version: 'v2.0', accuracy: agent.accuracy - 1.2, date: '1 week ago', notes: 'Added multi-language support' },
    { version: 'v1.9', accuracy: agent.accuracy - 2.1, date: '2 weeks ago', notes: 'Enhanced OCR capabilities' }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={agent.name}
      size="large"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Bot className="text-purple-600" size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {agent.status}
              </span>
              <span className="text-sm text-gray-500">• Last run 2 minutes ago</span>
            </div>
            <p className="text-gray-600 mt-1">{agent.recentAnalysis}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Play size={16} />
            </button>
            <button className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <Pause size={16} />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">{metric.label}</div>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              <div className={`text-sm font-medium ${metric.color}`}>
                {metric.trend} vs last week
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supported Media */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Supported Media Types</h3>
              <div className="flex gap-2 flex-wrap">
                {agent.mediaSupport.map(type => (
                  <div key={type} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                    {getMediaIcon(type)}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Runs */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Runs</h3>
              <div className="space-y-3">
                {recentRuns.map(run => (
                  <div key={run.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {run.status === 'success' ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <Activity size={16} className="text-red-600" />
                        )}
                        <span className="font-medium text-gray-900">Input:</span>
                      </div>
                      <span className="text-xs text-gray-500">{run.time}</span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">{run.input}</div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">Output:</span> {run.output}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training History */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Training History</h3>
              <div className="space-y-3">
                {trainingHistory.map((version, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{version.accuracy}%</div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{version.version}</div>
                      <div className="text-sm text-gray-600">{version.notes}</div>
                      <div className="text-xs text-gray-500">{version.date}</div>
                    </div>
                    <TrendingUp size={16} className="text-green-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Play size={16} />
                  Run Agent
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Brain size={16} />
                  Retrain Model
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit size={16} />
                  Edit Configuration
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download size={16} />
                  Export Model
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 size={16} />
                  View Analytics
                </button>
                <button 
                  onClick={() => setShareDialogOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={16} />
                  Share Agent
                </button>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model Type:</span>
                  <span className="text-gray-900">Transformer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="text-gray-900">v2.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Data:</span>
                  <span className="text-gray-900">1.2M samples</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Trained:</span>
                  <span className="text-gray-900">2 days ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence Threshold:</span>
                  <span className="text-gray-900">85%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Processing Time:</span>
                  <span className="text-gray-900">30s</span>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resource Usage</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">CPU Usage</span>
                    <span className="text-gray-900">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Memory</span>
                    <span className="text-gray-900">2.1 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">GPU Usage</span>
                    <span className="text-gray-900">23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Comments resourceId={`agent-${agent.id || '1'}`} resourceType="agent" />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Zap size={14} />
                {agent.runs.toLocaleString()} total runs
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                Created 3 weeks ago
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={16} className="inline mr-1" />
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={agent.id || '1'}
        resourceType="agent"
        resourceName={agent.name}
      />
    </Modal>
  );
};

export default AgentDetailModal;