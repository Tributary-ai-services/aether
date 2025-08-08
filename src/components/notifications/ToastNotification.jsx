import React from 'react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  X,
  Pause,
  Play
} from 'lucide-react';

const ToastNotification = () => {
  const { 
    toastNotifications, 
    removeToastNotification, 
    notificationsPaused, 
    togglePauseNotifications 
  } = useNotifications();

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-600" />;
      case 'error': return <XCircle size={20} className="text-red-600" />;
      case 'info': return <Info size={20} className="text-blue-600" />;
      default: return <Info size={20} className="text-gray-600" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Only show toast notifications, no control bar
  if (toastNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Toast Notifications */}
      {toastNotifications.slice(0, 3).map((toast, index) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full ${getToastStyles(toast.type)} border rounded-lg shadow-lg p-4 animate-slide-in`}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {toast.title}
              </h4>
              <p className="text-sm text-gray-600">
                {toast.message}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {toast.source}
              </div>
            </div>
            <button
              onClick={() => removeToastNotification(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;