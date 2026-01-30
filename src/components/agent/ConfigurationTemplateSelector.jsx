import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Shield, DollarSign, Zap, Scale, CheckCircle } from 'lucide-react';

const ConfigurationTemplateSelector = ({ selectedTemplate, onTemplateChange }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await api.agentTemplates.getPresets();
        setTemplates(response.data || []);
      } catch (error) {
        console.error('Failed to load templates:', error);
        // Fallback to default templates
        setTemplates([
          {
            name: 'High Reliability',
            description: 'Maximum reliability with extensive retry and fallback options',
            optimize_for: 'quality',
            recommended_for: ['Critical applications', 'Production systems', 'High-stakes decisions']
          },
          {
            name: 'Cost Optimized',
            description: 'Minimize costs while maintaining reasonable reliability',
            optimize_for: 'cost',
            recommended_for: ['Development', 'Testing', 'High-volume processing']
          },
          {
            name: 'Performance',
            description: 'Optimized for speed and low latency',
            optimize_for: 'performance',
            recommended_for: ['Real-time applications', 'Interactive systems', 'Low-latency requirements']
          },
          {
            name: 'Balanced',
            description: 'Balanced approach with moderate reliability and cost',
            optimize_for: 'quality',
            recommended_for: ['General use', 'Most applications', 'Default choice']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const getTemplateIcon = (templateName) => {
    switch (templateName) {
      case 'High Reliability':
        return <Shield className="text-green-600" size={20} />;
      case 'Cost Optimized':
        return <DollarSign className="text-(--color-primary-600)" size={20} />;
      case 'Performance':
        return <Zap className="text-purple-600" size={20} />;
      case 'Balanced':
        return <Scale className="text-orange-600" size={20} />;
      default:
        return <Shield className="text-gray-600" size={20} />;
    }
  };

  const getTemplateColor = (templateName) => {
    switch (templateName) {
      case 'High Reliability':
        return 'border-green-200 bg-green-50';
      case 'Cost Optimized':
        return 'border-(--color-primary-200) bg-(--color-primary-50)';
      case 'Performance':
        return 'border-purple-200 bg-purple-50';
      case 'Balanced':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSelectedColor = (templateName) => {
    switch (templateName) {
      case 'High Reliability':
        return 'border-green-500 bg-green-100 ring-2 ring-green-200';
      case 'Cost Optimized':
        return 'border-(--color-primary-500) bg-(--color-primary-100) ring-2 ring-(--color-primary-200)';
      case 'Performance':
        return 'border-purple-500 bg-purple-100 ring-2 ring-purple-200';
      case 'Balanced':
        return 'border-orange-500 bg-orange-100 ring-2 ring-orange-200';
      default:
        return 'border-gray-500 bg-gray-100 ring-2 ring-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Configuration Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-gray-900 mb-1">Configuration Templates</h4>
        <p className="text-sm text-gray-600">
          Choose a preset configuration that matches your use case. You can customize the settings after selection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.name;
          const baseColor = getTemplateColor(template.name);
          const selectedColor = getSelectedColor(template.name);
          
          return (
            <button
              key={template.name}
              type="button"
              onClick={() => onTemplateChange(template.name)}
              className={`relative border rounded-lg p-4 text-left transition-all hover:shadow-md ${
                isSelected ? selectedColor : baseColor
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="text-green-600" size={16} />
                </div>
              )}

              {/* Template Header */}
              <div className="flex items-start gap-3 mb-3">
                {getTemplateIcon(template.name)}
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 text-sm">{template.name}</h5>
                  <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                </div>
              </div>

              {/* Optimization Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  template.optimize_for === 'quality' ? 'bg-green-100 text-green-800' :
                  template.optimize_for === 'cost' ? 'bg-(--color-primary-100) text-(--color-primary-800)' :
                  template.optimize_for === 'performance' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Optimized for {template.optimize_for}
                </span>
              </div>

              {/* Recommended For */}
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Recommended for:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {template.recommended_for?.slice(0, 2).map((use, index) => (
                    <li key={index}>• {use}</li>
                  ))}
                  {template.recommended_for?.length > 2 && (
                    <li>• +{template.recommended_for.length - 2} more</li>
                  )}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Selected: {selectedTemplate}</h5>
          <p className="text-sm text-gray-600">
            This template will configure retry and fallback settings optimized for{' '}
            {templates.find(t => t.name === selectedTemplate)?.optimize_for || 'quality'}.
            You can further customize these settings in the advanced configuration sections below.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfigurationTemplateSelector;