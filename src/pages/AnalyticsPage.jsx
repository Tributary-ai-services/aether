import React, { useEffect } from 'react';
import { analyticsData, mlModels, experiments } from '../data/mockData.js';
import { useSpace } from '../hooks/useSpaces.js';
import { getTrendIcon, getModelStatusColor, getExperimentStatusColor, getMediaIcon } from '../utils/helpers.jsx';
import { PerformanceTrendChart, ProcessingDistributionChart, InfrastructureChart } from '../components/charts/index.js';
import { 
  Brain, 
  TestTube, 
  LineChart, 
  PieChart, 
  Target, 
  Cpu, 
  Database, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

const AnalyticsPage = () => {
  const { currentSpace, loadAvailableSpaces, initialized } = useSpace();

  // Initialize spaces
  useEffect(() => {
    if (!initialized) {
      loadAvailableSpaces();
    }
  }, [initialized, loadAvailableSpaces]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">ML/Analytics Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsData.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{item.metric}</h3>
                {getTrendIcon(item.trend)}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
              <div className={`text-sm font-medium ${
                item.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {item.change} from last month
              </div>
              <div className="text-xs text-gray-500 mt-2">{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Machine Learning Models</h3>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            Deploy New Model
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mlModels.map(model => (
            <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{model.name}</h4>
                    <p className="text-sm text-gray-600">{model.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getModelStatusColor(model.status)}`}>
                  {model.status}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex gap-1 flex-wrap">
                  {model.mediaTypes.map(type => (
                    <div key={type} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                      {getMediaIcon(type)}
                      {type}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{model.accuracy}%</div>
                  <div className="text-xs text-gray-600">Accuracy</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{model.predictions.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Predictions</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="text-gray-900">{model.version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Data:</span>
                  <span className="text-gray-900">{model.trainingData}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Trained:</span>
                  <span className="text-gray-900">{model.lastTrained}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-(--color-primary-600) text-(--color-primary-contrast) px-3 py-2 rounded text-sm hover:bg-(--color-primary-700)">
                  View Metrics
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                  Retrain
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">ML Experiments</h3>
          <button className="bg-(--color-primary-600) text-(--color-primary-contrast) px-4 py-2 rounded-lg hover:bg-(--color-primary-700) transition-colors">
            New Experiment
          </button>
        </div>
        <div className="space-y-4">
          {experiments.map(experiment => (
            <div key={experiment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TestTube className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{experiment.name}</h4>
                    <p className="text-sm text-gray-600">{experiment.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getExperimentStatusColor(experiment.status)}`}>
                  {experiment.status}
                </span>
              </div>

              {experiment.status === 'running' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{experiment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-(--color-primary-600) h-2 rounded-full"
                      style={{ width: `${experiment.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-600">
                <div className="flex gap-4">
                  <span>Started: {experiment.startDate}</span>
                  <span>ETA: {experiment.estimatedCompletion}</span>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800">View</button>
                  {experiment.status === 'running' && (
                    <button className="text-red-600 hover:text-red-800">Stop</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Model Performance Trends</h3>
          </div>
          <div className="h-48">
            <PerformanceTrendChart />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Processing Distribution</h3>
          </div>
          <div className="h-48">
            <ProcessingDistributionChart />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Infrastructure Metrics</h3>
          </div>
          <div className="h-40">
            <InfrastructureChart />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-orange-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Data Pipeline Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm text-green-900">Ingestion Pipeline</span>
              </div>
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm text-green-900">Processing Queue</span>
              </div>
              <span className="text-sm text-green-600">Normal</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-600" />
                <span className="text-sm text-yellow-900">Storage Cleanup</span>
              </div>
              <span className="text-sm text-yellow-600">Warning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;