import React from 'react';
import { RotateCcw, Clock, AlertTriangle, Info } from 'lucide-react';

const RetryConfigurationForm = ({ config, onChange }) => {
  const handleConfigChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleErrorTagsChange = (errors) => {
    onChange({
      ...config,
      retryable_errors: errors
    });
  };

  const addErrorType = (errorType) => {
    const retryableErrors = Array.isArray(config.retryable_errors) ? config.retryable_errors : [];
    if (errorType && !retryableErrors.includes(errorType)) {
      handleErrorTagsChange([...retryableErrors, errorType]);
    }
  };

  const removeErrorType = (errorType) => {
    const retryableErrors = Array.isArray(config.retryable_errors) ? config.retryable_errors : [];
    handleErrorTagsChange(retryableErrors.filter(e => e !== errorType));
  };

  const commonErrorTypes = [
    'timeout',
    'connection',
    'unavailable',
    'rate_limit',
    'server_error',
    'network_error',
    'authentication',
    'quota_exceeded'
  ];

  const getBackoffDescription = () => {
    if (config.backoff_type === 'exponential') {
      return 'Delays increase exponentially: 1s, 2s, 4s, 8s...';
    } else {
      return 'Delays increase linearly: 1s, 2s, 3s, 4s...';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw className="text-(--color-primary-600)" size={18} />
        <h4 className="font-medium text-gray-900">Retry Configuration</h4>
      </div>

      {/* Max Attempts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Attempts
          </label>
          <select
            value={config.max_attempts}
            onChange={(e) => handleConfigChange('max_attempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          >
            <option value={1}>1 (No retries)</option>
            <option value={2}>2 (1 retry)</option>
            <option value={3}>3 (2 retries)</option>
            <option value={4}>4 (3 retries)</option>
            <option value={5}>5 (4 retries)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Higher values increase reliability but may increase latency
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Backoff Type
          </label>
          <select
            value={config.backoff_type}
            onChange={(e) => handleConfigChange('backoff_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          >
            <option value="exponential">Exponential</option>
            <option value="linear">Linear</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {getBackoffDescription()}
          </p>
        </div>
      </div>

      {/* Delay Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Delay
          </label>
          <select
            value={config.base_delay}
            onChange={(e) => handleConfigChange('base_delay', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          >
            <option value="100ms">100ms</option>
            <option value="500ms">500ms</option>
            <option value="1s">1 second</option>
            <option value="2s">2 seconds</option>
            <option value="5s">5 seconds</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Initial delay before first retry
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Delay
          </label>
          <select
            value={config.max_delay}
            onChange={(e) => handleConfigChange('max_delay', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
          >
            <option value="2s">2 seconds</option>
            <option value="10s">10 seconds</option>
            <option value="30s">30 seconds</option>
            <option value="60s">60 seconds</option>
            <option value="120s">2 minutes</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Maximum delay cap for retries
          </p>
        </div>
      </div>

      {/* Retryable Errors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Retryable Error Types
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select which types of errors should trigger a retry attempt
        </p>

        {/* Current Error Types */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(Array.isArray(config.retryable_errors) ? config.retryable_errors : []).map(errorType => (
            <span
              key={errorType}
              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm"
            >
              <AlertTriangle size={12} />
              {errorType}
              <button
                type="button"
                onClick={() => removeErrorType(errorType)}
                className="text-red-600 hover:text-red-800 ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Add Error Types */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {commonErrorTypes.filter(type => {
            const retryableErrors = Array.isArray(config.retryable_errors) ? config.retryable_errors : [];
            return !retryableErrors.includes(type);
          }).map(errorType => (
            <button
              key={errorType}
              type="button"
              onClick={() => addErrorType(errorType)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              {errorType}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-(--color-primary-50) border border-(--color-primary-200) rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="text-(--color-primary-500) mt-0.5" size={16} />
          <div>
            <h5 className="font-medium text-(--color-primary-900) mb-1">Retry Configuration Summary</h5>
            <div className="text-sm text-(--color-primary-700) space-y-1">
              <p>
                • Up to <strong>{config.max_attempts}</strong> attempts will be made
              </p>
              <p>
                • Using <strong>{config.backoff_type}</strong> backoff strategy
              </p>
              <p>
                • Delays from <strong>{config.base_delay}</strong> to <strong>{config.max_delay}</strong>
              </p>
              <p>
                • Retrying on <strong>{Array.isArray(config.retryable_errors) ? config.retryable_errors.length : 0}</strong> error types: {Array.isArray(config.retryable_errors) ? config.retryable_errors.slice(0, 3).join(', ') : 'none'}
                {Array.isArray(config.retryable_errors) && config.retryable_errors.length > 3 && ` +${config.retryable_errors.length - 3} more`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reliability Estimate */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {config.max_attempts === 1 ? 'Low' : 
             config.max_attempts <= 3 ? 'Medium' : 'High'}
          </div>
          <div className="text-xs text-gray-600">Reliability</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {config.max_attempts === 1 ? 'Fast' : 
             config.max_attempts <= 3 ? 'Medium' : 'Slow'}
          </div>
          <div className="text-xs text-gray-600">Response Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-semibold text-gray-900">
            {config.max_attempts === 1 ? 'Low' : 
             config.max_attempts <= 3 ? 'Medium' : 'High'}
          </div>
          <div className="text-xs text-gray-600">Cost Impact</div>
        </div>
      </div>
    </div>
  );
};

export default RetryConfigurationForm;