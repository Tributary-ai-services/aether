import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Radio, ArrowLeft } from 'lucide-react';
import KafkaExplorer from '../components/database/KafkaExplorer.jsx';

const KafkaExplorerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const connectionId = searchParams.get('connectionId') || null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Radio className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Kafka Explorer</h1>
                  <p className="text-xs text-gray-500">Browse topics, messages, and consumer groups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <KafkaExplorer initialConnectionId={connectionId} />
        </div>
      </main>
    </div>
  );
};

export default KafkaExplorerPage;
