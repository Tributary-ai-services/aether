import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft,
  Users,
  Settings,
  UserPlus,
  BookOpen,
  Calendar,
  Crown,
  Shield,
  Eye
} from 'lucide-react';
import { 
  fetchTeams,
  selectAllTeams,
  selectTeamsLoading,
  selectTeamsError 
} from '../store/slices/teamsSlice.js';
import TeamDetailsModal from '../components/teams/TeamDetailsModal.jsx';
import InviteTeamMemberModal from '../components/teams/InviteTeamMemberModal.jsx';

const TeamPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const teams = useSelector(selectAllTeams);
  const loading = useSelector(selectTeamsLoading);
  const error = useSelector(selectTeamsError);
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  // Find the team by ID
  const team = teams.find(t => t.id === teamId);
  
  useEffect(() => {
    if (teams.length === 0) {
      dispatch(fetchTeams());
    }
  }, [dispatch, teams.length]);
  
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      case 'member': return Users;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  if (loading && !team) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-primary-600) mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 text-red-700">
            <p>Error loading team: {error}</p>
          </div>
          <button
            onClick={() => navigate('/teams')}
            className="mt-4 text-(--color-primary-600) hover:text-(--color-primary-700)"
          >
            ← Back to Teams
          </button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Team not found</h3>
          <p className="text-gray-600 mb-6">The team you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/teams')}
            className="inline-flex items-center gap-2 text-(--color-primary-600) hover:text-(--color-primary-700)"
          >
            <ArrowLeft size={16} />
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(team.userRole);
  
  // Permission checks
  const canViewMembers = team?.userRole && ['owner', 'admin', 'member', 'viewer'].includes(team.userRole);
  const canManageTeam = team?.userRole === 'owner' || team?.userRole === 'admin';
  const canInviteMembers = team?.userRole === 'owner' || team?.userRole === 'admin';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/teams')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-600">Team Management</p>
        </div>
      </div>

      {/* Team Overview Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h2>
              <div className="flex gap-3 mb-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(team.userRole || 'member')}`}>
                  <RoleIcon size={12} />
                  {team.userRole || 'Member'}
                </span>
                {team.ownerName && (
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                    Owner: {team.ownerName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {team.memberCount || 1} members
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {team.notebookCount || 0} notebooks
                </span>
                {team.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canInviteMembers && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700)"
              >
                <UserPlus size={16} />
                Invite Members
              </button>
            )}
            <button
              onClick={() => setDetailsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Settings size={16} />
              {canManageTeam ? 'Manage Team' : 'View Team'}
            </button>
          </div>
        </div>
        
        {team.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-gray-700">{team.description}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${!canViewMembers ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${canViewMembers ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Users className={`${canViewMembers ? 'text-blue-600' : 'text-gray-400'}`} size={20} />
            </div>
            <h3 className="font-medium text-gray-900">Team Members</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {canViewMembers 
              ? 'View and manage team members, roles, and permissions.' 
              : 'You need to be a team member to view the member list.'
            }
          </p>
          {canViewMembers ? (
            <button
              onClick={() => setDetailsModalOpen(true)}
              className="text-(--color-primary-600) hover:text-(--color-primary-700) text-sm font-medium"
            >
              View Members →
            </button>
          ) : (
            <button
              disabled
              className="text-gray-400 text-sm font-medium cursor-not-allowed"
            >
              Access Restricted
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="text-green-600" size={20} />
            </div>
            <h3 className="font-medium text-gray-900">Notebooks</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Access shared notebooks and collaborative documents.</p>
          <button
            onClick={() => navigate('/notebooks')}
            className="text-(--color-primary-600) hover:text-(--color-primary-700) text-sm font-medium"
          >
            View Notebooks →
          </button>
        </div>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${!canManageTeam ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${canManageTeam ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <Settings className={`${canManageTeam ? 'text-purple-600' : 'text-gray-400'}`} size={20} />
            </div>
            <h3 className="font-medium text-gray-900">Team Settings</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {canManageTeam 
              ? 'Configure team preferences, permissions, and visibility.' 
              : 'Only team owners and admins can modify settings.'
            }
          </p>
          {canManageTeam ? (
            <button
              onClick={() => setDetailsModalOpen(true)}
              className="text-(--color-primary-600) hover:text-(--color-primary-700) text-sm font-medium"
            >
              Open Settings →
            </button>
          ) : (
            <button
              onClick={() => setDetailsModalOpen(true)}
              className="text-(--color-primary-600) hover:text-(--color-primary-700) text-sm font-medium"
            >
              View Settings →
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <TeamDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        team={team}
      />
      
      <InviteTeamMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        team={team}
      />
    </div>
  );
};

export default TeamPage;