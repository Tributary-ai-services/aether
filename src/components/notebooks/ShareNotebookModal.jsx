import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import Tooltip from '../ui/Tooltip.jsx';
import { TeamIcon } from '../ui/IconPicker.jsx';
import { 
  Share, 
  Users, 
  Eye, 
  Edit, 
  Shield,
  Plus,
  X,
  Check,
  AlertCircle,
  Search,
  Globe,
  Lock,
  ExternalLink,
  Settings,
  Info,
  MoreVertical,
  User,
  Building,
  Mail,
  AtSign
} from 'lucide-react';
import {
  shareNotebookWithTeam,
  unshareNotebookFromTeam,
  fetchNotebookTeams,
  selectNotebookTeams,
  selectSharingLoading,
  selectSharingError,
  clearSharingError
} from '../../store/slices/notebooksSlice.js';
import {
  fetchTeams,
  selectAllTeams,
  selectTeamMembers
} from '../../store/slices/teamsSlice.js';

const ShareNotebookModal = ({ isOpen, onClose, notebook }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const availableTeams = useSelector(selectAllTeams);
  const sharedTeams = useSelector(selectNotebookTeams(notebook?.id));
  const loading = useSelector(selectSharingLoading);
  const error = useSelector(selectSharingError);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [shareType, setShareType] = useState('team'); // 'team', 'user', 'organization'
  const [showAddShare, setShowAddShare] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('view');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [orgSearchResults, setOrgSearchResults] = useState([]);

  useEffect(() => {
    if (isOpen && notebook?.id) {
      dispatch(fetchTeams());
      dispatch(fetchNotebookTeams(notebook.id));
    }
  }, [dispatch, isOpen, notebook?.id]);

  const permissionOptions = [
    {
      value: 'view',
      label: 'View',
      description: 'Can view notebook and run cells',
      icon: Eye,
      color: 'text-gray-600'
    },
    {
      value: 'edit',
      label: 'Edit',
      description: 'Can edit notebook content and settings',
      icon: Edit,
      color: 'text-blue-600'
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage sharing and delete notebook',
      icon: Shield,
      color: 'text-purple-600'
    }
  ];

  const getPermissionBadge = (permission) => {
    const option = permissionOptions.find(opt => opt.value === permission);
    if (!option) return { color: 'bg-gray-100 text-gray-800', icon: Eye };
    
    const colorMap = {
      'text-gray-600': 'bg-gray-100 text-gray-800',
      'text-blue-600': 'bg-blue-100 text-blue-800',
      'text-purple-600': 'bg-purple-100 text-purple-800'
    };
    
    return {
      color: colorMap[option.color] || 'bg-gray-100 text-gray-800',
      icon: option.icon,
      label: option.label
    };
  };
  
  const getTeamDetails = (teamId) => {
    return availableTeams.find(team => team.id === teamId);
  };

  const handleShare = async () => {
    if (!notebook?.id) return;
    
    try {
      if (shareType === 'team' && selectedTeam) {
        await dispatch(shareNotebookWithTeam({
          notebookId: notebook.id,
          teamId: selectedTeam,
          permission: selectedPermission
        })).unwrap();
      } else if (shareType === 'user' && selectedUser) {
        // Mock user sharing for now
        console.log('Sharing with user:', selectedUser, 'permission:', selectedPermission);
      } else if (shareType === 'organization' && selectedOrganization) {
        // Mock organization sharing for now
        console.log('Sharing with organization:', selectedOrganization, 'permission:', selectedPermission);
      }
      
      setShowAddShare(false);
      resetForm();
    } catch (error) {
      console.error('Failed to share notebook:', error);
    }
  };

  const resetForm = () => {
    setSelectedTeam('');
    setSelectedUser('');
    setSelectedOrganization('');
    setSelectedPermission('view');
    setSearchQuery('');
    setUserSearchResults([]);
    setOrgSearchResults([]);
  };

  const handleUnshare = async (teamId) => {
    if (!notebook?.id) return;
    
    if (window.confirm('Are you sure you want to remove access for this team?')) {
      try {
        await dispatch(unshareNotebookFromTeam({
          notebookId: notebook.id,
          teamId
        })).unwrap();
      } catch (error) {
        console.error('Failed to unshare notebook:', error);
      }
    }
  };

  const handleClose = () => {
    setShowAddShare(false);
    resetForm();
    if (error) {
      dispatch(clearSharingError());
    }
    onClose();
  };

  // Mock search functions - replace with actual API calls
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    // Mock user search results
    setUserSearchResults([
      { id: 1, name: 'John Doe', email: 'john@example.com', avatar: null },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: null },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', avatar: null }
    ].filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    ));
  };

  const searchOrganizations = async (query) => {
    if (query.length < 2) {
      setOrgSearchResults([]);
      return;
    }
    // Mock organization search results
    setOrgSearchResults([
      { id: 1, name: 'Acme Corp', description: 'Enterprise solutions', memberCount: 150 },
      { id: 2, name: 'Tech Innovations', description: 'Software development', memberCount: 75 },
      { id: 3, name: 'Data Solutions Inc', description: 'Analytics and AI', memberCount: 200 }
    ].filter(org => 
      org.name.toLowerCase().includes(query.toLowerCase()) ||
      org.description.toLowerCase().includes(query.toLowerCase())
    ));
  };

  // Handle search based on share type
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (shareType === 'user') {
      searchUsers(query);
    } else if (shareType === 'organization') {
      searchOrganizations(query);
    }
  };

  const filteredTeams = availableTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
    const notAlreadyShared = !sharedTeams.find(shared => shared.id === team.id);
    return matchesSearch && notAlreadyShared;
  });

  if (!notebook) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`Share "${notebook.name}"`}
      size="md"
    >
      <div className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Current Visibility */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            {notebook.visibility === 'public' ? (
              <>
                <Globe size={20} className="text-green-600" />
                <span className="font-medium">Public Notebook</span>
              </>
            ) : (
              <>
                <Lock size={20} className="text-gray-600" />
                <span className="font-medium">Private Notebook</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {notebook.visibility === 'public' 
              ? 'Anyone with the link can view this notebook'
              : 'Only you and shared teams can access this notebook'
            }
          </p>
        </div>

        {/* Shared Teams */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Teams with Access</h3>
            <button
              onClick={() => setShowAddShare(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Plus size={16} />
              Add Access
            </button>
          </div>

          {sharedTeams.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm">No teams have access yet</p>
              <button
                onClick={() => setShowAddShare(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Share with teams, users, or organizations
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedTeams.map((team) => {
                const badge = getPermissionBadge(team.permission);
                const BadgeIcon = badge.icon;
                const teamDetails = getTeamDetails(team.id);
                
                return (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <TeamIcon icon={teamDetails?.icon} size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                            <BadgeIcon size={12} />
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* Member Avatars */}
                      <div className="flex items-center gap-1">
                        {/* Mock member avatars - will be populated when profiles are complete */}
                        {[...Array(Math.min(4, teamDetails?.memberCount || 3))].map((_, index) => (
                          <div 
                            key={index}
                            className="w-7 h-7 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-xs text-white font-medium"
                            style={{
                              marginLeft: index > 0 ? '-8px' : '0',
                              zIndex: 10 - index
                            }}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                        ))}
                        {teamDetails?.memberCount > 4 && (
                          <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-xs text-white font-medium ml-1">
                            +{teamDetails.memberCount - 4}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Right aligned actions */}
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => handleUnshare(team.id)}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Remove access"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Share Form */}
        {showAddShare && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-blue-900">Add Access</h4>
              <button
                onClick={() => setShowAddShare(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Share Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share with
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShareType('team');
                    setSearchQuery('');
                    setUserSearchResults([]);
                    setOrgSearchResults([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    shareType === 'team'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users size={16} />
                  Teams
                </button>
                <button
                  onClick={() => {
                    setShareType('user');
                    setSearchQuery('');
                    setUserSearchResults([]);
                    setOrgSearchResults([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    shareType === 'user'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User size={16} />
                  Users
                </button>
                <button
                  onClick={() => {
                    setShareType('organization');
                    setSearchQuery('');
                    setUserSearchResults([]);
                    setOrgSearchResults([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    shareType === 'organization'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building size={16} />
                  Organizations
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {shareType === 'team' ? 'Select Team' : shareType === 'user' ? 'Select User' : 'Select Organization'}
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={`Search ${shareType === 'team' ? 'teams' : shareType === 'user' ? 'users' : 'organizations'}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {/* Teams */}
                {shareType === 'team' && filteredTeams.map((team) => {
                  const teamDetails = getTeamDetails(team.id);
                  return (
                    <label
                      key={team.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedTeam === team.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selection"
                        value={team.id}
                        checked={selectedTeam === team.id}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="sr-only"
                      />
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <TeamIcon icon={teamDetails?.icon} size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-xs text-gray-500">{team.memberCount} members</div>
                      </div>
                      {selectedTeam === team.id && (
                        <Check className="text-blue-600" size={16} />
                      )}
                    </label>
                  );
                })}

                {/* Users */}
                {shareType === 'user' && userSearchResults.map((user) => (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedUser === user.id.toString() ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selection"
                      value={user.id}
                      checked={selectedUser === user.id.toString()}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">
                        <Mail size={12} className="inline mr-1" />
                        {user.email}
                      </div>
                    </div>
                    {selectedUser === user.id.toString() && (
                      <Check className="text-blue-600" size={16} />
                    )}
                  </label>
                ))}

                {/* Organizations */}
                {shareType === 'organization' && orgSearchResults.map((org) => (
                  <label
                    key={org.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      selectedOrganization === org.id.toString() ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selection"
                      value={org.id}
                      checked={selectedOrganization === org.id.toString()}
                      onChange={(e) => setSelectedOrganization(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs">
                      <Building size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-xs text-gray-500">
                        {org.description} • {org.memberCount} members
                      </div>
                    </div>
                    {selectedOrganization === org.id.toString() && (
                      <Check className="text-blue-600" size={16} />
                    )}
                  </label>
                ))}
              </div>
              
              {/* No results messages */}
              {shareType === 'team' && filteredTeams.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  {searchQuery ? 'No teams found' : 'No available teams'}
                </p>
              )}
              {shareType === 'user' && searchQuery && userSearchResults.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No users found
                </p>
              )}
              {shareType === 'organization' && searchQuery && orgSearchResults.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No organizations found
                </p>
              )}
            </div>

            {/* Permission Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permission Level
              </label>
              <div className="space-y-2">
                {permissionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPermission === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="permission"
                        value={option.value}
                        checked={selectedPermission === option.value}
                        onChange={(e) => setSelectedPermission(e.target.value)}
                        className="sr-only"
                      />
                      <Icon size={20} className={option.color} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                      {selectedPermission === option.value && (
                        <Check className="text-blue-600" size={16} />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddShare(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={loading || 
                  (shareType === 'team' && !selectedTeam) ||
                  (shareType === 'user' && !selectedUser) ||
                  (shareType === 'organization' && !selectedOrganization)
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share size={16} />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareNotebookModal;