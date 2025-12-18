import React, { useState } from 'react';
import { useAgentProviders } from '../../hooks/useAgentBuilder.js';
import { ArrowRight, DollarSign, Shield, Info, Plus, X } from 'lucide-react';

const FallbackConfigurationForm = ({ config, onChange }) => {
  const { providers } = useAgentProviders();
  const [newProvider, setNewProvider] = useState('');

  const handleConfigChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleProviderChainChange = (newChain) => {
    handleConfigChange('preferred_chain', newChain);
  };

  const addProvider = () => {
    const currentChain = Array.isArray(config.preferred_chain) ? config.preferred_chain : [];
    if (newProvider && !currentChain.includes(newProvider)) {
      handleProviderChainChange([...currentChain, newProvider]);
      setNewProvider('');
    }
  };

  const removeProvider = (providerToRemove) => {
    const currentChain = Array.isArray(config.preferred_chain) ? config.preferred_chain : [];
    handleProviderChainChange(currentChain.filter(p => p !== providerToRemove));
  };

  const moveProvider = (index, direction) => {
    const currentChain = [...(Array.isArray(config.preferred_chain) ? config.preferred_chain : [])];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < currentChain.length) {
      [currentChain[index], currentChain[newIndex]] = [currentChain[newIndex], currentChain[index]];
      handleProviderChainChange(currentChain);
    }
  };

  const getCostImpactDescription = () => {
    const increase = config.max_cost_increase || 0;
    if (increase === 0) return 'No cost increase allowed';
    if (increase <= 0.2) return 'Up to 20% cost increase';
    if (increase <= 0.5) return 'Up to 50% cost increase';
    if (increase <= 1.0) return 'Up to 100% cost increase';
    return 'No cost limit';
  };

  // Handle both array and object with providers property
  const providersArray = Array.isArray(providers) ? providers : (providers?.providers || []);
  const availableProviders = providersArray.filter(p => 
    !config.preferred_chain?.includes(p.name || p.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-green-600" size={18} />
        <h4 className="font-medium text-gray-900">Fallback Configuration</h4>
      </div>

      {/* Enable Fallback */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="fallback-enabled"
          checked={config.enabled}
          onChange={(e) => handleConfigChange('enabled', e.target.checked)}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <label htmlFor="fallback-enabled" className="block text-sm font-medium text-gray-700">
            Enable Automatic Fallback
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Automatically switch to alternative providers when the primary provider fails
          </p>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Provider Chain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Fallback Chain
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Define the order of providers to try when the primary fails. Leave empty to use automatic selection.
            </p>

            {/* Current Chain */}
            {config.preferred_chain && config.preferred_chain.length > 0 && (
              <div className="space-y-2 mb-3">
                {config.preferred_chain.map((provider, index) => (
                  <div key={provider} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{provider}</span>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Primary
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveProvider(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveProvider(index, 1)}
                        disabled={index === config.preferred_chain.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProvider(provider)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {config.preferred_chain.length > 1 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <ArrowRight size={12} />
                    <span>
                      If primary fails → try {config.preferred_chain[1]} → 
                      {config.preferred_chain.length > 2 ? ` try ${config.preferred_chain[2]}...` : ' automatic selection'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Add Provider */}
            {availableProviders.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select provider to add...</option>
                  {availableProviders.map(provider => (
                    <option key={provider.name || provider.id} value={provider.name || provider.id}>
                      {provider.display_name || provider.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addProvider}
                  disabled={!newProvider}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Cost and Feature Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Cost Increase
              </label>
              <select
                value={config.max_cost_increase || 0.5}
                onChange={(e) => handleConfigChange('max_cost_increase', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>No cost increase (0%)</option>
                <option value={0.1}>10% cost increase</option>
                <option value={0.2}>20% cost increase</option>
                <option value={0.5}>50% cost increase</option>
                <option value={1.0}>100% cost increase</option>
                <option value={-1}>No cost limit</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {getCostImpactDescription()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feature Requirements
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.require_same_features}
                    onChange={(e) => handleConfigChange('require_same_features', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Require same features</span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Only fallback to providers that support the same features as the primary
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="text-green-500 mt-0.5" size={16} />
              <div>
                <h5 className="font-medium text-green-900 mb-1">Fallback Configuration Summary</h5>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    • Fallback is <strong>{config.enabled ? 'enabled' : 'disabled'}</strong>
                  </p>
                  {config.enabled && (
                    <>
                      <p>
                        • Provider chain: {
                          config.preferred_chain?.length > 0 
                            ? config.preferred_chain.join(' → ') + ' → automatic'
                            : 'Automatic selection'
                        }
                      </p>
                      <p>
                        • Cost limit: {getCostImpactDescription()}
                      </p>
                      <p>
                        • Feature matching: {config.require_same_features ? 'Required' : 'Optional'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reliability Estimate */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {!config.enabled ? 'None' :
                 config.preferred_chain?.length > 2 ? 'High' : 'Medium'}
              </div>
              <div className="text-xs text-gray-600">Fallback Coverage</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {config.max_cost_increase === 0 ? 'Fixed' :
                 config.max_cost_increase <= 0.2 ? 'Low' :
                 config.max_cost_increase <= 0.5 ? 'Medium' : 'High'}
              </div>
              <div className="text-xs text-gray-600">Cost Variability</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {!config.enabled ? 'Low' :
                 config.preferred_chain?.length > 1 ? 'High' : 'Medium'}
              </div>
              <div className="text-xs text-gray-600">Reliability Boost</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FallbackConfigurationForm;