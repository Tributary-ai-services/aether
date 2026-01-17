import React from 'react';
import { 
  TrendingUp,
  Image,
  Video,
  Mic,
  FileVideo,
  Scan,
  FileText
} from 'lucide-react';

// Utility functions for the Aether AI platform

export const getSentimentColor = (sentiment) => {
  switch(sentiment) {
    case 'positive': return 'text-green-600 bg-green-50';
    case 'negative': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const getStatusColor = (status) => {
  switch(status) {
    case 'active': return 'bg-green-500';
    case 'paused': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export const getModelStatusColor = (status) => {
  switch(status) {
    case 'deployed': return 'bg-green-100 text-green-800';
    case 'training': return 'bg-blue-100 text-blue-800';
    case 'testing': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getExperimentStatusColor = (status) => {
  switch(status) {
    case 'running': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'queued': return 'bg-gray-100 text-gray-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTrendIcon = (trend) => {
  return trend === 'up' ? 
    <TrendingUp size={14} className="text-green-600" /> : 
    <TrendingUp size={14} className="text-red-600 rotate-180" />;
};

export const getMediaIcon = (mediaType) => {
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

export const getMediaTypeColor = (mediaTypes) => {
  if (mediaTypes?.includes('video')) return 'bg-purple-100 text-purple-800';
  if (mediaTypes?.includes('audio')) return 'bg-green-100 text-green-800';
  if (mediaTypes?.includes('image')) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};