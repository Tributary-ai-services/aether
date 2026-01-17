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