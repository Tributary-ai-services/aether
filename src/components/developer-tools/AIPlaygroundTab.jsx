import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RefreshCw,
  Plus,
  X,
  Copy,
  Save,
  Settings,
  ChevronDown,
  ChevronRight,
  Bot,
  Workflow,
  Zap,
  MessageSquare,
  Clock,
  DollarSign,
  Hash,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Folder,
  ArrowRight,
  Check,
  AlertCircle,
  Loader,
  Pause
} from 'lucide-react';
import { aetherApi } from '../../services/aetherApi';

// Mode tabs
const MODES = {
  LLM: 'llm',
  AGENT: 'agent',
  WORKFLOW: 'workflow'
};

// Available LLM providers and models
const LLM_PROVIDERS = {
  anthropic: {
    name: 'Anthropic',
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }
    ]
  },
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ]
  },
  xai: {
    name: 'xAI',
    models: [
      { id: 'grok-2', name: 'Grok 2' },
      { id: 'grok-1', name: 'Grok 1' }
    ]
  }
};

const AIPlaygroundTab = () => {
  const [mode, setMode] = useState(MODES.LLM);

  return (
    <div className="h-full flex flex-col">
      {/* Mode Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Test Mode:</span>
          <button
            onClick={() => setMode(MODES.LLM)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === MODES.LLM
                ? 'bg-(--color-primary-600) text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MessageSquare size={16} />
            LLM Comparison
          </button>
          <button
            onClick={() => setMode(MODES.AGENT)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === MODES.AGENT
                ? 'bg-(--color-primary-600) text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Bot size={16} />
            Agent Testing
          </button>
          <button
            onClick={() => setMode(MODES.WORKFLOW)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === MODES.WORKFLOW
                ? 'bg-(--color-primary-600) text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Workflow size={16} />
            Workflow Testing
          </button>
        </div>
      </div>

      {/* Content based on mode */}
      <div className="flex-1 min-h-0">
        {mode === MODES.LLM && <LLMComparisonMode />}
        {mode === MODES.AGENT && <AgentTestingMode />}
        {mode === MODES.WORKFLOW && <WorkflowTestingMode />}
      </div>
    </div>
  );
};

// LLM Comparison Mode Component
const LLMComparisonMode = () => {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState([
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', temperature: 0.7 }
  ]);
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const addModel = () => {
    if (selectedModels.length >= 4) return;
    setSelectedModels(prev => [
      ...prev,
      { provider: 'openai', model: 'gpt-4o', temperature: 0.7 }
    ]);
  };

  const removeModel = (index) => {
    setSelectedModels(prev => prev.filter((_, i) => i !== index));
  };

  const updateModel = (index, updates) => {
    setSelectedModels(prev => prev.map((m, i) => i === index ? { ...m, ...updates } : m));
  };

  const runComparison = async () => {
    if (!userPrompt.trim() || selectedModels.length === 0) return;

    setIsRunning(true);
    setResults({});

    // Run all models in parallel (simulated)
    const promises = selectedModels.map(async (config, idx) => {
      const key = `${config.provider}-${config.model}-${idx}`;
      try {
        // Simulate API call with delay
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        const duration = Date.now() - startTime;

        // Mock response
        const response = {
          content: `[${LLM_PROVIDERS[config.provider]?.name} - ${config.model}]\n\nThis is a simulated response to your prompt: "${userPrompt.substring(0, 50)}..."\n\nThe model would provide a thoughtful, detailed answer here based on the system prompt and user query.`,
          tokens: Math.floor(200 + Math.random() * 300),
          latency: duration,
          cost: (Math.random() * 0.05).toFixed(4)
        };

        setResults(prev => ({ ...prev, [key]: { ...response, status: 'complete' } }));
      } catch (error) {
        setResults(prev => ({ ...prev, [key]: { error: error.message, status: 'error' } }));
      }
    });

    await Promise.all(promises);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Prompt Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) resize-none"
            placeholder="You are a helpful assistant..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) resize-none"
            placeholder="Enter your prompt here..."
          />
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Models ({selectedModels.length}/4)</span>
          <button
            onClick={addModel}
            disabled={selectedModels.length >= 4}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
          >
            <Plus size={14} />
            Add Model
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          {selectedModels.map((config, idx) => (
            <div key={idx} className="flex-1 min-w-[200px] max-w-[250px] p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <select
                  value={config.provider}
                  onChange={(e) => {
                    const newProvider = e.target.value;
                    const firstModel = LLM_PROVIDERS[newProvider]?.models[0]?.id;
                    updateModel(idx, { provider: newProvider, model: firstModel });
                  }}
                  className="text-sm font-medium bg-transparent border-none focus:ring-0 p-0"
                >
                  {Object.entries(LLM_PROVIDERS).map(([key, provider]) => (
                    <option key={key} value={key}>{provider.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeModel(idx)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
              <select
                value={config.model}
                onChange={(e) => updateModel(idx, { model: e.target.value })}
                className="w-full mb-2 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-(--color-primary-500)"
              >
                {LLM_PROVIDERS[config.provider]?.models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>temp:</span>
                <input
                  type="number"
                  value={config.temperature}
                  onChange={(e) => updateModel(idx, { temperature: parseFloat(e.target.value) || 0 })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <button
          onClick={runComparison}
          disabled={isRunning || !userPrompt.trim() || selectedModels.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
        >
          {isRunning ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
          {isRunning ? 'Running...' : 'Run All'}
        </button>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-auto">
        <div className={`grid gap-4 h-full ${
          selectedModels.length === 1 ? 'grid-cols-1' :
          selectedModels.length === 2 ? 'grid-cols-2' :
          selectedModels.length === 3 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {selectedModels.map((config, idx) => {
            const key = `${config.provider}-${config.model}-${idx}`;
            const result = results[key];
            const modelName = LLM_PROVIDERS[config.provider]?.models.find(m => m.id === config.model)?.name || config.model;

            return (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 flex flex-col h-full min-h-[300px]">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="font-medium text-sm text-gray-900">{modelName}</div>
                  <div className="text-xs text-gray-500">{LLM_PROVIDERS[config.provider]?.name}</div>
                </div>
                <div className="flex-1 p-3 overflow-auto">
                  {!result && !isRunning && (
                    <div className="text-gray-400 text-sm text-center py-8">
                      Click "Run All" to generate responses
                    </div>
                  )}
                  {isRunning && !result && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw size={24} className="animate-spin text-gray-400" />
                    </div>
                  )}
                  {result?.status === 'complete' && (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{result.content}</div>
                  )}
                  {result?.status === 'error' && (
                    <div className="text-sm text-red-600">{result.error}</div>
                  )}
                </div>
                {result?.status === 'complete' && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock size={12} />{result.latency}ms</span>
                      <span className="flex items-center gap-1"><Hash size={12} />{result.tokens} tok</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} />${result.cost}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-200 rounded"><ThumbsUp size={12} /></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><ThumbsDown size={12} /></button>
                      <button className="p-1 hover:bg-gray-200 rounded"><Copy size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Agent Testing Mode Component
const AgentTestingMode = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [testInput, setTestInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTrace, setExecutionTrace] = useState([]);
  const [finalResponse, setFinalResponse] = useState(null);

  // Load agents on mount
  useEffect(() => {
    // Mock agents for demo
    setAgents([
      {
        id: 'agent-1',
        name: 'Research Assistant',
        description: 'Helps with research tasks and information gathering',
        type: 'user',
        model: 'claude-sonnet-4-20250514',
        tools: ['web_search', 'calculator']
      },
      {
        id: 'agent-2',
        name: 'Document Analyzer',
        description: 'Analyzes and summarizes documents',
        type: 'system',
        model: 'gpt-4o',
        tools: ['read_document', 'summarize']
      },
      {
        id: 'agent-3',
        name: 'Code Reviewer',
        description: 'Reviews code and suggests improvements',
        type: 'system',
        model: 'claude-opus-4-5-20251101',
        tools: ['analyze_code', 'suggest_fixes']
      }
    ]);
  }, []);

  const runAgent = async () => {
    if (!selectedAgent || !testInput.trim()) return;

    setIsRunning(true);
    setExecutionTrace([]);
    setFinalResponse(null);

    // Simulate agent execution with trace
    const steps = [
      { type: 'reasoning', content: 'Analyzing the user request...', timing: 300 },
      { type: 'tool_call', content: 'Calling tool: web_search', toolCall: { name: 'web_search', input: { query: testInput.substring(0, 30) }, output: '[3 results found]' }, timing: 1200 },
      { type: 'reasoning', content: 'Processing search results and formulating response...', timing: 400 },
      { type: 'response', content: 'Based on my research, here is what I found...', timing: 800 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.timing));
      setExecutionTrace(prev => [...prev, { ...step, timestamp: new Date().toISOString() }]);
    }

    setFinalResponse({
      content: `This is the agent's response to: "${testInput}"\n\nThe agent processed your request using ${selectedAgent.tools.length} tools and generated this comprehensive response.`,
      metrics: {
        totalTime: steps.reduce((sum, s) => sum + s.timing, 0),
        tokens: 1247,
        cost: 0.024,
        toolCalls: 1
      }
    });

    setIsRunning(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Agent Selection */}
      <div className="w-72 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Select Agent</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors mb-2 ${
                selectedAgent?.id === agent.id
                  ? 'bg-(--color-primary-50) border border-(--color-primary-200)'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                selectedAgent?.id === agent.id ? 'bg-(--color-primary-100)' : 'bg-gray-100'
              }`}>
                <Bot size={16} className={selectedAgent?.id === agent.id ? 'text-(--color-primary-600)' : 'text-gray-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{agent.name}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    agent.type === 'system' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {agent.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">{agent.description}</div>
                <div className="text-xs text-gray-400 mt-1">{agent.tools.join(', ')}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Input & Configuration */}
      <div className="w-96 bg-white rounded-lg border border-gray-200 flex flex-col">
        {selectedAgent ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={18} className="text-(--color-primary-600)" />
                <h3 className="font-semibold text-gray-900">{selectedAgent.name}</h3>
              </div>
              <div className="text-sm text-gray-600 mb-3">{selectedAgent.description}</div>
              <div className="p-3 bg-gray-50 rounded-lg text-xs">
                <div className="mb-1"><strong>Model:</strong> {selectedAgent.model}</div>
                <div><strong>Tools:</strong> {selectedAgent.tools.join(', ')}</div>
              </div>
            </div>
            <div className="flex-1 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Input</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) resize-none"
                placeholder="Enter your test message..."
              />
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={runAgent}
                disabled={isRunning || !testInput.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
              >
                {isRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {isRunning ? 'Running...' : 'Run Agent'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select an agent to test</p>
            </div>
          </div>
        )}
      </div>

      {/* Execution Trace */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Execution Trace</h3>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {executionTrace.length === 0 && !isRunning ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Zap size={48} className="mb-4 text-gray-300" />
              <p>Run an agent to see the execution trace</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executionTrace.map((step, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${
                  step.type === 'reasoning' ? 'bg-blue-50 border-blue-200' :
                  step.type === 'tool_call' ? 'bg-purple-50 border-purple-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {step.type === 'reasoning' && <MessageSquare size={14} className="text-blue-500" />}
                      {step.type === 'tool_call' && <Zap size={14} className="text-purple-500" />}
                      {step.type === 'response' && <Check size={14} className="text-green-500" />}
                      <span className="text-sm font-medium capitalize">{step.type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs text-gray-500">{step.timing}ms</span>
                  </div>
                  <div className="text-sm text-gray-700">{step.content}</div>
                  {step.toolCall && (
                    <div className="mt-2 p-2 bg-white rounded text-xs font-mono">
                      <div><strong>Input:</strong> {JSON.stringify(step.toolCall.input)}</div>
                      <div><strong>Output:</strong> {step.toolCall.output}</div>
                    </div>
                  )}
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
          )}

          {finalResponse && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Final Response</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{finalResponse.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>Total: {finalResponse.metrics.totalTime}ms</span>
                <span>Tokens: {finalResponse.metrics.tokens}</span>
                <span>Cost: ${finalResponse.metrics.cost}</span>
                <span>Tools: {finalResponse.metrics.toolCalls} calls</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Workflow Testing Mode Component
const WorkflowTestingMode = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [inputParams, setInputParams] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [stepByStepMode, setStepByStepMode] = useState(false);
  const [executionSteps, setExecutionSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);

  // Load workflows on mount
  useEffect(() => {
    // Mock workflows for demo
    setWorkflows([
      {
        id: 'wf-1',
        name: 'Document Processing Pipeline',
        description: 'Extract, analyze, and store document data',
        steps: ['Extract', 'Analyze', 'Enrich', 'Store'],
        inputSchema: {
          document_url: { type: 'string', required: true, description: 'URL of the document' },
          output_format: { type: 'select', options: ['markdown', 'json', 'csv'], default: 'markdown' },
          include_summary: { type: 'boolean', default: true }
        }
      },
      {
        id: 'wf-2',
        name: 'Research & Summarize',
        description: 'Research a topic and generate a summary',
        steps: ['Search', 'Filter', 'Summarize', 'Format'],
        inputSchema: {
          topic: { type: 'string', required: true, description: 'Research topic' },
          max_sources: { type: 'number', default: 5 },
          output_length: { type: 'select', options: ['short', 'medium', 'long'], default: 'medium' }
        }
      }
    ]);
  }, []);

  const runWorkflow = async () => {
    if (!selectedWorkflow) return;

    setIsRunning(true);
    setExecutionSteps([]);
    setCurrentStep(null);

    const steps = selectedWorkflow.steps;
    for (let i = 0; i < steps.length; i++) {
      const stepName = steps[i];
      setCurrentStep(i);
      setExecutionSteps(prev => [...prev, {
        step: stepName,
        status: 'running',
        input: i === 0 ? inputParams : null,
        output: null,
        timing: null
      }]);

      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      setExecutionSteps(prev => prev.map((s, idx) =>
        idx === i ? {
          ...s,
          status: 'success',
          output: { result: `${stepName} completed successfully`, data: { processed: true } },
          timing: Math.floor(1500 + Math.random() * 1000)
        } : s
      ));

      if (stepByStepMode && i < steps.length - 1) {
        // Wait for user to continue
        // In a real implementation, we'd pause here
      }
    }

    setIsRunning(false);
    setCurrentStep(null);
  };

  const renderInputField = (name, schema) => {
    const value = inputParams[name] ?? schema.default ?? '';

    if (schema.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => setInputParams(p => ({ ...p, [name]: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500)"
        >
          {schema.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (schema.type === 'boolean') {
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => setInputParams(p => ({ ...p, [name]: e.target.checked }))}
            className="rounded border-gray-300 text-(--color-primary-600)"
          />
          <span className="text-sm text-gray-600">{schema.description}</span>
        </label>
      );
    }

    if (schema.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => setInputParams(p => ({ ...p, [name]: parseFloat(e.target.value) || 0 }))}
          placeholder={schema.description}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500)"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setInputParams(p => ({ ...p, [name]: e.target.value }))}
        placeholder={schema.description}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500)"
      />
    );
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'running': return <Loader size={16} className="animate-spin text-blue-500" />;
      case 'success': return <Check size={16} className="text-green-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      case 'pending': return <Pause size={16} className="text-gray-400" />;
      default: return <Pause size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Workflow Selection */}
      <div className="w-72 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Select Workflow</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {workflows.map(workflow => (
            <button
              key={workflow.id}
              onClick={() => {
                setSelectedWorkflow(workflow);
                setInputParams({});
                setExecutionSteps([]);
              }}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors mb-2 ${
                selectedWorkflow?.id === workflow.id
                  ? 'bg-(--color-primary-50) border border-(--color-primary-200)'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                selectedWorkflow?.id === workflow.id ? 'bg-(--color-primary-100)' : 'bg-gray-100'
              }`}>
                <Workflow size={16} className={selectedWorkflow?.id === workflow.id ? 'text-(--color-primary-600)' : 'text-gray-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{workflow.name}</div>
                <div className="text-xs text-gray-500">{workflow.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {workflow.steps.length} steps
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="w-96 bg-white rounded-lg border border-gray-200 flex flex-col">
        {selectedWorkflow ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Workflow size={18} className="text-(--color-primary-600)" />
                <h3 className="font-semibold text-gray-900">{selectedWorkflow.name}</h3>
              </div>
              <div className="text-sm text-gray-600 mb-3">{selectedWorkflow.description}</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                {selectedWorkflow.steps.map((step, idx) => (
                  <React.Fragment key={step}>
                    <span className="text-xs font-medium text-gray-700 px-2 py-1 bg-white rounded border border-gray-200">
                      {step}
                    </span>
                    {idx < selectedWorkflow.steps.length - 1 && (
                      <ArrowRight size={14} className="text-gray-400" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Input Parameters</h4>
              <div className="space-y-4">
                {Object.entries(selectedWorkflow.inputSchema).map(([name, schema]) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {name}
                      {schema.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderInputField(name, schema)}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={stepByStepMode}
                  onChange={(e) => setStepByStepMode(e.target.checked)}
                  className="rounded border-gray-300 text-(--color-primary-600)"
                />
                <span className="text-sm text-gray-700">Step-by-step mode</span>
              </label>
              <button
                onClick={runWorkflow}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
              >
                {isRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {isRunning ? 'Running...' : 'Run Workflow'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Workflow size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a workflow to test</p>
            </div>
          </div>
        )}
      </div>

      {/* Execution View */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Execution</h3>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {executionSteps.length === 0 && !isRunning ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Zap size={48} className="mb-4 text-gray-300" />
              <p>Run a workflow to see execution progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedWorkflow?.steps.map((stepName, idx) => {
                const stepExec = executionSteps[idx];
                const status = stepExec?.status || (isRunning && currentStep === idx ? 'running' : 'pending');

                return (
                  <div key={stepName} className={`p-4 rounded-lg border ${
                    status === 'success' ? 'bg-green-50 border-green-200' :
                    status === 'running' ? 'bg-blue-50 border-blue-200' :
                    status === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStepIcon(status)}
                        <span className="font-medium text-gray-900">Step {idx + 1}: {stepName}</span>
                      </div>
                      {stepExec?.timing && (
                        <span className="text-sm text-gray-500">{stepExec.timing}ms</span>
                      )}
                    </div>
                    {stepExec?.input && (
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <strong>Input:</strong>
                        <pre className="mt-1 text-gray-600">{JSON.stringify(stepExec.input, null, 2)}</pre>
                      </div>
                    )}
                    {stepExec?.output && (
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <strong>Output:</strong>
                        <pre className="mt-1 text-gray-600">{JSON.stringify(stepExec.output, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isRunning && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={16} className="animate-spin text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Workflow in progress...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentStep || 0) + 1) / (selectedWorkflow?.steps.length || 1) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPlaygroundTab;
