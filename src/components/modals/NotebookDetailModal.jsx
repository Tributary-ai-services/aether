import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Comments from '../collaboration/Comments.jsx';
import ShareDialog from '../collaboration/ShareDialog.jsx';
import { 
  Heart, 
  Share2, 
  Shield, 
  Users, 
  Calendar, 
  Eye,
  Download,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  Tag,
  FileText,
  Folder
} from 'lucide-react';

const NotebookDetailModal = ({ isOpen, onClose, notebook, onOpenSettings, onOpenExport, onViewContents }) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  if (!notebook) return null;

  const recentActivity = [
    { id: 1, action: 'Document processed', file: 'contract_v2.pdf', time: '2 hours ago', status: 'success' },
    { id: 2, action: 'Signature verified', file: 'agreement.pdf', time: '4 hours ago', status: 'success' },
    { id: 3, action: 'OCR completed', file: 'scan_001.jpg', time: '6 hours ago', status: 'success' },
    { id: 4, action: 'Processing error', file: 'corrupted.pdf', time: '1 day ago', status: 'error' }
  ];

  const collaborators = [
    { id: 1, name: 'John Doe', role: 'Owner', avatar: 'JD', lastActive: '2 min ago' },
    { id: 2, name: 'Sarah Smith', role: 'Editor', avatar: 'SS', lastActive: '1 hour ago' },
    { id: 3, name: 'Mike Johnson', role: 'Viewer', avatar: 'MJ', lastActive: '2 days ago' }
  ];

  const processingStats = [
    { label: 'Success Rate', value: '98.2%', color: 'text-green-600' },
    { label: 'Avg Processing Time', value: '2.3s', color: 'text-blue-600' },
    { label: 'Total Size', value: '1.2 GB', color: 'text-purple-600' },
    { label: 'Last Updated', value: '3 hours ago', color: 'text-gray-600' }
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={notebook.name}
      size="large"
    >
      <div className="p-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{notebook.documentCount || 0}</div>
            <div className="text-sm text-blue-600">Documents</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{notebook.children?.length || 0}</div>
            <div className="text-sm text-purple-600">Sub-notebooks</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {notebook.visibility === 'public' && <Globe className="text-green-600" size={20} />}
              {notebook.visibility === 'shared' && <Users className="text-blue-600" size={20} />}
              {notebook.visibility === 'private' && <Lock className="text-gray-600" size={20} />}
            </div>
            <div className="text-sm text-gray-600 capitalize">{notebook.visibility}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-orange-600">
              {new Date(notebook.updatedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-orange-600">Last Updated</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Tags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 mb-4">
                {notebook.description || 'No description available'}
              </p>
              
              {notebook.tags && notebook.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex gap-2 flex-wrap">
                    {notebook.tags.map(tag => (
                      <div key={tag} className="px-3 py-1 rounded-full text-sm flex items-center gap-1 bg-gray-100 text-gray-700">
                        <Tag size={12} />
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Processing Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                {processingStats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">{stat.label}</div>
                    <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {activity.status === 'success' ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                      <div className="text-xs text-gray-500">{activity.file}</div>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    onClose();
                    onViewContents?.(notebook);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) transition-colors"
                >
                  <Eye size={16} />
                  View Contents
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    onOpenSettings?.(notebook);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit size={16} />
                  Edit Settings
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    onOpenExport?.(notebook);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download size={16} />
                  Export Data
                </button>
                <button 
                  onClick={() => setShareDialogOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={16} />
                  Share Notebook
                </button>
              </div>
            </div>

            {/* Collaborators */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Collaborators</h3>
              <div className="space-y-2">
                {collaborators.map(collaborator => (
                  <div key={collaborator.id} className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {collaborator.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{collaborator.name}</div>
                      <div className="text-xs text-gray-500">{collaborator.role} • {collaborator.lastActive}</div>
                    </div>
                  </div>
                ))}
                <button className="w-full mt-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  + Add Collaborator
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Visibility:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    notebook.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {notebook.public ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Processed:</span>
                  <span className="text-gray-900">{notebook.lastProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">2 weeks ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modified:</span>
                  <span className="text-gray-900">3 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Comments resourceId={`notebook-${notebook.id || '1'}`} resourceType="notebook" />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart size={14} />
                {notebook.likes} likes
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare size={14} />
                12 comments
              </div>
              <div className="flex items-center gap-1">
                <Shield size={14} />
                Audit Score: {notebook.auditScore}%
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={16} className="inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={notebook.id || '1'}
        resourceType="notebook"
        resourceName={notebook.name}
      />
    </Modal>
  );
};

export default NotebookDetailModal;