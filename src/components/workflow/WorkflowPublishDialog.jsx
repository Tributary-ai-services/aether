import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import {
  Globe,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

const WorkflowPublishDialog = ({ isOpen, onClose, workflow }) => {
  const [description, setDescription] = useState(workflow?.description || '');
  const [tags, setTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handlePublish = async () => {
    if (!workflow?.id) {
      setStatus('error');
      setErrorMsg('Workflow must be saved before publishing.');
      return;
    }

    setIsPublishing(true);
    setStatus(null);
    setErrorMsg('');

    try {
      await api.workflows.publish(workflow.id, {
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to publish workflow. The backend may not support this yet.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    setStatus(null);
    setErrorMsg('');
    setIsPublishing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Publish to Community">
      <div className="space-y-4">
        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Published!</h3>
            <p className="text-sm text-gray-500">
              Your workflow "{workflow?.name}" is now available in the community.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg text-sm font-medium hover:bg-(--color-primary-700) transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Globe size={18} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700">
                Publishing makes this workflow available to all users in your community.
              </p>
            </div>

            {/* Workflow Name (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workflow</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {workflow?.name || 'Unnamed Workflow'}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow does and when to use it..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag size={14} className="inline mr-1" />
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="compliance, document, automation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated tags to help others discover your workflow</p>
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg text-sm font-medium hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
              >
                {isPublishing ? (
                  <><Loader2 size={14} className="animate-spin" /> Publishing...</>
                ) : (
                  <><Globe size={14} /> Publish</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WorkflowPublishDialog;
