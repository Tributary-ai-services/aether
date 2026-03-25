import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../ui/Modal.jsx';
import {
  Share2,
  Link,
  Mail,
  Eye,
  Edit,
  UserPlus,
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  sendInvitation,
  fetchNotebookShares,
  selectNotebookShares,
  selectSharingLoading,
  selectInvitationLoading,
  selectInvitationError,
} from '../../store/slices/notebooksSlice.js';

const ShareDialog = ({ isOpen, onClose, resourceId, resourceType, resourceName }) => {
  const dispatch = useDispatch();
  const shares = useSelector((state) => selectNotebookShares(state, resourceId));
  const sharingLoading = useSelector(selectSharingLoading);
  const invitationLoading = useSelector(selectInvitationLoading);
  const invitationError = useSelector(selectInvitationError);

  const [shareEmail, setShareEmail] = useState('');
  const [permissions, setPermissions] = useState('view');
  const [linkCopied, setLinkCopied] = useState(false);
  const [publicAccess, setPublicAccess] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const shareLink = `${window.location.origin}/shared/${resourceType}/${resourceId}`;

  useEffect(() => {
    if (isOpen && resourceId) {
      dispatch(fetchNotebookShares(resourceId));
    }
  }, [dispatch, isOpen, resourceId]);

  const handleShareWithUser = (e) => {
    e.preventDefault();
    if (shareEmail.trim() && resourceId) {
      dispatch(sendInvitation({
        notebookId: resourceId,
        email: shareEmail.trim(),
        permission: permissions,
        message: '',
      }));
      setShareEmail('');
    }
  };

  const handleSendEmailInvitation = () => {
    if (shareEmail.trim() && resourceId) {
      dispatch(sendInvitation({
        notebookId: resourceId,
        email: shareEmail.trim(),
        permission: permissions,
        message: inviteMessage,
      })).unwrap().then(() => {
        setInviteSent(true);
        setShareEmail('');
        setInviteMessage('');
        setTimeout(() => setInviteSent(false), 3000);
      }).catch(() => {});
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'view': return <Eye size={14} className="text-(--color-primary-600)" />;
      case 'edit': return <Edit size={14} className="text-green-600" />;
      case 'admin': return <Users size={14} className="text-purple-600" />;
      default: return <Eye size={14} className="text-gray-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${resourceName}"`}
      size="default"
    >
      <div className="p-6 space-y-6">
        {/* Error */}
        {invitationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            {invitationError}
          </div>
        )}

        {/* Share with specific users */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={20} />
            Share with people
          </h3>

          <form onSubmit={handleShareWithUser} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              />
              <select
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={!shareEmail.trim() || invitationLoading}
                className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {invitationLoading ? <Loader2 size={16} className="animate-spin" /> : 'Share'}
              </button>
            </div>
          </form>

          {/* Current shared users */}
          {shares.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">People with access</h4>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div key={share.userId || share.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(share.userName || share.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{share.userName || share.email}</div>
                        <div className="text-xs text-gray-500">
                          Shared {new Date(share.grantedAt || share.granted_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(share.permission)}
                      <span className="text-sm text-gray-600 capitalize">{share.permission}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share via link */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Link size={20} />
            Share via link
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {publicAccess ? <Globe size={20} className="text-green-600" /> : <Lock size={20} className="text-gray-600" />}
                <div>
                  <div className="font-medium text-gray-900">
                    {publicAccess ? 'Public access' : 'Private link'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {publicAccess ? 'Anyone with the link can view' : 'Only people with access can view'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicAccess}
                  onChange={(e) => setPublicAccess(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-(--color-primary-300) rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--color-primary-600)"></div>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Expires in:</label>
              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={0}>Never</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {linkCopied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Share via email */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail size={20} />
            Send via email
          </h3>

          <div className="space-y-3">
            {!shareEmail && (
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
              />
            )}
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) resize-none"
              rows={3}
            />
            <button
              onClick={handleSendEmailInvitation}
              disabled={!shareEmail.trim() || invitationLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50"
            >
              {invitationLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : inviteSent ? (
                <><Check size={16} /> Invitation Sent!</>
              ) : (
                <><Mail size={16} /> Send Email Invitation</>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareDialog;
