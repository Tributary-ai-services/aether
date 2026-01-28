import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Modal from '../ui/Modal.jsx';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Filter,
  Search,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart2,
  PieChartIcon
} from 'lucide-react';
import {
  fetchViolations,
  fetchSummary,
  acknowledgeViolation,
  bulkAcknowledgeViolations,
  setFilters,
  clearFilters,
  selectViolations,
  selectViolationsLoading,
  selectSummary,
  selectSummaryLoading,
  selectFilters,
  selectAcknowledgeLoading,
  selectBulkAcknowledgeLoading,
  selectViolationsMeta
} from '../../store/slices/complianceSlice.js';

const CompliancePanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  // Redux state
  const violations = useSelector(selectViolations);
  const violationsLoading = useSelector(selectViolationsLoading);
  const summary = useSelector(selectSummary);
  const summaryLoading = useSelector(selectSummaryLoading);
  const filters = useSelector(selectFilters);
  const meta = useSelector(selectViolationsMeta);
  const acknowledgeLoading = useSelector(selectAcknowledgeLoading);
  const bulkAcknowledgeLoading = useSelector(selectBulkAcknowledgeLoading);

  // Local state
  const [selectedViolations, setSelectedViolations] = useState([]);
  const [expandedViolation, setExpandedViolation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bar'
  const [showChart, setShowChart] = useState(true);
  const pageSize = 20;

  // Chart colors for severity levels
  const SEVERITY_COLORS = {
    critical: '#dc2626', // red-600
    high: '#ea580c',     // orange-600
    medium: '#d97706',   // amber-600
    low: '#16a34a'       // green-600
  };

  // Prepare chart data from summary
  const chartData = useMemo(() => {
    return [
      { name: 'Critical', value: summary.criticalCount || 0, color: SEVERITY_COLORS.critical },
      { name: 'High', value: summary.highCount || 0, color: SEVERITY_COLORS.high },
      { name: 'Medium', value: summary.mediumCount || 0, color: SEVERITY_COLORS.medium },
      { name: 'Low', value: summary.lowCount || 0, color: SEVERITY_COLORS.low }
    ].filter(d => d.value > 0);
  }, [summary]);

  // Fetch data when panel opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchSummary());
      dispatch(fetchViolations({ page: currentPage, page_size: pageSize }));
    }
  }, [isOpen, dispatch]);

  // Refetch when filters change - reset to page 1
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      dispatch(fetchViolations({
        page: 1,
        page_size: pageSize,
        ...filters
      }));
    }
  }, [filters, dispatch, isOpen]);

  // Fetch when page changes
  useEffect(() => {
    if (isOpen && currentPage > 0) {
      dispatch(fetchViolations({
        page: currentPage,
        page_size: pageSize,
        ...filters
      }));
    }
  }, [currentPage]);

  const handleRefresh = () => {
    dispatch(fetchSummary());
    dispatch(fetchViolations({ page: currentPage, page_size: pageSize, ...filters }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setCurrentPage(newPage);
      setSelectedViolations([]); // Clear selection when changing pages
    }
  };

  const totalPages = meta.totalPages || Math.ceil(meta.total / pageSize) || 1;

  const handleAcknowledge = async (violationId) => {
    await dispatch(acknowledgeViolation(violationId));
    dispatch(fetchSummary());
  };

  const handleBulkAcknowledge = async () => {
    if (selectedViolations.length === 0) return;
    await dispatch(bulkAcknowledgeViolations(selectedViolations));
    setSelectedViolations([]);
    dispatch(fetchSummary());
  };

  const handleSelectAll = () => {
    const unacknowledgedIds = violations
      .filter(v => !v.acknowledged)
      .map(v => v.id);
    setSelectedViolations(unacknowledgedIds);
  };

  const handleSelectNone = () => {
    setSelectedViolations([]);
  };

  const toggleViolationSelection = (id) => {
    setSelectedViolations(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle size={16} className="text-red-600" />;
      case 'high': return <AlertTriangle size={16} className="text-orange-600" />;
      case 'medium': return <Clock size={16} className="text-yellow-600" />;
      case 'low': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Shield size={16} className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const filteredViolations = violations.filter(v => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      v.rule_name?.toLowerCase().includes(search) ||
      v.compliance_type?.toLowerCase().includes(search) ||
      v.file_name?.toLowerCase().includes(search)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compliance Violations"
      size="xlarge"
    >
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {summaryLoading ? '...' : summary.totalViolations}
            </div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {summaryLoading ? '...' : summary.unacknowledgedCount}
            </div>
            <div className="text-xs text-yellow-600">Unacknowledged</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {summaryLoading ? '...' : summary.criticalCount}
            </div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {summaryLoading ? '...' : summary.highCount}
            </div>
            <div className="text-xs text-orange-600">High</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">
              {summaryLoading ? '...' : summary.mediumCount}
            </div>
            <div className="text-xs text-amber-600">Medium</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {summaryLoading ? '...' : summary.lowCount}
            </div>
            <div className="text-xs text-green-600">Low</div>
          </div>
        </div>

        {/* Severity Distribution Chart */}
        {chartData.length > 0 && (
          <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Violations by Severity</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showChart ? 'Hide Chart' : 'Show Chart'}
                </button>
                {showChart && (
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setChartType('pie')}
                      className={`p-1.5 ${chartType === 'pie' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Pie Chart"
                    >
                      <PieChartIcon size={16} />
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`p-1.5 ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Bar Chart"
                    >
                      <BarChart2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showChart && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={50} />
                      <Tooltip
                        formatter={(value) => [value, 'Violations']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Filters and Actions Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search violations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={filters.severity || ''}
            onChange={(e) => dispatch(setFilters({ severity: e.target.value || null }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Acknowledged Filter */}
          <select
            value={filters.acknowledged === null ? '' : String(filters.acknowledged)}
            onChange={(e) => {
              const value = e.target.value;
              dispatch(setFilters({
                acknowledged: value === '' ? null : value === 'true'
              }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="false">Unacknowledged</option>
            <option value="true">Acknowledged</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={violationsLoading}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={violationsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Bulk Actions */}
        {violations.some(v => !v.acknowledged) && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All Unacknowledged
            </button>
            <button
              onClick={handleSelectNone}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
            {selectedViolations.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedViolations.length} selected
                </span>
                <button
                  onClick={handleBulkAcknowledge}
                  disabled={bulkAcknowledgeLoading}
                  className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Check size={16} />
                  {bulkAcknowledgeLoading ? 'Processing...' : 'Acknowledge Selected'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Violations List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {violationsLoading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Loading violations...
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No violations found</p>
              <p className="text-sm">Upload files with sensitive data to see compliance violations here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
              {filteredViolations.map((violation) => (
                <div
                  key={violation.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    violation.acknowledged ? 'bg-gray-50 opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for unacknowledged */}
                    {!violation.acknowledged && (
                      <input
                        type="checkbox"
                        checked={selectedViolations.includes(violation.id)}
                        onChange={() => toggleViolationSelection(violation.id)}
                        className="mt-1 rounded border-gray-300"
                      />
                    )}

                    {/* Severity Icon */}
                    <div className={`p-2 rounded-lg ${getSeverityColor(violation.severity)}`}>
                      {getSeverityIcon(violation.severity)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {violation.rule_name || 'Unknown Rule'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        {violation.acknowledged && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                            Acknowledged
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          {violation.file_name || 'Unknown File'}
                        </span>
                        <span>
                          {violation.compliance_type || 'General'}
                        </span>
                        <span>
                          {formatDate(violation.created_at)}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {expandedViolation === violation.id && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-500">Confidence:</span>{' '}
                              <span className="font-medium">{(violation.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>{' '}
                              <span className="font-medium">{violation.status}</span>
                            </div>
                            {violation.context && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Context:</span>{' '}
                                <span className="font-medium">{violation.context}</span>
                              </div>
                            )}
                            {violation.acknowledged_by && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Acknowledged by:</span>{' '}
                                <span className="font-medium">{violation.acknowledged_by}</span>
                                {violation.acknowledged_at && (
                                  <span className="text-gray-400"> on {formatDate(violation.acknowledged_at)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedViolation(
                          expandedViolation === violation.id ? null : violation.id
                        )}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Toggle Details"
                      >
                        {expandedViolation === violation.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      {!violation.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(violation.id)}
                          disabled={acknowledgeLoading}
                          className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-50"
                          title="Acknowledge"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {meta.total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, meta.total)} of {meta.total} violations
            </div>

            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || violationsLoading}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft size={18} />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || violationsLoading}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  // Adjust start if we're near the end
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  // Add first page and ellipsis if needed
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-1 text-sm rounded-lg hover:bg-blue-50 text-gray-600"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="ellipsis1" className="px-2 text-gray-400">...</span>);
                    }
                  }

                  // Add visible page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        disabled={violationsLoading}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          i === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-blue-50 text-gray-600'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Add last page and ellipsis if needed
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="ellipsis2" className="px-2 text-gray-400">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 text-sm rounded-lg hover:bg-blue-50 text-gray-600"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || violationsLoading}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || violationsLoading}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CompliancePanel;
