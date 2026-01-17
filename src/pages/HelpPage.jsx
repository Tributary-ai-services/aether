import React from 'react';
import { Book, MessageCircle, Video, FileText, RefreshCw, Mail, HelpCircle, Rocket, Bot, Database } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { resetOnboarding } from '../store';

const HelpPage = () => {
  const dispatch = useAppDispatch();

  const handleRestartTutorial = async () => {
    try {
      // This will reset and auto-open the modal via Redux thunk
      await dispatch(resetOnboarding(false)).unwrap();
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  };

  const sections = [
    {
      title: 'Getting Started',
      icon: Rocket,
      color: 'blue',
      items: [
        {
          title: 'Welcome to Aether',
          description: 'Learn the basics of your AI-powered document workspace.',
          link: '#welcome'
        },
        {
          title: 'Your First Notebook',
          description: 'Create and organize documents in notebooks.',
          link: '#notebooks'
        },
        {
          title: 'Working with AI Agents',
          description: 'Use intelligent agents to analyze your documents.',
          link: '#agents'
        }
      ]
    },
    {
      title: 'Core Features',
      icon: Database,
      color: 'purple',
      items: [
        {
          title: 'Document Upload & Processing',
          description: 'Upload PDFs, images, and other files for AI analysis.',
          link: '#upload'
        },
        {
          title: 'AI-Powered Search',
          description: 'Find information quickly with semantic search.',
          link: '#search'
        },
        {
          title: 'Collaboration',
          description: 'Share notebooks and work together with your team.',
          link: '#collaboration'
        }
      ]
    },
    {
      title: 'Resources',
      icon: Book,
      color: 'green',
      items: [
        {
          title: 'Video Tutorials',
          description: 'Watch step-by-step video guides.',
          icon: Video,
          link: '#videos'
        },
        {
          title: 'Documentation',
          description: 'Comprehensive guides and API references.',
          icon: FileText,
          link: '#docs'
        },
        {
          title: 'Community Forum',
          description: 'Connect with other users and get help.',
          icon: MessageCircle,
          link: '#community'
        }
      ]
    }
  ];

  const faqs = [
    {
      question: 'How do I upload documents?',
      answer: 'Navigate to any notebook and click the "Upload" button. You can drag and drop files or browse from your computer. Supported formats include PDF, DOCX, images, and more.'
    },
    {
      question: 'What are AI Agents?',
      answer: 'AI Agents are intelligent assistants that can analyze your documents, answer questions, and help you find information. Each agent can be customized with specific instructions and capabilities.'
    },
    {
      question: 'How is my data secured?',
      answer: 'Aether uses enterprise-grade encryption for data at rest and in transit. All documents are stored securely, and access is controlled through robust authentication and authorization.'
    },
    {
      question: 'Can I collaborate with team members?',
      answer: 'Yes! You can create shared notebooks and invite team members. Aether supports real-time collaboration with granular permission controls.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'Aether supports PDF, DOCX, XLSX, PPTX, TXT, images (PNG, JPG, TIFF), and many other common document formats. Each file is processed to extract text and metadata for AI analysis.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center mb-4">
            <HelpCircle className="w-12 h-12 mr-4" />
            <h1 className="text-4xl font-bold">Help Center</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-3xl">
            Get started with Aether, learn about features, and find answers to common questions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Restart Tutorial Button */}
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need a Refresher?
              </h3>
              <p className="text-gray-600 text-sm">
                Restart the onboarding tutorial to review the basics and explore key features again.
              </p>
            </div>
            <button
              onClick={handleRestartTutorial}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="mr-2 w-5 h-5" />
              Restart Tutorial
            </button>
          </div>
        </div>

        {/* Help Sections */}
        {sections.map((section, index) => {
          const SectionIcon = section.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            green: 'bg-green-100 text-green-600'
          };

          return (
            <div key={index} className="mb-8">
              <div className="flex items-center mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses[section.color]} mr-3`}>
                  <SectionIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {section.items.map((item, itemIndex) => {
                  const ItemIcon = item.icon;
                  return (
                    <a
                      key={itemIndex}
                      href={item.link}
                      className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                    >
                      {ItemIcon && (
                        <div className="mb-3">
                          <ItemIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Still Need Help?
              </h3>
              <p className="text-gray-600">
                Our support team is here to assist you. Reach out anytime!
              </p>
            </div>
            <a
              href="mailto:support@aether.ai"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              <Mail className="mr-2 w-5 h-5" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
