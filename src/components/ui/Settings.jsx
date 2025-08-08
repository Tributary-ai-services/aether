import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNavigation } from '../../context/NavigationContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { 
  Settings as SettingsIcon,
  X,
  Palette,
  Monitor,
  Sun,
  Moon,
  Bell,
  Shield,
  Globe,
  User,
  Database,
  Download,
  HelpCircle,
  Layout
} from 'lucide-react';

const Settings = ({ isOpen, onClose, onOpenThemeCustomizer }) => {
  const { theme, updateBranding, setThemeMode } = useTheme();
  const { visibleTabs, setTabVisibility, resetToDefaults } = useNavigation();
  const { notificationsPaused, togglePauseNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('general');
  const [currentMode, setCurrentMode] = useState(theme.mode || 'light');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    desktop: true
  });

  if (!isOpen) return null;

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    setThemeMode(mode);
  };

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const settingsTabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'navigation', label: 'Navigation', icon: Layout },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
    { id: 'data', label: 'Data', icon: Database }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon size={20} />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {settingsTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European)</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable beta features</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'navigation' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Navigation Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Visible Tabs</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose which navigation tabs are visible in the main menu.
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">Notebooks</span>
                          <p className="text-sm text-gray-500">Document processing and analysis</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleTabs.notebooks}
                          onChange={() => setTabVisibility('notebooks', !visibleTabs.notebooks)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">Agents</span>
                          <p className="text-sm text-gray-500">AI agents and automation</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleTabs.agents}
                          onChange={() => setTabVisibility('agents', !visibleTabs.agents)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">Workflows</span>
                          <p className="text-sm text-gray-500">Workflow automation and pipelines</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleTabs.workflows}
                          onChange={() => setTabVisibility('workflows', !visibleTabs.workflows)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">ML/Analytics</span>
                          <p className="text-sm text-gray-500">Machine learning and data analytics</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleTabs.analytics}
                          onChange={() => setTabVisibility('analytics', !visibleTabs.analytics)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">Community</span>
                          <p className="text-sm text-gray-500">Shared resources and collaboration</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleTabs.community}
                          onChange={() => setTabVisibility('community', !visibleTabs.community)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">Live Streams</span>
                          <p className="text-sm text-gray-500">Real-time data streaming and events</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={visibleTabs.streaming}
                          onChange={() => setTabVisibility('streaming', !visibleTabs.streaming)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <button
                      onClick={resetToDefaults}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reset to Defaults
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Restore default navigation settings (Notebooks, Agents, and Community visible)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
                <div className="space-y-6">
                  {/* Theme Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Theme Mode
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          currentMode === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleModeChange('light')}
                      >
                        <Sun size={24} className="mx-auto mb-2 text-yellow-500" />
                        <div className="text-sm font-medium">Light</div>
                      </button>
                      <button
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          currentMode === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleModeChange('dark')}
                      >
                        <Moon size={24} className="mx-auto mb-2 text-blue-600" />
                        <div className="text-sm font-medium">Dark</div>
                      </button>
                      <button
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          currentMode === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleModeChange('system')}
                      >
                        <Monitor size={24} className="mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium">System</div>
                      </button>
                    </div>
                  </div>

                  {/* White Label Theming */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        White Label Theming
                      </label>
                      <button
                        onClick={onOpenThemeCustomizer}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Palette size={16} />
                        Customize Theme
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Customize your platform's branding, colors, and logo to match your organization.
                    </p>
                    
                    {/* Current Theme Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-8 h-8 rounded" 
                          style={{ backgroundColor: 'var(--color-primary-600)' }}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-900">{theme.branding.appName}</div>
                          <div className="text-sm text-gray-500">{theme.branding.tagline}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: 'var(--color-primary-500)' }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: 'var(--color-secondary-500)' }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: 'var(--color-accent-500)' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-6">
                  {/* Live Notifications Control */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Live Notifications</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">Toast Notifications</span>
                          <p className="text-sm text-gray-500">Show real-time notifications as popups</p>
                        </div>
                        <button
                          onClick={togglePauseNotifications}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            notificationsPaused 
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {notificationsPaused ? 'Resume' : 'Pause'}
                        </button>
                      </label>
                      {notificationsPaused && (
                        <p className="text-sm text-orange-600 mt-2">
                          Toast notifications are currently paused
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Email notifications</span>
                        <input 
                          type="checkbox" 
                          checked={notifications.email}
                          onChange={() => handleNotificationChange('email')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Push notifications</span>
                        <input 
                          type="checkbox" 
                          checked={notifications.push}
                          onChange={() => handleNotificationChange('push')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Desktop notifications</span>
                        <input 
                          type="checkbox" 
                          checked={notifications.desktop}
                          onChange={() => handleNotificationChange('desktop')}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Authentication</h4>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="font-medium text-gray-900">Change Password</div>
                        <div className="text-sm text-gray-500">Update your account password</div>
                      </button>
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-500">Add an extra layer of security</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input 
                      type="text" 
                      defaultValue="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      defaultValue="john.doe@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Export Data</h4>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download size={16} />
                      Export All Data
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Download a copy of all your data in JSON format
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-red-900 mb-3">Danger Zone</h4>
                    <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                      Delete Account
                    </button>
                    <p className="text-sm text-red-500 mt-2">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HelpCircle size={16} />
              Need help? Check our documentation
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;