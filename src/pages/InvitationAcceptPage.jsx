import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { aetherApi } from '../services/aetherApi.js';

export default function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [resourceId, setResourceId] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link. No token provided.');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to signup with invite token
      navigate(`/signup?invite=${encodeURIComponent(token)}`);
      return;
    }

    // Accept the invitation
    const acceptInvitation = async () => {
      try {
        const result = await aetherApi.invitations.accept(token);
        setStatus('success');
        setResourceId(result.resourceId);
        setMessage(`You now have ${result.permission} access to this notebook.`);
        // Auto-redirect after 3 seconds
        setTimeout(() => navigate('/notebooks'), 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Failed to accept invitation. It may have expired or already been accepted.');
      }
    };

    acceptInvitation();
  }, [token, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accepting Invitation</h2>
            <p className="text-gray-500">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/notebooks')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Notebooks
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/notebooks')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Notebooks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
