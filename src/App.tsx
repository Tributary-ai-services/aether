import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { useNavigation } from './context/NavigationContext.jsx';
import TabButton from './components/ui/TabButton.jsx';
import Logo from './components/ui/Logo.jsx';
import ThemeCustomizer from './components/ui/ThemeCustomizer.jsx';
import Settings from './components/ui/Settings.jsx';
import NotificationCenter from './components/notifications/NotificationCenter.jsx';
import ToastNotification from './components/notifications/ToastNotification.jsx';
import AuditTrail from './components/audit/AuditTrail.jsx';
import LeftNavigation from './components/navigation/LeftNavigation.jsx';
import NotebooksPage from './pages/NotebooksPage.jsx';
import AgentsPage from './pages/AgentsPage.jsx';
import WorkflowsPage from './pages/WorkflowsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import StreamingPage from './pages/StreamingPage.jsx';
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
  Shield
} from 'lucide-react';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { visibleTabs } = useNavigation();
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(true);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);

  // Get current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/notebooks') return 'documents';
    if (path === '/agents') return 'agents';
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
      'agents': visibleTabs.agents,
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
          'agents': '/agents',
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
      'agents': '/agents',
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

  return (
    <FilterProvider>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo size="default" />
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="text-white px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              Create New
            </button>
            
            {/* Audit Trail */}
            <button 
              onClick={() => setAuditTrailOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Audit Trail"
            >
              <Shield size={20} />
            </button>
            
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* Settings Icon */}
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <SettingsIcon size={20} />
            </button>
            
            {/* Profile/Login */}
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900">John Doe</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden md:block" />
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
          {visibleTabs.agents && (
            <TabButton 
              id="agents" 
              label="Agents" 
              icon={Bot} 
              isActive={activeTab === 'agents'} 
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
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/streaming" element={<StreamingPage />} />
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
      
      {/* Toast Notifications */}
      <ToastNotification />
    </div>
    </FilterProvider>
  );
};

export default App;
