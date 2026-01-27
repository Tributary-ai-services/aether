import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from './store/hooks.js';
import { FilterProvider } from './context/FilterContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { useNavigation } from './context/NavigationContext.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import {
  openModal,
  closeModal,
  selectModals,
  fetchOnboardingStatus,
  markOnboardingComplete,
  openOnboardingModal,
  closeOnboardingModal,
  selectOnboardingModal,
  selectShouldAutoTrigger,
  selectOnboardingLoading,
  fetchSummary as fetchComplianceSummary,
  selectUnacknowledgedCount
} from './store';
import { createNotebook } from './store/slices/notebooksSlice.js';
import TabButton from './components/ui/TabButton.jsx';
import Logo from './components/ui/Logo.jsx';
import ThemeCustomizer from './components/ui/ThemeCustomizer.jsx';
import Settings from './components/ui/Settings.jsx';
import NotificationCenter from './components/notifications/NotificationCenter.jsx';
import ToastNotification from './components/notifications/ToastNotification.jsx';
import ComplianceToast from './components/notifications/ComplianceToast.jsx';
import PermissionErrorToast from './components/ui/PermissionErrorToast.jsx';
import AuditTrail from './components/audit/AuditTrail.jsx';
import CompliancePanel from './components/compliance/CompliancePanel.jsx';
import LeftNavigation from './components/navigation/LeftNavigation.jsx';
import NotebooksPage from './pages/NotebooksPage.jsx';
import AgentBuilderPage from './pages/AgentBuilderPage.jsx';
import WorkflowsPage from './pages/WorkflowsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import StreamingPage from './pages/StreamingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import OrganizationsPage from './pages/OrganizationsPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import CreateNotebookModal from './components/notebooks/CreateNotebookModal.jsx';
import SpaceSelector from './components/ui/SpaceSelector.jsx';
import OnboardingModal from './components/onboarding/OnboardingModal.jsx';
import {
  BookOpen,
  Users,
  Bot,
  Workflow,
  Brain,
  Radio,
  Settings as SettingsIcon,
  User,
  ChevronDown,
  Search,
  Calendar,
  Tag,
  Folder,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image,
  Video,
  Mic,
  FileText,
  Activity,
  Shield,
  Sparkles
} from 'lucide-react';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { visibleTabs } = useNavigation();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const modals = useAppSelector(selectModals);
  const isOnboardingOpen = useAppSelector(selectOnboardingModal);
  const shouldAutoTrigger = useAppSelector(selectShouldAutoTrigger);
  const isOnboardingLoading = useAppSelector(selectOnboardingLoading);
  const unacknowledgedViolationsCount = useAppSelector(selectUnacknowledgedCount);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(true);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [compliancePanelOpen, setCompliancePanelOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch onboarding status on mount
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      dispatch(fetchOnboardingStatus());
    }
  }, [isAuthenticated, isLoading, dispatch]);

  // Fetch compliance summary on mount to show violation badge
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      dispatch(fetchComplianceSummary());
    }
  }, [isAuthenticated, isLoading, dispatch]);

  // Auto-trigger onboarding for new users
  useEffect(() => {
    // Wait for both auth and onboarding status to load before auto-triggering
    // Also check that the modal is not already open to prevent re-triggering
    if (isAuthenticated && !isLoading && !isOnboardingLoading && shouldAutoTrigger && !isOnboardingOpen) {
      // Delay slightly to allow initial page load
      const timer = setTimeout(() => {
        dispatch(openOnboardingModal());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, isOnboardingLoading, shouldAutoTrigger, isOnboardingOpen, dispatch]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if the click is outside the user menu
      const userMenuElement = document.getElementById('user-menu-dropdown');
      const userMenuButton = document.getElementById('user-menu-button');

      if (userMenuElement && !userMenuElement.contains(e.target) &&
          userMenuButton && !userMenuButton.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      // Add a small delay to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);

      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  // Get current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/notebooks') return 'documents';
    if (path === '/agent-builder') return 'agent-builder';
    if (path === '/workflows') return 'workflows';
    if (path === '/analytics') return 'analytics';
    if (path === '/community') return 'community';
    if (path === '/streaming') return 'streaming';
    return 'documents';
  };

  const activeTab = getCurrentTab();

  // Check if current tab is visible, redirect to first visible tab if not
  useEffect(() => {
    const tabVisibilityMap = {
      'documents': visibleTabs.notebooks,
      'agent-builder': visibleTabs['agent-builder'],
      'workflows': visibleTabs.workflows,
      'analytics': visibleTabs.analytics,
      'community': visibleTabs.community,
      'streaming': visibleTabs.streaming
    };

    if (!tabVisibilityMap[activeTab]) {
      // Find first visible tab
      const firstVisibleTab = Object.entries(tabVisibilityMap).find(([tab, visible]) => visible);
      if (firstVisibleTab) {
        const routes = {
          'documents': '/notebooks',
          'agent-builder': '/agent-builder',
          'workflows': '/workflows',
          'analytics': '/analytics',
          'community': '/community',
          'streaming': '/streaming'
        };
        navigate(routes[firstVisibleTab[0]]);
      }
    }
  }, [activeTab, visibleTabs, navigate]);

  const handleTabClick = (tabId) => {
    const routes = {
      'documents': '/notebooks',
      'agent-builder': '/agent-builder',
      'workflows': '/workflows',
      'analytics': '/analytics',
      'community': '/community',
      'streaming': '/streaming'
    };
    navigate(routes[tabId] || '/notebooks');
    
    // Reset to list view when clicking Notebooks tab
    if (tabId === 'documents') {
      // Trigger event that NotebooksPage can listen to
      window.dispatchEvent(new CustomEvent('resetToListView'));
    }
  };
  
  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    // Don't navigate - let the auth state change handle the redirect
  };
  
  // Handle Create New button click based on current page
  const handleCreateNew = () => {
    const path = location.pathname;
    if (path === '/' || path === '/notebooks') {
      dispatch(openModal('createNotebook'));
    } else if (path === '/agent-builder') {
      dispatch(openModal('createAgent'));
    } else if (path === '/teams') {
      // Navigate to teams page if not already there, the teams page has its own create button
      navigate('/teams');
    } else {
      // Default to creating a notebook for other pages
      dispatch(openModal('createNotebook'));
    }
  };
  
  // Handle notebook creation
  const handleCreateNotebook = async (notebookData) => {
    try {
      await dispatch(createNotebook(notebookData)).unwrap();
      dispatch(closeModal('createNotebook'));
    } catch (error) {
      console.error('Failed to create notebook:', error);
    }
  };
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="large" />
          <div className="mt-4 text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }
  
  // Show login/signup pages if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <FilterProvider>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo size="default" />
            <SpaceSelector className="min-w-[200px]" />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCreateNew}
              className="text-white px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              Create New
            </button>

            {/* Compliance Violations */}
            <button
              onClick={() => setCompliancePanelOpen(true)}
              className={`relative p-2 transition-colors ${
                unacknowledgedViolationsCount > 0
                  ? 'text-red-500 hover:text-red-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={unacknowledgedViolationsCount > 0
                ? `${unacknowledgedViolationsCount} Unacknowledged Violations`
                : 'Compliance Violations'}
            >
              <Shield size={20} />
              {unacknowledgedViolationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unacknowledgedViolationsCount > 99 ? '99+' : unacknowledgedViolationsCount}
                </span>
              )}
            </button>
            
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* Profile/Logout */}
            <div className="relative">
              <div 
                id="user-menu-button"
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user?.full_name || user?.email || 'User'}</div>
                  <div className="text-xs text-gray-500">{user?.status || 'User'}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400 hidden md:block" />
              </div>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div id="user-menu-dropdown" className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        dispatch(openOnboardingModal());
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Sparkles size={16} className="mr-2 text-blue-600" />
                      Getting Started
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setSettingsOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-2">
          {visibleTabs.notebooks && (
            <TabButton 
              id="documents" 
              label="Notebooks" 
              icon={BookOpen} 
              isActive={activeTab === 'documents'} 
              onClick={handleTabClick} 
            />
          )}
          {visibleTabs['agent-builder'] && (
            <TabButton 
              id="agent-builder" 
              label="Agent Builder" 
              icon={Bot} 
              isActive={activeTab === 'agent-builder'} 
              onClick={handleTabClick} 
            />
          )}
          {visibleTabs.workflows && (
            <TabButton 
              id="workflows" 
              label="Workflows" 
              icon={Workflow} 
              isActive={activeTab === 'workflows'} 
              onClick={handleTabClick} 
            />
          )}
          {visibleTabs.analytics && (
            <TabButton 
              id="analytics" 
              label="ML/Analytics" 
              icon={Brain} 
              isActive={activeTab === 'analytics'} 
              onClick={handleTabClick} 
            />
          )}
          {visibleTabs.community && (
            <TabButton 
              id="community" 
              label="Community" 
              icon={Users} 
              isActive={activeTab === 'community'} 
              onClick={handleTabClick} 
            />
          )}
          {visibleTabs.streaming && (
            <TabButton 
              id="streaming" 
              label="Live Streams" 
              icon={Radio} 
              isActive={activeTab === 'streaming'} 
              onClick={handleTabClick} 
            />
          )}
        </div>
      </nav>

      <div className="flex">
        <LeftNavigation 
          isCollapsed={leftNavCollapsed} 
          onToggleCollapse={() => setLeftNavCollapsed(!leftNavCollapsed)} 
        />

        {/* Main Content */}
        <main className="flex-1 px-6 py-8">
          <Routes>
            <Route path="/" element={<NotebooksPage />} />
            <Route path="/notebooks" element={<NotebooksPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/agent-builder" element={<AgentBuilderPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/streaming" element={<StreamingPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Routes>
        </main>
      </div>
      
      {/* Theme Customizer Modal */}
      <ThemeCustomizer 
        isOpen={themeCustomizerOpen} 
        onClose={() => setThemeCustomizerOpen(false)} 
      />
      
      {/* Settings Modal */}
      <Settings 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        onOpenThemeCustomizer={() => {
          setSettingsOpen(false);
          setThemeCustomizerOpen(true);
        }}
      />
      
      {/* Audit Trail Modal */}
      <AuditTrail
        isOpen={auditTrailOpen}
        onClose={() => setAuditTrailOpen(false)}
      />

      {/* Compliance Violations Panel */}
      <CompliancePanel
        isOpen={compliancePanelOpen}
        onClose={() => setCompliancePanelOpen(false)}
      />

      {/* Create Notebook Modal */}
      <CreateNotebookModal
        isOpen={modals?.createNotebook || false}
        onClose={() => dispatch(closeModal('createNotebook'))}
        onCreateNotebook={handleCreateNotebook}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => dispatch(closeOnboardingModal())}
        onComplete={() => dispatch(markOnboardingComplete())}
      />

      {/* Toast Notifications */}
      <ToastNotification />

      {/* Compliance Toast Notifications */}
      <ComplianceToast onOpenAuditTrail={() => setAuditTrailOpen(true)} />

      {/* Permission Error Toast (403 handling) */}
      <PermissionErrorToast />
      </div>
    </FilterProvider>
  );
};

export default App;
