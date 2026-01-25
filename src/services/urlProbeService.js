/**
 * URL Probe Service
 *
 * Probes URLs to detect AI-friendly content and determine the best
 * scraping strategy. Checks for:
 * - llms.txt and llms-full.txt (AI-friendly content)
 * - ai.txt (AI access rules)
 * - robots.txt (crawler rules and AI agent directives)
 * - Paywall detection
 * - Site accessibility
 */

import { aetherApi } from './aetherApi.js';

// ============================================================================
// Scraper Types
// ============================================================================

export const SCRAPER_TYPES = {
  // Direct fetch - for sites with AI-friendly content (llms.txt)
  DIRECT_FETCH: 'direct_fetch',

  // Crawl4AI - primary scraper for JavaScript-heavy sites
  CRAWL4AI: 'crawl4ai',

  // Archive.org fallback - for paywalled or blocked content
  ARCHIVE_ORG: 'archive_org',

  // DuckDuckGo MCP - for search-based content discovery
  DUCKDUCKGO: 'duckduckgo',

  // Playwright MCP - for complex interactive sites
  PLAYWRIGHT: 'playwright',

  // Manual - user needs to copy/paste content
  MANUAL: 'manual',
};

// ============================================================================
// Probe Result Structure
// ============================================================================

/**
 * @typedef {Object} ProbeResult
 * @property {string} url - The probed URL
 * @property {boolean} accessible - Whether the URL is accessible
 * @property {number} statusCode - HTTP status code
 * @property {boolean} hasLlmsTxt - Whether llms.txt exists
 * @property {boolean} hasLlmsFullTxt - Whether llms-full.txt exists
 * @property {boolean} hasAiTxt - Whether ai.txt exists
 * @property {Object} robotsRules - Parsed robots.txt rules
 * @property {boolean} requiresJavaScript - Whether site requires JS
 * @property {boolean} hasPaywall - Whether paywall is detected
 * @property {boolean} isArchiveAvailable - Whether archive.org has copy
 * @property {string} recommendedScraper - Recommended scraper type
 * @property {string} reasoning - Explanation for recommendation
 * @property {Object} llmsTxtContent - Parsed llms.txt content if available
 * @property {Object} aiTxtContent - Parsed ai.txt content if available
 */

// ============================================================================
// Well-Known File Paths
// ============================================================================

const WELL_KNOWN_PATHS = {
  LLMS_TXT: '/.well-known/llms.txt',
  LLMS_FULL_TXT: '/.well-known/llms-full.txt',
  AI_TXT: '/.well-known/ai.txt',
  ROBOTS_TXT: '/robots.txt',
};

// ============================================================================
// Paywall Detection Patterns
// ============================================================================

const PAYWALL_INDICATORS = [
  // HTML patterns
  'subscribe to continue',
  'premium content',
  'member-only',
  'subscription required',
  'login to read',
  'sign in to continue',
  'paywall',
  'create an account',
  'free trial',
  'unlock this article',

  // Class/ID patterns
  'paywall-modal',
  'subscription-wall',
  'regwall',
  'meter-paywall',
];

const PAYWALL_DOMAINS = [
  'nytimes.com',
  'wsj.com',
  'ft.com',
  'economist.com',
  'bloomberg.com',
  'washingtonpost.com',
  'medium.com',
  'substack.com',
  'patreon.com',
];

// ============================================================================
// URL Probe Service Class
// ============================================================================

class UrlProbeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main probe function - checks URL for AI-friendly content
   * @param {string} url - URL to probe
   * @param {Object} options - Probe options
   * @returns {Promise<ProbeResult>}
   */
  async probe(url, options = {}) {
    // Normalize URL
    const normalizedUrl = this.normalizeUrl(url);

    // Check cache
    const cached = this.getCached(normalizedUrl);
    if (cached && !options.forceRefresh) {
      return cached;
    }

    try {
      // Call backend probe API (which handles CORS and server-side probing)
      const response = await aetherApi.dataSources.probeUrl(normalizedUrl);

      if (!response.success) {
        return this.createFailedResult(normalizedUrl, response.error);
      }

      const result = response.data;

      // Cache the result
      this.setCached(normalizedUrl, result);

      return result;
    } catch (error) {
      console.error('URL probe failed:', error);
      return this.createFailedResult(normalizedUrl, error.message);
    }
  }

  /**
   * Client-side probe (limited due to CORS - use backend probe for full functionality)
   * This is useful for quick checks that don't require cross-origin requests
   * @param {string} url - URL to probe
   * @returns {Promise<Partial<ProbeResult>>}
   */
  async clientSideProbe(url) {
    const normalizedUrl = this.normalizeUrl(url);
    const baseUrl = new URL(normalizedUrl);
    const origin = baseUrl.origin;

    const result = {
      url: normalizedUrl,
      accessible: false,
      statusCode: null,
      hasLlmsTxt: false,
      hasLlmsFullTxt: false,
      hasAiTxt: false,
      robotsRules: null,
      requiresJavaScript: true, // Assume true until proven otherwise
      hasPaywall: this.isKnownPaywalledDomain(normalizedUrl),
      isArchiveAvailable: false,
      recommendedScraper: SCRAPER_TYPES.CRAWL4AI,
      reasoning: 'Default recommendation pending full probe',
      llmsTxtContent: null,
      aiTxtContent: null,
    };

    // Check if domain is known paywalled
    result.hasPaywall = this.isKnownPaywalledDomain(normalizedUrl);

    // Quick domain-based recommendation
    result.recommendedScraper = this.getQuickRecommendation(normalizedUrl, result);
    result.reasoning = this.getQuickReasoning(normalizedUrl, result);

    return result;
  }

  /**
   * Determine recommended scraper based on probe results
   * @param {ProbeResult} probeResult - Probe result
   * @returns {string} Recommended scraper type
   */
  getRecommendedScraper(probeResult) {
    // Priority 1: AI-friendly sites with llms.txt
    if (probeResult.hasLlmsTxt || probeResult.hasLlmsFullTxt) {
      return SCRAPER_TYPES.DIRECT_FETCH;
    }

    // Priority 2: Check ai.txt permissions
    if (probeResult.aiTxtContent) {
      const permissions = probeResult.aiTxtContent;
      if (permissions.allowAiAccess === false) {
        // Site explicitly blocks AI access
        if (probeResult.isArchiveAvailable) {
          return SCRAPER_TYPES.ARCHIVE_ORG;
        }
        return SCRAPER_TYPES.MANUAL;
      }
    }

    // Priority 3: Check robots.txt for AI agent rules
    if (probeResult.robotsRules) {
      const rules = probeResult.robotsRules;
      if (rules.disallowedForAI) {
        if (probeResult.isArchiveAvailable) {
          return SCRAPER_TYPES.ARCHIVE_ORG;
        }
        return SCRAPER_TYPES.MANUAL;
      }
    }

    // Priority 4: Paywall detection
    if (probeResult.hasPaywall) {
      if (probeResult.isArchiveAvailable) {
        return SCRAPER_TYPES.ARCHIVE_ORG;
      }
      return SCRAPER_TYPES.MANUAL;
    }

    // Priority 5: JavaScript requirement
    if (probeResult.requiresJavaScript) {
      return SCRAPER_TYPES.CRAWL4AI;
    }

    // Default: Direct fetch for simple pages
    return SCRAPER_TYPES.DIRECT_FETCH;
  }

  /**
   * Get human-readable explanation for scraper recommendation
   * @param {ProbeResult} probeResult - Probe result
   * @returns {string} Explanation
   */
  getRecommendationReasoning(probeResult) {
    const scraper = probeResult.recommendedScraper;

    switch (scraper) {
      case SCRAPER_TYPES.DIRECT_FETCH:
        if (probeResult.hasLlmsTxt) {
          return 'Site provides AI-friendly content via llms.txt. Direct fetch will retrieve optimized content.';
        }
        return 'Site is accessible and does not require JavaScript rendering.';

      case SCRAPER_TYPES.CRAWL4AI:
        return 'Site requires JavaScript rendering. Crawl4AI will handle dynamic content and browser emulation.';

      case SCRAPER_TYPES.ARCHIVE_ORG:
        if (probeResult.hasPaywall) {
          return 'Paywall detected. Using archive.org to retrieve cached version of the content.';
        }
        if (probeResult.aiTxtContent?.allowAiAccess === false) {
          return 'Site blocks AI access. Using archive.org as a fallback.';
        }
        return 'Site is not directly accessible. Using archive.org cached version.';

      case SCRAPER_TYPES.PLAYWRIGHT:
        return 'Site requires complex browser interaction. Playwright will handle authentication or dynamic elements.';

      case SCRAPER_TYPES.DUCKDUCKGO:
        return 'Using DuckDuckGo search to find related content.';

      case SCRAPER_TYPES.MANUAL:
        if (probeResult.hasPaywall) {
          return 'Paywall detected and no archive available. Please copy/paste the content manually.';
        }
        return 'Site cannot be automatically scraped. Please copy/paste the content manually.';

      default:
        return 'Using default scraping strategy.';
    }
  }

  /**
   * Parse llms.txt content
   * @param {string} content - Raw llms.txt content
   * @returns {Object} Parsed content
   */
  parseLlmsTxt(content) {
    if (!content) return null;

    const lines = content.split('\n');
    const result = {
      title: null,
      description: null,
      sections: [],
      links: [],
      raw: content,
    };

    let currentSection = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Title (# heading)
      if (trimmedLine.startsWith('# ') && !result.title) {
        result.title = trimmedLine.substring(2);
        continue;
      }

      // Description (> blockquote)
      if (trimmedLine.startsWith('> ') && !result.description) {
        result.description = trimmedLine.substring(2);
        continue;
      }

      // Section (## heading)
      if (trimmedLine.startsWith('## ')) {
        currentSection = {
          name: trimmedLine.substring(3),
          content: [],
        };
        result.sections.push(currentSection);
        continue;
      }

      // Links
      const linkMatch = trimmedLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        result.links.push({
          text: linkMatch[1],
          url: linkMatch[2],
          section: currentSection?.name || null,
        });
      }

      // Add to current section
      if (currentSection) {
        currentSection.content.push(trimmedLine);
      }
    }

    return result;
  }

  /**
   * Parse ai.txt content
   * @param {string} content - Raw ai.txt content
   * @returns {Object} Parsed content
   */
  parseAiTxt(content) {
    if (!content) return null;

    const lines = content.split('\n');
    const result = {
      allowAiAccess: true,
      allowTraining: true,
      allowScraping: true,
      preferredFormat: null,
      rateLimit: null,
      contact: null,
      raw: content,
    };

    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();

      if (trimmedLine.startsWith('allow-ai:')) {
        result.allowAiAccess = trimmedLine.includes('true') || trimmedLine.includes('yes');
      }
      if (trimmedLine.startsWith('allow-training:')) {
        result.allowTraining = trimmedLine.includes('true') || trimmedLine.includes('yes');
      }
      if (trimmedLine.startsWith('allow-scraping:')) {
        result.allowScraping = trimmedLine.includes('true') || trimmedLine.includes('yes');
      }
      if (trimmedLine.startsWith('preferred-format:')) {
        result.preferredFormat = line.split(':')[1]?.trim();
      }
      if (trimmedLine.startsWith('rate-limit:')) {
        result.rateLimit = line.split(':')[1]?.trim();
      }
      if (trimmedLine.startsWith('contact:')) {
        result.contact = line.split(':').slice(1).join(':').trim();
      }
    }

    return result;
  }

  /**
   * Parse robots.txt for AI agent rules
   * @param {string} content - Raw robots.txt content
   * @returns {Object} Parsed rules relevant to AI
   */
  parseRobotsTxt(content) {
    if (!content) return null;

    const AI_USER_AGENTS = [
      'gptbot',
      'chatgpt-user',
      'claude-web',
      'anthropic-ai',
      'cohere-ai',
      'perplexitybot',
      'bytespider',
      'ccbot',
      'diffbot',
      'facebookbot',
      'google-extended',
    ];

    const lines = content.split('\n');
    const result = {
      disallowedForAI: false,
      disallowedPaths: [],
      allowedPaths: [],
      crawlDelay: null,
      sitemaps: [],
      raw: content,
    };

    let currentUserAgent = null;
    let isRelevantAgent = false;

    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();

      // Skip comments and empty lines
      if (trimmedLine.startsWith('#') || !trimmedLine) continue;

      // User-agent directive
      if (trimmedLine.startsWith('user-agent:')) {
        const agent = trimmedLine.split(':')[1]?.trim();
        currentUserAgent = agent;
        isRelevantAgent = agent === '*' || AI_USER_AGENTS.some(ua => agent.includes(ua));
        continue;
      }

      // Only process rules for relevant user agents
      if (!isRelevantAgent) continue;

      // Disallow directive
      if (trimmedLine.startsWith('disallow:')) {
        const path = line.split(':')[1]?.trim();
        if (path === '/' || path === '/*') {
          result.disallowedForAI = true;
        }
        if (path) {
          result.disallowedPaths.push(path);
        }
      }

      // Allow directive
      if (trimmedLine.startsWith('allow:')) {
        const path = line.split(':')[1]?.trim();
        if (path) {
          result.allowedPaths.push(path);
        }
      }

      // Crawl-delay directive
      if (trimmedLine.startsWith('crawl-delay:')) {
        result.crawlDelay = parseInt(line.split(':')[1]?.trim(), 10);
      }

      // Sitemap directive
      if (trimmedLine.startsWith('sitemap:')) {
        const sitemap = line.split(':').slice(1).join(':').trim();
        if (sitemap) {
          result.sitemaps.push(sitemap);
        }
      }
    }

    return result;
  }

  /**
   * Check if URL domain is known to have paywall
   * @param {string} url - URL to check
   * @returns {boolean}
   */
  isKnownPaywalledDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return PAYWALL_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Detect paywall from page content
   * @param {string} content - Page HTML content
   * @returns {boolean}
   */
  detectPaywallInContent(content) {
    if (!content) return false;

    const lowerContent = content.toLowerCase();
    return PAYWALL_INDICATORS.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Check archive.org availability
   * @param {string} url - URL to check
   * @returns {Promise<{available: boolean, archiveUrl: string|null}>}
   */
  async checkArchiveAvailability(url) {
    try {
      const response = await fetch(
        `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        return { available: false, archiveUrl: null };
      }

      const data = await response.json();
      const snapshot = data.archived_snapshots?.closest;

      if (snapshot?.available) {
        return {
          available: true,
          archiveUrl: snapshot.url,
          timestamp: snapshot.timestamp,
        };
      }

      return { available: false, archiveUrl: null };
    } catch (error) {
      console.error('Archive.org check failed:', error);
      return { available: false, archiveUrl: null };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Ensure https
      if (parsed.protocol === 'http:') {
        parsed.protocol = 'https:';
      }
      return parsed.href;
    } catch {
      // Assume https if no protocol
      if (!url.startsWith('http')) {
        return `https://${url}`;
      }
      return url;
    }
  }

  getCached(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  setCached(url, data) {
    this.cache.set(url, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
  }

  createFailedResult(url, error) {
    return {
      url,
      accessible: false,
      statusCode: null,
      hasLlmsTxt: false,
      hasLlmsFullTxt: false,
      hasAiTxt: false,
      robotsRules: null,
      requiresJavaScript: true,
      hasPaywall: this.isKnownPaywalledDomain(url),
      isArchiveAvailable: false,
      recommendedScraper: SCRAPER_TYPES.CRAWL4AI,
      reasoning: `Probe failed: ${error}. Using Crawl4AI as default.`,
      llmsTxtContent: null,
      aiTxtContent: null,
      error,
    };
  }

  getQuickRecommendation(url, partialResult) {
    if (partialResult.hasPaywall) {
      return SCRAPER_TYPES.ARCHIVE_ORG;
    }
    return SCRAPER_TYPES.CRAWL4AI;
  }

  getQuickReasoning(url, partialResult) {
    if (partialResult.hasPaywall) {
      return 'Known paywalled site. Will attempt archive.org fallback.';
    }
    return 'Pending full probe. Crawl4AI recommended for most sites.';
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const urlProbeService = new UrlProbeService();

export default urlProbeService;
