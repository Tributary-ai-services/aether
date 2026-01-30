import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { 
  Users, 
  Globe, 
  Lock, 
  Shield,
  AlertCircle 
} from 'lucide-react';

const CreateTeamModal = ({ isOpen, onClose, onCreateTeam }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibilityOptions = [
    {
      value: 'private',
      label: 'Private',
      description: 'Only team members can see this team',
      icon: Lock,
      color: 'text-gray-600'
    },
    {
      value: 'organization',
      label: 'Organization',
      description: 'All organization members can see this team',
      icon: Shield,
      color: 'text-(--color-primary-600)'
    },
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can see this team',
      icon: Globe,
      color: 'text-green-600'
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Team name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Team name must be less than 50 characters';
    }
    
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onCreateTeam({
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        visibility: 'private',
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create team:', error);
      setErrors({ submit: 'Failed to create team. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Team"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Team Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter team name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) resize-none ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Briefly describe your team's purpose (optional)"
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/200 characters
          </p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Team Visibility
          </label>
          <div className="space-y-2">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.value}
                  className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.visibility === option.value
                      ? 'border-(--color-primary-500) bg-(--color-primary-50)'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={formData.visibility === option.value}
                    onChange={handleInputChange}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={option.color} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  {formData.visibility === option.value && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-(--color-primary-600) rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Users size={16} />
                Create Team
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTeamModal;