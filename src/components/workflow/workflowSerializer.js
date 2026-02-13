/**
 * Serialization utilities for converting between ReactFlow nodes/edges
 * and the backend workflow API format (steps, triggers, configuration).
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
 * Map from backend step types to ReactFlow node types
 */
const stepTypeToNodeType = {
  process_document: 'action',
  compliance_check: 'action',
  approval: 'action',
  notification: 'action',
  ai_analysis: 'action',
  custom: 'action',
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
        config: {},
      };
    case 'action':
      return {
        label: 'New Action',
        actionType: 'custom',
        config: {},
        timeout: 300,
        retryCount: 0,
      };
    case 'condition':
      return {
        label: 'New Condition',
        conditionType: 'contains',
        config: { field: '', value: '' },
      };
    case 'agent':
      return {
        label: 'New Agent',
        agentType: 'general',
        agentName: '',
        config: {},
        timeout: 300,
      };
    case 'sync':
      return {
        label: 'Sync Point',
        syncMode: 'all',
        timeout: 300,
        config: {},
      };
    default:
      return { label: 'New Node', config: {} };
  }
};

/**
 * Convert ReactFlow nodes and edges to backend API format
 * @param {Array} nodes - ReactFlow nodes
 * @param {Array} edges - ReactFlow edges
 * @param {Object} metadata - { name, description, type }
 * @returns {Object} Backend-compatible workflow data for create/update
 */
export const nodesToBackendFormat = (nodes, edges, metadata = {}) => {
  const triggers = [];
  const steps = [];

  // Separate nodes into triggers and steps
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

  // Build a map of node connections from edges for ordering
  const outgoingEdges = {};
  const incomingEdges = {};
  edges.forEach((edge) => {
    if (!outgoingEdges[edge.source]) outgoingEdges[edge.source] = [];
    outgoingEdges[edge.source].push(edge);
    if (!incomingEdges[edge.target]) incomingEdges[edge.target] = [];
    incomingEdges[edge.target].push(edge);
  });

  // Topological ordering: find nodes connected from triggers first
  const visited = new Set();
  const ordered = [];

  const visit = (nodeId) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const outEdges = outgoingEdges[nodeId] || [];
    outEdges.forEach((edge) => {
      const targetNode = stepNodes.find(n => n.id === edge.target);
      if (targetNode) {
        visit(targetNode.id);
      }
    });
    const node = stepNodes.find(n => n.id === nodeId);
    if (node) ordered.unshift(node);
  };

  // Start from trigger outputs
  eventSourceNodes.forEach((trigger) => {
    const outEdges = outgoingEdges[trigger.id] || [];
    outEdges.forEach((edge) => {
      visit(edge.target);
    });
  });

  // Add any disconnected step nodes at the end
  stepNodes.forEach((node) => {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  });

  // Convert step nodes to backend steps
  ordered.forEach((node, index) => {
    const step = {
      name: node.data.label || `Step ${index + 1}`,
      type: nodeToStepType(node),
      order: index + 1,
      configuration: buildStepConfiguration(node),
      timeout: node.data.timeout || 300,
      retry_count: node.data.retryCount || 0,
    };

    // Determine on_success from outgoing edges
    const outEdges = outgoingEdges[node.id] || [];
    const nextStepEdge = outEdges.find(e =>
      e.sourceHandle === 'output' || e.sourceHandle === 'true' || !e.sourceHandle
    );
    if (nextStepEdge) {
      const nextNode = ordered.find(n => n.id === nextStepEdge.target);
      step.on_success = nextNode ? 'next' : 'complete';
    } else {
      step.on_success = 'complete';
    }

    // Determine on_failure
    step.on_failure = 'abort';

    // For condition nodes, add conditions
    if (node.type === 'condition') {
      step.conditions = {
        type: node.data.conditionType || 'contains',
        field: node.data.config?.field || '',
        value: node.data.config?.value || '',
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
      order: 1,
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
      // Store ReactFlow layout for re-loading
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
 * Map a ReactFlow node to a backend step type
 */
const nodeToStepType = (node) => {
  switch (node.type) {
    case 'action':
      return node.data.actionType || 'custom';
    case 'condition':
      return 'custom'; // Conditions are encoded via step.conditions
    case 'agent':
      return 'ai_analysis'; // Agents map to ai_analysis step type
    case 'sync':
      return 'custom'; // Sync is a custom step type
    default:
      return 'custom';
  }
};

/**
 * Build step configuration from node data
 */
const buildStepConfiguration = (node) => {
  const config = { ...(node.data.config || {}) };

  switch (node.type) {
    case 'agent':
      config.agent_type = node.data.agentType || 'general';
      config.agent_name = node.data.agentName || '';
      break;
    case 'sync':
      config.sync_mode = node.data.syncMode || 'all';
      break;
    default:
      break;
  }

  return config;
};

/**
 * Convert a backend workflow (with steps/triggers) back to ReactFlow nodes/edges.
 * Prefers stored reactflow layout if available in configuration.
 * @param {Object} workflow - Backend workflow object
 * @returns {{ nodes: Array, edges: Array }}
 */
export const backendToNodes = (workflow) => {
  // If we have stored ReactFlow layout, use it directly
  if (workflow.configuration?.reactflow) {
    const { nodes, edges } = workflow.configuration.reactflow;
    return {
      nodes: nodes || [],
      edges: edges || [],
    };
  }

  // Otherwise, reconstruct from steps and triggers
  const nodes = [];
  const edges = [];
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

  // Create step nodes and edges
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

    // Connect to previous step or trigger
    if (index === 0) {
      // Connect first step to all triggers
      nodes.filter(n => n.type === 'eventSource').forEach((triggerNode) => {
        edges.push({
          id: `e-${triggerNode.id}-${nodeId}`,
          source: triggerNode.id,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
        });
      });
    } else {
      // Connect to previous step
      const prevStep = sortedSteps[index - 1];
      const prevNodeId = prevStep.id || nodes[nodes.length - 2]?.id;
      if (prevNodeId) {
        edges.push({
          id: `e-${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
        });
      }
    }
  });

  return { nodes, edges };
};

/**
 * Map a backend step to a ReactFlow node type
 */
const stepToNodeType = (step) => {
  // Check configuration hints
  if (step.configuration?.agent_type || step.configuration?.agent_name) {
    return 'agent';
  }
  if (step.configuration?.sync_mode) {
    return 'sync';
  }
  if (step.conditions && Object.keys(step.conditions).length > 0) {
    return 'condition';
  }
  return 'action';
};

/**
 * Map a backend step to ReactFlow node data
 */
const stepToNodeData = (step, nodeType) => {
  const baseData = {
    label: step.name || 'Unnamed Step',
    config: step.configuration || {},
    timeout: step.timeout || 300,
    retryCount: step.retry_count || 0,
  };

  switch (nodeType) {
    case 'action':
      return {
        ...baseData,
        actionType: step.type || 'custom',
      };
    case 'agent':
      return {
        ...baseData,
        agentType: step.configuration?.agent_type || 'general',
        agentName: step.configuration?.agent_name || '',
      };
    case 'sync':
      return {
        ...baseData,
        syncMode: step.configuration?.sync_mode || 'all',
      };
    case 'condition':
      return {
        ...baseData,
        conditionType: step.conditions?.type || 'contains',
        config: {
          ...baseData.config,
          field: step.conditions?.field || '',
          value: step.conditions?.value || '',
        },
      };
    default:
      return baseData;
  }
};

/**
 * Convert initialData (from create modal - blank canvas or template) to ReactFlow nodes/edges
 * @param {Object} initialData - { name, description, type, triggerType, steps, triggers }
 * @returns {{ nodes: Array, edges: Array }}
 */
export const initialDataToNodes = (initialData) => {
  const nodes = [];
  const edges = [];
  const xStart = 50;
  const yStart = 80;
  const xGap = 280;
  const yGap = 120;

  // Create trigger nodes
  const triggers = initialData.triggers || [];
  if (triggers.length === 0 && initialData.triggerType) {
    // Blank canvas with a trigger type specified
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

  // Create step nodes from template steps
  const steps = initialData.steps || [];
  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

  sortedSteps.forEach((step, index) => {
    const nodeId = generateNodeId();
    const nodeType = stepToNodeType(step);

    nodes.push({
      id: nodeId,
      type: nodeType,
      position: { x: xStart + (index + 1) * xGap, y: yStart },
      data: stepToNodeData(step, nodeType),
    });

    // Connect to previous node
    if (index === 0) {
      // Connect to triggers
      nodes.filter(n => n.type === 'eventSource').forEach((triggerNode) => {
        edges.push({
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
        edges.push({
          id: `e-${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
        });
      }
    }
  });

  // If blank canvas with no steps, just show the trigger
  if (nodes.length === 0) {
    nodes.push({
      id: generateNodeId(),
      type: 'eventSource',
      position: { x: xStart, y: yStart },
      data: {
        label: 'Manual Trigger',
        triggerType: 'manual',
        config: {},
      },
    });
  }

  return { nodes, edges };
};

/**
 * Validate a workflow before saving
 * @param {Array} nodes - ReactFlow nodes
 * @returns {{ valid: boolean, errors: string[] }}
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

  // Check for empty labels
  nodes.forEach((node) => {
    if (!node.data.label?.trim()) {
      errors.push(`Node "${node.id}" is missing a label.`);
    }
  });

  return { valid: errors.length === 0, errors };
};
