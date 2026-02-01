import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// ============================================================================
// Async Thunks for AI Playground Operations
// ============================================================================

// Fetch available providers and models
export const fetchProviders = createAsyncThunk(
  'aiPlayground/fetchProviders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.getProviders();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch providers');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch providers');
    }
  }
);

// Run LLM completion
export const runLLMCompletion = createAsyncThunk(
  'aiPlayground/runLLMCompletion',
  async ({ modelConfig, systemPrompt, userPrompt }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.llmCompletion({
        provider: modelConfig.provider,
        model: modelConfig.model,
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        parameters: modelConfig.parameters || {},
      });
      if (response.success) {
        return { modelKey: `${modelConfig.provider}:${modelConfig.model}`, result: response.data };
      } else {
        return rejectWithValue({ modelKey: `${modelConfig.provider}:${modelConfig.model}`, error: response.error || 'Completion failed' });
      }
    } catch (error) {
      return rejectWithValue({ modelKey: `${modelConfig.provider}:${modelConfig.model}`, error: error.message || 'Completion failed' });
    }
  }
);

// Run all LLM comparisons in parallel
export const runLLMComparison = createAsyncThunk(
  'aiPlayground/runLLMComparison',
  async ({ models, systemPrompt, userPrompt }, { dispatch }) => {
    // Dispatch individual completions in parallel
    const promises = models.map(modelConfig =>
      dispatch(runLLMCompletion({ modelConfig, systemPrompt, userPrompt }))
    );

    await Promise.allSettled(promises);
    return { completed: true };
  }
);

// Fetch testable agents
export const fetchAgents = createAsyncThunk(
  'aiPlayground/fetchAgents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.getAgents();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch agents');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch agents');
    }
  }
);

// Test an agent
export const testAgent = createAsyncThunk(
  'aiPlayground/testAgent',
  async ({ agentId, input, contextDocuments = [], contextNotebooks = [] }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.testAgent(agentId, {
        input,
        context_documents: contextDocuments,
        context_notebooks: contextNotebooks,
      });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Agent test failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Agent test failed');
    }
  }
);

// Fetch testable workflows
export const fetchWorkflows = createAsyncThunk(
  'aiPlayground/fetchWorkflows',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.getWorkflows();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch workflows');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch workflows');
    }
  }
);

// Test a workflow
export const testWorkflow = createAsyncThunk(
  'aiPlayground/testWorkflow',
  async ({ workflowId, inputParams, stepByStep = false }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.testWorkflow(workflowId, {
        input_params: inputParams,
        step_by_step: stepByStep,
      });
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Workflow test failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Workflow test failed');
    }
  }
);

// Execute a single workflow step (for step-by-step mode)
export const executeWorkflowStep = createAsyncThunk(
  'aiPlayground/executeWorkflowStep',
  async ({ workflowId, stepIndex, inputData }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.executeWorkflowStep(workflowId, stepIndex, inputData);
      if (response.success) {
        return { stepIndex, result: response.data };
      } else {
        return rejectWithValue({ stepIndex, error: response.error || 'Step execution failed' });
      }
    } catch (error) {
      return rejectWithValue({ stepIndex, error: error.message || 'Step execution failed' });
    }
  }
);

// Fetch saved prompts
export const fetchSavedPrompts = createAsyncThunk(
  'aiPlayground/fetchSavedPrompts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.getSavedPrompts();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch saved prompts');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch saved prompts');
    }
  }
);

// Save a prompt
export const savePrompt = createAsyncThunk(
  'aiPlayground/savePrompt',
  async (promptData, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.savePrompt(promptData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to save prompt');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to save prompt');
    }
  }
);

// Delete a prompt
export const deletePrompt = createAsyncThunk(
  'aiPlayground/deletePrompt',
  async (promptId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.aiPlayground.deletePrompt(promptId);
      if (response.success) {
        return promptId;
      } else {
        return rejectWithValue(response.error || 'Failed to delete prompt');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete prompt');
    }
  }
);

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  // Current mode
  mode: 'llm', // 'llm' | 'agent' | 'workflow'

  // Available providers and models
  providers: [],
  providersLoading: false,
  providersError: null,

  // LLM Comparison state
  llm: {
    systemPrompt: '',
    userPrompt: '',
    models: [], // [{provider, model, parameters: {temperature, max_tokens, top_p}}]
    results: {}, // keyed by 'provider:model'
    errors: {},  // keyed by 'provider:model'
    isRunning: false,
    runningModels: [], // models currently executing
  },

  // Agent Testing state
  agent: {
    agents: [],
    agentsLoading: false,
    agentsError: null,
    selectedAgentId: null,
    selectedAgent: null,
    testInput: '',
    contextDocuments: [],
    contextNotebooks: [],
    executionTrace: [], // [{type, content, timing, toolCall}]
    finalResponse: null,
    metrics: null,
    isRunning: false,
    error: null,
  },

  // Workflow Testing state
  workflow: {
    workflows: [],
    workflowsLoading: false,
    workflowsError: null,
    selectedWorkflowId: null,
    selectedWorkflow: null,
    inputParams: {},
    executionSteps: [], // [{step, status, input, output, timing}]
    isRunning: false,
    currentStepIndex: null,
    stepByStepMode: false,
    error: null,
  },

  // Saved prompts
  savedPrompts: [],
  savedPromptsLoading: false,
  savedPromptsError: null,

  // History of tests
  history: [],
};

// ============================================================================
// Slice
// ============================================================================

const aiPlaygroundSlice = createSlice({
  name: 'aiPlayground',
  initialState,
  reducers: {
    // Mode switching
    setMode: (state, action) => {
      state.mode = action.payload;
    },

    // LLM mode actions
    setSystemPrompt: (state, action) => {
      state.llm.systemPrompt = action.payload;
    },

    setUserPrompt: (state, action) => {
      state.llm.userPrompt = action.payload;
    },

    addModel: (state, action) => {
      const { provider, model, parameters = {} } = action.payload;
      // Prevent duplicates
      const exists = state.llm.models.some(
        m => m.provider === provider && m.model === model
      );
      if (!exists && state.llm.models.length < 4) {
        state.llm.models.push({
          provider,
          model,
          parameters: {
            temperature: parameters.temperature || 0.7,
            max_tokens: parameters.max_tokens || 1024,
            top_p: parameters.top_p || 1.0,
          },
        });
      }
    },

    removeModel: (state, action) => {
      const { provider, model } = action.payload;
      state.llm.models = state.llm.models.filter(
        m => !(m.provider === provider && m.model === model)
      );
      // Clear result for removed model
      const key = `${provider}:${model}`;
      delete state.llm.results[key];
      delete state.llm.errors[key];
    },

    updateModelParams: (state, action) => {
      const { provider, model, parameters } = action.payload;
      const modelConfig = state.llm.models.find(
        m => m.provider === provider && m.model === model
      );
      if (modelConfig) {
        modelConfig.parameters = { ...modelConfig.parameters, ...parameters };
      }
    },

    clearLLMResults: (state) => {
      state.llm.results = {};
      state.llm.errors = {};
      state.llm.isRunning = false;
      state.llm.runningModels = [];
    },

    // Agent mode actions
    setSelectedAgent: (state, action) => {
      state.agent.selectedAgentId = action.payload;
      state.agent.selectedAgent = state.agent.agents.find(a => a.id === action.payload) || null;
      // Reset test state
      state.agent.executionTrace = [];
      state.agent.finalResponse = null;
      state.agent.metrics = null;
      state.agent.error = null;
    },

    setAgentTestInput: (state, action) => {
      state.agent.testInput = action.payload;
    },

    setAgentContextDocuments: (state, action) => {
      state.agent.contextDocuments = action.payload;
    },

    setAgentContextNotebooks: (state, action) => {
      state.agent.contextNotebooks = action.payload;
    },

    clearAgentTest: (state) => {
      state.agent.executionTrace = [];
      state.agent.finalResponse = null;
      state.agent.metrics = null;
      state.agent.error = null;
      state.agent.isRunning = false;
    },

    // Workflow mode actions
    setSelectedWorkflow: (state, action) => {
      state.workflow.selectedWorkflowId = action.payload;
      state.workflow.selectedWorkflow = state.workflow.workflows.find(w => w.id === action.payload) || null;
      // Reset test state
      state.workflow.executionSteps = [];
      state.workflow.inputParams = {};
      state.workflow.currentStepIndex = null;
      state.workflow.error = null;
    },

    setWorkflowInputParams: (state, action) => {
      state.workflow.inputParams = { ...state.workflow.inputParams, ...action.payload };
    },

    setStepByStepMode: (state, action) => {
      state.workflow.stepByStepMode = action.payload;
    },

    clearWorkflowTest: (state) => {
      state.workflow.executionSteps = [];
      state.workflow.currentStepIndex = null;
      state.workflow.error = null;
      state.workflow.isRunning = false;
    },

    // History management
    addToHistory: (state, action) => {
      const historyItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.history.unshift(historyItem);
      // Keep only last 50 items
      state.history = state.history.slice(0, 50);
    },

    clearHistory: (state) => {
      state.history = [];
    },

    // Load prompt into editor
    loadPrompt: (state, action) => {
      const prompt = action.payload;
      state.llm.systemPrompt = prompt.system_prompt || '';
      state.llm.userPrompt = prompt.user_prompt || '';
      if (prompt.default_models && prompt.default_models.length > 0) {
        state.llm.models = prompt.default_models;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ======== Fetch Providers ========
      .addCase(fetchProviders.pending, (state) => {
        state.providersLoading = true;
        state.providersError = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.providersLoading = false;
        state.providers = action.payload.providers || action.payload || [];
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.providersLoading = false;
        state.providersError = action.payload || 'Failed to fetch providers';
      })

      // ======== Run LLM Completion (individual) ========
      .addCase(runLLMCompletion.pending, (state, action) => {
        const { modelConfig } = action.meta.arg;
        const key = `${modelConfig.provider}:${modelConfig.model}`;
        state.llm.isRunning = true;
        if (!state.llm.runningModels.includes(key)) {
          state.llm.runningModels.push(key);
        }
        delete state.llm.errors[key];
      })
      .addCase(runLLMCompletion.fulfilled, (state, action) => {
        const { modelKey, result } = action.payload;
        state.llm.results[modelKey] = result;
        state.llm.runningModels = state.llm.runningModels.filter(k => k !== modelKey);
        if (state.llm.runningModels.length === 0) {
          state.llm.isRunning = false;
        }
      })
      .addCase(runLLMCompletion.rejected, (state, action) => {
        const { modelKey, error } = action.payload || {};
        if (modelKey) {
          state.llm.errors[modelKey] = error;
          state.llm.runningModels = state.llm.runningModels.filter(k => k !== modelKey);
        }
        if (state.llm.runningModels.length === 0) {
          state.llm.isRunning = false;
        }
      })

      // ======== Run LLM Comparison ========
      .addCase(runLLMComparison.pending, (state) => {
        state.llm.isRunning = true;
        state.llm.results = {};
        state.llm.errors = {};
      })
      .addCase(runLLMComparison.fulfilled, (state) => {
        state.llm.isRunning = false;
      })

      // ======== Fetch Agents ========
      .addCase(fetchAgents.pending, (state) => {
        state.agent.agentsLoading = true;
        state.agent.agentsError = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.agent.agentsLoading = false;
        state.agent.agents = action.payload.agents || action.payload || [];
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.agent.agentsLoading = false;
        state.agent.agentsError = action.payload || 'Failed to fetch agents';
      })

      // ======== Test Agent ========
      .addCase(testAgent.pending, (state) => {
        state.agent.isRunning = true;
        state.agent.error = null;
        state.agent.executionTrace = [];
        state.agent.finalResponse = null;
        state.agent.metrics = null;
      })
      .addCase(testAgent.fulfilled, (state, action) => {
        state.agent.isRunning = false;
        state.agent.executionTrace = action.payload.execution_trace || [];
        state.agent.finalResponse = action.payload.final_response || null;
        state.agent.metrics = action.payload.metrics || null;
      })
      .addCase(testAgent.rejected, (state, action) => {
        state.agent.isRunning = false;
        state.agent.error = action.payload || 'Agent test failed';
      })

      // ======== Fetch Workflows ========
      .addCase(fetchWorkflows.pending, (state) => {
        state.workflow.workflowsLoading = true;
        state.workflow.workflowsError = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.workflow.workflowsLoading = false;
        state.workflow.workflows = action.payload.workflows || action.payload || [];
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.workflow.workflowsLoading = false;
        state.workflow.workflowsError = action.payload || 'Failed to fetch workflows';
      })

      // ======== Test Workflow ========
      .addCase(testWorkflow.pending, (state) => {
        state.workflow.isRunning = true;
        state.workflow.error = null;
        state.workflow.executionSteps = [];
        state.workflow.currentStepIndex = 0;
      })
      .addCase(testWorkflow.fulfilled, (state, action) => {
        state.workflow.isRunning = false;
        state.workflow.executionSteps = action.payload.steps || [];
        state.workflow.currentStepIndex = null;
      })
      .addCase(testWorkflow.rejected, (state, action) => {
        state.workflow.isRunning = false;
        state.workflow.error = action.payload || 'Workflow test failed';
      })

      // ======== Execute Workflow Step ========
      .addCase(executeWorkflowStep.pending, (state, action) => {
        const stepIndex = action.meta.arg.stepIndex;
        state.workflow.currentStepIndex = stepIndex;
        if (state.workflow.executionSteps[stepIndex]) {
          state.workflow.executionSteps[stepIndex].status = 'running';
        }
      })
      .addCase(executeWorkflowStep.fulfilled, (state, action) => {
        const { stepIndex, result } = action.payload;
        if (state.workflow.executionSteps[stepIndex]) {
          state.workflow.executionSteps[stepIndex] = {
            ...state.workflow.executionSteps[stepIndex],
            status: 'completed',
            output: result.output,
            timing: result.timing,
          };
        }
      })
      .addCase(executeWorkflowStep.rejected, (state, action) => {
        const { stepIndex, error } = action.payload || {};
        if (stepIndex !== undefined && state.workflow.executionSteps[stepIndex]) {
          state.workflow.executionSteps[stepIndex].status = 'failed';
          state.workflow.executionSteps[stepIndex].error = error;
        }
        state.workflow.error = error;
      })

      // ======== Fetch Saved Prompts ========
      .addCase(fetchSavedPrompts.pending, (state) => {
        state.savedPromptsLoading = true;
        state.savedPromptsError = null;
      })
      .addCase(fetchSavedPrompts.fulfilled, (state, action) => {
        state.savedPromptsLoading = false;
        state.savedPrompts = action.payload.prompts || action.payload || [];
      })
      .addCase(fetchSavedPrompts.rejected, (state, action) => {
        state.savedPromptsLoading = false;
        state.savedPromptsError = action.payload || 'Failed to fetch saved prompts';
      })

      // ======== Save Prompt ========
      .addCase(savePrompt.fulfilled, (state, action) => {
        state.savedPrompts.unshift(action.payload);
      })

      // ======== Delete Prompt ========
      .addCase(deletePrompt.fulfilled, (state, action) => {
        state.savedPrompts = state.savedPrompts.filter(p => p.id !== action.payload);
      });
  },
});

// ============================================================================
// Actions Export
// ============================================================================

export const {
  setMode,
  setSystemPrompt,
  setUserPrompt,
  addModel,
  removeModel,
  updateModelParams,
  clearLLMResults,
  setSelectedAgent,
  setAgentTestInput,
  setAgentContextDocuments,
  setAgentContextNotebooks,
  clearAgentTest,
  setSelectedWorkflow,
  setWorkflowInputParams,
  setStepByStepMode,
  clearWorkflowTest,
  addToHistory,
  clearHistory,
  loadPrompt,
} = aiPlaygroundSlice.actions;

// ============================================================================
// Selectors
// ============================================================================

// Mode selector
export const selectMode = (state) => state.aiPlayground.mode;

// Providers selectors
export const selectProviders = (state) => state.aiPlayground.providers;
export const selectProvidersLoading = (state) => state.aiPlayground.providersLoading;
export const selectProvidersError = (state) => state.aiPlayground.providersError;

// LLM selectors
export const selectLLMState = (state) => state.aiPlayground.llm;
export const selectLLMModels = (state) => state.aiPlayground.llm.models;
export const selectLLMResults = (state) => state.aiPlayground.llm.results;
export const selectLLMErrors = (state) => state.aiPlayground.llm.errors;
export const selectLLMIsRunning = (state) => state.aiPlayground.llm.isRunning;
export const selectSystemPrompt = (state) => state.aiPlayground.llm.systemPrompt;
export const selectUserPrompt = (state) => state.aiPlayground.llm.userPrompt;

// Agent selectors
export const selectAgentState = (state) => state.aiPlayground.agent;
export const selectAgents = (state) => state.aiPlayground.agent.agents;
export const selectAgentsLoading = (state) => state.aiPlayground.agent.agentsLoading;
export const selectSelectedAgent = (state) => state.aiPlayground.agent.selectedAgent;
export const selectAgentExecutionTrace = (state) => state.aiPlayground.agent.executionTrace;
export const selectAgentIsRunning = (state) => state.aiPlayground.agent.isRunning;
export const selectAgentMetrics = (state) => state.aiPlayground.agent.metrics;

// Workflow selectors
export const selectWorkflowState = (state) => state.aiPlayground.workflow;
export const selectWorkflows = (state) => state.aiPlayground.workflow.workflows;
export const selectWorkflowsLoading = (state) => state.aiPlayground.workflow.workflowsLoading;
export const selectSelectedWorkflow = (state) => state.aiPlayground.workflow.selectedWorkflow;
export const selectWorkflowExecutionSteps = (state) => state.aiPlayground.workflow.executionSteps;
export const selectWorkflowIsRunning = (state) => state.aiPlayground.workflow.isRunning;
export const selectWorkflowCurrentStep = (state) => state.aiPlayground.workflow.currentStepIndex;

// Saved prompts selectors
export const selectSavedPrompts = (state) => state.aiPlayground.savedPrompts;
export const selectSavedPromptsLoading = (state) => state.aiPlayground.savedPromptsLoading;

// History selector
export const selectHistory = (state) => state.aiPlayground.history;

// Get models by provider
export const selectModelsByProvider = createSelector(
  [selectProviders, (state, providerName) => providerName],
  (providers, providerName) => {
    const provider = providers.find(p => p.name === providerName);
    return provider?.models || [];
  }
);

// Get LLM result for a specific model
export const selectLLMResultForModel = createSelector(
  [selectLLMResults, (state, provider, model) => `${provider}:${model}`],
  (results, key) => results[key] || null
);

export default aiPlaygroundSlice.reducer;
