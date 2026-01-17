import React from 'react';

const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

export default TabButton;