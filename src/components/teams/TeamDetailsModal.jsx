import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../ui/Modal.jsx';
import IconPicker, { TeamIcon } from '../ui/IconPicker.jsx';
import { 
  Users, 
  Settings, 
  Shield, 
  Mail, 
  MoreVertical,
  UserPlus,
  UserMinus,
  Edit,
  Save,
  X,
  AlertCircle,
  Crown,
  Eye,
  Edit2,
  Image
} from 'lucide-react';
import {
  fetchTeamMembers,
  updateTeam,
  updateTeamMemberRole,
  removeTeamMember,
  selectTeamMembers,
  selectTeamsLoading,
  selectTeamsError
} from '../../store/slices/teamsSlice.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const TeamDetailsModal = ({ isOpen, onClose, team }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const members = useSelector(selectTeamMembers(team?.id));
  const loading = useSelector(selectTeamsLoading);
  const error = useSelector(selectTeamsError);
  
  const [activeTab, setActiveTab] = useState('members');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [teamDetails, setTeamDetails] = useState({
    name: team?.name || '',
    description: team?.description || '',
    visibility: team?.visibility || 'private',
    icon: team?.icon || null
  });
  const [showMemberMenu, setShowMemberMenu] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (team?.id && isOpen) {
      dispatch(fetchTeamMembers(team.id));
    }
  }, [dispatch, team?.id, isOpen]);

  useEffect(() => {
    if (team) {
      setTeamDetails({
        name: team.name,
        description: team.description || '',
        visibility: team.visibility || 'private',
        icon: team.icon || null
      });
    }
  }, [team]);

  const handleUpdateTeam = async () => {
    try {
      await dispatch(updateTeam({ 
        teamId: team.id, 
        updates: teamDetails 
      })).unwrap();
      setIsEditingDetails(false);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      await dispatch(updateTeamMemberRole({
        teamId: team.id,
        userId: memberId,
        role: newRole
      })).unwrap();
      setShowMemberMenu(null);
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await dispatch(removeTeamMember({
          teamId: team.id,
          userId: memberId
        })).unwrap();
        setShowMemberMenu(null);
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: { color: 'bg-purple-100 text-purple-800', icon: Crown },
      admin: { color: 'bg-(--color-primary-100) text-(--color-primary-800)', icon: Shield },
      member: { color: 'bg-green-100 text-green-800', icon: Users },
      viewer: { color: 'bg-gray-100 text-gray-800', icon: Eye }
    };
    
    return badges[role] || badges.member;
  };

  const canEditTeam = team?.userRole === 'owner' || team?.userRole === 'admin';
  const canManageMembers = team?.userRole === 'owner' || team?.userRole === 'admin';

  if (!team) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={team.name}
      size="lg"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'text-(--color-primary-600) border-(--color-primary-600)'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'text-(--color-primary-600) border-(--color-primary-600)'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Members List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading members...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  {error.status === 403 ? (
                    <>
                      <Shield className="mx-auto h-12 w-12 text-red-400 mb-3" />
                      <p className="text-red-600 font-medium">Access Denied</p>
                      <p className="text-gray-600 mt-2">You don't have permission to view team members</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-3" />
                      <p className="text-red-600 font-medium">Failed to Load Members</p>
                      <p className="text-gray-600 mt-2">{error.message || 'An error occurred while loading team members'}</p>
                    </>
                  )}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const roleBadge = getRoleBadge(member.role);
                    const RoleIcon = roleBadge.icon;
                    
                    return (
                      <div
                        key={member.id || member.userId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {member.name || member.email}
                              {member.userId === user?.id && (
                                <span className="text-gray-500 text-sm ml-2">(You)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${roleBadge.color}`}>
                                <RoleIcon size={12} />
                                {member.role}
                              </span>
                              {member.joinedAt && (
                                <span className="text-xs text-gray-500">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Member Actions */}
                        {canManageMembers && member.role !== 'owner' && member.userId !== user?.id && (
                          <div className="relative">
                            <button
                              onClick={() => setShowMemberMenu(
                                showMemberMenu === member.userId ? null : member.userId
                              )}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {showMemberMenu === member.userId && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <div className="p-2">
                                  <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                                    Change Role
                                  </p>
                                  {['admin', 'member', 'viewer'].map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => handleUpdateMemberRole(member.userId, role)}
                                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                                        member.role === role ? 'bg-gray-100 font-medium' : ''
                                      }`}
                                    >
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </button>
                                  ))}
                                </div>
                                <hr />
                                <button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Remove from team
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Team Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Team Details</h3>
                  {canEditTeam && !isEditingDetails && (
                    <button
                      onClick={() => setIsEditingDetails(true)}
                      className="flex items-center gap-2 text-(--color-primary-600) hover:text-(--color-primary-700)"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDetails ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={teamDetails.name}
                        onChange={(e) => setTeamDetails({ ...teamDetails, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team Icon
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <TeamIcon icon={teamDetails.icon} size={24} className="text-white" />
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Image size={16} />
                            Change Icon
                          </button>
                          {showIconPicker && (
                            <div className="absolute top-full left-0 mt-2 z-50">
                              <IconPicker
                                value={teamDetails.icon}
                                onChange={(icon) => {
                                  setTeamDetails({ ...teamDetails, icon });
                                  setShowIconPicker(false);
                                }}
                                onClose={() => setShowIconPicker(false)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={teamDetails.description}
                        onChange={(e) => setTeamDetails({ ...teamDetails, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visibility
                      </label>
                      <select
                        value={teamDetails.visibility}
                        onChange={(e) => setTeamDetails({ ...teamDetails, visibility: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                      >
                        <option value="private">Private</option>
                        <option value="organization">Organization</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateTeam}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDetails(false);
                          setTeamDetails({
                            name: team.name,
                            description: team.description || '',
                            visibility: team.visibility || 'private',
                            icon: team.icon || null
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Team Icon & Name</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <TeamIcon icon={team.icon} size={20} className="text-white" />
                        </div>
                        <p className="font-medium">{team.name}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-900">{team.description || 'No description'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visibility</p>
                      <p className="font-medium capitalize">{team.visibility}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-gray-900">
                        {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              {team.userRole === 'owner' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 mb-3">
                      Once you delete a team, there is no going back. Please be certain.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Delete Team
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TeamDetailsModal;