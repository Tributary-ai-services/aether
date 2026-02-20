import React, { useState } from 'react';
import {
  FileBox,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  FileImage,
  FileCode,
  Clock,
  HardDrive,
  X,
} from 'lucide-react';

const fileTypeIcons = {
  'application/json': FileCode,
  'text/plain': FileText,
  'text/csv': FileText,
  'text/html': FileCode,
  'image/png': FileImage,
  'image/jpeg': FileImage,
  'application/pdf': FileText,
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ArtifactBrowser = ({ artifacts = [], onDownload, loading = false, title = 'Artifacts' }) => {
  const [expandedArtifacts, setExpandedArtifacts] = useState({});
  const [previewArtifact, setPreviewArtifact] = useState(null);

  const toggleExpand = (id) => {
    setExpandedArtifacts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePreview = (artifact) => {
    setPreviewArtifact(previewArtifact?.name === artifact.name ? null : artifact);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FileBox size={16} className="text-indigo-500" />
          {title}
        </h4>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FileBox size={16} className="text-indigo-500" />
          {title}
        </h4>
        <div className="text-center py-6 text-gray-500">
          <FileBox size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No artifacts available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <FileBox size={16} className="text-indigo-500" />
          {title}
          <span className="text-xs text-gray-400 ml-auto">{artifacts.length} item{artifacts.length !== 1 ? 's' : ''}</span>
        </h4>
      </div>

      <div className="divide-y divide-gray-100">
        {artifacts.map((artifact, idx) => {
          const id = artifact.name || idx;
          const isExpanded = expandedArtifacts[id];
          const Icon = fileTypeIcons[artifact.type] || File;

          return (
            <div key={id}>
              <button
                onClick={() => toggleExpand(id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
                <Icon size={16} className="text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{artifact.name}</p>
                  <p className="text-xs text-gray-500">
                    {artifact.type || 'unknown'}
                    {artifact.size_bytes ? ` - ${formatBytes(artifact.size_bytes)}` : ''}
                  </p>
                </div>
                {artifact.step_name && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full shrink-0">
                    {artifact.step_name}
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 py-2">
                    {artifact.type && (
                      <div className="flex items-center gap-1">
                        <File size={12} className="text-gray-400" />
                        <span>{artifact.type}</span>
                      </div>
                    )}
                    {artifact.size_bytes > 0 && (
                      <div className="flex items-center gap-1">
                        <HardDrive size={12} className="text-gray-400" />
                        <span>{formatBytes(artifact.size_bytes)}</span>
                      </div>
                    )}
                    {artifact.created_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        <span>{new Date(artifact.created_at).toLocaleString()}</span>
                      </div>
                    )}
                    {artifact.step_name && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Step:</span>
                        <span>{artifact.step_name}</span>
                      </div>
                    )}
                  </div>

                  {artifact.uri && (
                    <p className="text-xs text-gray-400 font-mono truncate mb-2">{artifact.uri}</p>
                  )}

                  <div className="flex gap-2">
                    {artifact.content && (
                      <button
                        onClick={() => handlePreview(artifact)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded"
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                    )}
                    {onDownload && (
                      <button
                        onClick={() => onDownload(artifact)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 rounded"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    )}
                  </div>

                  {previewArtifact?.name === artifact.name && artifact.content && (
                    <div className="mt-2 relative">
                      <button
                        onClick={() => setPreviewArtifact(null)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={12} />
                      </button>
                      <div className="bg-gray-900 rounded-lg p-3 overflow-auto max-h-60">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                          {typeof artifact.content === 'string'
                            ? artifact.content
                            : JSON.stringify(artifact.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ArtifactBrowser;
