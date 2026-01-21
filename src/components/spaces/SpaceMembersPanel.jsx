/**
 * SpaceMembersPanel Component
 *
 * Displays and manages space members with permission-based actions.
 * Shows member list with roles and provides admin controls.
 */
import React, { useState, useEffect } from 'react';
import { useSpaceRole } from '../../hooks/useSpaceRole.js';
import { RequirePermission } from '../auth/RequirePermission.jsx';
import { ProtectedButton } from '../auth/ProtectedButton.jsx';
import { aetherApi } from '../../services/aetherApi.js';
import {
  Users,
  UserPlus,
  Shield,
  MoreVertical,
  Edit2,
  Trash2,
  Crown,
  User,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';

/**
 * Role badge component with appropriate styling
 */
const RoleBadge = ({ role }) => {
  const getRoleStyles = () => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'member':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'owner':
        return <Crown size={12} />;
      case 'admin':
        return <Shield size={12} />;
      default:
        return <User size={12} />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleStyles()}`}>
      {getRoleIcon()}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

/**
 * Member row with actions menu
 */
const MemberRow = ({
  member,
  currentUserRole,
  onUpdateRole,
  onRemove,
  isCurrentUser
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);
  const { assignableRoles } = useSpaceRole();

  const canModifyMember = () => {
    // Owner can modify anyone except themselves
    if (currentUserRole === 'owner' && !isCurrentUser) return true;
    // Admin can modify members and viewers, but not other admins or owner
    if (currentUserRole === 'admin' &&
        ['member', 'viewer'].includes(member.role) &&
        !isCurrentUser) return true;
    return false;
  };

  const handleRoleChange = async () => {
    if (selectedRole !== member.role) {
      await onUpdateRole(member.user_id, selectedRole);
    }
    setShowRoleSelect(false);
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
          {member.display_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {member.display_name || member.email}
            </span>
            {isCurrentUser && (
              <span className="text-xs text-gray-500">(You)</span>
            )}
          </div>
          <span className="text-sm text-gray-500">{member.email}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {showRoleSelect ? (
          <div className="flex items-center space-x-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {assignableRoles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleRoleChange}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setSelectedRole(member.role);
                setShowRoleSelect(false);
              }}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <RoleBadge role={member.role} />

            {canModifyMember() && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <MoreVertical size={16} className="text-gray-400" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                      <button
                        onClick={() => {
                          setShowRoleSelect(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 size={14} />
                        <span>Change Role</span>
                      </button>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => {
                            onRemove(member.user_id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Main SpaceMembersPanel component
 */
const SpaceMembersPanel = ({ spaceId, onInvite }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { role: currentUserRole, isOwner, isAdmin } = useSpaceRole();

  useEffect(() => {
    if (spaceId) {
      loadMembers();
    }
  }, [spaceId]);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aetherApi.get(`/spaces/${spaceId}/members`);
      setMembers(response.data.members || []);
    } catch (err) {
      console.error('Failed to load space members:', err);
      setError(err.response?.data?.error || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setUpdateLoading(true);
    try {
      await aetherApi.patch(`/spaces/${spaceId}/members/${userId}`, {
        role: newRole
      });
      // Refresh members list
      await loadMembers();
    } catch (err) {
      console.error('Failed to update member role:', err);
      setError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    const confirmRemove = window.confirm(
      'Are you sure you want to remove this member from the space?'
    );
    if (!confirmRemove) return;

    setUpdateLoading(true);
    try {
      await aetherApi.delete(`/spaces/${spaceId}/members/${userId}`);
      // Refresh members list
      await loadMembers();
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get current user ID from somewhere (could be from auth context)
  const currentUserId = ''; // This would come from auth context

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading members...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Users size={18} className="text-gray-500" />
          <h3 className="font-medium text-gray-900">
            Space Members ({members.length})
          </h3>
        </div>

        {/* Invite button - only shown for admins and owners */}
        <RequirePermission role="admin">
          <button
            onClick={onInvite}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={16} />
            <span>Invite</span>
          </button>
        </RequirePermission>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="divide-y divide-gray-100">
        {members.length > 0 ? (
          members.map(member => (
            <MemberRow
              key={member.user_id}
              member={member}
              currentUserRole={currentUserRole}
              onUpdateRole={handleUpdateRole}
              onRemove={handleRemoveMember}
              isCurrentUser={member.user_id === currentUserId}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No members found</p>
          </div>
        )}
      </div>

      {/* Loading overlay for updates */}
      {updateLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
};

export default SpaceMembersPanel;
