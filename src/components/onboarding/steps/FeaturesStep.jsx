import React from 'react';
import { Zap, Upload, MessageSquare, TrendingUp, Users, Shield } from 'lucide-react';

const FeaturesStep = ({ onNext, onBack }) => {
  const features = [
    {
      icon: Upload,
      title: 'Multi-Modal Upload',
      description: 'Upload PDFs, images, audio, video, and more. Automatic text extraction with OCR.',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      icon: MessageSquare,
      title: 'AI Agents',
      description: 'Create custom AI assistants that understand your documents and answer questions.',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200'
    },
    {
      icon: Zap,
      title: 'Semantic Search',
      description: 'Find content using natural language. Search understands meaning, not just keywords.',
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-50 to-orange-100',
      borderColor: 'border-orange-200'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Track document processing, search trends, and AI agent performance.',
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-200'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Share notebooks with team members. Organize work in personal or organization spaces.',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'End-to-end encryption, role-based access control, and comprehensive audit logs.',
      color: 'red',
      gradient: 'from-red-500 to-rose-600',
      bgGradient: 'from-red-50 to-rose-100',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Powerful Features
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore what makes Aether the ultimate AI-powered document intelligence platform.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${feature.bgGradient} rounded-xl p-5 border ${feature.borderColor} transition-all duration-300 hover:shadow-md`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-lg mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Tip */}
      <div className="bg-(--color-primary-50) border-l-4 border-(--color-primary-500) rounded-r-lg p-4 mb-8">
        <p className="text-sm text-(--color-primary-900)">
          <span className="font-semibold">Pro Tip:</span> Start by uploading a few documents to your "Getting Started" notebook, then create an AI agent to ask questions about them!
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-2.5 bg-(--color-primary-600) text-(--color-primary-contrast) font-medium rounded-lg hover:bg-(--color-primary-700) transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default FeaturesStep;
