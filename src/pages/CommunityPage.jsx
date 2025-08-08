import React from 'react';
import { communityItems } from '../data/mockData.js';
import CommunityCard from '../components/cards/CommunityCard.jsx';

const CommunityPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Community Marketplace</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Filter
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Sort
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityItems.map((item, index) => (
          <CommunityCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;