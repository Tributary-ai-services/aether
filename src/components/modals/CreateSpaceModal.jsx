import React, { useState } from 'react';
import { aetherApi } from '../../services/aetherApi.js';
import { useSpace } from '../../hooks/useSpaces.js';
import {
  X,
  Loader2,
  AlertCircle,
  User,
  Building2,
  Globe,
  Lock,
  Users,
  Shield
} from 'lucide-react';

const CreateSpaceModal = ({ onClose, organizationId = null, onComplete }) => {
  const { loadAvailableSpaces } = useSpace();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private', // private, team, public
    organizationId: organizationId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Space name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const spaceData = {
        name: formData.name,
        description: formData.description,
        visibility: formData.visibility,
        organizationId: formData.organizationId || null
      };

      // Create space via API
      const response = await aetherApi.spaces.create(spaceData);
      
      if (response.success) {
        // Refresh available spaces
        await loadAvailableSpaces();
        
        // Call completion callback if provided
        if (onComplete) {
          await onComplete();
        }
        
        // Show success message
        alert(`Space "${formData.name}" created successfully!`);
        onClose();
      } else {
        throw new Error('Failed to create space');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const visibilityOptions = [
    {
      value: 'private',
      label: 'Private',
      description: 'Only you can access this space',
      icon: <Lock size={16} className="text-gray-500" />
    },
    {
      value: 'team',
      label: 'Team',
      description: 'Invite team members to collaborate',
      icon: <Users size={16} className="text-blue-500" />
    },
    {
      value: 'public',
      label: 'Organization',
      description: 'Visible to all organization members',
      icon: <Building2 size={16} className="text-green-500" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Space</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Space Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Space Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Marketing Campaigns, Product Development"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe the purpose of this space..."
              disabled={loading}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-start p-3 border rounded-lg cursor-pointer transition-colors
                    ${formData.visibility === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={formData.visibility === option.value}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="mt-1 mr-3"
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {option.icon}
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Organization Selection (if not creating within an org) */}
          {!organizationId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization (optional)
              </label>
              <select
                value={formData.organizationId}
                onChange={(e) => handleInputChange('organizationId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Personal Space</option>
                {/* TODO: Load user's organizations */}
                <option value="demo-org">Demo Organization</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose an organization to create the space under, or leave empty for a personal space.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              disabled={loading}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Space'}</span>
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start space-x-2">
            <Shield size={16} className="text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">About Spaces</p>
              <p>Spaces provide isolated environments for your projects. You can manage team access and permissions after creation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSpaceModal;