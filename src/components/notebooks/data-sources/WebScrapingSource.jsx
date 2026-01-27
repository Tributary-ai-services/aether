import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Globe,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  FileText,
  ExternalLink,
  Shield,
  Zap,
  Archive,
  RefreshCw,
  Eye,
  Save,
  Info,
  AlertTriangle,
  Copy
} from 'lucide-react';
import {
  probeUrl,
  scrapeUrl,
  selectUrlProbe,
  selectScraping,
  resetUrlProbe,
  resetScraping,
  clearUrlProbeError,
  clearScrapingError
} from '../../../store/slices/dataSourcesSlice.js';
import { SCRAPER_TYPES } from '../../../services/urlProbeService.js';
import { aetherApi } from '../../../services/aetherApi.js';

// Scraper display info
const SCRAPER_INFO = {
  [SCRAPER_TYPES.DIRECT_FETCH]: {
    name: 'Direct Fetch',
    description: 'Fast, direct HTTP request. Best for AI-friendly sites.',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  [SCRAPER_TYPES.CRAWL4AI]: {
    name: 'Crawl4AI',
    description: 'Browser-based scraping with JavaScript support.',
    icon: Globe,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  [SCRAPER_TYPES.ARCHIVE_ORG]: {
    name: 'Archive.org',
    description: 'Retrieves cached version from the Wayback Machine.',
    icon: Archive,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  [SCRAPER_TYPES.PLAYWRIGHT]: {
    name: 'Playwright',
    description: 'Full browser automation for complex sites.',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  [SCRAPER_TYPES.DUCKDUCKGO]: {
    name: 'DuckDuckGo Search',
    description: 'Search-based content discovery.',
    icon: Search,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  [SCRAPER_TYPES.MANUAL]: {
    name: 'Manual Copy',
    description: 'Site cannot be scraped. Please copy/paste content.',
    icon: Copy,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

const WebScrapingSource = ({
  notebook,
  onBack,
  onSuccess,
  onClose
}) => {
  const dispatch = useDispatch();

  // Redux state
  const urlProbe = useSelector(selectUrlProbe);
  const scraping = useSelector(selectScraping);

  // Local state
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [selectedScraper, setSelectedScraper] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetUrlProbe());
      dispatch(resetScraping());
    };
  }, [dispatch]);

  // Validate URL
  const validateUrl = useCallback((value) => {
    if (!value) {
      setUrlError('');
      return false;
    }

    try {
      const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('Only HTTP and HTTPS URLs are supported');
        return false;
      }
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  }, []);

  // Handle URL input change
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
    // Reset probe when URL changes
    if (urlProbe.status !== 'idle') {
      dispatch(resetUrlProbe());
    }
    if (scraping.status !== 'idle') {
      dispatch(resetScraping());
    }
    setSelectedScraper(null);
  };

  // Probe URL
  const handleProbe = async (e) => {
    e.preventDefault();

    if (!validateUrl(url)) {
      return;
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    dispatch(probeUrl(normalizedUrl));
  };

  // Set recommended scraper when probe completes
  useEffect(() => {
    if (urlProbe.status === 'complete' && urlProbe.result?.recommendedScraper) {
      setSelectedScraper(urlProbe.result.recommendedScraper);
    }
  }, [urlProbe.status, urlProbe.result]);

  // Handle scrape
  const handleScrape = async () => {
    if (!selectedScraper || !url) return;

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    dispatch(scrapeUrl({
      url: normalizedUrl,
      scraperType: selectedScraper,
      options: {}
    }));
  };

  // Handle save to notebook
  const handleSave = async () => {
    if (!scraping.result?.content) return;

    setSaving(true);
    setSaveError(null);

    try {
      const documentData = {
        title: scraping.result.title || `Web Content: ${new URL(url).hostname}`,
        content: scraping.result.content,
        content_type: 'text/markdown',
        notebook_id: notebook?.id,
        source_type: 'web_scraping',
        source_url: url,
        metadata: {
          scraped_at: new Date().toISOString(),
          scraper_used: selectedScraper,
          original_url: url,
        }
      };

      const response = await aetherApi.documents.create(documentData);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setSaveError('Failed to save content');
      }
    } catch (err) {
      console.error('Failed to save scraped content:', err);
      setSaveError(err.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Render probe results
  const renderProbeResults = () => {
    if (urlProbe.status === 'idle') return null;

    if (urlProbe.status === 'probing') {
      return (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-700">Analyzing URL...</span>
          </div>
        </div>
      );
    }

    if (urlProbe.status === 'failed') {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{urlProbe.error}</span>
          </div>
        </div>
      );
    }

    const result = urlProbe.result;
    if (!result) return null;

    return (
      <div className="mt-4 space-y-4">
        {/* Probe Summary */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">URL Analysis Results</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* AI-Friendly */}
            <div className={`p-3 rounded-lg ${result.hasLlmsTxt ? 'bg-green-50 border border-green-200' : 'bg-gray-100'}`}>
              <div className="flex items-center space-x-2">
                {result.hasLlmsTxt ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${result.hasLlmsTxt ? 'text-green-700' : 'text-gray-500'}`}>
                  llms.txt
                </span>
              </div>
            </div>

            {/* AI Policy */}
            <div className={`p-3 rounded-lg ${result.hasAiTxt ? 'bg-green-50 border border-green-200' : 'bg-gray-100'}`}>
              <div className="flex items-center space-x-2">
                {result.hasAiTxt ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${result.hasAiTxt ? 'text-green-700' : 'text-gray-500'}`}>
                  ai.txt
                </span>
              </div>
            </div>

            {/* Paywall */}
            <div className={`p-3 rounded-lg ${result.hasPaywall ? 'bg-amber-50 border border-amber-200' : 'bg-gray-100'}`}>
              <div className="flex items-center space-x-2">
                {result.hasPaywall ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <span className={`text-sm font-medium ${result.hasPaywall ? 'text-amber-700' : 'text-gray-500'}`}>
                  {result.hasPaywall ? 'Paywall' : 'No Paywall'}
                </span>
              </div>
            </div>

            {/* Archive Available */}
            <div className={`p-3 rounded-lg ${result.isArchiveAvailable ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}>
              <div className="flex items-center space-x-2">
                {result.isArchiveAvailable ? (
                  <Archive className="w-4 h-4 text-blue-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${result.isArchiveAvailable ? 'text-blue-700' : 'text-gray-500'}`}>
                  Archive
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scraper Selection */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Select Scraper</h4>
          <p className="text-sm text-gray-600 mb-4">{result.reasoning}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(SCRAPER_INFO)
              .filter(([key]) => {
                // Only show relevant scrapers
                if (key === SCRAPER_TYPES.MANUAL && selectedScraper !== SCRAPER_TYPES.MANUAL) {
                  return result.recommendedScraper === SCRAPER_TYPES.MANUAL;
                }
                return true;
              })
              .map(([key, info]) => {
                const IconComponent = info.icon;
                const isRecommended = key === result.recommendedScraper;
                const isSelected = key === selectedScraper;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedScraper(key)}
                    disabled={key === SCRAPER_TYPES.MANUAL}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${key === SCRAPER_TYPES.MANUAL ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${info.bgColor}`}>
                        <IconComponent className={`w-4 h-4 ${info.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{info.name}</span>
                          {isRecommended && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Scrape Button */}
          {selectedScraper && selectedScraper !== SCRAPER_TYPES.MANUAL && (
            <div className="mt-4">
              <button
                onClick={handleScrape}
                disabled={scraping.status === 'scraping'}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  scraping.status === 'scraping'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {scraping.status === 'scraping' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Scraping content...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    <span>Scrape Content</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scraping Error */}
        {scraping.status === 'failed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{scraping.error}</span>
            </div>
          </div>
        )}

        {/* Scraping Results */}
        {scraping.status === 'complete' && scraping.result && (
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Content scraped successfully!</span>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-green-700 hover:text-green-800 flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
            </div>

            {/* Content Stats */}
            <div className="flex items-center space-x-4 text-sm text-green-700">
              <span>{scraping.result.content?.length?.toLocaleString() || 0} characters</span>
              <span>•</span>
              <span>{scraping.result.title || 'No title'}</span>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {scraping.result.content?.substring(0, 2000)}
                  {scraping.result.content?.length > 2000 && '...'}
                </pre>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-4">
              {saveError && (
                <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg text-sm text-red-700">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Add to Notebook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Web Scraping</h2>
              <p className="text-sm text-gray-500">
                Extract content from web pages for "{notebook?.name || 'this notebook'}"
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6 overflow-y-auto">
        {/* URL Input Form */}
        <form onSubmit={handleProbe}>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Enter URL to scrape
          </label>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com/article"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  urlError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!url || !!urlError || urlProbe.status === 'probing'}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                !url || !!urlError || urlProbe.status === 'probing'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {urlProbe.status === 'probing' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>Analyze</span>
            </button>
          </div>
          {urlError && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {urlError}
            </p>
          )}
        </form>

        {/* Probe Results */}
        {renderProbeResults()}

        {/* Info Section - show only when idle */}
        {urlProbe.status === 'idle' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-900">How it works</h4>
                <ol className="mt-2 text-blue-700 list-decimal list-inside space-y-1">
                  <li>Enter a URL and click "Analyze"</li>
                  <li>We detect AI-friendly content (llms.txt, ai.txt) and site requirements</li>
                  <li>Select a scraper (or use our recommendation)</li>
                  <li>Preview the content and add it to your notebook</li>
                </ol>
                <p className="mt-3 text-blue-600">
                  <strong>Tip:</strong> Sites with llms.txt provide AI-optimized content for better results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default WebScrapingSource;
