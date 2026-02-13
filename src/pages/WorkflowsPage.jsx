import React, { useState, useEffect } from 'react';
import { useWorkflows } from '../hooks/useWorkflows.js';
import { useSpace } from '../hooks/useSpaces.js';
import { useAppSelector, useAppDispatch } from '../store/hooks.js';
import { selectModals, closeModal } from '../store/slices/uiSlice.js';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder.jsx';
import WorkflowCreateModal from '../components/modals/WorkflowCreateModal.jsx';
import WorkflowCardSkeleton from '../components/skeletons/WorkflowCardSkeleton.jsx';
import WorkflowAnalyticsSummary from '../components/workflow/WorkflowAnalyticsSummary.jsx';
import {
  Workflow,
  Play,
  Pause,
  Trash2,
  Edit3,
  MoreVertical,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', classes: 'bg-green-100 text-green-800', icon: CheckCircle },
  paused: { label: 'Paused', classes: 'bg-yellow-100 text-yellow-800', icon: Pause },
  disabled: { label: 'Disabled', classes: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const typeLabels = {
  document_processing: 'Document Processing',
  compliance_check: 'Compliance',
  approval_chain: 'Approval',
  custom: 'Custom',
};

const WorkflowsPage = () => {
  const dispatch = useAppDispatch();
  const modals = useAppSelector(selectModals);
  const { currentSpace, loadAvailableSpaces, initialized } = useSpace();
  const {
    workflows,
    loading,
    error,
    pagination,
    refetch,
    create,
    remove,
    toggleStatus,
  } = useWorkflows();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [builderInitial, setBuilderInitial] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionMenuId, setActionMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (!initialized) {
      loadAvailableSpaces();
    }
  }, [initialized, loadAvailableSpaces]);

  // Listen for global "Create New" button via Redux modals
  useEffect(() => {
    if (modals?.createWorkflow) {
      setCreateModalOpen(true);
      dispatch(closeModal('createWorkflow'));
    }
  }, [modals?.createWorkflow, dispatch]);

  // Filter workflows client-side
  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      !searchQuery ||
      w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchesType = typeFilter === 'all' || w.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateBlank = ({ name, description, type, triggerType }) => {
    setBuilderInitial({ name, description, type, triggerType, steps: [], triggers: [] });
    setSelectedWorkflow(null);
    setCreateModalOpen(false);
    setBuilderOpen(true);
  };

  const handleCreateFromTemplate = (template) => {
    setBuilderInitial({
      name: template.name,
      description: template.description,
      type: template.type,
      steps: template.steps,
      triggers: template.triggers,
    });
    setSelectedWorkflow(null);
    setCreateModalOpen(false);
    setBuilderOpen(true);
  };

  const handleEdit = (workflow) => {
    setSelectedWorkflow(workflow);
    setBuilderInitial(null);
    setActionMenuId(null);
    setBuilderOpen(true);
  };

  const handleToggleStatus = async (workflow) => {
    setActionMenuId(null);
    try {
      await toggleStatus(workflow.id, workflow.status);
    } catch (err) {
      console.error('Failed to toggle workflow status:', err);
    }
  };

  const handleDelete = async (workflowId) => {
    try {
      await remove(workflowId);
      setDeleteConfirmId(null);
      setActionMenuId(null);
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setSelectedWorkflow(null);
    setBuilderInitial(null);
    refetch();
  };

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
        <Workflow size={28} className="text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
        Create your first automation workflow to streamline document processing, compliance checks, and approval chains.
      </p>
      <button
        onClick={() => setCreateModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg text-sm font-medium hover:bg-(--color-primary-700) transition-colors"
      >
        <Plus size={16} />
        Create Workflow
      </button>
    </div>
  );

  const renderError = () => (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <AlertCircle size={20} className="text-red-500 shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-700">{error}</p>
      </div>
      <button
        onClick={() => refetch()}
        className="text-sm text-red-600 hover:text-red-800 font-medium shrink-0"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Automation Workflows</h2>
          {pagination.total > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} workflow{pagination.total !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-(--color-primary-600) text-white px-4 py-2 rounded-lg hover:bg-(--color-primary-700) transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Create Workflow
        </button>
      </div>

      {/* Analytics Summary */}
      {workflows.length > 0 && (
        <div className="mb-4">
          <WorkflowAnalyticsSummary compact />
        </div>
      )}

      {/* Filters */}
      {(workflows.length > 0 || searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="disabled">Disabled</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="document_processing">Document Processing</option>
            <option value="compliance_check">Compliance</option>
            <option value="approval_chain">Approval</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      )}

      {/* Error */}
      {error && renderError()}

      {/* Loading */}
      {loading && workflows.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <WorkflowCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && workflows.length === 0 && renderEmptyState()}

      {/* No results for filter */}
      {!loading && workflows.length > 0 && filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Filter size={24} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No workflows match your filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}
            className="text-sm text-(--color-primary-600) hover:text-(--color-primary-800) mt-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Workflow cards */}
      {filteredWorkflows.length > 0 && (
        <div className="space-y-3">
          {filteredWorkflows.map((workflow) => {
            const status = statusConfig[workflow.status] || statusConfig.disabled;
            const StatusIcon = status.icon;
            return (
              <div key={workflow.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
                      <Workflow className="text-blue-600" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{workflow.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.classes}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          {typeLabels[workflow.type] || workflow.type}
                        </span>
                        {workflow.execution_count > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 size={12} />
                            {workflow.execution_count} execution{workflow.execution_count !== 1 ? 's' : ''}
                          </span>
                        )}
                        {workflow.success_rate > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle size={12} />
                            {Math.round(workflow.success_rate)}% success
                          </span>
                        )}
                        {workflow.last_executed && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            Last run {new Date(workflow.last_executed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative shrink-0 ml-4">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === workflow.id ? null : workflow.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {actionMenuId === workflow.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                        <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-44">
                          <button
                            onClick={() => handleEdit(workflow)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(workflow)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {workflow.status === 'active' ? (
                              <><Pause size={14} /> Pause</>
                            ) : (
                              <><Play size={14} /> Activate</>
                            )}
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          {deleteConfirmId === workflow.id ? (
                            <div className="px-3 py-2">
                              <p className="text-xs text-red-600 mb-2">Delete this workflow?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDelete(workflow.id)}
                                  className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(workflow.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <WorkflowCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateBlank={handleCreateBlank}
        onCreateFromTemplate={handleCreateFromTemplate}
      />

      {/* Workflow Builder Modal */}
      <WorkflowBuilder
        isOpen={builderOpen}
        onClose={handleBuilderClose}
        workflow={selectedWorkflow}
        initialData={builderInitial}
      />
    </div>
  );
};

export default WorkflowsPage;
