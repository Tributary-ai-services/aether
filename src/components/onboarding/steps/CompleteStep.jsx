import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Rocket, BookOpen, Bot, HelpCircle } from 'lucide-react';

const CompleteStep = ({ onComplete, onBack, onClose, isCompleting }) => {
  const navigate = useNavigate();
  const nextSteps = [
    {
      icon: BookOpen,
      title: 'Explore Your Notebook',
      description: 'Check out the "Getting Started" notebook with sample documents',
      action: 'Go to Notebooks',
      route: '/notebooks',
      color: 'green'
    },
    {
      icon: Bot,
      title: 'Try Your AI Agent',
      description: 'Chat with your "Personal Assistant" agent about the sample documents',
      action: 'Open Agents',
      route: '/agent-builder',
      color: 'purple'
    },
    {
      icon: HelpCircle,
      title: 'Need Help?',
      description: 'Visit our documentation or contact support anytime',
      action: 'View Docs',
      route: '/help',
      color: 'blue'
    }
  ];

  const handleNavigate = (route) => {
    // Close the modal first
    if (onClose) {
      onClose();
    }
    // Then navigate to the specified route
    navigate(route);
  };

  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          You're All Set!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your Aether workspace is ready. We've set up everything you need to get started with AI-powered document intelligence.
        </p>
      </div>

      {/* What's Ready */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What's Ready for You
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Personal Space</p>
              <p className="text-xs text-gray-600">Your private workspace</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Getting Started Notebook</p>
              <p className="text-xs text-gray-600">With 3 sample documents</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Personal Assistant</p>
              <p className="text-xs text-gray-600">GPT-4 powered AI agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recommended Next Steps
        </h3>
        <div className="space-y-3">
          {nextSteps.map((step, index) => {
            const Icon = step.icon;
            const colorClasses = {
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              blue: 'bg-blue-100 text-blue-600'
            };

            return (
              <div
                key={index}
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses[step.color]} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 ml-4 text-left">
                  <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
                <button
                  onClick={() => handleNavigate(step.route)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  {step.action}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Rocket className="mr-2 w-5 h-5" />
          {isCompleting ? 'Completing...' : 'Start Using Aether'}
        </button>
      </div>

      {/* Footer Note */}
      <p className="mt-6 text-xs text-gray-500">
        You can always revisit this guide from the Help menu
      </p>
    </div>
  );
};

export default CompleteStep;
