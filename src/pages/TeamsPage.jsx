import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  Shield, 
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { 
  fetchTeams, 
  createTeam,
  deleteTeam,
  selectAllTeams,
  selectTeamsLoading,
  selectTeamsError,
  clearTeamsError
} from '../store/slices/teamsSlice.js';
import CreateTeamModal from '../components/teams/CreateTeamModal.jsx';
import TeamDetailsModal from '../components/teams/TeamDetailsModal.jsx';
import InviteTeamMemberModal from '../components/teams/InviteTeamMemberModal.jsx';

const TeamsPage = () => {
  const dispatch = useDispatch();
  const teams = useSelector(selectAllTeams);
  const loading = useSelector(selectTeamsLoading);
  const error = useSelector(selectTeamsError);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showTeamMenu, setShowTeamMenu] = useState(null);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  const handleCreateTeam = async (teamData) => {
    try {
      await dispatch(createTeam(teamData)).unwrap();
      setCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await dispatch(deleteTeam(teamId)).unwrap();
      } catch (err) {
        console.error('Failed to delete team:', err);
      }
    }
  };

  const handleViewTeamDetails = (team) => {
    setSelectedTeam(team);
    setDetailsModalOpen(true);
    setShowTeamMenu(null);
  };

  const handleInviteMembers = (team) => {
    setSelectedTeam(team);
    setInviteModalOpen(true);
    setShowTeamMenu(null);
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    // TODO: Filter by user's role in team once we have that data
    return matchesSearch;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-(--color-primary-100) text-(--color-primary-800)';
      case 'member': return 'bg-(--color-success-light) text-(--color-success-dark)';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--color-primary-600) mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teams</h1>
        <p className="text-gray-600">Collaborate with your team members on notebooks and projects</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => dispatch(clearTeamsError())}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-primary-500)"
            >
              <option value="all">All Teams</option>
              <option value="owner">My Teams</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          {/* Create Team Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
          >
            <Plus size={20} />
            Create Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No teams found' : 'No teams yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : 'Create your first team to start collaborating'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
              >
                <Plus size={20} />
                Create Team
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <div className="flex gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(team.userRole || 'member')}`}>
                          {team.userRole || 'Member'}
                        </span>
                        {team.ownerName && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Owner: {team.ownerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTeamMenu(showTeamMenu === team.id ? null : team.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {showTeamMenu === team.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleViewTeamDetails(team)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Settings size={16} />
                          Team Settings
                        </button>
                        <button
                          onClick={() => handleInviteMembers(team)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Invite Members
                        </button>
                        {(team.userRole === 'owner' || team.userRole === 'admin') && (
                          <>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Delete Team
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {team.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {team.memberCount || 1} members
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={16} />
                      {team.notebookCount || 0} notebooks
                    </span>
                  </div>
                </div>

                {/* Manage Team Button */}
                <button
                  onClick={() => handleViewTeamDetails(team)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Manage Team
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateTeam={handleCreateTeam}
      />

      {selectedTeam && (
        <>
          <TeamDetailsModal
            isOpen={detailsModalOpen}
            onClose={() => {
              setDetailsModalOpen(false);
              setSelectedTeam(null);
            }}
            team={selectedTeam}
          />

          <InviteTeamMemberModal
            isOpen={inviteModalOpen}
            onClose={() => {
              setInviteModalOpen(false);
              setSelectedTeam(null);
            }}
            team={selectedTeam}
          />
        </>
      )}
    </div>
  );
};

export default TeamsPage;