import React from 'react';
import { Sparkles, FileText, Bot, Search } from 'lucide-react';

const WelcomeStep = ({ onNext, onComplete, isCompleting }) => {
  return (
    <div className="text-center">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-(--color-primary-contrast)" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Aether
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your AI-powered document intelligence platform for processing, analyzing, and extracting insights from any document.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Document Processing */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-(--color-primary-600) rounded-lg mb-4">
            <FileText className="w-6 h-6 text-(--color-primary-contrast)" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Document Processing
          </h3>
          <p className="text-sm text-gray-600">
            Upload PDFs, images, audio, and video files. Automatic text extraction and OCR powered by AI.
          </p>
        </div>

        {/* AI Agents */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg mb-4">
            <Bot className="w-6 h-6 text-(--color-primary-contrast)" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Agents
          </h3>
          <p className="text-sm text-gray-600">
            Create custom AI assistants for your notebooks. Ask questions and get intelligent summaries.
          </p>
        </div>

        {/* Smart Search */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-4">
            <Search className="w-6 h-6 text-(--color-primary-contrast)" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Smart Search
          </h3>
          <p className="text-sm text-gray-600">
            Semantic search across all documents. Find content using natural language queries.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <button
          onClick={onNext}
          className="inline-flex items-center px-8 py-3 bg-(--color-primary-600) text-(--color-primary-contrast) font-medium rounded-lg hover:bg-(--color-primary-700) transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Let's Get Started
          <Sparkles className="ml-2 w-5 h-5" />
        </button>
        <p className="mt-4 text-sm text-gray-500">
          Takes less than 2 minutes to complete
        </p>
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline transition-colors duration-200 disabled:opacity-50"
        >
          {isCompleting ? 'Skipping...' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeStep;
