import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { 
  Palette, 
  Image, 
  Type, 
  Settings,
  X,
  Download,
  Upload,
  RotateCcw,
  Check
} from 'lucide-react';

const ThemeCustomizer = ({ isOpen, onClose }) => {
  const { 
    theme, 
    setThemePreset, 
    updateBranding, 
    updateColors, 
    resetTheme, 
    themePresets 
  } = useTheme();
  
  const [activeTab, setActiveTab] = useState('presets');
  const [localBranding, setLocalBranding] = useState(theme.branding);
  const [customColors, setCustomColors] = useState(theme.colors.primary);

  if (!isOpen) return null;

  const handleBrandingChange = (field, value) => {
    const newBranding = { ...localBranding, [field]: value };
    setLocalBranding(newBranding);
    updateBranding(newBranding);
  };

  const handleColorChange = (shade, color) => {
    const newColors = { ...customColors, [shade]: color };
    setCustomColors(newColors);
    updateColors({ primary: newColors });
  };

  const handlePresetSelect = (presetKey) => {
    setThemePreset(presetKey);
    setLocalBranding(themePresets[presetKey].branding);
    setCustomColors(themePresets[presetKey].colors.primary);
  };

  const exportTheme = () => {
    const themeData = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.branding.appName.toLowerCase()}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTheme = JSON.parse(e.target.result);
          // Use the setTheme function from context
          updateBranding(importedTheme.branding);
          updateColors(importedTheme.colors);
          setLocalBranding(importedTheme.branding);
          setCustomColors(importedTheme.colors.primary);
        } catch (error) {
          alert('Failed to import theme file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Palette size={20} />
            Theme Customizer
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
              {[
                { id: 'presets', label: 'Theme Presets', icon: Palette },
                { id: 'branding', label: 'Branding', icon: Type },
                { id: 'colors', label: 'Colors', icon: Palette },
                { id: 'import-export', label: 'Import/Export', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? 'bg-(--color-primary-100) text-(--color-primary-700)'
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
            {activeTab === 'presets' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose a Theme Preset</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(themePresets).map(([key, preset]) => (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-(--color-primary-300) transition-colors"
                      onClick={() => handlePresetSelect(key)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{preset.name}</h4>
                        {theme.branding.appName === preset.branding.appName && (
                          <Check size={16} className="text-green-600" />
                        )}
                      </div>
                      <div className="flex space-x-2 mb-3">
                        {Object.values(preset.colors.primary).slice(4, 7).map((color, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{preset.branding.appName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Branding Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name
                    </label>
                    <input
                      type="text"
                      value={localBranding.appName}
                      onChange={(e) => handleBrandingChange('appName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                      placeholder="Enter application name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={localBranding.tagline}
                      onChange={(e) => handleBrandingChange('tagline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                      placeholder="Enter tagline"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={localBranding.logoUrl || ''}
                      onChange={(e) => handleBrandingChange('logoUrl', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                      placeholder="Enter logo URL (leave empty for text logo)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use text logo. Recommended size: 200x50px
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Favicon URL
                    </label>
                    <input
                      type="url"
                      value={localBranding.faviconUrl}
                      onChange={(e) => handleBrandingChange('faviconUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                      placeholder="Enter favicon URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended format: .ico, .png (32x32px)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colors' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Primary Color Palette</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(customColors).map(([shade, color]) => (
                    <div key={shade} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-10 h-10 rounded-lg border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            {shade}
                          </label>
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(shade, e.target.value)}
                            className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'import-export' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Import/Export Theme</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Export Current Theme</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Download your current theme configuration as a JSON file.
                    </p>
                    <button
                      onClick={exportTheme}
                      className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
                    >
                      <Download size={16} />
                      Export Theme
                    </button>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Import Theme</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload a JSON theme file to apply a custom theme.
                    </p>
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <Upload size={16} />
                      Import Theme
                      <input
                        type="file"
                        accept=".json"
                        onChange={importTheme}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Reset to Default</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Reset all theme settings to the default configuration.
                    </p>
                    <button
                      onClick={resetTheme}
                      className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <RotateCcw size={16} />
                      Reset Theme
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;