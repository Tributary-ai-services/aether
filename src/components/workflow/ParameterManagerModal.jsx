import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import ParameterEditor from './ParameterEditor.jsx';
import { Plus, Settings } from 'lucide-react';

const ParameterManagerModal = ({ isOpen, onClose, parameters = [], onSave }) => {
  const [localParams, setLocalParams] = useState([]);

  // Only initialize local state when modal opens — ignore subsequent parameter prop changes
  // while the modal is open to prevent resetting user edits
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setLocalParams(parameters.map((p) => ({ ...p })));
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const addParameter = () => {
    setLocalParams((prev) => [
      ...prev,
      {
        name: `param_${prev.length + 1}`,
        label: '',
        type: 'string',
        description: '',
        required: false,
      },
    ]);
  };

  const updateParameter = (index, param) => {
    setLocalParams((prev) => {
      const updated = [...prev];
      updated[index] = param;
      return updated;
    });
  };

  const removeParameter = (index) => {
    setLocalParams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(localParams);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Input Parameters" size="large">
      <div className="flex flex-col" style={{ maxHeight: '70vh' }}>
        <p className="text-sm text-gray-600 mb-4">
          Define the input parameters that users will fill in when running this workflow.
        </p>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {localParams.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Settings size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No parameters defined yet.</p>
              <p className="text-xs mt-1">Click "Add Parameter" below to create one.</p>
            </div>
          ) : (
            localParams.map((param, idx) => (
              <ParameterEditor
                key={idx}
                param={param}
                onChange={(p) => updateParameter(idx, p)}
                onRemove={() => removeParameter(idx)}
              />
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <button
            onClick={addParameter}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Parameter
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Parameters ({localParams.length})
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ParameterManagerModal;
