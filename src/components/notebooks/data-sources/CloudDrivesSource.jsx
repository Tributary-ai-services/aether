import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  CloudOff,
  ExternalLink,
  Folder,
} from 'lucide-react';
import {
  initiateOAuthFlow,
  listCloudDriveSites,
  fetchCredentials,
  deleteCredential,
  selectCredentials,
  selectOAuthPending,
  selectOAuthError,
  resetOAuthState,
  selectCloudDrive,
} from '../../../store/slices/dataSourcesSlice.js';
import { cloudDriveProviders, getOAuthProvider, getProviderById } from '../../../config/cloudDriveProviders.js';
import CloudDriveFileBrowser from './CloudDriveFileBrowser.jsx';

// Wizard steps
const STEPS = {
  PROVIDER_SELECT: 'provider_select',
  AUTHENTICATE: 'authenticate',
  SITE_SELECT: 'site_select',    // SharePoint only
  FILE_BROWSE: 'file_browse',
  IMPORT_CONFIRM: 'import_confirm',
};

/**
 * CloudDrivesSource
 *
 * Multi-step wizard for importing files from cloud drives.
 * Steps: Provider Selection → Authentication → File Browser → Import Confirmation
 */
const CloudDrivesSource = ({ notebook, onBack, onSuccess, onClose }) => {
  const dispatch = useDispatch();
  const credentials = useSelector(selectCredentials);
  const oauthPending = useSelector(selectOAuthPending);
  const oauthError = useSelector(selectOAuthError);
  const cloudDrive = useSelector(selectCloudDrive);

  const [step, setStep] = useState(STEPS.PROVIDER_SELECT);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [credentialId, setCredentialId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // idle | importing | success | error
  const [importError, setImportError] = useState(null);
  const [importProgress, setImportProgress] = useState(0);

  // SharePoint-specific state
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [sitesLoading, setSitesLoading] = useState(false);

  const oauthPopupRef = useRef(null);

  // Fetch existing credentials on mount
  useEffect(() => {
    dispatch(fetchCredentials());
  }, [dispatch]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'oauth_callback') return;

      if (event.data.success && event.data.credential) {
        setCredentialId(event.data.credential.id);
        const provider = getProviderById(selectedProvider);
        if (provider?.requiresSiteSelection) {
          setStep(STEPS.SITE_SELECT);
        } else {
          setStep(STEPS.FILE_BROWSE);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedProvider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetOAuthState());
    };
  }, [dispatch]);

  const [disconnecting, setDisconnecting] = useState(null);

  // Check for existing credential when provider is selected
  const checkExistingCredential = useCallback((providerId) => {
    const oauthProvider = getOAuthProvider(providerId);
    const existing = credentials.find(
      (c) => c.provider === oauthProvider && c.status === 'active'
    );
    return existing || null;
  }, [credentials]);

  // Disconnect a credential
  const handleDisconnect = useCallback(async (e, providerId) => {
    e.stopPropagation();
    const existing = checkExistingCredential(providerId);
    if (!existing) return;
    setDisconnecting(providerId);
    try {
      await dispatch(deleteCredential(existing.id)).unwrap();
      dispatch(fetchCredentials());
    } catch (err) {
      // silently handle
    } finally {
      setDisconnecting(null);
    }
  }, [dispatch, checkExistingCredential]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId) => {
    setSelectedProvider(providerId);
    const existing = checkExistingCredential(providerId);

    if (existing) {
      setCredentialId(existing.id);
      const provider = getProviderById(providerId);
      if (provider?.requiresSiteSelection) {
        setStep(STEPS.SITE_SELECT);
      } else {
        setStep(STEPS.FILE_BROWSE);
      }
    } else {
      setStep(STEPS.AUTHENTICATE);
    }
  }, [checkExistingCredential]);

  const [loginHint, setLoginHint] = useState('');

  // Start OAuth flow
  const handleConnect = useCallback(async () => {
    const oauthProvider = getOAuthProvider(selectedProvider);
    try {
      const result = await dispatch(initiateOAuthFlow({ provider: oauthProvider, loginHint: loginHint || undefined })).unwrap();
      const authUrl = result.authUrl || result.auth_url;
      if (authUrl) {
        // Open popup window for OAuth
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        oauthPopupRef.current = window.open(
          authUrl,
          'oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
      }
    } catch (err) {
      // Error is handled via Redux state
    }
  }, [dispatch, selectedProvider]);

  // Handle file selection from browser
  const handleFilesSelected = useCallback((files) => {
    setSelectedFiles(files);
    setStep(STEPS.IMPORT_CONFIRM);
  }, []);

  // Handle import — pass selected files to parent to open DocumentUploadModal
  const handleImport = useCallback(() => {
    if (onSuccess) {
      onSuccess({
        cloudDriveFiles: selectedFiles.map(f => ({
          id: f.id,
          fileId: f.id,
          name: f.name,
          size: f.size || 0,
          mimeType: f.mimeType || f.type || 'application/octet-stream',
          provider: selectedProvider,
          credentialId,
          siteId: selectedSite?.id,
        })),
        notebook_id: notebook?.id,
      });
    }
  }, [selectedProvider, credentialId, selectedFiles, notebook, selectedSite, onSuccess]);

  // Load SharePoint sites
  const loadSites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const result = await dispatch(
        listCloudDriveSites({ provider: 'sharepoint', credentialId })
      ).unwrap();
      setSites(result.sites || []);
    } catch (err) {
      setSites([]);
    } finally {
      setSitesLoading(false);
    }
  }, [dispatch, credentialId]);

  useEffect(() => {
    if (step === STEPS.SITE_SELECT && credentialId) {
      loadSites();
    }
  }, [step, credentialId, loadSites]);

  // Go back to previous step
  const handleStepBack = useCallback(() => {
    switch (step) {
      case STEPS.AUTHENTICATE:
        setSelectedProvider(null);
        setStep(STEPS.PROVIDER_SELECT);
        break;
      case STEPS.SITE_SELECT:
        setStep(STEPS.AUTHENTICATE);
        break;
      case STEPS.FILE_BROWSE:
        if (getProviderById(selectedProvider)?.requiresSiteSelection) {
          setStep(STEPS.SITE_SELECT);
        } else {
          setSelectedProvider(null);
          setStep(STEPS.PROVIDER_SELECT);
        }
        break;
      case STEPS.IMPORT_CONFIRM:
        setStep(STEPS.FILE_BROWSE);
        break;
      default:
        onBack();
    }
  }, [step, selectedProvider, onBack]);

  // Render provider selection
  const renderProviderSelect = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a Cloud Drive</h3>
      <p className="text-sm text-gray-500 mb-6">
        Select a cloud storage provider to import files from.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {cloudDriveProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelect(provider.id)}
            className={`flex items-center gap-4 p-4 border rounded-lg text-left transition-all ${provider.bgColor} ${provider.borderColor} ${provider.hoverColor}`}
          >
            <div className={`p-2.5 rounded-lg ${provider.bgColor}`}>
              <ProviderIcon provider={provider.id} className={`w-6 h-6 ${provider.iconColor}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{provider.name}</h4>
              <p className="text-sm text-gray-500">{provider.description}</p>
            </div>
            {checkExistingCredential(provider.id) && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </span>
                <button
                  onClick={(e) => handleDisconnect(e, provider.id)}
                  disabled={disconnecting === provider.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="Disconnect"
                >
                  {disconnecting === provider.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3 mr-1" />
                      Disconnect
                    </>
                  )}
                </button>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Render authentication step
  const renderAuthenticate = () => {
    const provider = getProviderById(selectedProvider);
    return (
      <div className="p-6 text-center">
        <div className={`p-4 rounded-full ${provider?.bgColor} inline-block mb-4`}>
          <ProviderIcon provider={selectedProvider} className={`w-10 h-10 ${provider?.iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect to {provider?.name}
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          You'll be redirected to sign in with your{' '}
          {selectedProvider === 'google' ? 'Google' : 'Microsoft'} account.
          We only request read-only access to your files.
        </p>

        <div className="mb-4 max-w-sm mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
            Email (optional)
          </label>
          <input
            type="email"
            value={loginHint}
            onChange={(e) => setLoginHint(e.target.value)}
            placeholder="e.g. you@example.com"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Pre-selects your account on the sign-in page
          </p>
        </div>

        {oauthError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {oauthError}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={oauthPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {oauthPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Connect {provider?.name}
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          A popup window will open for authentication.
          Please allow popups for this site.
        </p>
      </div>
    );
  };

  // Render SharePoint site selection
  const renderSiteSelect = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a SharePoint Site</h3>
      <p className="text-sm text-gray-500 mb-6">
        Choose the SharePoint site containing the documents you want to import.
      </p>

      {sitesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading sites...</span>
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-12">
          <CloudOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No SharePoint sites found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                setSelectedSite(site);
                setStep(STEPS.FILE_BROWSE);
              }}
              className="w-full flex items-center gap-3 p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <Folder className="w-5 h-5 text-teal-500" />
              <div>
                <div className="font-medium text-sm text-gray-900">{site.name}</div>
                {site.description && (
                  <div className="text-xs text-gray-500">{site.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render import confirmation
  const renderImportConfirm = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Import</h3>
      <p className="text-sm text-gray-500 mb-4">
        The following {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} will be
        imported into "{notebook?.name || 'this notebook'}".
      </p>

      <div className="border rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto mb-6">
        {selectedFiles.map((file) => (
          <div key={file.id} className="flex items-center gap-3 px-4 py-2.5">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
            <span className="text-xs text-gray-400">
              {file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''}
            </span>
          </div>
        ))}
      </div>

      {importStatus === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {importError}
        </div>
      )}

      {importStatus === 'importing' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-600">Importing files...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}

      {importStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Files imported successfully! They are now being processed.
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setStep(STEPS.FILE_BROWSE)}
          disabled={importStatus === 'importing'}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleImport}
          disabled={importStatus === 'importing' || importStatus === 'success'}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importStatus === 'importing' ? 'Importing...' : 'Import Files'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={step === STEPS.PROVIDER_SELECT ? onBack : handleStepBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cloud Drives</h2>
            <p className="text-sm text-gray-500">
              {step === STEPS.PROVIDER_SELECT && 'Choose a provider to get started'}
              {step === STEPS.AUTHENTICATE && `Connect to ${getProviderById(selectedProvider)?.name}`}
              {step === STEPS.SITE_SELECT && 'Select a SharePoint site'}
              {step === STEPS.FILE_BROWSE && 'Browse and select files to import'}
              {step === STEPS.IMPORT_CONFIRM && 'Review and confirm your import'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {step === STEPS.PROVIDER_SELECT && renderProviderSelect()}
        {step === STEPS.AUTHENTICATE && renderAuthenticate()}
        {step === STEPS.SITE_SELECT && renderSiteSelect()}
        {step === STEPS.FILE_BROWSE && (
          <CloudDriveFileBrowser
            provider={selectedProvider}
            credentialId={credentialId}
            siteId={selectedSite?.id}
            onFilesSelected={handleFilesSelected}
            onCancel={() => handleStepBack()}
          />
        )}
        {step === STEPS.IMPORT_CONFIRM && renderImportConfirm()}
      </div>
    </div>
  );
};

/**
 * Simple provider icon component
 * Uses SVG paths for Google Drive, OneDrive, and SharePoint icons
 */
const ProviderIcon = ({ provider, className = '' }) => {
  switch (provider) {
    case 'google':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
    case 'onedrive':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      );
    case 'sharepoint':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      );
    default:
      return <Folder className={className} />;
  }
};

export default CloudDrivesSource;
