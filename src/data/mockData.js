import { 
  MessageCircle, 
  DollarSign, 
  Building2, 
  Globe,
  TrendingUp,
  Image,
  Video,
  Mic,
  FileVideo,
  Scan,
  FileText
} from 'lucide-react';

// Mock data for the Aether AI platform

export const notebooks = [
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

// NOTE: Agent data removed - now using real Agent Builder backend API

export const workflows = [
  { id: 1, name: "Document Approval Chain", triggers: "Upload", status: "active" },
  { id: 2, name: "Compliance Validation Flow", triggers: "Schedule", status: "paused" },
  { id: 3, name: "Multi-tenant Processing", triggers: "API", status: "active" }
];

export const streamSources = [
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

export const liveEvents = [
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

export const mlModels = [
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

export const analyticsData = [
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

// Chart data for interactive visualizations
export const performanceTrendData = [
  { month: 'Jan', accuracy: 91.2, latency: 145, throughput: 1200 },
  { month: 'Feb', accuracy: 92.1, latency: 142, throughput: 1350 },
  { month: 'Mar', accuracy: 91.8, latency: 138, throughput: 1420 },
  { month: 'Apr', accuracy: 93.2, latency: 135, throughput: 1580 },
  { month: 'May', accuracy: 93.8, latency: 132, throughput: 1720 },
  { month: 'Jun', accuracy: 94.2, latency: 128, throughput: 1890 }
];

export const processingDistributionData = [
  { name: 'Documents', value: 65, count: 1560000 },
  { name: 'Images', value: 20, count: 480000 },
  { name: 'Videos', value: 10, count: 240000 },
  { name: 'Audio', value: 5, count: 120000 }
];

export const infrastructureData = [
  { metric: 'GPU Utilization', value: 78, color: '#8b5cf6' },
  { metric: 'Memory Usage', value: 62, color: '#3b82f6' },
  { metric: 'Network I/O', value: 34, color: '#22c55e' },
  { metric: 'Storage', value: 45, color: '#f59e0b' }
];

export const experiments = [
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

export const communityItems = [
  { type: "agent", name: "Medical Records Processor", author: "Dr. Smith", downloads: 234, rating: 4.8 },
  { type: "workflow", name: "GDPR Compliance Flow", author: "CompliancePro", downloads: 567, rating: 4.9 },
  { type: "notebook", name: "Financial Analysis Templates", author: "FinTech Labs", views: 1234, rating: 4.7 },
  { type: "agent", name: "Legal Contract Analyzer", author: "LawTech Inc", downloads: 456, rating: 4.6 },
  { type: "workflow", name: "Document Classification Pipeline", author: "AI Solutions", downloads: 789, rating: 4.7 },
  { type: "notebook", name: "HIPAA Compliance Checker", author: "HealthTech", views: 567, rating: 4.9 }
];