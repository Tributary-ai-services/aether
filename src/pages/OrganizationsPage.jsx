import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Building, Users, Settings, Trash2, Edit, Globe, Lock, Search, Filter, Crown, Shield, User, Eye } from 'lucide-react';
import {
  fetchOrganizations,
  createOrganization,
  deleteOrganization,
  selectAllOrganizations,
  selectOrganizationsLoading,
  selectOrganizationsError,
  clearOrganizationsError,
  setCurrentOrganization
} from '../store/slices/organizationsSlice.js';
import CreateOrganizationModal from '../components/organizations/CreateOrganizationModal.jsx';
import OrganizationDetailsModal from '../components/organizations/OrganizationDetailsModal.jsx';

const OrganizationsPage = () => {
  const dispatch = useDispatch();
  const organizations = useSelector(selectAllOrganizations);
  const loading = useSelector(selectOrganizationsLoading);
  const error = useSelector(selectOrganizationsError);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected organization from Redux state (stays fresh after updates)
  const selectedOrganization = selectedOrgId
    ? organizations.find(org => org.id === selectedOrgId)
    : null;
  const [filterBy, setFilterBy] = useState('all'); // all, owner, admin, member
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  useEffect(() => {
    dispatch(fetchOrganizations());
  }, [dispatch]);

  const getRoleBadge = (role) => {
    const badges = {
      owner: { color: 'bg-purple-100 text-purple-800', icon: Crown, label: 'Owner' },
      admin: { color: 'bg-blue-100 text-blue-800', icon: Shield, label: 'Admin' },
      member: { color: 'bg-green-100 text-green-800', icon: User, label: 'Member' },
      viewer: { color: 'bg-gray-100 text-gray-800', icon: Eye, label: 'Viewer' }
    };
    
    return badges[role] || badges.member;
  };

  const getPlanBadge = (plan) => {
    const badges = {
      free: { color: 'bg-gray-100 text-gray-800', label: 'Free' },
      pro: { color: 'bg-blue-100 text-blue-800', label: 'Pro' },
      enterprise: { color: 'bg-purple-100 text-purple-800', label: 'Enterprise' }
    };
    
    return badges[plan] || badges.free;
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         org.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterBy !== 'all') {
      matchesFilter = org.userRole === filterBy;
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateOrganization = async (orgData) => {
    try {
      await dispatch(createOrganization(orgData)).unwrap();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        await dispatch(deleteOrganization(orgId)).unwrap();
      } catch (error) {
        console.error('Failed to delete organization:', error);
      }
    }
  };

  const handleOrganizationClick = (org) => {
    dispatch(setCurrentOrganization(org));
    setSelectedOrgId(org.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building size={32} className="text-blue-600" />
            Organizations
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your organizations, teams, and collaboration spaces
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Organization
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700">{error}</div>
          <button
            onClick={() => dispatch(clearOrganizationsError())}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Organizations</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-current rounded-sm" />
              ))}
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="w-4 h-4 flex flex-col gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-0.5 bg-current rounded" />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            {searchQuery || filterBy !== 'all' 
              ? 'No organizations match your search criteria' 
              : "You haven't joined any organizations yet"
            }
          </p>
          {!searchQuery && filterBy === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              Create your first organization
            </button>
          )}
        </div>
      ) : (
        /* Organizations Grid/List */
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredOrganizations.map((org) => {
            const roleBadge = getRoleBadge(org.userRole);
            const planBadge = getPlanBadge(org.billing?.plan);
            const RoleIcon = roleBadge.icon;

            return viewMode === 'grid' ? (
              /* Grid Card View */
              <div
                key={org.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOrganizationClick(org)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Building size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {org.visibility === 'public' ? (
                            <Globe size={12} className="text-green-600" />
                          ) : (
                            <Lock size={12} className="text-gray-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {org.visibility === 'public' ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${roleBadge.color}`}>
                        <RoleIcon size={10} />
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {org.description || 'No description available'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {org.memberCount}
                      </span>
                      <span>{org.teamCount} teams</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${planBadge.color}`}>
                      {planBadge.label}
                    </span>
                  </div>

                  {/* Actions */}
                  {(org.userRole === 'owner' || org.userRole === 'admin') && (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrganizationClick(org);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Settings"
                      >
                        <Settings size={16} />
                      </button>
                      {org.userRole === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrganization(org.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* List View */
              <div
                key={org.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOrganizationClick(org)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Building size={20} className="text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {org.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${roleBadge.color}`}>
                          <RoleIcon size={10} />
                          {roleBadge.label}
                        </span>
                        {org.visibility === 'public' ? (
                          <Globe size={12} className="text-green-600" />
                        ) : (
                          <Lock size={12} className="text-gray-500" />
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${planBadge.color}`}>
                          {planBadge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {org.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {org.memberCount} members
                        </span>
                        <span>{org.teamCount} teams</span>
                        <span>{org.repositoryCount} repositories</span>
                        {org.location && <span>{org.location}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {(org.userRole === 'owner' || org.userRole === 'admin') && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrganizationClick(org);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Settings"
                      >
                        <Settings size={16} />
                      </button>
                      {org.userRole === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrganization(org.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateOrganization={handleCreateOrganization}
      />

      {/* Organization Details Modal */}
      <OrganizationDetailsModal
        isOpen={selectedOrgId !== null}
        onClose={() => setSelectedOrgId(null)}
        organization={selectedOrganization}
      />
    </div>
  );
};

export default OrganizationsPage;