import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  X,
  Headphones,
  Presentation,
  FileAudio,
  Wand2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// Map renderer names/types to icons
const RENDERER_ICONS = {
  podcast: Headphones,
  audio: FileAudio,
  presentation: Presentation,
  default: Wand2,
};

const getRendererIcon = (renderer) => {
  const name = (renderer.name || '').toLowerCase();
  if (name.includes('podcast')) return RENDERER_ICONS.podcast;
  if (name.includes('audio') || name.includes('tts')) return RENDERER_ICONS.audio;
  if (name.includes('present') || name.includes('slide')) return RENDERER_ICONS.presentation;
  return RENDERER_ICONS.default;
};

const RendererSelectModal = ({ isOpen, onClose, onSelect }) => {
  const [renderers, setRenderers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRenderers();
    }
  }, [isOpen]);

  const fetchRenderers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/renderers');
      setRenderers(response.data?.renderers || []);
    } catch (err) {
      console.error('Failed to fetch renderers:', err);
      setError('Failed to load renderers');
      // Fallback mock data for development
      setRenderers([
        {
          id: 'renderer-podcast',
          name: 'Podcast Renderer',
          description: 'Transform text into a multi-speaker podcast with TTS, music, and ambient audio',
          type: 'renderer',
          rendererType: 'podcast',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (renderer) => {
    onSelect?.(renderer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select Renderer</h2>
            <p className="text-sm text-gray-500">Choose how to transform the output</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-(--color-primary-600)" />
              <span className="ml-2 text-gray-500">Loading renderers...</span>
            </div>
          ) : error && renderers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span className="ml-2 text-gray-600">{error}</span>
            </div>
          ) : renderers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No renderers available
            </div>
          ) : (
            <div className="space-y-2">
              {renderers.map((renderer) => {
                const Icon = getRendererIcon(renderer);
                return (
                  <button
                    key={renderer.id}
                    onClick={() => handleSelect(renderer)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-(--color-primary-300) hover:bg-(--color-primary-50) transition-colors text-left"
                  >
                    <div className="p-2 bg-rose-50 rounded-lg flex-shrink-0">
                      <Icon size={20} className="text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900">{renderer.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {renderer.description || 'Transform production output into a different format'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RendererSelectModal;
