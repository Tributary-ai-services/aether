import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { 
  FolderOpen,
  Folder,
  FileText,
  Image,
  Film,
  Music,
  File,
  ChevronRight,
  ChevronDown,
  Search,
  Grid,
  List,
  Eye,
  Download,
  Info,
  Calendar,
  HardDrive,
  Hash,
  Type,
  Layers,
  Brain,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const ContentsViewModal = ({ isOpen, onClose, notebook }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // tree or grid
  const [searchTerm, setSearchTerm] = useState('');

  if (!notebook) return null;

  // Mock content structure - in real app this would come from the backend
  const contentStructure = {
    id: 'root',
    name: notebook.name,
    type: 'folder',
    children: [
      {
        id: 'documents',
        name: 'Documents',
        type: 'folder',
        count: 156,
        size: '245 MB',
        children: [
          {
            id: 'doc1',
            name: 'Research Paper - AI Ethics.pdf',
            type: 'file',
            mimeType: 'application/pdf',
            size: '2.4 MB',
            uploadedAt: '2024-01-15T10:30:00Z',
            processedAt: '2024-01-15T10:32:00Z',
            status: 'processed',
            metadata: {
              pages: 24,
              vectorCount: 1250,
              extractedText: true,
              language: 'en',
              confidence: 0.95
            }
          },
          {
            id: 'doc2',
            name: 'Contract_v2_signed.pdf',
            type: 'file',
            mimeType: 'application/pdf',
            size: '856 KB',
            uploadedAt: '2024-01-14T09:15:00Z',
            processedAt: '2024-01-14T09:16:00Z',
            status: 'processed',
            metadata: {
              pages: 12,
              vectorCount: 450,
              hasSignature: true,
              extractedText: true
            }
          }
        ]
      },
      {
        id: 'images',
        name: 'Images',
        type: 'folder',
        count: 89,
        size: '312 MB',
        children: [
          {
            id: 'img1',
            name: 'Architecture_Diagram.png',
            type: 'file',
            mimeType: 'image/png',
            size: '1.2 MB',
            uploadedAt: '2024-01-12T14:20:00Z',
            processedAt: '2024-01-12T14:21:00Z',
            status: 'processed',
            metadata: {
              dimensions: '1920x1080',
              vectorCount: 85,
              hasText: true,
              extractedLabels: ['architecture', 'system', 'design']
            }
          },
          {
            id: 'img2',
            name: 'Handwritten_Notes.jpg',
            type: 'file',
            mimeType: 'image/jpeg',
            size: '3.4 MB',
            uploadedAt: '2024-01-10T11:30:00Z',
            processedAt: '2024-01-10T11:32:00Z',
            status: 'processed',
            metadata: {
              dimensions: '3024x4032',
              vectorCount: 120,
              hasHandwriting: true,
              ocrConfidence: 0.87
            }
          }
        ]
      },
      {
        id: 'media',
        name: 'Media',
        type: 'folder',
        count: 35,
        size: '1.4 GB',
        children: [
          {
            id: 'vid1',
            name: 'Meeting_Recording_2024-01-10.mp4',
            type: 'file',
            mimeType: 'video/mp4',
            size: '156.8 MB',
            uploadedAt: '2024-01-10T14:00:00Z',
            processedAt: '2024-01-10T14:25:00Z',
            status: 'processed',
            metadata: {
              duration: '57:00',
              resolution: '1920x1080',
              vectorCount: 890,
              hasTranscript: true,
              speakers: 4
            }
          },
          {
            id: 'aud1',
            name: 'Interview_Transcript.mp3',
            type: 'file',
            mimeType: 'audio/mp3',
            size: '45.2 MB',
            uploadedAt: '2024-01-08T16:45:00Z',
            processedAt: '2024-01-08T16:52:00Z',
            status: 'processed',
            metadata: {
              duration: '32:15',
              vectorCount: 420,
              hasTranscript: true,
              language: 'en',
              speakers: 2
            }
          }
        ]
      },
      {
        id: 'vectors',
        name: 'Vector Embeddings',
        type: 'folder',
        count: 2784,
        size: '78 MB',
        children: []
      }
    ]
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (item) => {
    if (item.type === 'folder') {
      return expandedFolders.has(item.id) ? FolderOpen : Folder;
    }
    
    if (item.mimeType?.includes('pdf')) return FileText;
    if (item.mimeType?.includes('image')) return Image;
    if (item.mimeType?.includes('video')) return Film;
    if (item.mimeType?.includes('audio')) return Music;
    return File;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (size) => {
    return size; // Already formatted in mock data
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTreeItem = (item, depth = 0) => {
    const Icon = getFileIcon(item);
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders.has(item.id);
    const isSelected = selectedItem?.id === item.id;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(item.id);
            }
            setSelectedItem(item);
          }}
        >
          {isFolder && (
            <ChevronRight
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
          <Icon size={16} className={isFolder ? 'text-gray-500' : 'text-gray-600'} />
          <span className="flex-1 text-sm">{item.name}</span>
          {isFolder && (
            <span className="text-xs text-gray-500">
              {item.count} items • {item.size}
            </span>
          )}
          {!isFolder && item.status && (
            <div className={`text-xs ${getStatusColor(item.status)}`}>
              {item.status === 'processed' && <CheckCircle size={12} />}
              {item.status === 'processing' && <Clock size={12} />}
              {item.status === 'error' && <AlertCircle size={12} />}
            </div>
          )}
        </div>
        {isFolder && isExpanded && item.children?.map(child => 
          renderTreeItem(child, depth + 1)
        )}
      </div>
    );
  };

  const renderGridItem = (item) => {
    if (item.type === 'folder') return null;
    
    const Icon = getFileIcon(item);
    
    return (
      <div
        key={item.id}
        className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
          selectedItem?.id === item.id 
            ? 'border-blue-500 shadow-md' 
            : 'border-gray-200 hover:shadow-sm'
        }`}
        onClick={() => setSelectedItem(item)}
      >
        <div className="flex items-start justify-between mb-3">
          <Icon size={32} className="text-gray-400" />
          <div className={`text-xs ${getStatusColor(item.status)}`}>
            {item.status}
          </div>
        </div>
        <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
          {item.name}
        </h4>
        <p className="text-xs text-gray-500">{item.size}</p>
      </div>
    );
  };

  const getAllFiles = (node) => {
    let files = [];
    if (node.type === 'file') {
      files.push(node);
    } else if (node.children) {
      node.children.forEach(child => {
        files = files.concat(getAllFiles(child));
      });
    }
    return files;
  };

  const allFiles = getAllFiles(contentStructure);
  const filteredFiles = allFiles.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notebook Contents" size="xl">
      <div className="flex h-[600px]">
        {/* Left Panel - Tree/Grid View */}
        <div className="flex-1 border-r border-gray-200 pr-4">
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 mr-4">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'tree' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid size={16} />
              </button>
            </div>
          </div>

          {/* Content View */}
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
            {viewMode === 'tree' ? (
              <div className="space-y-1">
                {renderTreeItem(contentStructure)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchTerm ? 
                  filteredFiles.map(file => renderGridItem(file)) :
                  allFiles.map(file => renderGridItem(file))
                }
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Item Details */}
        <div className="w-80 pl-4">
          {selectedItem ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedItem.name}</h3>
                {selectedItem.type === 'folder' ? (
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Folder size={16} />
                      <span>{selectedItem.count} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} />
                      <span>{selectedItem.size}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* File Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="text-gray-900">{selectedItem.mimeType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Size:</span>
                        <span className="text-gray-900">{selectedItem.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Uploaded:</span>
                        <span className="text-gray-900">{formatDate(selectedItem.uploadedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${getStatusColor(selectedItem.status)}`}>
                          {selectedItem.status}
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    {selectedItem.metadata && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-gray-900 mb-2">Processing Details</h4>
                        <div className="space-y-2 text-sm">
                          {selectedItem.metadata.vectorCount && (
                            <div className="flex items-center gap-2">
                              <Brain size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                {selectedItem.metadata.vectorCount} vectors generated
                              </span>
                            </div>
                          )}
                          {selectedItem.metadata.pages && (
                            <div className="flex items-center gap-2">
                              <Layers size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                {selectedItem.metadata.pages} pages
                              </span>
                            </div>
                          )}
                          {selectedItem.metadata.duration && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                {selectedItem.metadata.duration}
                              </span>
                            </div>
                          )}
                          {selectedItem.metadata.hasTranscript && (
                            <div className="flex items-center gap-2">
                              <Type size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                Transcript available
                              </span>
                            </div>
                          )}
                          {selectedItem.metadata.confidence && (
                            <div className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-gray-400" />
                              <span className="text-gray-600">
                                {(selectedItem.metadata.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t pt-3 space-y-2">
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Eye size={16} />
                        Preview
                      </button>
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Info size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select an item to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ContentsViewModal;