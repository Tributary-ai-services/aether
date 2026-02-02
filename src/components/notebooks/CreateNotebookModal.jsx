import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal.jsx';
import ComplianceSettings from './ComplianceSettings.jsx';
import notebookService from '../../services/notebookService.js';
import { 
  FolderPlus,
  Upload,
  Globe,
  Lock,
  Users,
  Tag,
  AlertCircle,
  Check,
  X,
  Folder,
  ChevronRight,
  ChevronDown,
  Shield
} from 'lucide-react';

const CreateNotebookModal = ({ isOpen, onClose, parentNotebook = null, onCreateNotebook }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private', // private, shared, public
    tags: [],
    parentId: parentNotebook?.id || null,
    complianceSettings: notebookService.getDefaultComplianceSettings(),
    allowedCollaborators: []
  });

  const [currentTag, setCurrentTag] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // basic, compliance
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});

  // Track component instance for debugging
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  console.log('CreateNotebookModal RENDER - instance:', instanceId.current, 'parentNotebook:', parentNotebook?.id);

  // Store parentId in sessionStorage to survive component remounts
  // This is a workaround for React remounting the component
  useEffect(() => {
    console.log('CreateNotebookModal useEffect - instance:', instanceId.current, 'parentNotebook:', parentNotebook?.id, 'isOpen:', isOpen);
    if (isOpen && parentNotebook?.id) {
      console.log('CreateNotebookModal: Storing parentId in sessionStorage:', parentNotebook.id);
      sessionStorage.setItem('createNotebook_parentId', parentNotebook.id);
    } else if (!isOpen) {
      console.log('CreateNotebookModal: Modal closed, clearing sessionStorage parentId');
      sessionStorage.removeItem('createNotebook_parentId');
    }
  }, [parentNotebook, isOpen]);

  // Mock parent notebook hierarchy for display
  const getNotebookPath = () => {
    if (!parentNotebook) return [];
    // In real app, this would traverse up the parent chain
    return ['Root', 'Research', 'AI Projects']; // Example path
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Notebook name is required';
    }
    
    if (formData.name.length > 100) {
      newErrors.name = 'Notebook name must be less than 100 characters';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsCreating(true);
    
    try {
      // Create notebook using the persistence service
      // Read parentId from sessionStorage - this survives component remounts
      const effectiveParentId = sessionStorage.getItem('createNotebook_parentId');
      console.log('Creating notebook - using sessionStorage parentId:', effectiveParentId);

      const notebookData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        tags: formData.tags,
        parentId: effectiveParentId,
        // Send complianceSettings as JSON string to avoid Neo4j Map{} error
        complianceSettings: JSON.stringify(formData.complianceSettings || {})
      };

      console.log('Creating notebook:', notebookData);
      console.log('DEBUG sessionStorage parentId:', effectiveParentId);
      console.log('DEBUG notebookData.parentId:', notebookData.parentId);
      console.log('Form compliance settings before stringify:', formData.complianceSettings);
      console.log('Stringified compliance settings:', JSON.stringify(formData.complianceSettings || {}));
      
      if (onCreateNotebook) {
        await onCreateNotebook(notebookData);
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        visibility: 'private',
        tags: [],
        parentId: parentNotebook?.id || null,
        complianceSettings: notebookService.getDefaultComplianceSettings(),
        allowedCollaborators: []
      });
      setCollaboratorEmail('');
      setActiveTab('basic');
      
      onClose();
      
    } catch (error) {
      console.error('Error creating notebook:', error);
      setErrors({ submit: 'Failed to create notebook. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addCollaborator = () => {
    if (collaboratorEmail.trim() && !formData.allowedCollaborators.includes(collaboratorEmail.trim())) {
      setFormData(prev => ({
        ...prev,
        allowedCollaborators: [...prev.allowedCollaborators, collaboratorEmail.trim()]
      }));
      setCollaboratorEmail('');
    }
  };

  const removeCollaborator = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      allowedCollaborators: prev.allowedCollaborators.filter(email => email !== emailToRemove)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Notebook" size="large">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Breadcrumb for nested creation */}
        {parentNotebook && (
          <div className="bg-(--color-primary-50) border border-(--color-primary-200) rounded-lg p-3">
            <div className="flex items-center text-sm text-(--color-primary-700)">
              <Folder size={16} className="mr-2" />
              <span>Creating notebook in: </span>
              <div className="flex items-center ml-2">
                {getNotebookPath().map((folder, index) => (
                  <React.Fragment key={index}>
                    <span className="font-medium">{folder}</span>
                    {index < getNotebookPath().length - 1 && (
                      <ChevronRight size={14} className="mx-1" />
                    )}
                  </React.Fragment>
                ))}
                <ChevronRight size={14} className="mx-1" />
                <span className="font-semibold">{parentNotebook.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-(--color-primary-500) text-(--color-primary-600)'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Basic Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'compliance'
                  ? 'border-(--color-primary-500) text-(--color-primary-600)'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield size={16} />
              Compliance Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'basic' ? (
          /* Basic Information Tab */
          <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notebook Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter notebook name"
              disabled={isCreating}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              disabled={isCreating}
            >
              <option value="private">
                🔒 Private (Only you)
              </option>
              <option value="shared">
                👥 Shared (Selected users)
              </option>
              <option value="public">
                🌐 Public (Everyone)
              </option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) resize-none ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe the purpose and contents of this notebook"
            disabled={isCreating}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errors.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              placeholder="Add tags for better organization"
              disabled={isCreating}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
              disabled={!currentTag.trim() || isCreating}
            >
              <Tag size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-(--color-primary-100) text-(--color-primary-700) rounded-full text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-(--color-primary-600)"
                  disabled={isCreating}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Collaborators (only for shared visibility) */}
        {formData.visibility === 'shared' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collaborators
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCollaborator())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                placeholder="Enter collaborator email"
                disabled={isCreating}
              />
              <button
                type="button"
                onClick={addCollaborator}
                className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
                disabled={!collaboratorEmail.trim() || isCreating}
              >
                <Users size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {formData.allowedCollaborators.map(email => (
                <div
                  key={email}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{email}</span>
                  <button
                    type="button"
                    onClick={() => removeCollaborator(email)}
                    className="text-gray-400 hover:text-red-600"
                    disabled={isCreating}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        ) : (
          /* Compliance Settings Tab */
          <div>
            <ComplianceSettings
              settings={formData.complianceSettings}
              onChange={(newSettings) => setFormData(prev => ({ ...prev, complianceSettings: newSettings }))}
              disabled={isCreating}
            />
          </div>
        )}

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            * Required fields
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus size={16} />
                  Create Notebook
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateNotebookModal;