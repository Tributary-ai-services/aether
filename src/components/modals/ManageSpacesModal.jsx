import React, { useState } from 'react';
import { useSpace } from '../../hooks/useSpaces.js';
import { useSpaceRole } from '../../hooks/useSpaceRole.js';
import { RequirePermission } from '../auth/RequirePermission.jsx';
import { ProtectedButton } from '../auth/ProtectedButton.jsx';
import { aetherApi } from '../../services/aetherApi.js';
import CreateSpaceModal from './CreateSpaceModal.jsx';
import SpaceMembersPanel from '../spaces/SpaceMembersPanel.jsx';
import InviteMemberModal from '../spaces/InviteMemberModal.jsx';
import {
  X,
  Building2,
  User,
  Users,
  Plus,
  Settings,
  Shield,
  Loader2,
  AlertCircle,
  Check,
  ChevronRight,
  Globe,
  Lock,
  Edit2,
  Trash2
} from 'lucide-react';

const ManageSpacesModal = ({ onClose }) => {
  const {
    availableSpaces,
    currentSpace,
    loadAvailableSpaces,
    setCurrentSpace
  } = useSpace();
  const { role: currentUserRole, isOwner, isAdmin } = useSpaceRole();

  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [createSpaceType, setCreateSpaceType] = useState('personal'); // 'personal' or 'organization'
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedSpaceForMembers, setSelectedSpaceForMembers] = useState(null);
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  const handleCreateSpace = (spaceType) => {
    setCreateSpaceType(spaceType);
    setShowCreateSpaceModal(true);
  };

  const handleCreateSpaceComplete = async () => {
    // Refresh spaces after creation
    await loadAvailableSpaces();
    setShowCreateSpaceModal(false);
  };

  const handleShowMembers = (space) => {
    setSelectedSpaceForMembers(space);
    setShowMembersPanel(true);
  };

  const handleInviteMember = (space) => {
    setSelectedSpaceForMembers(space);
    setShowInviteModal(true);
  };

  const handleInviteComplete = async () => {
    setShowInviteModal(false);
    // Optionally refresh spaces if needed
    await loadAvailableSpaces();
  };

  const renderPersonalSpace = () => {
    if (!availableSpaces.personal_space) {
      return (
        <div className="text-center py-12 text-gray-500">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No personal space available</p>
        </div>
      );
    }

    const isActive = currentSpace?.space_id === availableSpaces.personal_space.space_id;

    return (
      <div className="space-y-4">
        <div className={`
          border rounded-lg p-4 cursor-pointer transition-all
          ${isActive ? 'border-(--color-primary-500) bg-(--color-primary-50)' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
        `}
          onClick={() => setCurrentSpace(availableSpaces.personal_space)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-(--color-primary-100) rounded-lg">
                <User size={20} className="text-(--color-primary-600)" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {availableSpaces.personal_space.space_name}
                </h3>
                <p className="text-sm text-gray-500">Your personal workspace</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center">
                    <Shield size={12} className="mr-1" />
                    Owner
                  </span>
                  <span>Unlimited access</span>
                </div>
              </div>
            </div>
            {isActive && (
              <Check size={20} className="text-(--color-primary-600)" />
            )}
          </div>
        </div>

        {/* Personal spaces are created automatically - no create button needed */}
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Personal Space Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <Check size={14} className="text-green-500 mr-2" />
              Private notebooks and documents
            </li>
            <li className="flex items-center">
              <Check size={14} className="text-green-500 mr-2" />
              Personal AI agents and workflows
            </li>
            <li className="flex items-center">
              <Check size={14} className="text-green-500 mr-2" />
              Full privacy control
            </li>
          </ul>
        </div>
      </div>
    );
  };

  // Group organization spaces by their parent organization
  const getSpacesByOrganization = () => {
    const spacesByOrg = {};
    if (availableSpaces.organization_spaces) {
      availableSpaces.organization_spaces.forEach(space => {
        const orgId = space.organization_id || 'unknown';
        const orgName = space.organization_name || 'Unknown Organization';
        if (!spacesByOrg[orgId]) {
          spacesByOrg[orgId] = {
            id: orgId,
            name: orgName,
            spaces: [],
            // Use the highest role among spaces in this org
            userRole: space.user_role
          };
        }
        spacesByOrg[orgId].spaces.push(space);
      });
    }
    return spacesByOrg;
  };

  const renderOrganizationSpaces = () => {
    const spacesByOrg = getSpacesByOrganization();
    const hasSpaces = Object.keys(spacesByOrg).length > 0;

    return (
      <div className="space-y-6">
        {hasSpaces ? (
          Object.values(spacesByOrg).map(org => (
            <div key={org.id} className="space-y-3">
              {/* Organization Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  {org.name}
                </h3>
                {/* Only show create button for org admins/owners */}
                {(org.userRole === 'owner' || org.userRole === 'admin') && (
                  <button
                    onClick={() => handleCreateSpace('organization')}
                    className="text-xs text-(--color-primary-600) hover:text-(--color-primary-700) flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Space</span>
                  </button>
                )}
              </div>

              {/* Spaces within this organization */}
              <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                {org.spaces.map(space => {
                  const isActive = currentSpace?.space_id === space.space_id;

                  return (
                    <div
                      key={space.space_id}
                      className={`
                        border rounded-lg p-3 cursor-pointer transition-all
                        ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                      `}
                      onClick={() => setCurrentSpace(space)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-green-100 rounded">
                            <Building2 size={16} className="text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {space.space_name}
                            </h4>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                              <span className="flex items-center">
                                <Shield size={10} className="mr-1" />
                                {space.user_role || 'Member'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {isActive && (
                            <Check size={16} className="text-green-600" />
                          )}
                          {/* Members button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowMembers(space);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View members"
                          >
                            <Users size={14} className="text-gray-400" />
                          </button>
                          {/* Settings button - admin+ only */}
                          {(space.user_role === 'owner' || space.user_role === 'admin') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowMembers(space);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Space settings"
                            >
                              <Settings size={14} className="text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No organization spaces yet</p>
            <p className="text-sm mt-2">
              <a href="/organizations" className="text-blue-600 hover:underline">
                Create an organization
              </a>
              {' '}to get started with team collaboration
            </p>
          </div>
        )}

        {/* Create new space button - only shown if user has at least one org */}
        {hasSpaces && (
          <button
            onClick={() => handleCreateSpace('organization')}
            className="w-full p-4 border border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2 text-green-600"
          >
            <Plus size={20} />
            <span>Create New Organization Space</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Manage Spaces</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'personal'
                  ? 'border-(--color-primary-500) text-(--color-primary-600) font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <User size={16} />
                <span>Personal Space</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'organizations'
                  ? 'border-(--color-primary-500) text-(--color-primary-600) font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 size={16} />
                <span>Organization Spaces</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'personal' ? renderPersonalSpace() : renderOrganizationSpaces()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            Spaces provide isolated environments for your data and AI resources. 
            Switch between spaces using the selector in the header.
          </p>
        </div>
      </div>
      
      {/* Create Space Modal */}
      {showCreateSpaceModal && (
        <CreateSpaceModal
          onClose={() => setShowCreateSpaceModal(false)}
          spaceType={createSpaceType}
          onComplete={handleCreateSpaceComplete}
        />
      )}

      {/* Members Panel Modal */}
      {showMembersPanel && selectedSpaceForMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedSpaceForMembers.space_name} - Members
                </h2>
                <p className="text-sm text-gray-500">
                  Manage who has access to this space
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMembersPanel(false);
                  setSelectedSpaceForMembers(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <SpaceMembersPanel
                spaceId={selectedSpaceForMembers.space_id}
                onInvite={() => handleInviteMember(selectedSpaceForMembers)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && selectedSpaceForMembers && (
        <InviteMemberModal
          spaceId={selectedSpaceForMembers.space_id}
          spaceName={selectedSpaceForMembers.space_name}
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteComplete}
        />
      )}
    </div>
  );
};

export default ManageSpacesModal;