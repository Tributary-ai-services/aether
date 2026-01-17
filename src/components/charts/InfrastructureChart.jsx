import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { infrastructureData } from '../../data/mockData.js';

const InfrastructureChart = () => {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart 
        data={infrastructureData} 
        layout="horizontal"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          type="number" 
          domain={[0, 100]}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          type="category" 
          dataKey="metric" 
          stroke="#6b7280"
          fontSize={12}
          width={70}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value) => [`${value}%`, 'Usage']}
        />
        <Bar 
          dataKey="value" 
          radius={[0, 4, 4, 0]}
        >
          {infrastructureData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default InfrastructureChart;