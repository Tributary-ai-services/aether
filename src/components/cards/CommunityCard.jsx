import React from 'react';
import { Bot, Workflow, BookOpen, Star, Eye } from 'lucide-react';

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

export default CommunityCard;