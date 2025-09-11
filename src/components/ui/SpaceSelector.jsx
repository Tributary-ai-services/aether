import React, { useState } from 'react';
import { useSpace } from '../../contexts/SpaceContext.jsx';
import ManageSpacesModal from '../modals/ManageSpacesModal.jsx';
import {
  ChevronDown,
  User,
  Building2,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  Settings
} from 'lucide-react';

const SpaceSelector = ({ className = "" }) => {
  const {
    currentSpace,
    availableSpaces,
    loading,
    error,
    setCurrentSpace,
    switchToPersonalSpace,
    switchToOrganizationSpace,
    clearError,
    loadAvailableSpaces,
    SPACE_TYPES
  } = useSpace();

  const [isOpen, setIsOpen] = useState(false);
  const [showManageSpaces, setShowManageSpaces] = useState(false);

  const handleSpaceSelect = (space) => {
    setCurrentSpace(space);
    setIsOpen(false);
    clearError();
  };

  const getSpaceIcon = (spaceType) => {
    switch (spaceType) {
      case SPACE_TYPES.PERSONAL:
        return <User size={16} className="text-blue-600" />;
      case SPACE_TYPES.ORGANIZATION:
        return <Building2 size={16} className="text-green-600" />;
      default:
        return <Globe size={16} className="text-gray-500" />;
    }
  };

  const getSpaceTypeLabel = (spaceType) => {
    switch (spaceType) {
      case SPACE_TYPES.PERSONAL:
        return 'Personal';
      case SPACE_TYPES.ORGANIZATION:
        return 'Organization';
      default:
        return 'Unknown';
    }
  };

  const getAllAvailableSpaces = () => {
    const spaces = [];
    
    if (availableSpaces.personal_space) {
      spaces.push(availableSpaces.personal_space);
    }
    
    if (availableSpaces.organization_spaces) {
      spaces.push(...availableSpaces.organization_spaces);
    }
    
    return spaces;
  };

  const availableSpacesList = getAllAvailableSpaces();

  if (loading && !currentSpace) {
    return (
      <div className={`flex items-center space-x-2 p-2 ${className}`}>
        <Loader2 size={16} className="animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading spaces...</span>
      </div>
    );
  }

  if (error && availableSpacesList.length === 0) {
    return (
      <div className={`flex items-center space-x-2 p-2 text-red-600 ${className}`}>
        <AlertCircle size={16} />
        <span className="text-sm">Failed to load spaces</span>
      </div>
    );
  }

  if (availableSpacesList.length === 0) {
    return (
      <div className={`flex items-center justify-between p-2 text-gray-500 ${className}`}>
        <div className="flex items-center space-x-2">
          <Globe size={16} />
          <span className="text-sm">No spaces available</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            loadAvailableSpaces();
          }}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Space Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <div className="flex items-center space-x-2 min-w-0">
          {currentSpace ? getSpaceIcon(currentSpace.space_type) : <Globe size={16} className="text-gray-400" />}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {currentSpace ? currentSpace.space_name : 'Select Space'}
            </div>
            {currentSpace && (
              <div className="text-xs text-gray-500">
                {getSpaceTypeLabel(currentSpace.space_type)}
                {currentSpace.user_role && ` • ${currentSpace.user_role}`}
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-80 overflow-y-auto">
            {error && (
              <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div className="py-1">
              {/* Personal Space */}
              {availableSpaces.personal_space && (
                <>
                  <div className="px-3 py-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal
                    </div>
                  </div>
                  <button
                    onClick={() => handleSpaceSelect(availableSpaces.personal_space)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <User size={16} className="text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {availableSpaces.personal_space.space_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Your personal workspace
                        </div>
                      </div>
                    </div>
                    {currentSpace?.space_id === availableSpaces.personal_space.space_id && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </button>
                </>
              )}

              {/* Organization Spaces */}
              {availableSpaces.organization_spaces.length > 0 && (
                <>
                  {availableSpaces.personal_space && <div className="border-t border-gray-100 my-1" />}
                  
                  <div className="px-3 py-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizations
                    </div>
                  </div>
                  
                  {availableSpaces.organization_spaces.map((orgSpace) => (
                    <button
                      key={orgSpace.space_id}
                      onClick={() => handleSpaceSelect(orgSpace)}
                      className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Building2 size={16} className="text-green-600" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {orgSpace.space_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {orgSpace.user_role && `${orgSpace.user_role} • `}
                            {orgSpace.permissions?.length > 0 
                              ? `${orgSpace.permissions.join(', ')}`
                              : 'Organization workspace'
                            }
                          </div>
                        </div>
                      </div>
                      {currentSpace?.space_id === orgSpace.space_id && (
                        <Check size={16} className="text-green-600" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManageSpaces(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                <span>Manage Spaces</span>
                <Settings size={14} className="text-gray-400" />
              </button>
              <div className="px-3 pt-2 text-xs text-gray-400">
                {availableSpacesList.length} space{availableSpacesList.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Manage Spaces Modal */}
      {showManageSpaces && (
        <ManageSpacesModal onClose={() => setShowManageSpaces(false)} />
      )}
    </div>
  );
};

export default SpaceSelector;