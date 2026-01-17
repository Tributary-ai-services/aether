import React from 'react';
import { BookOpen, FileText, CheckCircle } from 'lucide-react';

const NotebookIntroStep = ({ onNext, onBack }) => {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your First Notebook
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We've created a "Getting Started" notebook with sample documents to help you explore Aether's capabilities.
        </p>
      </div>

      {/* What's Included */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-green-600" />
          What's Included
        </h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Welcome to Aether.txt</p>
              <p className="text-sm text-gray-600">Introduction to the platform and key features</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Quick Start Guide.txt</p>
              <p className="text-sm text-gray-600">Step-by-step guide to using Aether effectively</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Sample FAQ.txt</p>
              <p className="text-sm text-gray-600">Frequently asked questions about Aether</p>
            </div>
          </div>
        </div>
      </div>

      {/* What You Can Do */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          What You Can Do
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Upload your own documents (PDF, images, audio, video)</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Search across all documents using natural language</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Organize documents with tags and descriptions</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Create AI agents to interact with your content</span>
          </li>
        </ul>
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
          className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default NotebookIntroStep;
