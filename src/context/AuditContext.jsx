import React, { createContext, useContext, useState, useEffect } from 'react';

const AuditContext = createContext();

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};

export const AuditProvider = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState([]);

  // Initialize with some mock audit data
  useEffect(() => {
    const mockAuditData = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        action: 'Document Upload',
        resource: 'contract_v2.pdf',
        user: 'john.doe@company.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.100',
        location: 'New York, NY',
        details: 'Uploaded 2.1MB PDF document for legal review',
        category: 'data_access',
        riskLevel: 'low',
        complianceFlags: ['PII_DETECTED', 'CLASSIFICATION_REQUIRED'],
        outcome: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        action: 'Model Training',
        resource: 'Legal Document Classifier v2.1',
        user: 'sarah.smith@company.com',
        userAgent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '10.0.0.25',
        location: 'San Francisco, CA',
        details: 'Initiated training on 10,000 legal documents with enhanced privacy filters',
        category: 'model_training',
        riskLevel: 'medium',
        complianceFlags: ['GDPR_COMPLIANT', 'RETENTION_POLICY_APPLIED'],
        outcome: 'success'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        action: 'Data Export',
        resource: 'Notebook: Medical Records Analysis',
        user: 'mike.johnson@company.com',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        ipAddress: '172.16.0.50',
        location: 'Austin, TX',
        details: 'Exported 250 processed medical records for compliance review',
        category: 'data_export',
        riskLevel: 'high',
        complianceFlags: ['HIPAA_AUDIT', 'PHI_DETECTED', 'APPROVAL_REQUIRED'],
        outcome: 'pending_approval'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 14400000), // 4 hours ago
        action: 'User Login',
        resource: 'Authentication System',
        user: 'admin@company.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '203.0.113.10',
        location: 'London, UK',
        details: 'Administrative user logged in with 2FA authentication',
        category: 'authentication',
        riskLevel: 'low',
        complianceFlags: ['MFA_VERIFIED', 'PRIVILEGED_ACCESS'],
        outcome: 'success'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 18000000), // 5 hours ago
        action: 'Failed Access Attempt',
        resource: 'Confidential Notebook',
        user: 'external.user@partner.com',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        ipAddress: '198.51.100.42',
        location: 'Unknown',
        details: 'Attempted to access restricted notebook without proper authorization',
        category: 'security_violation',
        riskLevel: 'critical',
        complianceFlags: ['UNAUTHORIZED_ACCESS', 'SECURITY_ALERT', 'INVESTIGATION_REQUIRED'],
        outcome: 'blocked'
      }
    ];

    setAuditLogs(mockAuditData);
  }, []);

  const addAuditLog = (logEntry) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      outcome: 'success',
      riskLevel: 'low',
      complianceFlags: [],
      ...logEntry
    };
    
    setAuditLogs(prevLogs => [newLog, ...prevLogs]);
    return newLog.id;
  };

  const getAuditLogsByCategory = (category) => {
    return auditLogs.filter(log => log.category === category);
  };

  const getAuditLogsByRiskLevel = (riskLevel) => {
    return auditLogs.filter(log => log.riskLevel === riskLevel);
  };

  const getAuditLogsByUser = (user) => {
    return auditLogs.filter(log => log.user === user);
  };

  const getComplianceReport = () => {
    const totalLogs = auditLogs.length;
    const criticalEvents = auditLogs.filter(log => log.riskLevel === 'critical').length;
    const highRiskEvents = auditLogs.filter(log => log.riskLevel === 'high').length;
    const failedActions = auditLogs.filter(log => log.outcome === 'blocked' || log.outcome === 'failed').length;
    
    const complianceFlags = auditLogs.reduce((acc, log) => {
      log.complianceFlags.forEach(flag => {
        acc[flag] = (acc[flag] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      totalLogs,
      criticalEvents,
      highRiskEvents,
      failedActions,
      complianceScore: Math.max(0, 100 - (criticalEvents * 20) - (highRiskEvents * 10) - (failedActions * 5)),
      complianceFlags
    };
  };

  const value = {
    auditLogs,
    addAuditLog,
    getAuditLogsByCategory,
    getAuditLogsByRiskLevel,
    getAuditLogsByUser,
    getComplianceReport
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
};