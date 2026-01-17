import React, { useState } from 'react';
import { 
  Users, 
  Code, 
  Database, 
  Brain, 
  Rocket, 
  Shield, 
  Zap, 
  Target, 
  Layers, 
  Globe,
  Heart,
  Star,
  Award,
  Briefcase,
  Coffee,
  Lightbulb,
  Puzzle,
  Camera,
  Music,
  Palette,
  Upload,
  X
} from 'lucide-react';

const IconPicker = ({ value, onChange, onClose }) => {
  const [activeTab, setActiveTab] = useState('icons');
  const [uploadedIcon, setUploadedIcon] = useState(null);

  const predefinedIcons = [
    { id: 'users', icon: Users, label: 'Team', color: 'text-blue-600' },
    { id: 'code', icon: Code, label: 'Development', color: 'text-green-600' },
    { id: 'database', icon: Database, label: 'Data', color: 'text-purple-600' },
    { id: 'brain', icon: Brain, label: 'AI/ML', color: 'text-pink-600' },
    { id: 'rocket', icon: Rocket, label: 'Innovation', color: 'text-orange-600' },
    { id: 'shield', icon: Shield, label: 'Security', color: 'text-red-600' },
    { id: 'zap', icon: Zap, label: 'Performance', color: 'text-yellow-600' },
    { id: 'target', icon: Target, label: 'Goals', color: 'text-indigo-600' },
    { id: 'layers', icon: Layers, label: 'Architecture', color: 'text-gray-600' },
    { id: 'globe', icon: Globe, label: 'Global', color: 'text-cyan-600' },
    { id: 'heart', icon: Heart, label: 'Culture', color: 'text-red-500' },
    { id: 'star', icon: Star, label: 'Excellence', color: 'text-amber-500' },
    { id: 'award', icon: Award, label: 'Achievement', color: 'text-yellow-500' },
    { id: 'briefcase', icon: Briefcase, label: 'Business', color: 'text-slate-600' },
    { id: 'coffee', icon: Coffee, label: 'Casual', color: 'text-amber-700' },
    { id: 'lightbulb', icon: Lightbulb, label: 'Ideas', color: 'text-yellow-400' },
    { id: 'puzzle', icon: Puzzle, label: 'Problem Solving', color: 'text-teal-600' },
    { id: 'camera', icon: Camera, label: 'Creative', color: 'text-violet-600' },
    { id: 'music', icon: Music, label: 'Entertainment', color: 'text-purple-500' },
    { id: 'palette', icon: Palette, label: 'Design', color: 'text-pink-500' },
  ];

  const handleIconSelect = (iconId) => {
    onChange({ type: 'predefined', value: iconId });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setUploadedIcon(imageUrl);
        onChange({ type: 'custom', value: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const isSelected = (iconId) => {
    return value?.type === 'predefined' && value?.value === iconId;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Choose Team Icon</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('icons')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'icons'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Predefined Icons
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Upload Custom
        </button>
      </div>

      {/* Content */}
      {activeTab === 'icons' && (
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {predefinedIcons.map((iconItem) => {
            const Icon = iconItem.icon;
            return (
              <button
                key={iconItem.id}
                onClick={() => handleIconSelect(iconItem.id)}
                className={`p-3 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                  isSelected(iconItem.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                title={iconItem.label}
              >
                <Icon size={24} className={iconItem.color} />
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Upload a custom icon for your team
            </p>
            <p className="text-xs text-gray-500 mb-4">
              PNG, JPG up to 2MB. Recommended: 64x64px
            </p>
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              <Upload size={16} className="mr-2" />
              Choose File
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Show uploaded preview */}
          {uploadedIcon && (
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <img
                src={uploadedIcon}
                alt="Uploaded icon"
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              />
            </div>
          )}

          {/* Show current custom icon if exists */}
          {value?.type === 'custom' && !uploadedIcon && (
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <img
                src={value.value}
                alt="Current custom icon"
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// Helper component to render team icon
export const TeamIcon = ({ icon, size = 20, className = '' }) => {
  if (!icon) {
    return <Users size={size} className={`text-gray-500 ${className}`} />;
  }

  if (icon.type === 'custom') {
    return (
      <img
        src={icon.value}
        alt="Team icon"
        className={`rounded object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (icon.type === 'predefined') {
    const predefinedIcons = {
      users: Users,
      code: Code,
      database: Database,
      brain: Brain,
      rocket: Rocket,
      shield: Shield,
      zap: Zap,
      target: Target,
      layers: Layers,
      globe: Globe,
      heart: Heart,
      star: Star,
      award: Award,
      briefcase: Briefcase,
      coffee: Coffee,
      lightbulb: Lightbulb,
      puzzle: Puzzle,
      camera: Camera,
      music: Music,
      palette: Palette,
    };

    const iconColors = {
      users: 'text-blue-600',
      code: 'text-green-600',
      database: 'text-purple-600',
      brain: 'text-pink-600',
      rocket: 'text-orange-600',
      shield: 'text-red-600',
      zap: 'text-yellow-600',
      target: 'text-indigo-600',
      layers: 'text-gray-600',
      globe: 'text-cyan-600',
      heart: 'text-red-500',
      star: 'text-amber-500',
      award: 'text-yellow-500',
      briefcase: 'text-slate-600',
      coffee: 'text-amber-700',
      lightbulb: 'text-yellow-400',
      puzzle: 'text-teal-600',
      camera: 'text-violet-600',
      music: 'text-purple-500',
      palette: 'text-pink-500',
    };

    const IconComponent = predefinedIcons[icon.value] || Users;
    const iconColor = iconColors[icon.value] || 'text-gray-500';

    return <IconComponent size={size} className={`${iconColor} ${className}`} />;
  }

  return <Users size={size} className={`text-gray-500 ${className}`} />;
};

export default IconPicker;