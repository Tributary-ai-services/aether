import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Bot, 
  Workflow, 
  BookOpen, 
  Users, 
  Share2, 
  Play, 
  Settings, 
  TrendingUp,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Star,
  Radio,
  Activity,
  DollarSign,
  Building2,
  Globe,
  AlertTriangle,
  Pause,
  Filter,
  Clock,
  Bell,
  Image,
  Video,
  Mic,
  FileVideo,
  Camera,
  Volume2,
  Scan,
  Shield,
  CheckCircle,
  XCircle,
  BarChart3,
  Brain,
  LineChart,
  PieChart,
  Target,
  Cpu,
  Database,
  GitBranch,
  Layers,
  TestTube,
  User,
  ChevronDown
} from 'lucide-react';

const TributaryAIDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [eventsPerSecond, setEventsPerSecond] = useState(0);
  const [activeStreams, setActiveStreams] = useState(0);
  const [selectedNotebook, setSelectedNotebook] = useState(null);

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStreams(Math.floor(Math.random() * 5) + 8);
      setEventsPerSecond(Math.floor(Math.random() * 100) + 50);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const notebooks = [
    { 
      id: 1, 
      name: "Contract Analysis Pipeline", 
      documents: 45, 
      collaborators: 3, 
      public: true, 
      likes: 23,
      mediaTypes: ['document', 'image', 'signature'],
      lastProcessed: 'PDF with embedded signatures',
      auditScore: 98
    },
    { 
      id: 2, 
      name: "HIPAA Compliance Checker", 
      documents: 67, 
      collaborators: 5, 
      public: false, 
      likes: 0,
      mediaTypes: ['document', 'audio', 'video'],
      lastProcessed: 'Medical consultation video',
      auditScore: 95
    },
    { 
      id: 3, 
      name: "Invoice Processing Automation", 
      documents: 123, 
      collaborators: 8, 
      public: true, 
      likes: 56,
      mediaTypes: ['document', 'image', 'scan'],
      lastProcessed: 'Multi-page invoice scan',
      auditScore: 92
    }
  ];

  const agents = [
    { 
      id: 1, 
      name: "Legal Contract Analyzer", 
      status: "active", 
      runs: 1204, 
      accuracy: 94,
      mediaSupport: ['document', 'image', 'handwriting'],
      recentAnalysis: 'Detected 12 key clauses in scanned contract'
    },
    { 
      id: 2, 
      name: "PII Detection Agent", 
      status: "training", 
      runs: 345, 
      accuracy: 87,
      mediaSupport: ['audio', 'video', 'document', 'image'],
      recentAnalysis: 'Identified SSN in voice recording at 2:34'
    },
    { 
      id: 3, 
      name: "Invoice Data Extractor", 
      status: "active", 
      runs: 2341, 
      accuracy: 96,
      mediaSupport: ['scan', 'image', 'document'],
      recentAnalysis: 'Extracted line items from blurry receipt photo'
    }
  ];

  const workflows = [
    { id: 1, name: "Document Approval Chain", triggers: "Upload", status: "active" },
    { id: 2, name: "Compliance Validation Flow", triggers: "Schedule", status: "paused" },
    { id: 3, name: "Multi-tenant Processing", triggers: "API", status: "active" }
  ];

  const streamSources = [
    { 
      id: 'twitter', 
      name: 'Twitter/X Feed', 
      type: 'social', 
      status: 'active', 
      events: 1234, 
      rate: 45,
      icon: MessageCircle,
      color: 'blue'
    },
    { 
      id: 'stocks', 
      name: 'Stock Quotes', 
      type: 'financial', 
      status: 'active', 
      events: 856, 
      rate: 23,
      icon: DollarSign,
      color: 'green'
    },
    { 
      id: 'salesforce', 
      name: 'Salesforce Events', 
      type: 'enterprise', 
      status: 'paused', 
      events: 67, 
      rate: 0,
      icon: Building2,
      color: 'purple'
    },
    { 
      id: 'news', 
      name: 'News Feed', 
      type: 'media', 
      status: 'active', 
      events: 342, 
      rate: 12,
      icon: Globe,
      color: 'orange'
    }
  ];

  const liveEvents = [
    { 
      id: 1, 
      source: 'Twitter', 
      type: 'mention', 
      content: '@company great product update!', 
      sentiment: 'positive', 
      timestamp: '2s ago',
      mediaType: 'text',
      hasAuditTrail: true
    },
    { 
      id: 2, 
      source: 'Document Upload', 
      type: 'multimodal', 
      content: 'Processing video call transcript with slide deck images', 
      sentiment: 'neutral', 
      timestamp: '5s ago',
      mediaType: 'video+image',
      hasAuditTrail: true
    },
    { 
      id: 3, 
      source: 'Voice Analytics', 
      type: 'audio', 
      content: 'Customer service call - compliance keywords detected', 
      sentiment: 'positive', 
      timestamp: '12s ago',
      mediaType: 'audio',
      hasAuditTrail: true
    },
    { 
      id: 4, 
      source: 'Image Scanner', 
      type: 'document', 
      content: 'Handwritten form converted to structured data', 
      sentiment: 'neutral', 
      timestamp: '18s ago',
      mediaType: 'image',
      hasAuditTrail: true
    },
    { 
      id: 5, 
      source: 'Video Analysis', 
      type: 'surveillance', 
      content: 'Security footage: person detection and behavior analysis', 
      sentiment: 'neutral', 
      timestamp: '25s ago',
      mediaType: 'video',
      hasAuditTrail: true
    }
  ];

  const mlModels = [
    {
      id: 1,
      name: "Document Classification Model",
      type: "Classification",
      status: "deployed",
      accuracy: 94.2,
      version: "v2.1",
      trainingData: "45K documents",
      lastTrained: "2 days ago",
      predictions: 12456,
      mediaTypes: ['document', 'image']
    },
    {
      id: 2,
      name: "PII Detection Neural Network",
      type: "Named Entity Recognition",
      status: "training",
      accuracy: 97.8,
      version: "v1.3",
      trainingData: "89K samples",
      lastTrained: "In progress",
      predictions: 8934,
      mediaTypes: ['text', 'audio', 'video']
    },
    {
      id: 3,
      name: "Sentiment Analysis Transformer",
      type: "Sentiment Analysis",
      status: "deployed",
      accuracy: 91.6,
      version: "v3.0",
      trainingData: "156K texts",
      lastTrained: "1 week ago",
      predictions: 25789,
      mediaTypes: ['text', 'audio']
    },
    {
      id: 4,
      name: "Video Content Analyzer",
      type: "Computer Vision",
      status: "testing",
      accuracy: 88.4,
      version: "v0.9",
      trainingData: "12K videos",
      lastTrained: "Yesterday",
      predictions: 1234,
      mediaTypes: ['video', 'image']
    }
  ];

  const analyticsData = [
    {
      metric: "Model Performance",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      description: "Average accuracy across all models"
    },
    {
      metric: "Processing Volume",
      value: "2.4M",
      change: "+15%",
      trend: "up",
      description: "Documents processed this month"
    },
    {
      metric: "Training Efficiency",
      value: "12.3h",
      change: "-8%",
      trend: "down",
      description: "Average model training time"
    },
    {
      metric: "Cost Optimization",
      value: "$4.2K",
      change: "-12%",
      trend: "down",
      description: "Monthly ML infrastructure costs"
    }
  ];

  const experiments = [
    {
      id: 1,
      name: "Multimodal Fusion Experiment",
      status: "running",
      progress: 67,
      startDate: "3 days ago",
      estimatedCompletion: "2 days",
      description: "Testing combined image+text classification"
    },
    {
      id: 2,
      name: "Transfer Learning Study",
      status: "completed",
      progress: 100,
      startDate: "1 week ago",
      estimatedCompletion: "Completed",
      description: "Fine-tuning pre-trained models for legal documents"
    },
    {
      id: 3,
      name: "Data Augmentation Test",
      status: "queued",
      progress: 0,
      startDate: "Pending",
      estimatedCompletion: "5 days",
      description: "Synthetic data generation for rare document types"
    }
  ];

  const communityItems = [
    { type: "agent", name: "Medical Records Processor", author: "Dr. Smith", downloads: 234, rating: 4.8 },
    { type: "workflow", name: "GDPR Compliance Flow", author: "CompliancePro", downloads: 567, rating: 4.9 },
    { type: "notebook", name: "Financial Analysis Templates", author: "FinTech Labs", views: 1234, rating: 4.7 }
  ];

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getModelStatusColor = (status) => {
    switch(status) {
      case 'deployed': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperimentStatusColor = (status) => {
    switch(status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'queued': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? 
      <TrendingUp size={14} className="text-green-600" /> : 
      <TrendingUp size={14} className="text-red-600 rotate-180" />;
  };

  const getMediaIcon = (mediaType) => {
    switch(mediaType) {
      case 'image': return <Image size={12} className="text-blue-600" />;
      case 'video': return <Video size={12} className="text-purple-600" />;
      case 'audio': return <Mic size={12} className="text-green-600" />;
      case 'video+image': return <FileVideo size={12} className="text-indigo-600" />;
      case 'scan': return <Scan size={12} className="text-orange-600" />;
      case 'document': return <FileText size={12} className="text-gray-600" />;
      case 'text': return <FileText size={12} className="text-gray-600" />;
      case 'handwriting': return <FileText size={12} className="text-purple-600" />;
      case 'signature': return <FileText size={12} className="text-blue-600" />;
      default: return <FileText size={12} className="text-gray-600" />;
    }
  };

  const getMediaTypeColor = (mediaTypes) => {
    if (mediaTypes?.includes('video')) return 'bg-purple-100 text-purple-800';
    if (mediaTypes?.includes('audio')) return 'bg-green-100 text-green-800';
    if (mediaTypes?.includes('image')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const NotebookCard = ({ notebook }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-gray-900">{notebook.name}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Shield size={14} className="text-green-600" />
            <span className="text-xs text-green-600">{notebook.auditScore}%</span>
          </div>
          {notebook.public && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Heart size={14} />
              {notebook.likes}
            </div>
          )}
          <Share2 size={16} className="text-gray-400 cursor-pointer hover:text-blue-600" />
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {notebook.mediaTypes.map(type => (
          <div key={type} className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getMediaTypeColor([type])}`}>
            {getMediaIcon(type)}
            {type}
          </div>
        ))}
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 mb-1">Latest Processing</div>
        <div className="text-sm text-gray-700">{notebook.lastProcessed}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{notebook.documents}</div>
          <div className="text-sm text-gray-600">Media Items</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{notebook.collaborators}</div>
          <div className="text-sm text-gray-600">Collaborators</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 rounded-full text-xs ${
          notebook.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {notebook.public ? 'Public' : 'Private'}
        </span>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          Open →
        </button>
      </div>
    </div>
  );

  const AgentCard = ({ agent }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="text-purple-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {agent.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-blue-600">
            <Play size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Supported Media</div>
        <div className="flex gap-1 flex-wrap">
          {agent.mediaSupport.map(type => (
            <div key={type} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
              {getMediaIcon(type)}
              {type}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-600 mb-1">Recent Analysis</div>
        <div className="text-sm text-gray-700">{agent.recentAnalysis}</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{agent.runs.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Runs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{agent.accuracy}%</div>
          <div className="text-sm text-gray-600">Accuracy</div>
        </div>
      </div>
    </div>
  );

  const CommunityCard = ({ item }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {item.type === 'agent' && <Bot size={16} className="text-purple-600" />}
          {item.type === 'workflow' && <Workflow size={16} className="text-blue-600" />}
          {item.type === 'notebook' && <BookOpen size={16} className="text-green-600" />}
          <span className="text-xs uppercase tracking-wide text-gray-500">{item.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-500 fill-current" />
          <span className="text-sm text-gray-600">{item.rating}</span>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
      <p className="text-sm text-gray-600 mb-3">by {item.author}</p>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Eye size={14} />
          {item.downloads || item.views}
        </div>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          Use Template
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Tributary AI</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Enterprise</span>
            {activeTab === 'streaming' && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">{eventsPerSecond}/sec</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Create New
            </button>
            
            {/* Settings Icon */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings size={20} />
            </button>
            
            {/* Profile/Login */}
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900">John Doe</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden md:block" />
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-2">
          <TabButton 
            id="documents" 
            label="Notebooks" 
            icon={BookOpen} 
            isActive={activeTab === 'documents'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="agents" 
            label="Agents" 
            icon={Bot} 
            isActive={activeTab === 'agents'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="workflows" 
            label="Workflows" 
            icon={Workflow} 
            isActive={activeTab === 'workflows'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="analytics" 
            label="ML/Analytics" 
            icon={Brain} 
            isActive={activeTab === 'analytics'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="community" 
            label="Community" 
            icon={Users} 
            isActive={activeTab === 'community'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="streaming" 
            label="Live Streams" 
            icon={Radio} 
            isActive={activeTab === 'streaming'} 
            onClick={setActiveTab} 
          />
        </div>
      </nav>

      <main className="px-6 py-8">
        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Document Notebooks</h2>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                New Notebook
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notebooks.map(notebook => (
                <NotebookCard key={notebook.id} notebook={notebook} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">AI Agents</h2>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Create Agent
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Automation Workflows</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Build Workflow
              </button>
            </div>
            <div className="space-y-4">
              {workflows.map(workflow => (
                <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Workflow className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-600">Triggers: {workflow.triggers}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {workflow.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
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
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
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
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
                            className="bg-blue-600 h-2 rounded-full" 
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
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Interactive performance charts</p>
                    <p className="text-sm">Accuracy, Latency, Throughput over time</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="text-green-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Processing Distribution</h3>
                </div>
                <div className="h-48 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Target size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Media type distribution</p>
                    <p className="text-sm">Documents: 65%, Images: 20%, Video: 10%, Audio: 5%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="text-purple-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Infrastructure Metrics</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">GPU Utilization</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-16 h-2 bg-purple-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-900">78%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-12 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-900">62%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Network I/O</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-8 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-900">34%</span>
                    </div>
                  </div>
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
        )}

        {activeTab === 'community' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Community Marketplace</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Filter
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Sort
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityItems.map((item, index) => (
                <CommunityCard key={index} item={item} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'streaming' && (
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
                    <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{event.source}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{event.type}</span>
                          <div className="flex items-center gap-1">
                            {getMediaIcon(event.mediaType)}
                            <span className="text-xs text-gray-500">{event.mediaType}</span>
                          </div>
                          {event.hasAuditTrail && (
                            <div className="flex items-center gap-1">
                              <Shield size={10} className="text-green-600" />
                              <span className="text-xs text-green-600">Audited</span>
                            </div>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(event.sentiment)}`}>
                            {event.sentiment}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {event.timestamp}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{event.content}</p>
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
        )}
      </main>
    </div>
  );
};

export default TributaryAIDashboard;
