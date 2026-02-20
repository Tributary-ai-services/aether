/**
 * Serialization utilities for converting between ReactFlow nodes/edges
 * and the backend workflow API format (steps, triggers, configuration).
 *
 * Supports both legacy node types (action, agent) and new Argo-aligned types
 * (container, script, http, aiTask, suspend, transform, condition).
 * Serializes step ordering as DAG dependencies (derived from edges) rather than
 * linear order numbers.
 */

let nodeIdCounter = 0;

/**
 * Generate a unique node ID for ReactFlow
 */
export const generateNodeId = () => {
  nodeIdCounter += 1;
  return `node-${Date.now()}-${nodeIdCounter}`;
};

/**
 * Sanitize a node label into a valid Argo task name (lowercase, hyphens, no spaces)
 */
const toTaskName = (label) =>
  (label || 'step')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'step';

/**
 * Language-to-default-image map for script nodes
 */
const LANGUAGE_IMAGES = {
  python: 'python:3.11-slim',
  bash: 'alpine:3.19',
  node: 'node:20-slim',
};

/**
 * AI Task type to image map
 */
const AI_TASK_IMAGES = {
  llm: 'curlimages/curl:8.8.0',
  agent: 'curlimages/curl:8.8.0',
  compliance: 'registry-api.tas.scharber.com/compliance-scanner:latest',
  document: 'curlimages/curl:8.8.0',
};

/**
 * Return sensible default configuration for a given trigger type.
 */
export const getDefaultTriggerConfig = (triggerType) => {
  switch (triggerType) {
    case 'schedule':
      return {
        schedule: {
          frequency: 'daily',
          interval: 1,
          daysOfWeek: [1, 2, 3, 4, 5],
          dayOfMonth: 1,
          lastDay: false,
          time: '09:00',
          timezone: 'UTC',
          starts: '',
          endsType: 'never',
          endsDate: '',
          endsCount: 10,
        },
        cron: '0 9 * * *',
        timezone: 'UTC',
      };
    case 'upload':
    case 'file_upload':
      return {
        accepted_extensions: ['pdf', 'docx', 'xlsx', 'csv', 'txt'],
        source_filter: 'any',
        output_mode: 'same_notebook',
      };
    case 'webhook':
      return {
        argo_event_source: '',
        argo_event_name: '',
        http_method: 'POST',
        webhook_url: '',
      };
    case 'api':
      return { api_endpoint: '/api/v1/workflows/{id}/execute' };
    case 'document_event':
      return {
        event_type: 'processing.completed',
        notebook_ids: [],
        mime_filter: [],
        output_mode: 'same_notebook',
      };
    case 'manual':
    default:
      return {};
  }
};

const DEFAULT_RETRY = {
  limit: 0,
  duration: '2s',
  factor: 2,
  maxDuration: '1m',
  retryPolicy: 'Always',
};

/**
 * Default node data by type
 */
export const getDefaultNodeData = (type) => {
  switch (type) {
    case 'eventSource':
      return {
        label: 'New Trigger',
        triggerType: 'manual',
        config: getDefaultTriggerConfig('manual'),
      };

    // --- New Argo-aligned types ---
    case 'container':
      return {
        label: 'Container Step',
        image: '',
        command: [],
        args: [],
        env: [],
        resources: {
          requests: { memory: '128Mi', cpu: '100m' },
          limits: { memory: '512Mi', cpu: '500m' },
        },
        inputs: { parameters: [] },
        outputs: { parameters: [] },
        retryStrategy: { ...DEFAULT_RETRY },
        timeout: '5m',
        when: '',
      };
    case 'script':
      return {
        label: 'Script Step',
        language: 'python',
        source: '',
        image: 'python:3.11-slim',
        inputs: { parameters: [] },
        outputs: { parameters: [] },
        retryStrategy: { ...DEFAULT_RETRY },
        timeout: '5m',
        when: '',
      };
    case 'http':
      return {
        label: 'HTTP Request',
        url: '',
        method: 'GET',
        headers: [],
        body: '',
        successCondition: '',
        failureCondition: '',
        inputs: { parameters: [] },
        outputs: { parameters: [] },
        retryStrategy: { ...DEFAULT_RETRY },
        timeout: '30s',
        when: '',
      };
    case 'aiTask':
      return {
        label: 'AI Task',
        aiTaskType: 'llm',
        model: 'gpt-4o-mini',
        prompt: '',
        systemPrompt: '',
        maxTokens: 2000,
        temperature: 0.7,
        agentType: 'general',
        agentName: '',
        instructions: '',
        mcpEnabled: false,
        ragEnabled: false,
        ragDataset: 'default',
        ragTopK: 5,
        image: '',
        inputs: { parameters: [] },
        outputs: { parameters: [] },
        retryStrategy: { ...DEFAULT_RETRY },
        timeout: '10m',
        when: '',
      };
    case 'condition':
      return {
        label: 'Condition',
        conditionType: 'expression',
        expression: '',
        config: { field: '', value: '' },
      };
    case 'suspend':
      return {
        label: 'Approval Gate',
        duration: '',
        message: '',
        approverRole: '',
        inputs: { parameters: [] },
        outputs: { parameters: [] },
      };
    case 'transform':
      return {
        label: 'Transform Data',
        transformType: 'expression',
        expression: '',
        sourceStep: '',
        sourceParam: '',
        jsonpathQuery: '',
        luaScript: '',
        sprigFunction: '',
        outputParam: 'result',
        inputs: { parameters: [] },
        outputs: { parameters: [{ name: 'result' }] },
      };
    case 'assembler':
      return {
        label: 'Assembler',
        assemblyMode: 'concat',
        outputFormat: 'text',
        instructions: '',
        inputs: { parameters: [] },
        outputs: { parameters: [{ name: 'result' }] },
        retryStrategy: { ...DEFAULT_RETRY },
        timeout: '5m',
        when: '',
      };
    case 'sync':
      return {
        label: 'Sync',
        targets: [{ type: 'in_app', url: '', includeResult: true, messageTemplate: '' }],
        onExit: false,
        timeout: '30s',
        when: '',
      };

    // --- n8n-inspired flow control types ---
    case 'merge':
      return {
        label: 'Merge',
        mergeMode: 'append', // append, combine-by-position, combine-by-field, choose-branch
        combineField: '',
        chooseBranch: 0,
      };
    case 'loop':
      return {
        label: 'Loop',
        batchSize: 0, // 0 = no batching
        inputSource: '',
      };
    case 'subworkflow':
      return {
        label: 'Sub-Workflow',
        workflowRef: '',
        workflowName: '',
        parameterMapping: {},
      };
    case 'errorHandler':
      return {
        label: 'Error Handler',
        actionType: 'log', // log, notify, retry
        notifyUrl: '',
        errorWorkflowId: '',
      };

    // --- Legacy types (backward compat) ---
    case 'action':
      return {
        label: 'New Action',
        actionType: 'custom',
        config: {},
        timeout: 300,
        retryCount: 0,
      };
    case 'agent':
      return {
        label: 'New Agent',
        agentType: 'general',
        agentName: '',
        config: {},
        timeout: 300,
      };
    default:
      return { label: 'New Node', config: {} };
  }
};

// --------------------------------------------------------------------------
// Serialization: ReactFlow → Backend
// --------------------------------------------------------------------------

/**
 * Map a ReactFlow node type to an Argo template_type
 */
const nodeToTemplateType = (node) => {
  switch (node.type) {
    case 'container': return 'container';
    case 'script':    return 'script';
    case 'http':      return 'http';
    case 'suspend':   return 'suspend';
    case 'aiTask':    return 'container';
    case 'transform': return 'data';
    case 'condition': return 'condition';
    case 'assembler': return 'script';
    case 'sync':      return 'http';
    // n8n-inspired types
    case 'merge':       return 'script';
    case 'loop':        return 'script';
    case 'subworkflow': return 'container';
    case 'errorHandler': return 'script';
    // Legacy types
    case 'action':    return 'container';
    case 'agent':     return 'container';
    default:          return 'container';
  }
};

/**
 * Map a ReactFlow node to a backend step type string
 */
const nodeToStepType = (node) => {
  switch (node.type) {
    case 'container': return 'container';
    case 'script':    return 'script';
    case 'http':      return 'http';
    case 'suspend':   return 'suspend';
    case 'aiTask':    return 'aiTask';
    case 'transform': return 'transform';
    case 'condition': return 'condition';
    case 'assembler': return 'assembler';
    case 'sync':      return 'sync';
    case 'merge':       return 'merge';
    case 'loop':        return 'loop';
    case 'subworkflow': return 'subworkflow';
    case 'errorHandler': return 'errorHandler';
    // Legacy
    case 'action':    return node.data.actionType || 'custom';
    case 'agent':     return 'ai_analysis';
    default:          return 'custom';
  }
};

/**
 * Build the configuration object stored in backend for each node type
 */
const buildStepConfiguration = (node) => {
  const d = node.data;
  switch (node.type) {
    case 'container':
      return {
        image: d.image || '',
        command: d.command || [],
        args: d.args || [],
        env: d.env || [],
        resources: d.resources || {},
      };
    case 'script':
      return {
        language: d.language || 'python',
        source: d.source || '',
        image: d.image || LANGUAGE_IMAGES[d.language] || 'python:3.11-slim',
      };
    case 'http':
      return {
        url: d.url || '',
        method: d.method || 'GET',
        headers: d.headers || [],
        body: d.body || '',
        successCondition: d.successCondition || '',
        failureCondition: d.failureCondition || '',
      };
    case 'aiTask':
      return {
        aiTaskType: d.aiTaskType || 'llm',
        chainType: d.chainType || 'completion',
        model: d.model || 'gpt-4o-mini',
        prompt: d.prompt || '',
        systemPrompt: d.systemPrompt || '',
        maxTokens: d.maxTokens || 2000,
        temperature: d.temperature ?? 0.7,
        agentType: d.agentType || 'general',
        agentName: d.agentName || '',
        instructions: d.instructions || '',
        mcpEnabled: d.mcpEnabled || false,
        ragEnabled: d.ragEnabled || false,
        ragDataset: d.ragDataset || 'default',
        ragTopK: d.ragTopK || 5,
        image: d.image || AI_TASK_IMAGES[d.aiTaskType] || AI_TASK_IMAGES.llm,
      };
    case 'suspend':
      return {
        duration: d.duration || '',
        message: d.message || '',
        approverRole: d.approverRole || '',
      };
    case 'transform':
      return {
        transformType: d.transformType || 'expression',
        expression: d.expression || '',
        sourceStep: d.sourceStep || '',
        sourceParam: d.sourceParam || '',
        jsonpathQuery: d.jsonpathQuery || '',
        luaScript: d.luaScript || '',
        sprigFunction: d.sprigFunction || '',
        outputParam: d.outputParam || 'result',
      };
    case 'condition':
      return {
        conditionType: d.conditionType || 'expression',
        expression: d.expression || '',
        field: d.config?.field || '',
        value: d.config?.value || '',
      };
    case 'assembler':
      return {
        assembly_mode: d.assemblyMode || 'concat',
        output_format: d.outputFormat || 'text',
        instructions: d.instructions || '',
      };
    case 'sync':
      return {
        targets: (d.targets || []).map(t => ({
          type: t.type || 'in_app',
          url: t.url || '',
          include_result: t.includeResult !== false,
          message_template: t.messageTemplate || '',
        })),
        on_exit: d.onExit || false,
      };
    case 'merge':
      return {
        merge_mode: d.mergeMode || 'append',
        combine_field: d.combineField || '',
        choose_branch: d.chooseBranch || 0,
      };
    case 'loop':
      return {
        batch_size: d.batchSize || 0,
        input_source: d.inputSource || '',
      };
    case 'subworkflow':
      return {
        workflow_ref: d.workflowRef || '',
        workflow_name: d.workflowName || '',
        parameter_mapping: d.parameterMapping || {},
      };
    case 'errorHandler':
      return {
        action: d.actionType || 'log',
        notify_url: d.notifyUrl || '',
        error_workflow_id: d.errorWorkflowId || '',
      };
    // Legacy
    case 'agent':
      return {
        ...(d.config || {}),
        agent_type: d.agentType || 'general',
        agent_name: d.agentName || '',
      };
    default:
      return { ...(d.config || {}) };
  }
};

/**
 * Convert ReactFlow nodes and edges to backend API format.
 * Uses DAG dependencies (from edges) instead of linear order.
 */
export const nodesToBackendFormat = (nodes, edges, metadata = {}) => {
  const triggers = [];
  const steps = [];

  const eventSourceNodes = nodes.filter(n => n.type === 'eventSource');
  const stepNodes = nodes.filter(n => n.type !== 'eventSource');

  // Convert event source nodes to triggers
  eventSourceNodes.forEach((node) => {
    triggers.push({
      type: node.data.triggerType || 'manual',
      name: node.data.label || 'Trigger',
      configuration: node.data.config || {},
    });
  });

  // Build dependency map from edges (replaces topological sort + order)
  const dependencyMap = {};
  stepNodes.forEach(n => { dependencyMap[n.id] = []; });

  // Track condition-handle edges for `when` generation
  const conditionEdges = {}; // targetNodeId → { sourceNodeId, handle: 'true'|'false' }

  edges.forEach((edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = stepNodes.find(n => n.id === edge.target);
    if (targetNode && sourceNode && sourceNode.type !== 'eventSource') {
      dependencyMap[targetNode.id].push(sourceNode.id);

      // Track condition node handle info for downstream `when` generation
      if (sourceNode.type === 'condition' && (edge.sourceHandle === 'true' || edge.sourceHandle === 'false')) {
        conditionEdges[targetNode.id] = {
          sourceNodeId: sourceNode.id,
          handle: edge.sourceHandle,
        };
      }
    }
  });

  // Build a node-id → task-name map for dependency references
  const nodeIdToName = {};
  stepNodes.forEach((node) => {
    nodeIdToName[node.id] = toTaskName(node.data.label);
  });
  // Deduplicate task names
  const nameCount = {};
  stepNodes.forEach((node) => {
    const base = nodeIdToName[node.id];
    nameCount[base] = (nameCount[base] || 0) + 1;
    if (nameCount[base] > 1) {
      nodeIdToName[node.id] = `${base}-${nameCount[base]}`;
    }
  });

  // Also do topological ordering for the 'order' field (backward compat)
  const visited = new Set();
  const ordered = [];
  const visit = (nodeId) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const outEdges = edges.filter(e => e.source === nodeId);
    outEdges.forEach((edge) => {
      if (stepNodes.find(n => n.id === edge.target)) visit(edge.target);
    });
    if (stepNodes.find(n => n.id === nodeId)) ordered.unshift(stepNodes.find(n => n.id === nodeId));
  };
  eventSourceNodes.forEach((trigger) => {
    edges.filter(e => e.source === trigger.id).forEach((edge) => visit(edge.target));
  });
  stepNodes.forEach((node) => { if (!visited.has(node.id)) ordered.push(node); });

  // Convert step nodes to backend steps
  ordered.forEach((node, index) => {
    const deps = (dependencyMap[node.id] || []).map(id => nodeIdToName[id]);
    const templateType = nodeToTemplateType(node);

    const step = {
      name: node.data.label || `Step ${index + 1}`,
      type: nodeToStepType(node),
      template_type: templateType,
      template_name: nodeIdToName[node.id],
      order: index + 1,
      dependencies: deps,
      configuration: buildStepConfiguration(node),
      timeout: typeof node.data.timeout === 'string'
        ? parseTimeoutToSeconds(node.data.timeout)
        : (node.data.timeout || 300),
      retry_count: node.data.retryStrategy?.limit || node.data.retryCount || 0,
      when: node.data.when || node.data.expression || '',
      on_success: 'next',
      on_failure: 'abort',
    };

    // Auto-set `when` for steps downstream of a condition's true/false handle
    const condEdge = conditionEdges[node.id];
    if (condEdge) {
      const condTaskName = nodeIdToName[condEdge.sourceNodeId];
      if (condEdge.handle === 'true') {
        step.when = `{{tasks.${condTaskName}.outputs.result}} == true`;
      } else {
        step.when = `{{tasks.${condTaskName}.outputs.result}} == false`;
      }
    }

    // Retry strategy (new format)
    if (node.data.retryStrategy && node.data.retryStrategy.limit > 0) {
      step.retry_strategy = node.data.retryStrategy;
    }

    // Data pinning: include pinned data in configuration so backend can use it
    if (node.data.pinnedData) {
      step.configuration.pinned_data = typeof node.data.pinnedData === 'string'
        ? node.data.pinnedData
        : JSON.stringify(node.data.pinnedData);
    }

    // Inputs / outputs
    if (node.data.inputs?.parameters?.length || node.data.inputs?.artifacts?.length) {
      step.inputs = node.data.inputs;
    }
    if (node.data.outputs?.parameters?.length || node.data.outputs?.artifacts?.length) {
      step.outputs = node.data.outputs;
    }

    // Legacy condition fields (backward compat)
    if (node.type === 'condition') {
      step.conditions = {
        type: node.data.conditionType || 'expression',
        field: node.data.config?.field || '',
        value: node.data.config?.value || '',
        expression: node.data.expression || '',
      };
    }

    steps.push(step);
  });

  // Ensure at least one trigger and step for backend validation
  if (triggers.length === 0) {
    triggers.push({ type: 'manual', name: 'Manual Trigger', configuration: {} });
  }
  if (steps.length === 0) {
    steps.push({
      name: 'Default Step',
      type: 'custom',
      template_type: 'container',
      template_name: 'default-step',
      order: 1,
      dependencies: [],
      configuration: {},
      timeout: 300,
      retry_count: 0,
      on_success: 'complete',
      on_failure: 'abort',
    });
  }

  return {
    name: metadata.name || 'Untitled Workflow',
    description: metadata.description || '',
    type: metadata.type || 'custom',
    configuration: {
      reactflow: {
        nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })),
      },
    },
    steps,
    triggers,
  };
};

/**
 * Parse a human-friendly timeout string like '5m', '30s', '2h' to seconds
 */
const parseTimeoutToSeconds = (str) => {
  if (!str) return 300;
  const match = String(str).match(/^(\d+)(s|m|h)?$/);
  if (!match) return 300;
  const val = parseInt(match[1], 10);
  switch (match[2]) {
    case 'h': return val * 3600;
    case 'm': return val * 60;
    case 's': default: return val;
  }
};

// --------------------------------------------------------------------------
// Deserialization: Backend → ReactFlow
// --------------------------------------------------------------------------

/**
 * Convert a backend workflow back to ReactFlow nodes/edges.
 * Prefers stored reactflow layout if available.
 */
export const backendToNodes = (workflow) => {
  // If we have stored ReactFlow layout, use it directly
  if (workflow.configuration?.reactflow) {
    const { nodes, edges } = workflow.configuration.reactflow;
    return { nodes: nodes || [], edges: edges || [] };
  }

  // Otherwise, reconstruct from steps and triggers
  const nodes = [];
  const edgesOut = [];
  const xStart = 50;
  const yStart = 80;
  const xGap = 280;
  const yGap = 120;

  // Create trigger nodes
  (workflow.triggers || []).forEach((trigger, index) => {
    const nodeId = trigger.id || generateNodeId();
    nodes.push({
      id: nodeId,
      type: 'eventSource',
      position: { x: xStart, y: yStart + index * yGap },
      data: {
        label: trigger.name || `Trigger ${index + 1}`,
        triggerType: trigger.type || 'manual',
        config: trigger.configuration || {},
      },
    });
  });

  // Create step nodes
  const sortedSteps = [...(workflow.steps || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  sortedSteps.forEach((step, index) => {
    const nodeId = step.id || generateNodeId();
    const nodeType = stepToNodeType(step);

    nodes.push({
      id: nodeId,
      type: nodeType,
      position: { x: xStart + (index + 1) * xGap, y: yStart },
      data: stepToNodeData(step, nodeType),
    });

    // Connect to previous step or trigger (fallback for workflows without stored layout)
    if (index === 0) {
      nodes.filter(n => n.type === 'eventSource').forEach((triggerNode) => {
        edgesOut.push({
          id: `e-${triggerNode.id}-${nodeId}`,
          source: triggerNode.id,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
        });
      });
    } else {
      const prevStep = sortedSteps[index - 1];
      const prevNodeId = prevStep.id || nodes[nodes.length - 2]?.id;
      if (prevNodeId) {
        edgesOut.push({
          id: `e-${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
        });
      }
    }
  });

  return { nodes, edges: edgesOut };
};

/**
 * Map a backend step to a ReactFlow node type.
 * Supports new template_type field and legacy heuristics.
 */
const stepToNodeType = (step) => {
  // New-style: check template_type or type directly
  if (step.template_type) {
    switch (step.template_type) {
      case 'container': {
        // Could be a container or aiTask — check configuration
        const cfg = step.configuration || {};
        if (cfg.aiTaskType) return 'aiTask';
        return 'container';
      }
      case 'script': {
        const cfg = step.configuration || {};
        if (cfg.assembly_mode) return 'assembler';
        return 'script';
      }
      case 'http': {
        if (step.type === 'sync') return 'sync';
        const cfg = step.configuration || {};
        if (cfg.targets) return 'sync';
        return 'http';
      }
      case 'suspend':   return 'suspend';
      case 'data':      return 'transform';
      case 'condition': return 'condition';
    }
  }

  // Check step.type for new types
  switch (step.type) {
    case 'container':  return 'container';
    case 'script':     return 'script';
    case 'http':       return 'http';
    case 'suspend':    return 'suspend';
    case 'aiTask':     return 'aiTask';
    case 'transform':  return 'transform';
    case 'condition':  return 'condition';
    case 'assembler':  return 'assembler';
    case 'sync':       return 'sync';
    case 'merge':      return 'merge';
    case 'loop':       return 'loop';
    case 'subworkflow': return 'subworkflow';
    case 'errorHandler': return 'errorHandler';
  }

  // Legacy heuristics
  if (step.configuration?.agent_type || step.configuration?.agent_name) return 'agent';
  if (step.conditions && Object.keys(step.conditions).length > 0) return 'condition';
  return 'action';
};

/**
 * Map a backend step to ReactFlow node data
 */
const stepToNodeData = (step, nodeType) => {
  const cfg = step.configuration || {};
  const baseData = {
    label: step.name || 'Unnamed Step',
    timeout: step.timeout || 300,
    when: step.when || '',
  };

  switch (nodeType) {
    case 'container':
      return {
        ...baseData,
        image: cfg.image || '',
        command: cfg.command || [],
        args: cfg.args || [],
        env: cfg.env || [],
        resources: cfg.resources || {},
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [] },
        retryStrategy: step.retry_strategy || { ...DEFAULT_RETRY },
      };
    case 'script':
      return {
        ...baseData,
        language: cfg.language || 'python',
        source: cfg.source || '',
        image: cfg.image || LANGUAGE_IMAGES[cfg.language] || 'python:3.11-slim',
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [] },
        retryStrategy: step.retry_strategy || { ...DEFAULT_RETRY },
      };
    case 'http':
      return {
        ...baseData,
        url: cfg.url || '',
        method: cfg.method || 'GET',
        headers: cfg.headers || [],
        body: cfg.body || '',
        successCondition: cfg.successCondition || '',
        failureCondition: cfg.failureCondition || '',
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [] },
        retryStrategy: step.retry_strategy || { ...DEFAULT_RETRY },
      };
    case 'aiTask':
      return {
        ...baseData,
        aiTaskType: cfg.aiTaskType || 'llm',
        chainType: cfg.chainType || 'completion',
        model: cfg.model || 'gpt-4o-mini',
        prompt: cfg.prompt || '',
        systemPrompt: cfg.systemPrompt || '',
        maxTokens: cfg.maxTokens || 2000,
        temperature: cfg.temperature ?? 0.7,
        agentType: cfg.agentType || 'general',
        agentName: cfg.agentName || '',
        instructions: cfg.instructions || '',
        mcpEnabled: cfg.mcpEnabled || false,
        ragEnabled: cfg.ragEnabled || false,
        ragDataset: cfg.ragDataset || 'default',
        ragTopK: cfg.ragTopK || 5,
        image: cfg.image || '',
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [] },
        retryStrategy: step.retry_strategy || { ...DEFAULT_RETRY },
      };
    case 'suspend':
      return {
        ...baseData,
        duration: cfg.duration || '',
        message: cfg.message || '',
        approverRole: cfg.approverRole || '',
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [] },
      };
    case 'transform':
      return {
        ...baseData,
        transformType: cfg.transformType || 'expression',
        expression: cfg.expression || '',
        sourceStep: cfg.sourceStep || '',
        sourceParam: cfg.sourceParam || '',
        jsonpathQuery: cfg.jsonpathQuery || '',
        luaScript: cfg.luaScript || '',
        sprigFunction: cfg.sprigFunction || '',
        outputParam: cfg.outputParam || 'result',
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [{ name: 'result' }] },
      };
    case 'condition':
      return {
        ...baseData,
        conditionType: cfg.conditionType || step.conditions?.type || 'expression',
        expression: cfg.expression || step.conditions?.expression || '',
        config: {
          field: cfg.field || step.conditions?.field || '',
          value: cfg.value || step.conditions?.value || '',
        },
      };
    case 'assembler':
      return {
        ...baseData,
        assemblyMode: cfg.assembly_mode || 'concat',
        outputFormat: cfg.output_format || 'text',
        instructions: cfg.instructions || '',
        inputs: step.inputs || { parameters: [] },
        outputs: step.outputs || { parameters: [{ name: 'result' }] },
        retryStrategy: step.retry_strategy || { ...DEFAULT_RETRY },
      };
    case 'sync':
      return {
        ...baseData,
        targets: (cfg.targets || []).map(t => ({
          type: t.type || 'in_app',
          url: t.url || '',
          includeResult: t.include_result !== false,
          messageTemplate: t.message_template || '',
        })),
        onExit: cfg.on_exit || false,
      };
    // n8n-inspired flow control types
    case 'merge':
      return {
        ...baseData,
        mergeMode: cfg.merge_mode || 'append',
        combineField: cfg.combine_field || '',
        chooseBranch: cfg.choose_branch || 0,
      };
    case 'loop':
      return {
        ...baseData,
        batchSize: cfg.batch_size || 0,
        inputSource: cfg.input_source || '',
      };
    case 'subworkflow':
      return {
        ...baseData,
        workflowRef: cfg.workflow_ref || '',
        workflowName: cfg.workflow_name || '',
        parameterMapping: cfg.parameter_mapping || {},
      };
    case 'errorHandler':
      return {
        ...baseData,
        actionType: cfg.action || 'log',
        notifyUrl: cfg.notify_url || '',
        errorWorkflowId: cfg.error_workflow_id || '',
      };
    // Legacy types
    case 'agent':
      return {
        ...baseData,
        agentType: cfg.agent_type || 'general',
        agentName: cfg.agent_name || '',
        config: cfg,
        retryCount: step.retry_count || 0,
      };
    case 'action':
      return {
        ...baseData,
        actionType: step.type || 'custom',
        config: cfg,
        retryCount: step.retry_count || 0,
      };
    default:
      return { ...baseData, config: cfg, retryCount: step.retry_count || 0 };
  }
};

// --------------------------------------------------------------------------
// Template initialization
// --------------------------------------------------------------------------

/**
 * Convert initialData (blank canvas or template) to ReactFlow nodes/edges
 */
export const initialDataToNodes = (initialData) => {
  const nodes = [];
  const edgesOut = [];
  const xStart = 50;
  const yStart = 80;
  const xGap = 280;
  const yGap = 120;

  // Create trigger nodes
  const triggers = initialData.triggers || [];
  if (triggers.length === 0 && initialData.triggerType) {
    triggers.push({
      type: initialData.triggerType,
      name: `${initialData.triggerType.charAt(0).toUpperCase() + initialData.triggerType.slice(1)} Trigger`,
      configuration: {},
    });
  }

  triggers.forEach((trigger, index) => {
    const nodeId = generateNodeId();
    nodes.push({
      id: nodeId,
      type: 'eventSource',
      position: { x: xStart, y: yStart + index * yGap },
      data: {
        label: trigger.name || `Trigger ${index + 1}`,
        triggerType: trigger.type || 'manual',
        config: trigger.configuration || {},
      },
    });
  });

  // Create step nodes from template steps, respecting DAG dependencies
  const steps = initialData.steps || [];
  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Check if any step has a `dependencies` array — if so, use DAG layout
  const hasDagDeps = sortedSteps.some(s => Array.isArray(s.dependencies));

  // Map step name (sanitized) → nodeId for dependency wiring
  const stepNameToNodeId = {};
  const stepNodeIds = [];

  if (hasDagDeps) {
    // --- DAG-aware layout ---
    // Compute depth (column) for each step based on dependencies
    const toSanitized = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const stepDepths = {};
    const computeDepth = (step) => {
      const key = toSanitized(step.name);
      if (stepDepths[key] !== undefined) return stepDepths[key];
      const deps = step.dependencies || [];
      if (deps.length === 0) {
        stepDepths[key] = 0;
        return 0;
      }
      let maxParent = 0;
      deps.forEach((depName) => {
        const parentStep = sortedSteps.find(s => toSanitized(s.name) === depName);
        if (parentStep) maxParent = Math.max(maxParent, computeDepth(parentStep) + 1);
      });
      stepDepths[key] = maxParent;
      return maxParent;
    };
    sortedSteps.forEach(s => computeDepth(s));

    // Group steps by depth for vertical stacking
    const depthGroups = {};
    sortedSteps.forEach((step) => {
      const d = stepDepths[toSanitized(step.name)] || 0;
      if (!depthGroups[d]) depthGroups[d] = [];
      depthGroups[d].push(step);
    });

    // Create nodes with DAG-aware positioning
    sortedSteps.forEach((step) => {
      const nodeId = generateNodeId();
      const nodeType = stepToNodeType(step);
      const key = toSanitized(step.name);
      const depth = stepDepths[key] || 0;
      const group = depthGroups[depth];
      const indexInGroup = group.indexOf(step);
      const groupSize = group.length;

      // Spread parallel nodes vertically, center them
      const yOffset = groupSize > 1
        ? (indexInGroup - (groupSize - 1) / 2) * yGap
        : 0;

      nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: xStart + (depth + 1) * xGap, y: yStart + yOffset },
        data: stepToNodeData(step, nodeType),
      });

      stepNameToNodeId[key] = nodeId;
      stepNodeIds.push(nodeId);
    });

    // Create edges from dependencies
    sortedSteps.forEach((step) => {
      const key = toSanitized(step.name);
      const nodeId = stepNameToNodeId[key];
      const deps = step.dependencies || [];

      if (deps.length === 0) {
        // No dependencies → connect from trigger(s)
        nodes.filter(n => n.type === 'eventSource').forEach((triggerNode) => {
          edgesOut.push({
            id: `e-${triggerNode.id}-${nodeId}`,
            source: triggerNode.id,
            target: nodeId,
            sourceHandle: 'output',
            targetHandle: 'input',
          });
        });
      } else {
        deps.forEach((depName) => {
          const sourceId = stepNameToNodeId[depName];
          if (sourceId) {
            edgesOut.push({
              id: `e-${sourceId}-${nodeId}`,
              source: sourceId,
              target: nodeId,
              sourceHandle: 'output',
              targetHandle: 'input',
            });
          }
        });
      }
    });
  } else {
    // --- Legacy sequential layout (no dependencies arrays) ---
    sortedSteps.forEach((step, index) => {
      const nodeId = generateNodeId();
      const nodeType = stepToNodeType(step);

      nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: xStart + (index + 1) * xGap, y: yStart },
        data: stepToNodeData(step, nodeType),
      });

      stepNodeIds.push(nodeId);

      if (index === 0) {
        nodes.filter(n => n.type === 'eventSource').forEach((triggerNode) => {
          edgesOut.push({
            id: `e-${triggerNode.id}-${nodeId}`,
            source: triggerNode.id,
            target: nodeId,
            sourceHandle: 'output',
            targetHandle: 'input',
          });
        });
      } else {
        const prevNodeId = nodes[nodes.length - 2]?.id;
        if (prevNodeId) {
          edgesOut.push({
            id: `e-${prevNodeId}-${nodeId}`,
            source: prevNodeId,
            target: nodeId,
            sourceHandle: 'output',
            targetHandle: 'input',
          });
        }
      }
    });
  }

  if (nodes.length === 0) {
    nodes.push({
      id: generateNodeId(),
      type: 'eventSource',
      position: { x: xStart, y: yStart },
      data: { label: 'Manual Trigger', triggerType: 'manual', config: {} },
    });
  }

  return { nodes, edges: edgesOut };
};

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

/**
 * Validate a single trigger node's configuration.
 */
export const validateTriggerConfig = (data) => {
  const warnings = [];
  const triggerType = data.triggerType || 'manual';
  const config = data.config || {};

  switch (triggerType) {
    case 'schedule':
      if (!config.cron && !config.schedule?.time) warnings.push('No schedule configured');
      break;
    case 'webhook':
      if (!config.argo_event_source) warnings.push('No event source selected');
      break;
    case 'document_event':
      if (!config.event_type) warnings.push('No event type selected');
      break;
    case 'upload':
    case 'file_upload':
    case 'api':
    case 'manual':
    default:
      break;
  }

  return warnings;
};

/**
 * Validate a workflow before saving
 */
export const validateWorkflow = (nodes) => {
  const errors = [];

  const triggers = nodes.filter(n => n.type === 'eventSource');
  const steps = nodes.filter(n => n.type !== 'eventSource');

  if (triggers.length === 0) {
    errors.push('Workflow must have at least one trigger.');
  }
  if (steps.length === 0) {
    errors.push('Workflow must have at least one step.');
  }

  nodes.forEach((node) => {
    if (!node.data.label?.trim()) {
      errors.push(`Node "${node.id}" is missing a label.`);
    }
  });

  triggers.forEach((node) => {
    const triggerWarnings = validateTriggerConfig(node.data);
    triggerWarnings.forEach((w) => {
      errors.push(`Trigger "${node.data.label || node.id}": ${w}`);
    });
  });

  return { valid: errors.length === 0, errors };
};
