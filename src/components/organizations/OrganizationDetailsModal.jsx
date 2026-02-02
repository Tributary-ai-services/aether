import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../ui/Modal.jsx';
import { 
  Building, 
  Users, 
  Settings, 
  Shield, 
  CreditCard, 
  MoreVertical,
  UserPlus,
  UserMinus,
  Crown,
  Eye,
  Edit2,
  Save,
  X,
  AlertCircle,
  Globe,
  Lock,
  ExternalLink,
  MapPin,
  Calendar,
  Mail
} from 'lucide-react';
import {
  fetchOrganizationMembers,
  updateOrganization,
  inviteOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
  selectOrganizationMembers,
  selectOrganizationsLoading,
  selectOrganizationInvitationLoading,
  selectOrganizationInvitationError,
  clearInvitationError
} from '../../store/slices/organizationsSlice.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const OrganizationDetailsModal = ({ isOpen, onClose, organization }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const members = useSelector(selectOrganizationMembers(organization?.id));
  const loading = useSelector(selectOrganizationsLoading);
  const invitationLoading = useSelector(selectOrganizationInvitationLoading);
  const invitationError = useSelector(selectOrganizationInvitationError);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [orgDetails, setOrgDetails] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    visibility: 'private'
  });
  const [showMemberMenu, setShowMemberMenu] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    if (organization?.id && isOpen) {
      dispatch(fetchOrganizationMembers(organization.id));
    }
  }, [dispatch, organization?.id, isOpen]);

  useEffect(() => {
    if (organization) {
      setOrgDetails({
        name: organization.name,
        description: organization.description || '',
        website: organization.website || '',
        location: organization.location || '',
        visibility: organization.visibility || 'private'
      });
    }
  }, [organization]);

  const handleUpdateOrganization = async () => {
    try {
      await dispatch(updateOrganization({ 
        orgId: organization.id, 
        updates: orgDetails 
      })).unwrap();
      setIsEditingDetails(false);
    } catch (error) {
      console.error('Failed to update organization:', error);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    try {
      await dispatch(inviteOrganizationMember({
        orgId: organization.id,
        email: inviteEmail,
        role: inviteRole
      })).unwrap();
      
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      await dispatch(updateOrganizationMemberRole({
        orgId: organization.id,
        userId,
        role: newRole
      })).unwrap();
      setShowMemberMenu(null);
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member from the organization?')) {
      try {
        await dispatch(removeOrganizationMember({
          orgId: organization.id,
          userId
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

  const getPlanInfo = (plan) => {
    const plans = {
      free: { name: 'Free', color: 'bg-gray-100 text-gray-800', seats: 3 },
      pro: { name: 'Pro', color: 'bg-(--color-primary-100) text-(--color-primary-800)', seats: 25 },
      enterprise: { name: 'Enterprise', color: 'bg-purple-100 text-purple-800', seats: 'Unlimited' }
    };
    
    return plans[plan] || plans.free;
  };

  const canManageOrg = organization?.userRole === 'owner' || organization?.userRole === 'admin';
  const canManageMembers = organization?.userRole === 'owner' || organization?.userRole === 'admin';

  if (!organization) return null;

  const planInfo = getPlanInfo(organization.billing?.plan);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={organization.name}
      size="xlarge"
    >
      <div className="flex flex-col h-full">
        {/* Header Info */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Building size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{organization.name}</h2>
              <p className="text-blue-100 mt-1">{organization.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-blue-100">
                {organization.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {organization.location}
                  </div>
                )}
                {organization.website && (
                  <div className="flex items-center gap-1">
                    <ExternalLink size={14} />
                    <a href={organization.website} target="_blank" rel="noopener noreferrer" 
                       className="hover:text-white">
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  Created {new Date(organization.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                {organization.visibility === 'public' ? (
                  <Globe size={16} className="text-green-300" />
                ) : (
                  <Lock size={16} className="text-yellow-300" />
                )}
                <span className="text-sm capitalize">{organization.visibility}</span>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${planInfo.color} bg-opacity-80`}>
                {planInfo.name} Plan
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'text-(--color-primary-600) border-(--color-primary-600)'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Overview
          </button>
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
          {canManageOrg && (
            <>
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
              <button
                onClick={() => setActiveTab('billing')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'billing'
                    ? 'text-(--color-primary-600) border-(--color-primary-600)'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Billing
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Users className="text-(--color-primary-600)" size={24} />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{organization.memberCount}</div>
                      <div className="text-sm text-gray-600">Members</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Shield className="text-green-600" size={24} />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{organization.teamCount}</div>
                      <div className="text-sm text-gray-600">Teams</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Building className="text-purple-600" size={24} />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{organization.repositoryCount}</div>
                      <div className="text-sm text-gray-600">Repositories</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Description</span>
                    <p className="text-gray-900">{organization.description || 'No description provided'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Location</span>
                      <p className="text-gray-900">{organization.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Website</span>
                      {organization.website ? (
                        <a href={organization.website} target="_blank" rel="noopener noreferrer" 
                           className="text-(--color-primary-600) hover:text-(--color-primary-700) flex items-center gap-1">
                          {organization.website}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-gray-900">Not specified</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Billing Email</span>
                    <p className="text-gray-900">{organization.billing?.billingEmail || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Invite Member */}
              {canManageMembers && (
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Organization Members</h3>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700)"
                  >
                    <UserPlus size={16} />
                    Invite Member
                  </button>
                </div>
              )}

              {/* Invite Form */}
              {showInviteForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <form onSubmit={handleInviteMember} className="space-y-4">
                    <div>
                      <h4 className="font-medium text-blue-900 mb-3">Invite New Member</h4>
                      {invitationError && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle size={16} />
                            <span className="text-sm">{invitationError}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                            disabled={invitationLoading}
                          />
                        </div>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                          disabled={invitationLoading}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          disabled={invitationLoading || !inviteEmail.trim()}
                          className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
                        >
                          {invitationLoading ? 'Inviting...' : 'Invite'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInviteForm(false);
                            setInviteEmail('');
                            setInviteRole('member');
                            if (invitationError) {
                              dispatch(clearInvitationError());
                            }
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Members List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading members...</p>
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
                              {member.teams && member.teams.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  Teams: {member.teams.join(', ')}
                                </span>
                              )}
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
                                  {['viewer', 'member', 'admin'].map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => handleUpdateMemberRole(member.userId, role)}
                                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 capitalize ${
                                        member.role === role ? 'bg-gray-100 font-medium' : ''
                                      }`}
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                                <hr />
                                <button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Remove from organization
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

          {activeTab === 'settings' && canManageOrg && (
            <div className="space-y-6">
              {/* Organization Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
                  {!isEditingDetails && (
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
                  <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={orgDetails.name}
                        onChange={(e) => setOrgDetails({ ...orgDetails, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={orgDetails.description}
                        onChange={(e) => setOrgDetails({ ...orgDetails, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={orgDetails.website}
                          onChange={(e) => setOrgDetails({ ...orgDetails, website: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={orgDetails.location}
                          onChange={(e) => setOrgDetails({ ...orgDetails, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visibility
                      </label>
                      <select
                        value={orgDetails.visibility}
                        onChange={(e) => setOrgDetails({ ...orgDetails, visibility: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdateOrganization}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDetails(false);
                          setOrgDetails({
                            name: organization.name,
                            description: organization.description || '',
                            website: organization.website || '',
                            location: organization.location || '',
                            visibility: organization.visibility || 'private'
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{organization.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-gray-900">{organization.description || 'No description'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <p className="text-gray-900">{organization.website || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-gray-900">{organization.location || 'Not specified'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visibility</p>
                      <p className="font-medium capitalize">{organization.visibility}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Member Permissions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Member Permissions</h3>
                <div className="space-y-3 bg-gray-50 rounded-lg p-6">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Create repositories</span>
                      <p className="text-sm text-gray-500">Allow members to create new repositories</p>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={organization.settings?.membersCanCreateRepositories}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Create teams</span>
                      <p className="text-sm text-gray-500">Allow members to create and manage teams</p>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={organization.settings?.membersCanCreateTeams}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Fork repositories</span>
                      <p className="text-sm text-gray-500">Allow members to fork repositories</p>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={organization.settings?.membersCanFork}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">Two-factor authentication</span>
                      <p className="text-sm text-gray-500">Require 2FA for all organization members</p>
                    </div>
                    <input 
                      type="checkbox" 
                      defaultChecked={organization.settings?.twoFactorRequired}
                      className="rounded border-gray-300 text-(--color-primary-600) focus:ring-(--color-primary-500)" 
                    />
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              {organization.userRole === 'owner' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 mb-3">
                      Once you delete an organization, there is no going back. Please be certain.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Delete Organization
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && canManageOrg && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold text-gray-900">{planInfo.name} Plan</h4>
                        <span className={`px-3 py-1 rounded-full text-sm ${planInfo.color}`}>
                          Current
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {typeof planInfo.seats === 'number' ? planInfo.seats : planInfo.seats} seats included
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {organization.billing?.plan === 'free' ? 'Free' : 
                         organization.billing?.plan === 'pro' ? '$15/month' : 
                         'Contact Sales'}
                      </div>
                      <p className="text-sm text-gray-500">per organization</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Seats Used</span>
                      <p className="font-medium">{organization.memberCount} / {planInfo.seats}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Billing Email</span>
                      <p className="font-medium">{organization.billing?.billingEmail || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Billing</span>
                      <p className="font-medium">
                        {organization.billing?.plan === 'free' ? 'N/A' : 'Monthly'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <div className={`border-2 rounded-lg p-6 ${
                    organization.billing?.plan === 'free' 
                      ? 'border-(--color-primary-500) bg-(--color-primary-50)' 
                      : 'border-gray-200'
                  }`}>
                    <h4 className="text-lg font-bold mb-2">Free</h4>
                    <div className="text-2xl font-bold mb-4">$0<span className="text-sm text-gray-500">/month</span></div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li>• 3 seats included</li>
                      <li>• Basic features</li>
                      <li>• Community support</li>
                      <li>• Public repositories</li>
                    </ul>
                    <button 
                      disabled={organization.billing?.plan === 'free'}
                      className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      {organization.billing?.plan === 'free' ? 'Current Plan' : 'Downgrade'}
                    </button>
                  </div>

                  {/* Pro Plan */}
                  <div className={`border-2 rounded-lg p-6 ${
                    organization.billing?.plan === 'pro' 
                      ? 'border-(--color-primary-500) bg-(--color-primary-50)' 
                      : 'border-gray-200'
                  }`}>
                    <h4 className="text-lg font-bold mb-2">Pro</h4>
                    <div className="text-2xl font-bold mb-4">$15<span className="text-sm text-gray-500">/month</span></div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li>• 25 seats included</li>
                      <li>• Advanced features</li>
                      <li>• Priority support</li>
                      <li>• Private repositories</li>
                      <li>• Advanced analytics</li>
                    </ul>
                    <button 
                      disabled={organization.billing?.plan === 'pro'}
                      className="w-full py-2 px-4 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg text-sm hover:bg-(--color-primary-700) disabled:opacity-50"
                    >
                      {organization.billing?.plan === 'pro' ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className={`border-2 rounded-lg p-6 ${
                    organization.billing?.plan === 'enterprise' 
                      ? 'border-(--color-primary-500) bg-(--color-primary-50)' 
                      : 'border-gray-200'
                  }`}>
                    <h4 className="text-lg font-bold mb-2">Enterprise</h4>
                    <div className="text-2xl font-bold mb-4">Custom</div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li>• Unlimited seats</li>
                      <li>• Enterprise features</li>
                      <li>• Dedicated support</li>
                      <li>• Advanced security</li>
                      <li>• Custom integrations</li>
                    </ul>
                    <button 
                      disabled={organization.billing?.plan === 'enterprise'}
                      className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      {organization.billing?.plan === 'enterprise' ? 'Current Plan' : 'Contact Sales'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing History</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">No billing history available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {organization.billing?.plan === 'free' 
                        ? 'Free plan - no charges'
                        : 'Invoices will appear here once billing starts'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OrganizationDetailsModal;