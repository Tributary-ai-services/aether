import React, { useState } from 'react';
import { Bot, Play, Settings, Share2 } from 'lucide-react';
import { getMediaIcon } from '../../utils/helpers.jsx';
import ShareDialog from '../collaboration/ShareDialog.jsx';

const AgentCard = ({ agent, onOpenDetail }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  return (
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
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShareDialogOpen(true);
          }}
          className="p-2 text-gray-400 hover:text-blue-600"
          title="Share Agent"
        >
          <Share2 size={16} />
        </button>
        <button 
          onClick={onOpenDetail}
          className="p-2 text-gray-400 hover:text-gray-600"
          title="View Details"
        >
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

    <ShareDialog
      isOpen={shareDialogOpen}
      onClose={() => setShareDialogOpen(false)}
      resourceId={agent.id || '1'}
      resourceType="agent"
      resourceName={agent.name}
    />
  </div>
  );
};

export default AgentCard;