import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { handleOAuthCallback } from '../store/slices/dataSourcesSlice.js';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * OAuthCallbackPage
 *
 * Handles the OAuth redirect from Google/Microsoft.
 * This page runs in a popup window opened by CloudDrivesSource.
 * It exchanges the authorization code for credentials, then
 * sends a postMessage to the parent window and closes itself.
 */
const OAuthCallbackPage = () => {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(searchParams.get('error_description') || 'Authorization was denied.');
      notifyParent({ success: false, error: error });
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or state parameter.');
      notifyParent({ success: false, error: 'missing_params' });
      return;
    }

    // Exchange the code for credentials via the backend
    dispatch(handleOAuthCallback({ provider, code, state }))
      .unwrap()
      .then((result) => {
        setStatus('success');
        notifyParent({
          success: true,
          provider,
          credential: result.credential,
        });
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(typeof err === 'string' ? err : err?.message || 'Failed to complete authentication.');
        notifyParent({ success: false, error: err });
      });
  }, [provider, searchParams, dispatch]);

  const notifyParent = (data) => {
    if (window.opener) {
      // Log to parent console for debugging
      try {
        window.opener.console.log('[OAuth Callback]', data);
      } catch (e) { /* cross-origin */ }

      window.opener.postMessage(
        { type: 'oauth_callback', ...data },
        window.location.origin
      );

      // Only auto-close on success; keep open on error so user can read the message
      if (data.success) {
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Completing Authentication</h2>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we connect your {provider === 'google' ? 'Google' : 'Microsoft'} account...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Connected Successfully</h2>
            <p className="text-sm text-gray-500 mt-2">
              You can close this window now.
            </p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Close Window
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Authentication Failed</h2>
            <p className="text-sm text-red-600 mt-2">{errorMessage}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
