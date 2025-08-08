import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { performanceTrendData } from '../../data/mockData.js';

const PerformanceTrendChart = () => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={performanceTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value, name) => {
            if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
            if (name === 'latency') return [`${value}ms`, 'Latency'];
            if (name === 'throughput') return [`${value}/h`, 'Throughput'];
            return [value, name];
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="accuracy" 
          stroke="var(--color-primary-600)" 
          strokeWidth={2}
          dot={{ fill: 'var(--color-primary-600)', r: 4 }}
          activeDot={{ r: 6 }}
          name="Accuracy"
        />
        <Line 
          type="monotone" 
          dataKey="latency" 
          stroke="var(--color-secondary-600)" 
          strokeWidth={2}
          dot={{ fill: 'var(--color-secondary-600)', r: 4 }}
          activeDot={{ r: 6 }}
          name="Latency"
        />
        <Line 
          type="monotone" 
          dataKey="throughput" 
          stroke="var(--color-accent-600)" 
          strokeWidth={2}
          dot={{ fill: 'var(--color-accent-600)', r: 4 }}
          activeDot={{ r: 6 }}
          name="Throughput"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceTrendChart;