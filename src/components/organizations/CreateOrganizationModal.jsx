import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Modal from '../ui/Modal.jsx';
import { Building, Globe, Lock, Mail, MapPin, ExternalLink, AlertCircle } from 'lucide-react';

const CreateOrganizationModal = ({ isOpen, onClose, onCreateOrganization }) => {
  // Get user email from Redux auth state
  const userEmail = useSelector(state => state.auth?.user?.email || '');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    visibility: 'private',
    billingEmail: userEmail
  });

  // Update billingEmail when userEmail becomes available (e.g., after auth loads)
  useEffect(() => {
    if (userEmail && !formData.billingEmail) {
      setFormData(prev => ({ ...prev, billingEmail: userEmail }));
    }
  }, [userEmail]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Organization name must be less than 50 characters';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must be a valid URL starting with http:// or https://';
    }

    if (formData.billingEmail && !formData.billingEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.billingEmail = 'Please enter a valid email address';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onCreateOrganization(formData);
      // Reset form (keep billing email as user's email)
      setFormData({
        name: '',
        description: '',
        website: '',
        location: '',
        visibility: 'private',
        billingEmail: userEmail
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      location: '',
      visibility: 'private',
      billingEmail: userEmail
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Organization" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g. Acme Corporation"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of your organization..."
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) resize-none ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description ? (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.description}
              </p>
            ) : (
              <span></span>
            )}
            <span className={`text-xs ${formData.description.length > 180 ? 'text-red-500' : 'text-gray-500'}`}>
              {formData.description.length}/200
            </span>
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourcompany.com"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) ${
                errors.website ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          {errors.website && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.website}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
              disabled={loading}
            />
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Organization Visibility
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === 'private'}
                onChange={(e) => handleInputChange('visibility', e.target.value)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-900">Private</span>
                </div>
                <p className="text-sm text-gray-600">
                  Only members can see this organization and its content
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={(e) => handleInputChange('visibility', e.target.value)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={16} className="text-green-600" />
                  <span className="font-medium text-gray-900">Public</span>
                </div>
                <p className="text-sm text-gray-600">
                  Anyone can see this organization, members, and public repositories
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Billing Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email"
              value={formData.billingEmail}
              onChange={(e) => handleInputChange('billingEmail', e.target.value)}
              placeholder="billing@yourcompany.com"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) ${
                errors.billingEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
          </div>
          {errors.billingEmail && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.billingEmail}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This email will receive billing notifications and invoices
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Building className="text-(--color-primary-600) mt-0.5" size={16} />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Organization Setup</p>
              <p>
                After creating your organization, you'll be able to invite members, create teams, and manage repositories. 
                You'll start with a free plan that includes 3 seats.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Building size={16} />
                Create Organization
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateOrganizationModal;