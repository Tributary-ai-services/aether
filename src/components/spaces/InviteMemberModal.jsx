/**
 * InviteMemberModal Component
 *
 * Modal for inviting new members to a space.
 * Allows setting email and role for the new member.
 */
import React, { useState } from 'react';
import { useSpaceRole } from '../../hooks/useSpaceRole.js';
import { aetherApi } from '../../services/aetherApi.js';
import {
  X,
  UserPlus,
  Mail,
  Shield,
  AlertCircle,
  Loader2,
  Check,
  Info
} from 'lucide-react';

/**
 * Role option with description
 */
const RoleOption = ({ role, description, selected, onSelect, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onSelect(role)}
    disabled={disabled}
    className={`
      w-full p-3 text-left rounded-lg border transition-all
      ${selected
        ? 'border-(--color-primary-500) bg-(--color-primary-50) ring-1 ring-(--color-primary-500)'
        : disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }
    `}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900 capitalize">{role}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      {selected && <Check size={18} className="text-(--color-primary-600)" />}
    </div>
  </button>
);

const ROLE_DESCRIPTIONS = {
  admin: 'Can manage members, settings, and all content',
  member: 'Can create and edit content, but cannot manage members',
  viewer: 'Can view content but cannot edit or create'
};

const InviteMemberModal = ({ spaceId, spaceName, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { role: currentUserRole, assignableRoles } = useSpaceRole();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await aetherApi.post(`/spaces/${spaceId}/members`, {
        email: email.trim(),
        role: role
      });
      setSuccess(true);
      // Call success callback after brief delay to show success state
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Failed to invite member:', err);
      if (err.response?.status === 409) {
        setError('This user is already a member of this space');
      } else if (err.response?.status === 404) {
        setError('No user found with this email address');
      } else {
        setError(err.response?.data?.error || 'Failed to invite member');
      }
    } finally {
      setLoading(false);
    }
  };

  const canAssignRole = (targetRole) => {
    // Owner can assign any role except owner
    if (currentUserRole === 'owner') {
      return targetRole !== 'owner';
    }
    // Admin can only assign member and viewer
    if (currentUserRole === 'admin') {
      return ['member', 'viewer'].includes(targetRole);
    }
    return false;
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Invitation Sent!
          </h3>
          <p className="text-gray-500">
            An invitation has been sent to {email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus size={20} className="text-(--color-primary-600)" />
            <h2 className="text-lg font-semibold text-gray-900">Invite Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Space name info */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-2">
            <Info size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              Inviting to: <span className="font-medium">{spaceName}</span>
            </span>
          </div>

          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="colleague@company.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <div className="space-y-2">
              {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, description]) => (
                <RoleOption
                  key={roleKey}
                  role={roleKey}
                  description={description}
                  selected={role === roleKey}
                  onSelect={setRole}
                  disabled={!canAssignRole(roleKey)}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Inviting...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
