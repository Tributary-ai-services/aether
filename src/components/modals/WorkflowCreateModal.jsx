import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import WorkflowTemplateGallery from '../workflow/WorkflowTemplateGallery.jsx';
import {
  Sparkles,
  Plus,
  LayoutTemplate,
  AlertCircle,
} from 'lucide-react';

const workflowTypes = [
  { value: 'document_processing', label: 'Document Processing' },
  { value: 'compliance_check', label: 'Compliance Check' },
  { value: 'approval_chain', label: 'Approval Chain' },
  { value: 'custom', label: 'Custom' },
];

const triggerTypes = [
  { value: 'manual', label: 'Manual' },
  { value: 'upload', label: 'File Upload' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'api', label: 'API' },
];

/**
 * Workflow creation modal with three paths:
 * 1. AI Generate (V1.1 - coming soon)
 * 2. Blank Canvas - name/desc/type, opens builder
 * 3. Template Gallery - pick a template, opens builder pre-populated
 */
const WorkflowCreateModal = ({ isOpen, onClose, onCreateBlank, onCreateFromTemplate }) => {
  const [view, setView] = useState('options'); // 'options' | 'blank' | 'templates'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom',
    triggerType: 'manual',
  });
  const [errors, setErrors] = useState({});

  const resetState = () => {
    setView('options');
    setFormData({ name: '', description: '', type: 'custom', triggerType: 'manual' });
    setErrors({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateBlankForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Workflow name is required';
    if (formData.name.trim().length > 100) newErrors.name = 'Name must be 100 characters or less';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlankSubmit = () => {
    if (!validateBlankForm()) return;
    onCreateBlank({
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      triggerType: formData.triggerType,
    });
    resetState();
  };

  const handleTemplateSelect = (template) => {
    onCreateFromTemplate(template);
    resetState();
  };

  const renderOptions = () => (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">How would you like to create your workflow?</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* AI Generate - Coming Soon */}
        <button
          disabled
          className="relative text-left border border-gray-200 rounded-lg p-5 opacity-50 cursor-not-allowed"
        >
          <div className="absolute top-2 right-2">
            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Coming Soon</span>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg inline-block mb-3">
            <Sparkles size={20} className="text-purple-500" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Describe Your Workflow</h3>
          <p className="text-xs text-gray-500 mt-1">
            Tell AI what you need and it will generate a workflow for you.
          </p>
        </button>

        {/* Blank Canvas */}
        <button
          onClick={() => setView('blank')}
          className="text-left border border-gray-200 rounded-lg p-5 hover:border-(--color-primary-400) hover:shadow-sm transition-all group"
        >
          <div className="p-2 bg-blue-50 rounded-lg inline-block mb-3 group-hover:bg-blue-100 transition-colors">
            <Plus size={20} className="text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Blank Canvas</h3>
          <p className="text-xs text-gray-500 mt-1">
            Start from scratch with an empty workflow builder.
          </p>
        </button>

        {/* Template Gallery */}
        <button
          onClick={() => setView('templates')}
          className="text-left border border-gray-200 rounded-lg p-5 hover:border-(--color-primary-400) hover:shadow-sm transition-all group"
        >
          <div className="p-2 bg-green-50 rounded-lg inline-block mb-3 group-hover:bg-green-100 transition-colors">
            <LayoutTemplate size={20} className="text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Use a Template</h3>
          <p className="text-xs text-gray-500 mt-1">
            Browse pre-built workflows and customize them.
          </p>
        </button>
      </div>
    </div>
  );

  const renderBlankForm = () => (
    <div className="space-y-4">
      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{Object.values(errors)[0]}</span>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          placeholder="e.g., Document Review Pipeline"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this workflow does..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent resize-none"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
        >
          {workflowTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Initial Trigger Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Trigger</label>
        <select
          value={formData.triggerType}
          onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
        >
          {triggerTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <button
          onClick={() => setView('options')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back
        </button>
        <button
          onClick={handleBlankSubmit}
          className="px-4 py-2 bg-(--color-primary-600) text-white rounded-lg text-sm font-medium hover:bg-(--color-primary-700) transition-colors"
        >
          Open Builder
        </button>
      </div>
    </div>
  );

  const titles = {
    options: 'Create Workflow',
    blank: 'New Blank Workflow',
    templates: 'Choose a Template',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titles[view]}
      size={view === 'templates' ? 'large' : 'default'}
    >
      {view === 'options' && renderOptions()}
      {view === 'blank' && renderBlankForm()}
      {view === 'templates' && (
        <WorkflowTemplateGallery
          onSelect={handleTemplateSelect}
          onBack={() => setView('options')}
        />
      )}
    </Modal>
  );
};

export default WorkflowCreateModal;
