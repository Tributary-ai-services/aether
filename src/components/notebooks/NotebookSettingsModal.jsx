import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import ComplianceSettings from './ComplianceSettings.jsx';
import VectorSearchTab from './VectorSearchTab.jsx';
import notebookService from '../../services/notebookService.js';
import {
  Settings,
  Save,
  X,
  Globe,
  Lock,
  Users,
  Tag,
  AlertCircle,
  Shield,
  FileText,
  Trash2,
  Archive,
  Search,
  AlertTriangle
} from 'lucide-react';

const NotebookSettingsModal = ({ isOpen, onClose, notebook, onUpdateNotebook }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    tags: [],
    complianceSettings: notebookService.getDefaultComplianceSettings(),
    allowedCollaborators: []
  });

  const [currentTag, setCurrentTag] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load notebook data when modal opens
  useEffect(() => {
    if (isOpen && notebook) {
      // Parse complianceSettings if it's a string
      let complianceSettings = notebook.complianceSettings;
      if (typeof complianceSettings === 'string') {
        try {
          complianceSettings = JSON.parse(complianceSettings);
        } catch (e) {
          console.error('Failed to parse compliance settings:', e);
          complianceSettings = notebookService.getDefaultComplianceSettings();
        }
      }
      
      setFormData({
        name: notebook.name || '',
        description: notebook.description || '',
        visibility: notebook.visibility || 'private',
        tags: notebook.tags || [],
        complianceSettings: complianceSettings || notebookService.getDefaultComplianceSettings(),
        allowedCollaborators: notebook.allowedCollaborators || []
      });
      setHasUnsavedChanges(false);
      setErrors({});
    }
  }, [isOpen, notebook]);

  // Track changes
  useEffect(() => {
    if (notebook) {
      // Parse complianceSettings for comparison
      let originalComplianceSettings = notebook.complianceSettings;
      if (typeof originalComplianceSettings === 'string') {
        try {
          originalComplianceSettings = JSON.parse(originalComplianceSettings);
        } catch (e) {
          originalComplianceSettings = notebookService.getDefaultComplianceSettings();
        }
      }
      
      const hasChanges = 
        formData.name !== (notebook.name || '') ||
        formData.description !== (notebook.description || '') ||
        formData.visibility !== (notebook.visibility || 'private') ||
        JSON.stringify(formData.tags) !== JSON.stringify(notebook.tags || []) ||
        JSON.stringify(formData.complianceSettings) !== JSON.stringify(originalComplianceSettings || {}) ||
        JSON.stringify(formData.allowedCollaborators) !== JSON.stringify(notebook.allowedCollaborators || []);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, notebook]);

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

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        tags: formData.tags,
        // Send compliance_settings as object (snake_case to match backend)
        compliance_settings: formData.complianceSettings || {},
        allowedCollaborators: formData.allowedCollaborators,
        updatedAt: new Date().toISOString()
      };

      console.log('Updating notebook with ID:', notebook.id, 'Updates:', updates);
      
      if (onUpdateNotebook) {
        await onUpdateNotebook(notebook.id, updates);
      }
      
      setHasUnsavedChanges(false);
      onClose();
      
    } catch (error) {
      console.error('Error updating notebook:', error);
      setErrors({ submit: 'Failed to update notebook. Please try again.' });
    } finally {
      setIsSaving(false);
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

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!notebook) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Settings: ${notebook.name}`} size="large">
      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'border-(--color-primary-500) text-(--color-primary-600)'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings size={16} />
              General
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
              Compliance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vectorSearch')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'vectorSearch'
                  ? 'border-(--color-primary-500) text-(--color-primary-600)'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search size={16} />
              Vector Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advanced')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'advanced'
                  ? 'border-(--color-primary-500) text-(--color-primary-600)'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Archive size={16} />
              Advanced
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Basic Information */}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                >
                  <option value="private">🔒 Private (Only you)</option>
                  <option value="shared">👥 Shared (Selected users)</option>
                  <option value="public">🌐 Public (Everyone)</option>
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
                disabled={isSaving}
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
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
                  disabled={!currentTag.trim() || isSaving}
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
                      disabled={isSaving}
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
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={addCollaborator}
                    className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
                    disabled={!collaboratorEmail.trim() || isSaving}
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
                        disabled={isSaving}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div>
            <ComplianceSettings
              settings={formData.complianceSettings}
              onChange={(newSettings) => setFormData(prev => ({ ...prev, complianceSettings: newSettings }))}
              disabled={isSaving}
            />
          </div>
        )}

        {activeTab === 'vectorSearch' && (
          <VectorSearchTab notebook={notebook} />
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Notebook Stats */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Notebook Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Documents</div>
                  <div className="font-semibold">{notebook.documentCount || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Sub-notebooks</div>
                  <div className="font-semibold">{notebook.children?.length || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Created</div>
                  <div className="font-semibold">
                    {notebook.createdAt ? new Date(notebook.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Last Updated</div>
                  <div className="font-semibold">
                    {notebook.updatedAt ? new Date(notebook.updatedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} />
                Danger Zone
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-red-700 mb-2">
                    Delete this notebook and all its contents. This action cannot be undone.
                  </p>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    disabled={isSaving}
                  >
                    <Trash2 size={14} />
                    Delete Notebook
                  </button>
                </div>
              </div>
            </div>
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {hasUnsavedChanges && (
              <>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Unsaved changes</span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NotebookSettingsModal;