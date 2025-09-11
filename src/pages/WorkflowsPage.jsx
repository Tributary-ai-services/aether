import React, { useState, useEffect } from 'react';
import { workflows } from '../data/mockData.js';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder.jsx';
import { useSpace } from '../contexts/SpaceContext.jsx';
import { Workflow } from 'lucide-react';

const WorkflowsPage = () => {
  const { currentSpace, loadAvailableSpaces, initialized } = useSpace();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  // Initialize spaces
  useEffect(() => {
    if (!initialized) {
      loadAvailableSpaces();
    }
  }, [initialized, loadAvailableSpaces]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Automation Workflows</h2>
        <button 
          onClick={() => {
            setSelectedWorkflow(null);
            setBuilderOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Build Workflow
        </button>
      </div>
      <div className="space-y-4">
        {workflows.map(workflow => (
          <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Workflow className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                  <p className="text-sm text-gray-600">Triggers: {workflow.triggers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {workflow.status}
                </span>
                <button 
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setBuilderOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Workflow Builder Modal */}
      <WorkflowBuilder 
        isOpen={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setSelectedWorkflow(null);
        }}
        workflow={selectedWorkflow}
      />
    </div>
  );
};

export default WorkflowsPage;