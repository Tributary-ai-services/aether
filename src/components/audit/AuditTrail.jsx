import React, { useState } from 'react';
import { useAudit } from '../../context/AuditContext.jsx';
import Modal from '../ui/Modal.jsx';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  MapPin,
  Monitor,
  Download,
  Filter,
  Search,
  Calendar,
  Eye
} from 'lucide-react';

const AuditTrail = ({ isOpen, onClose }) => {
  const { auditLogs, getComplianceReport } = useAudit();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const complianceReport = getComplianceReport();

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'success': return <CheckCircle size={16} className="text-green-600" />;
      case 'failed': return <XCircle size={16} className="text-red-600" />;
      case 'blocked': return <XCircle size={16} className="text-red-600" />;
      case 'pending_approval': return <Clock size={16} className="text-yellow-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'data_access': return <Eye size={16} className="text-blue-600" />;
      case 'data_export': return <Download size={16} className="text-purple-600" />;
      case 'authentication': return <User size={16} className="text-green-600" />;
      case 'model_training': return <Monitor size={16} className="text-indigo-600" />;
      case 'security_violation': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Shield size={16} className="text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesRiskLevel = selectedRiskLevel === 'all' || log.riskLevel === selectedRiskLevel;
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesRiskLevel && matchesSearch;
  });

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Audit Trail & Compliance"
        size="xlarge"
      >
        <div className="p-6">
          {/* Compliance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{complianceReport.totalLogs}</div>
              <div className="text-sm text-blue-600">Total Events</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{complianceReport.complianceScore}%</div>
              <div className="text-sm text-green-600">Compliance Score</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{complianceReport.criticalEvents}</div>
              <div className="text-sm text-red-600">Critical Events</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{complianceReport.failedActions}</div>
              <div className="text-sm text-orange-600">Failed Actions</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="data_access">Data Access</option>
                  <option value="data_export">Data Export</option>
                  <option value="authentication">Authentication</option>
                  <option value="model_training">Model Training</option>
                  <option value="security_violation">Security Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outcome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(log.category)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.action}</div>
                            <div className="text-xs text-gray-500">{log.resource}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">{log.user}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={10} />
                              {log.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(log.riskLevel)}`}>
                          {log.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getOutcomeIcon(log.outcome)}
                          <span className="text-sm text-gray-900 capitalize">{log.outcome.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield size={48} className="mx-auto mb-4 opacity-50" />
              <p>No audit logs found matching your criteria</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Audit Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLog(null);
          }}
          title="Audit Log Details"
          size="large"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Action</label>
                    <div className="text-gray-900">{selectedLog.action}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Resource</label>
                    <div className="text-gray-900">{selectedLog.resource}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <div className="text-gray-900">{formatTimestamp(selectedLog.timestamp)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Details</label>
                    <div className="text-gray-900">{selectedLog.details}</div>
                  </div>
                </div>
              </div>

              {/* User & Security Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">User</label>
                    <div className="text-gray-900">{selectedLog.user}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IP Address</label>
                    <div className="text-gray-900">{selectedLog.ipAddress}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <div className="text-gray-900">{selectedLog.location}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Agent</label>
                    <div className="text-gray-900 text-sm break-all">{selectedLog.userAgent}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Flags */}
            {selectedLog.complianceFlags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLog.complianceFlags.map((flag, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full"
                    >
                      {flag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">Risk Assessment</div>
                  <div className={`text-lg font-semibold ${selectedLog.riskLevel === 'critical' ? 'text-red-600' : selectedLog.riskLevel === 'high' ? 'text-orange-600' : selectedLog.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {selectedLog.riskLevel.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Outcome</div>
                  <div className="flex items-center gap-2">
                    {getOutcomeIcon(selectedLog.outcome)}
                    <span className="capitalize">{selectedLog.outcome.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AuditTrail;