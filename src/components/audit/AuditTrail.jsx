import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../../store/hooks.js';
import {
  fetchViolations,
  fetchSummary,
  acknowledgeViolation,
  bulkAcknowledgeViolations,
  setFilters,
  clearFilters,
  selectViolations,
  selectViolationsLoading,
  selectViolationsError,
  selectViolationsMeta,
  selectFilters,
  selectSummary,
  selectSummaryLoading,
  selectAcknowledgeLoading,
  selectBulkAcknowledgeLoading,
} from '../../store/slices/complianceSlice.js';
import Modal from '../ui/Modal.jsx';
import TimeRangePicker from '../ui/TimeRangePicker.jsx';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Download,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Check,
  BarChart3,
  List,
  X,
} from 'lucide-react';

const AuditTrail = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const violations = useAppSelector(selectViolations);
  const violationsLoading = useAppSelector(selectViolationsLoading);
  const violationsError = useAppSelector(selectViolationsError);
  const meta = useAppSelector(selectViolationsMeta);
  const filters = useAppSelector(selectFilters);
  const summary = useAppSelector(selectSummary);
  const summaryLoading = useAppSelector(selectSummaryLoading);
  const acknowledgeLoading = useAppSelector(selectAcknowledgeLoading);
  const bulkAcknowledgeLoading = useAppSelector(selectBulkAcknowledgeLoading) || false;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'charts'

  // Simple dropdown filter state
  const [severityFilter, setSeverityFilter] = useState('');
  const [complianceTypeFilter, setComplianceTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('false'); // Default: show unacknowledged

  // Time range filter (Grafana-style)
  const [timeRange, setTimeRange] = useState({
    from: 'now-24h',
    to: 'now',
    label: 'Last 24 hours',
  });

  // Multi-select for bulk acknowledge
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Build query params from filters
  const buildQueryParams = () => {
    const params = { page: currentPage, pageSize: 20 };

    if (severityFilter) {
      params.severity = severityFilter;
    }
    if (complianceTypeFilter) {
      params.complianceType = complianceTypeFilter;
    }
    if (statusFilter !== '') {
      params.acknowledged = statusFilter === 'true';
    }

    // Add time range params
    if (timeRange.from && timeRange.to) {
      params.from = timeRange.from;
      params.to = timeRange.to;
    }

    return params;
  };

  // Fetch violations when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      const params = buildQueryParams();
      dispatch(fetchViolations(params));
      dispatch(fetchSummary());
      // Clear selections when filters change
      setSelectedIds(new Set());
    }
  }, [isOpen, severityFilter, complianceTypeFilter, statusFilter, timeRange, currentPage, dispatch]);

  const handleRefresh = () => {
    const params = buildQueryParams();
    dispatch(fetchViolations(params));
    dispatch(fetchSummary());
    setSelectedIds(new Set());
  };

  const handleClearFilters = () => {
    setSeverityFilter('');
    setComplianceTypeFilter('');
    setStatusFilter('');
    setTimeRange({
      from: 'now-24h',
      to: 'now',
      label: 'Last 24 hours',
    });
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleAcknowledge = async (id) => {
    await dispatch(acknowledgeViolation(id));
    // Refresh data after acknowledging
    const params = buildQueryParams();
    dispatch(fetchViolations(params));
    dispatch(fetchSummary());
    // Remove from selection if selected
    if (selectedIds.has(id)) {
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  // Multi-select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all unacknowledged violations on current page
      const unacknowledgedIds = filteredViolations
        .filter(v => !v.acknowledged)
        .map(v => v.id);
      setSelectedIds(new Set(unacknowledgedIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAcknowledge = async () => {
    if (selectedIds.size === 0) return;

    const idsArray = Array.from(selectedIds);
    await dispatch(bulkAcknowledgeViolations(idsArray));

    // Refresh data
    const params = buildQueryParams();
    dispatch(fetchViolations(params));
    dispatch(fetchSummary());

    // Clear selection
    setSelectedIds(new Set());
    setShowConfirmDialog(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status, acknowledged) => {
    if (acknowledged) {
      return <CheckCircle size={16} className="text-green-600" />;
    }
    switch (status?.toLowerCase()) {
      case 'resolved': return <CheckCircle size={16} className="text-green-600" />;
      case 'detected': return <AlertTriangle size={16} className="text-yellow-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const formatMatchedText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  // Filter violations by search term locally
  const filteredViolations = violations.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.rule_name?.toLowerCase().includes(term) ||
      v.ruleName?.toLowerCase().includes(term) ||
      v.file_name?.toLowerCase().includes(term) ||
      v.fileName?.toLowerCase().includes(term) ||
      v.matched_text?.toLowerCase().includes(term) ||
      v.matchedText?.toLowerCase().includes(term)
    );
  });

  // Check if all unacknowledged violations are selected
  const unacknowledgedViolations = filteredViolations.filter(v => !v.acknowledged);
  const allUnacknowledgedSelected = unacknowledgedViolations.length > 0 &&
    unacknowledgedViolations.every(v => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0 && !allUnacknowledgedSelected;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Compliance Dashboard"
        size="xlarge"
      >
        <div className="p-6">
          {/* Compliance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-(--color-primary-50) rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-(--color-primary-600)">
                {summaryLoading ? '...' : summary.totalViolations}
              </div>
              <div className="text-sm text-(--color-primary-600)">Total Violations</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {summaryLoading ? '...' : `${summary.complianceScore}%`}
              </div>
              <div className="text-sm text-green-600">Compliance Score</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {summaryLoading ? '...' : summary.criticalCount}
              </div>
              <div className="text-sm text-red-600">Critical</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {summaryLoading ? '...' : summary.unacknowledgedCount}
              </div>
              <div className="text-sm text-orange-600">Unacknowledged</div>
            </div>
          </div>

          {/* PII Detection Stats */}
          {summary.piiDetections > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="text-purple-600" size={20} />
                  <span className="font-medium text-purple-900">PII Detections</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{summary.piiDetections}</span>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search rules, files..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  />
                </div>
              </div>

              {/* Severity Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                >
                  <option value="">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Compliance Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Type</label>
                <select
                  value={complianceTypeFilter}
                  onChange={(e) => { setComplianceTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                >
                  <option value="">All</option>
                  <option value="pii">PII</option>
                  <option value="hipaa">HIPAA</option>
                  <option value="pci-dss">PCI-DSS</option>
                  <option value="gdpr">GDPR</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                >
                  <option value="">All</option>
                  <option value="false">Unacknowledged</option>
                  <option value="true">Acknowledged</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Clear filters"
                >
                  Clear
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={violationsLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-md text-sm hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={violationsLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Time Range and View Toggle Row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              {/* Time Range Picker */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <TimeRangePicker
                  value={timeRange}
                  onChange={(range) => { setTimeRange(range); setCurrentPage(1); }}
                  defaultRange="now-24h"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {violationsLoading ? 'Loading...' : `${meta.total || violations.length} results`}
                </span>
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List view"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('charts')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                      viewMode === 'charts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Chart view"
                  >
                    <BarChart3 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-(--color-primary-50) border border-(--color-primary-200) rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-(--color-primary-600)" />
                <span className="text-sm font-medium text-(--color-primary-700)">
                  {selectedIds.size} violation{selectedIds.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-(--color-primary-600) hover:text-(--color-primary-700) hover:underline"
                >
                  Clear selection
                </button>
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={bulkAcknowledgeLoading}
                  className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
                  Acknowledge Selected
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {violationsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{violationsError}</span>
              </div>
            </div>
          )}

          {/* Charts View */}
          {viewMode === 'charts' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Severity Distribution Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Violations by Severity</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Critical', count: summary.criticalCount, color: 'bg-red-500', textColor: 'text-red-600' },
                    { label: 'High', count: summary.highCount, color: 'bg-orange-500', textColor: 'text-orange-600' },
                    { label: 'Medium', count: summary.mediumCount, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                    { label: 'Low', count: summary.lowCount, color: 'bg-green-500', textColor: 'text-green-600' },
                  ].map(({ label, count, color, textColor }) => {
                    const percentage = summary.totalViolations > 0 ? (count / summary.totalViolations) * 100 : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-medium ${textColor}`}>{label}</span>
                          <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className={`${color} h-4 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Type Distribution Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Violations by Compliance Type</h3>
                <div className="space-y-3">
                  {(() => {
                    // Group violations by compliance type
                    const byType = {};
                    violations.forEach(v => {
                      const type = v.compliance_type || v.complianceType || 'general';
                      byType[type] = (byType[type] || 0) + 1;
                    });
                    const types = Object.entries(byType).sort((a, b) => b[1] - a[1]);
                    const colors = {
                      pii: { bg: 'bg-purple-500', text: 'text-purple-600' },
                      hipaa: { bg: 'bg-blue-500', text: 'text-blue-600' },
                      'pci-dss': { bg: 'bg-indigo-500', text: 'text-indigo-600' },
                      gdpr: { bg: 'bg-teal-500', text: 'text-teal-600' },
                      general: { bg: 'bg-gray-500', text: 'text-gray-600' },
                    };
                    return types.length > 0 ? types.map(([type, count]) => {
                      const percentage = violations.length > 0 ? (count / violations.length) * 100 : 0;
                      const colorSet = colors[type] || colors.general;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={`font-medium ${colorSet.text} uppercase`}>{type}</span>
                            <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`${colorSet.bg} h-4 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-gray-500 text-center py-8">No violations to display</div>
                    );
                  })()}
                </div>
              </div>

              {/* Rule Type Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Violations by Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(() => {
                    // Group by rule name
                    const byRule = {};
                    violations.forEach(v => {
                      const rule = v.rule_name || v.ruleName || 'Unknown';
                      byRule[rule] = (byRule[rule] || 0) + 1;
                    });
                    const rules = Object.entries(byRule).sort((a, b) => b[1] - a[1]);
                    return rules.length > 0 ? rules.map(([rule, count]) => (
                      <div key={rule} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                        <span className="text-sm font-medium text-gray-700 truncate">{rule}</span>
                        <span className="text-lg font-bold text-(--color-primary-600) ml-2">{count}</span>
                      </div>
                    )) : (
                      <div className="col-span-full text-gray-500 text-center py-8">No violations to display</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Violations Table (List View) */}
          {viewMode === 'list' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={allUnacknowledgedSelected && unacknowledgedViolations.length > 0}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = someSelected;
                            }
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-(--color-primary-600) border-gray-300 rounded focus:ring-(--color-primary-500)"
                          title="Select all unacknowledged"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rule / Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {violationsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <RefreshCw size={16} className="animate-spin" />
                            Loading violations...
                          </div>
                        </td>
                      </tr>
                    ) : filteredViolations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center text-gray-500">
                            <Shield size={48} className="mb-4 opacity-50" />
                            <p>No violations found matching your criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredViolations.map((violation) => (
                        <tr key={violation.id} className={`hover:bg-gray-50 ${selectedIds.has(violation.id) ? 'bg-(--color-primary-50)' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {!violation.acknowledged && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(violation.id)}
                                onChange={() => toggleSelect(violation.id)}
                                className="w-4 h-4 text-(--color-primary-600) border-gray-300 rounded focus:ring-(--color-primary-500)"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTimestamp(violation.created_at || violation.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={16} className="text-amber-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {violation.rule_name || violation.ruleName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(violation.compliance_type || violation.complianceType || 'DLP').toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-gray-400" />
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {violation.file_name || violation.fileName || 'Unknown file'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(violation.severity)}`}>
                              {violation.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(violation.status, violation.acknowledged)}
                              <span className="text-sm text-gray-900 capitalize">
                                {violation.acknowledged ? 'Acknowledged' : (violation.status || 'detected')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedViolation(violation);
                                  setDetailModalOpen(true);
                                }}
                                className="text-(--color-primary-600) hover:text-(--color-primary-700)"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                              {!violation.acknowledged && (
                                <button
                                  onClick={() => handleAcknowledge(violation.id)}
                                  disabled={acknowledgeLoading}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  title="Acknowledge"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination (List View Only) */}
          {viewMode === 'list' && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || violationsLoading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(meta.totalPages, currentPage + 1))}
                  disabled={currentPage === meta.totalPages || violationsLoading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Violation Detail Modal */}
      {selectedViolation && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedViolation(null);
          }}
          title="Violation Details"
          size="large"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rule Name</label>
                    <div className="text-gray-900">{selectedViolation.rule_name || selectedViolation.ruleName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Compliance Type</label>
                    <div className="text-gray-900">{(selectedViolation.compliance_type || selectedViolation.complianceType || 'DLP').toUpperCase()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">File</label>
                    <div className="text-gray-900">{selectedViolation.file_name || selectedViolation.fileName || 'Unknown'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Detected At</label>
                    <div className="text-gray-900">{formatTimestamp(selectedViolation.created_at || selectedViolation.createdAt)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Confidence</label>
                    <div className="text-gray-900">{(selectedViolation.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Security Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severity</label>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedViolation.severity)}`}>
                        {selectedViolation.severity?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedViolation.status, selectedViolation.acknowledged)}
                      <span className="capitalize">{selectedViolation.acknowledged ? 'Acknowledged' : selectedViolation.status}</span>
                    </div>
                  </div>
                  {selectedViolation.line_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Line Number</label>
                      <div className="text-gray-900">{selectedViolation.line_number || selectedViolation.lineNumber}</div>
                    </div>
                  )}
                  {selectedViolation.acknowledged_by && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Acknowledged By</label>
                      <div className="text-gray-900">{selectedViolation.acknowledged_by || selectedViolation.acknowledgedBy}</div>
                    </div>
                  )}
                  {(selectedViolation.acknowledged_at || selectedViolation.acknowledgedAt) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Acknowledged At</label>
                      <div className="text-gray-900">{formatTimestamp(selectedViolation.acknowledged_at || selectedViolation.acknowledgedAt)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Matched Content */}
            {(selectedViolation.matched_text || selectedViolation.matchedText) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Content</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-800 font-mono break-all">
                    {selectedViolation.matched_text || selectedViolation.matchedText}
                  </div>
                </div>
              </div>
            )}

            {/* Context */}
            {(selectedViolation.context) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Context</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                    {selectedViolation.context}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Taken */}
            {selectedViolation.actions_taken?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Taken</h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedViolation.actions_taken || selectedViolation.actionsTaken || []).map((action, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-(--color-primary-100) text-(--color-primary-700) rounded-full"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Acknowledge Button - Fixed: await the async operation */}
            {!selectedViolation.acknowledged && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={async () => {
                    await handleAcknowledge(selectedViolation.id);
                    setDetailModalOpen(false);
                    setSelectedViolation(null);
                  }}
                  disabled={acknowledgeLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
                  {acknowledgeLoading ? 'Acknowledging...' : 'Acknowledge Violation'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Bulk Acknowledge Confirmation Dialog */}
      {showConfirmDialog && (
        <Modal
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirm Bulk Acknowledge"
          size="small"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-yellow-600" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">Acknowledge Violations</h4>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to acknowledge <strong>{selectedIds.size}</strong> violation{selectedIds.size > 1 ? 's' : ''}?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAcknowledge}
                disabled={bulkAcknowledgeLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {bulkAcknowledgeLoading ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AuditTrail;
