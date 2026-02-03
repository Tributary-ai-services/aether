/**
 * TypeScript definitions for Agent Builder backend models
 * Generated from Go models in TAS Agent Builder service
 */

export type AgentStatus = 'draft' | 'published' | 'disabled';
export type SpaceType = 'personal' | 'organization';
export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

// Retry Configuration
export interface RetryConfig {
  max_attempts: number;                // Maximum retry attempts (1-5)
  backoff_type?: string;               // "exponential" or "linear"
  base_delay?: string;                 // Base delay between retries (e.g., "1s", "500ms")
  max_delay?: string;                  // Maximum delay cap (e.g., "30s")
  retryable_errors?: string[];         // Error patterns that trigger retries
}

// Fallback Configuration
export interface FallbackConfig {
  enabled: boolean;                    // Enable fallback to healthy providers
  preferred_chain?: string[];          // Custom fallback order (provider names)
  max_cost_increase?: number;          // Max cost increase allowed for fallback
  require_same_features?: boolean;     // Whether fallback providers must support same features
}

// LLM Configuration with Enhanced Reliability
export interface AgentLLMConfig {
  provider: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stop?: string[];
  metadata?: Record<string, any>;
  // Enhanced reliability configuration
  optimize_for?: 'cost' | 'performance' | 'quality';
  required_features?: string[];        // e.g., ["functions", "vision"]
  max_cost?: number;                   // Maximum cost threshold
  retry_config?: RetryConfig;          // Retry configuration
  fallback_config?: FallbackConfig;    // Fallback configuration
}

// Main Agent Model
export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  llm_config: AgentLLMConfig;
  owner_id: string;
  space_id: string;
  tenant_id: string;
  status: AgentStatus;
  space_type: SpaceType;
  is_public: boolean;
  is_template: boolean;
  notebook_ids: string[];              // Array of notebook UUIDs
  tags: string[];                      // Array of tag strings
  // Knowledge configuration
  enable_knowledge: boolean;
  context_strategy?: ContextStrategy;
  hybrid_config?: HybridContextConfig;
  include_sub_notebooks?: boolean;
  max_context_tokens?: number;
  multi_pass_enabled?: boolean;
  // Execution stats
  total_executions: number;
  total_cost_usd: number;
  avg_response_time_ms: number;
  last_executed_at?: string;           // ISO date string
  created_at: string;                  // ISO date string
  updated_at: string;                  // ISO date string
  deleted_at?: string;                 // ISO date string
}

// Agent Creation Request
export interface CreateAgentRequest {
  name: string;
  description?: string;
  system_prompt: string;
  llm_config: AgentLLMConfig;
  space_id: string;
  is_public?: boolean;
  is_template?: boolean;
  notebook_ids?: string[];
  tags?: string[];
  // Knowledge configuration
  enable_knowledge?: boolean;
  context_strategy?: ContextStrategy;
  hybrid_config?: HybridContextConfig;
  include_sub_notebooks?: boolean;
  max_context_tokens?: number;
  multi_pass_enabled?: boolean;
}

// Agent Update Request
export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  system_prompt?: string;
  llm_config?: AgentLLMConfig;
  status?: AgentStatus;
  is_public?: boolean;
  is_template?: boolean;
  notebook_ids?: string[];
  tags?: string[];
  // Knowledge configuration
  enable_knowledge?: boolean;
  context_strategy?: ContextStrategy;
  hybrid_config?: HybridContextConfig;
  include_sub_notebooks?: boolean;
  max_context_tokens?: number;
  multi_pass_enabled?: boolean;
}

// Agent List Response
export interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  size: number;
}

// Agent List Filter
export interface AgentListFilter {
  owner_id?: string;
  space_id?: string;
  tenant_id?: string;
  status?: AgentStatus;
  space_type?: SpaceType;
  is_public?: boolean;
  is_template?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  size?: number;
}

// Execution Models
export interface ExecutionStep {
  step: string;
  started_at: string;                  // ISO date string
  completed_at?: string;               // ISO date string
  status: ExecutionStatus;
  output?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RouterResponse {
  provider: string;
  model: string;
  routing_strategy: string;
  token_usage: number;
  cost_usd: number;
  response_time_ms: number;
  metadata?: Record<string, any>;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  user_id: string;
  session_id?: string;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  status: ExecutionStatus;
  router_response?: RouterResponse;
  execution_steps?: ExecutionStep[];
  token_usage?: number;
  cost_usd?: number;
  total_duration_ms?: number;
  // Enhanced reliability metadata
  retry_attempts: number;
  fallback_used: boolean;
  failed_providers?: string[];
  successful_provider?: string;
  configuration_template_used?: string;
  reliability_score?: number;
  created_at: string;                  // ISO date string
  updated_at: string;                  // ISO date string
  completed_at?: string;               // ISO date string
}

// Execution Request
export interface StartExecutionRequest {
  agent_id: string;
  input: Record<string, any>;
  session_id?: string;
  context?: Record<string, any>;
}

// Execution List Response
export interface ExecutionListResponse {
  executions: AgentExecution[];
  total: number;
  page: number;
  size: number;
}

// Execution List Filter
export interface ExecutionListFilter {
  agent_id?: string;
  user_id?: string;
  status?: ExecutionStatus;
  session_id?: string;
  page?: number;
  size?: number;
}

// Stats and Analytics
export interface StatsResponse {
  agent_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_response_time_ms: number;
  total_cost_usd: number;
  avg_cost_per_execution: number;
  reliability_score: number;
  most_used_provider: string;
  fallback_usage_rate: number;
  retry_success_rate: number;
  period_start: string;                // ISO date string
  period_end: string;                  // ISO date string
}

// Provider and Model Information
export interface Provider {
  name: string;
  display_name: string;
  models: string[];
  features: string[];
}

export interface Model {
  name: string;
  display_name: string;
  provider: string;
  max_tokens: number;
  cost_per_1000: number;
  features: string[];
}

// Configuration Templates
export interface ConfigurationTemplate {
  name: string;
  description: string;
  retry_config: RetryConfig;
  fallback_config: FallbackConfig;
  optimize_for: 'cost' | 'performance' | 'quality';
  recommended_for: string[];
}

// API Response Wrapper
export interface APIResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Default Configuration Functions
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  max_attempts: 3,
  backoff_type: 'exponential',
  base_delay: '1s',
  max_delay: '30s',
  retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit']
};

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  max_cost_increase: 0.5, // Allow up to 50% cost increase
  require_same_features: true
};

export const HIGH_RELIABILITY_RETRY_CONFIG: RetryConfig = {
  max_attempts: 5,
  backoff_type: 'exponential',
  base_delay: '500ms',
  max_delay: '60s',
  retryable_errors: ['timeout', 'connection', 'unavailable', 'rate_limit', 'server_error']
};

export const HIGH_RELIABILITY_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  max_cost_increase: 1.0, // Allow up to 100% cost increase for reliability
  require_same_features: false // Allow fallback to different feature sets
};

export const COST_OPTIMIZED_RETRY_CONFIG: RetryConfig = {
  max_attempts: 2,
  backoff_type: 'linear',
  base_delay: '2s',
  max_delay: '10s',
  retryable_errors: ['timeout', 'connection']
};

export const COST_OPTIMIZED_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  preferred_chain: ['openai', 'anthropic'], // Prefer cost-effective providers
  max_cost_increase: 0.2, // Allow only 20% cost increase
  require_same_features: true
};

export const PERFORMANCE_OPTIMIZED_RETRY_CONFIG: RetryConfig = {
  max_attempts: 2,
  backoff_type: 'linear',
  base_delay: '100ms',
  max_delay: '2s',
  retryable_errors: ['timeout', 'connection']
};

export const PERFORMANCE_OPTIMIZED_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  preferred_chain: ['openai', 'anthropic'], // Prefer fast providers
  max_cost_increase: 0.3, // Allow moderate cost increase for speed
  require_same_features: true
};

// ============================================
// Hybrid Context Configuration Types
// ============================================

export type ContextStrategy = 'none' | 'vector' | 'full' | 'hybrid';

// Priority tier for token budget allocation
export interface HybridPriorityTier {
  name: string;                    // e.g., "high_relevance", "medium_relevance", "context"
  min_score: number;               // Minimum score to qualify for this tier
  max_tokens?: number;             // Maximum tokens for this tier
  percentage: number;              // Percentage of budget for this tier (0.0 - 1.0)
}

// Configuration for hybrid context retrieval strategy
export interface HybridContextConfig {
  // Weight for vector search results (0.0 - 1.0)
  vector_weight: number;
  // Weight for full document content (0.0 - 1.0)
  full_doc_weight: number;
  // Weight for document position (earlier chunks score higher)
  position_weight: number;
  // Boost multiplier for document summaries
  summary_boost: number;
  // Number of top results to retrieve from vector search
  vector_top_k: number;
  // Minimum similarity score for vector results
  vector_min_score: number;
  // Maximum number of chunks from full documents
  full_doc_max_chunks: number;
  // Token budget for the merged result
  token_budget: number;
  // Include document summaries if available
  include_summaries: boolean;
  // Deduplicate by content hash
  deduplicate_by_content: boolean;
  // Priority tiers for token budget allocation
  priority_tiers?: HybridPriorityTier[];
}

// Knowledge configuration for agents
export interface AgentKnowledgeConfig {
  // Enable knowledge retrieval
  enable_knowledge: boolean;
  // Context strategy to use
  context_strategy: ContextStrategy;
  // Hybrid context configuration (when strategy is 'hybrid')
  hybrid_config?: HybridContextConfig;
  // Include documents from sub-notebooks
  include_sub_notebooks: boolean;
  // Maximum context tokens to inject
  max_context_tokens?: number;
  // Enable multi-pass processing for large documents
  multi_pass_enabled?: boolean;
}

// Default hybrid context configuration
export const DEFAULT_HYBRID_CONTEXT_CONFIG: HybridContextConfig = {
  vector_weight: 0.6,
  full_doc_weight: 0.3,
  position_weight: 0.1,
  summary_boost: 1.5,
  vector_top_k: 20,
  vector_min_score: 0.5,
  full_doc_max_chunks: 50,
  token_budget: 8000,
  include_summaries: true,
  deduplicate_by_content: true,
  priority_tiers: [
    { name: 'high_relevance', min_score: 0.8, percentage: 0.5 },
    { name: 'medium_relevance', min_score: 0.6, percentage: 0.3 },
    { name: 'context', min_score: 0.0, percentage: 0.2 },
  ]
};

// Default knowledge configuration
export const DEFAULT_KNOWLEDGE_CONFIG: AgentKnowledgeConfig = {
  enable_knowledge: true,
  context_strategy: 'hybrid',
  hybrid_config: DEFAULT_HYBRID_CONTEXT_CONFIG,
  include_sub_notebooks: false,
  max_context_tokens: 8000,
  multi_pass_enabled: false
};

// Preset configurations for different use cases
export const KNOWLEDGE_PRESETS = {
  qa_agent: {
    name: 'Q&A Agent',
    description: 'Optimized for answering specific questions',
    config: {
      enable_knowledge: true,
      context_strategy: 'vector' as ContextStrategy,
      include_sub_notebooks: false,
      max_context_tokens: 4000
    }
  },
  research_agent: {
    name: 'Research Agent',
    description: 'Balanced retrieval for comprehensive research',
    config: {
      enable_knowledge: true,
      context_strategy: 'hybrid' as ContextStrategy,
      hybrid_config: {
        ...DEFAULT_HYBRID_CONTEXT_CONFIG,
        vector_weight: 0.5,
        full_doc_weight: 0.4,
        position_weight: 0.1,
        token_budget: 12000
      },
      include_sub_notebooks: true,
      max_context_tokens: 12000
    }
  },
  document_analyzer: {
    name: 'Document Analyzer',
    description: 'Full document access for comprehensive analysis',
    config: {
      enable_knowledge: true,
      context_strategy: 'full' as ContextStrategy,
      include_sub_notebooks: false,
      max_context_tokens: 16000,
      multi_pass_enabled: true
    }
  }
};