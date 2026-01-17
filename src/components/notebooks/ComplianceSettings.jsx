import React from 'react';
import { 
  Shield, 
  Eye, 
  Lock, 
  FileText, 
  Clock, 
  AlertTriangle,
  Check,
  Info
} from 'lucide-react';

const ComplianceSettings = ({ settings, onChange, disabled = false }) => {
  const handleChange = (key, value) => {
    if (onChange) {
      onChange({
        ...settings,
        [key]: value
      });
    }
  };

  const handleFrameworkChange = (framework, checked) => {
    const currentFrameworks = settings.complianceFrameworks || [];
    const newFrameworks = checked
      ? [...currentFrameworks, framework]
      : currentFrameworks.filter(f => f !== framework);
    
    handleChange('complianceFrameworks', newFrameworks);
  };

  const complianceFrameworks = [
    { id: 'HIPAA', label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act' },
    { id: 'PII', label: 'PII Protection', description: 'Personally Identifiable Information Detection & Protection' },
    { id: 'GDPR', label: 'GDPR', description: 'General Data Protection Regulation' },
    { id: 'SOC2', label: 'SOC 2', description: 'Service Organization Control 2' },
    { id: 'ISO27001', label: 'ISO 27001', description: 'Information Security Management' },
    { id: 'PCI-DSS', label: 'PCI DSS', description: 'Payment Card Industry Data Security Standard' },
    { id: 'CCPA', label: 'CCPA', description: 'California Consumer Privacy Act' }
  ];

  const dataClassifications = [
    { value: 'public', label: 'Public', color: 'text-green-600' },
    { value: 'internal', label: 'Internal', color: 'text-blue-600' },
    { value: 'confidential', label: 'Confidential', color: 'text-orange-600' },
    { value: 'restricted', label: 'Restricted', color: 'text-red-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Frameworks */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-4">
          <Shield className="text-blue-600 mt-1" size={20} />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">Compliance Frameworks</h3>
            <p className="text-xs text-blue-700 mb-3">
              Enable regulatory compliance frameworks for data protection and industry standards.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complianceFrameworks.map(framework => (
            <div key={framework.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`framework-${framework.id}`}
                checked={(settings.complianceFrameworks || []).includes(framework.id) || 
                         (framework.id === 'HIPAA' && settings.hipaaCompliant) ||
                         (framework.id === 'PII' && settings.piiDetection !== false)}
                onChange={(e) => {
                  if (framework.id === 'HIPAA') {
                    handleChange('hipaaCompliant', e.target.checked);
                  } else if (framework.id === 'PII') {
                    handleChange('piiDetection', e.target.checked);
                  } else {
                    handleFrameworkChange(framework.id, e.target.checked);
                  }
                }}
                disabled={disabled}
                className="rounded border-gray-300 mt-1"
              />
              <div>
                <label htmlFor={`framework-${framework.id}`} className="text-sm font-medium text-blue-800">
                  {framework.label}
                </label>
                <p className="text-xs text-blue-600">
                  {framework.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Classification */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <FileText size={16} />
          Data Classification
        </label>
        <select
          value={settings.dataClassification || 'internal'}
          onChange={(e) => handleChange('dataClassification', e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {dataClassifications.map(classification => (
            <option key={classification.value} value={classification.value}>
              {classification.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-600 mt-1">
          Classification level determines access controls and handling requirements
        </p>
      </div>


      {/* Data Retention */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Clock size={16} />
          Data Retention
        </label>
        
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="0"
            max="7300"
            value={settings.dataRetentionDays || 365}
            onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value) || 365)}
            disabled={disabled}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-600">days</span>
          <div className="text-xs text-gray-500">
            (0 = permanent, max 20 years)
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Documents will be automatically deleted after this period for compliance
        </p>
      </div>

      {/* Security Options */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Lock size={16} />
          Security Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-700">Content Redaction</label>
              <p className="text-xs text-gray-500">Automatically redact sensitive information in documents</p>
            </div>
            <input
              type="checkbox"
              checked={settings.redactionEnabled || false}
              onChange={(e) => handleChange('redactionEnabled', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-700">Access Logging</label>
              <p className="text-xs text-gray-500">Log all document access and user activities</p>
            </div>
            <input
              type="checkbox"
              checked={settings.accessLogging !== false}
              onChange={(e) => handleChange('accessLogging', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-700">Encryption at Rest</label>
              <p className="text-xs text-gray-500">Encrypt all stored documents and metadata</p>
            </div>
            <input
              type="checkbox"
              checked={settings.encryptionAtRest !== false}
              onChange={(e) => handleChange('encryptionAtRest', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-700">Audit Trail</label>
              <p className="text-xs text-gray-500">Maintain detailed audit trail for compliance reporting</p>
            </div>
            <input
              type="checkbox"
              checked={settings.auditTrail !== false}
              onChange={(e) => handleChange('auditTrail', e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300"
            />
          </div>
        </div>
      </div>


      {/* AudiModal Integration Note */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="text-green-600 mt-1" size={16} />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">AudiModal Integration</p>
            <p>These settings will be automatically applied to all document uploads and processing through AudiModal's compliance engine. Changes take effect immediately for new uploads.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceSettings;