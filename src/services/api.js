// Mock API service to simulate real API calls
import { 
  notebooks, 
  agents, 
  workflows, 
  mlModels, 
  analyticsData, 
  experiments,
  communityItems,
  liveEvents,
  streamSources
} from '../data/mockData.js';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API endpoints
export const api = {
  // Notebooks endpoints
  notebooks: {
    getAll: async () => {
      await delay(500);
      return { data: notebooks, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const notebook = notebooks.find(n => n.id === id);
      if (!notebook) {
        throw new Error('Notebook not found');
      }
      return { data: notebook, success: true };
    },
    create: async (notebookData) => {
      await delay(800);
      const newNotebook = {
        ...notebookData,
        id: Date.now(),
        documents: 0,
        collaborators: 1,
        likes: 0,
        auditScore: 100
      };
      return { data: newNotebook, success: true };
    },
    update: async (id, updates) => {
      await delay(600);
      return { data: { id, ...updates }, success: true };
    },
    delete: async (id) => {
      await delay(500);
      return { success: true };
    }
  },

  // Agents endpoints
  agents: {
    getAll: async () => {
      await delay(600);
      return { data: agents, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const agent = agents.find(a => a.id === id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      return { data: agent, success: true };
    },
    create: async (agentData) => {
      await delay(1000);
      const newAgent = {
        ...agentData,
        id: Date.now(),
        status: 'training',
        runs: 0,
        accuracy: 0
      };
      return { data: newAgent, success: true };
    },
    updateStatus: async (id, status) => {
      await delay(400);
      return { data: { id, status }, success: true };
    }
  },

  // Workflows endpoints
  workflows: {
    getAll: async () => {
      await delay(400);
      return { data: workflows, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const workflow = workflows.find(w => w.id === id);
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      return { data: workflow, success: true };
    },
    toggleStatus: async (id) => {
      await delay(500);
      const workflow = workflows.find(w => w.id === id);
      const newStatus = workflow.status === 'active' ? 'paused' : 'active';
      return { data: { id, status: newStatus }, success: true };
    }
  },

  // ML Models endpoints
  mlModels: {
    getAll: async () => {
      await delay(700);
      return { data: mlModels, success: true };
    },
    getById: async (id) => {
      await delay(300);
      const model = mlModels.find(m => m.id === id);
      if (!model) {
        throw new Error('Model not found');
      }
      return { data: model, success: true };
    },
    retrain: async (id) => {
      await delay(2000);
      return { data: { id, status: 'training' }, success: true };
    }
  },

  // Analytics endpoints
  analytics: {
    getMetrics: async () => {
      await delay(400);
      return { data: analyticsData, success: true };
    },
    getExperiments: async () => {
      await delay(500);
      return { data: experiments, success: true };
    }
  },

  // Community endpoints
  community: {
    getAll: async () => {
      await delay(600);
      return { data: communityItems, success: true };
    },
    search: async (query) => {
      await delay(400);
      const filtered = communityItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.author.toLowerCase().includes(query.toLowerCase())
      );
      return { data: filtered, success: true };
    }
  },

  // Streaming endpoints
  streaming: {
    getLiveEvents: async () => {
      await delay(200);
      return { data: liveEvents, success: true };
    },
    getStreamSources: async () => {
      await delay(300);
      return { data: streamSources, success: true };
    }
  }
};