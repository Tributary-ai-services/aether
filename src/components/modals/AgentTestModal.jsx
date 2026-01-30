import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Clock, DollarSign, RotateCcw, ArrowRight, AlertTriangle, CheckCircle, Play, Square } from 'lucide-react';
import { useAgentExecution } from '../../hooks/useAgentBuilder.js';

const AgentTestModal = ({ isOpen, onClose, agent }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  const messagesEndRef = useRef(null);
  const { startExecution, stopExecution, loading, error } = useAgentExecution(agent?.id);

  // DEBUG: Log agent data when modal opens
  useEffect(() => {
    if (isOpen && agent) {
      console.log('AgentTestModal - Agent data:', JSON.stringify(agent, null, 2));
      console.log('AgentTestModal - Agent type:', agent?.type, '| typeof:', typeof agent?.type);
      console.log('AgentTestModal - Agent Type (capital):', agent?.Type, '| typeof:', typeof agent?.Type);
      console.log('AgentTestModal - All agent keys:', Object.keys(agent));
    }
  }, [isOpen, agent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, currentExecution]);

  useEffect(() => {
    if (isOpen) {
      setChatHistory([]);
      setCurrentExecution(null);
      setMessage('');
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = { type: 'user', content: message, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');

    try {
      // Build execution request based on agent type
      const executionRequest = {
        message: currentMessage,
        input: currentMessage  // Backend expects 'input' field
      };
      
      // Add type-specific parameters
      if (agent?.type === 'conversational') {
        // Include conversation history for conversational agents
        executionRequest.conversation_id = currentExecution?.conversation_id || null;
        executionRequest.history = chatHistory.filter(msg => msg.type !== 'error').map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }));
      } else if (agent?.type === 'qa') {
        // For Q&A agents, could add source selection here
        executionRequest.max_results = 5;
        // executionRequest.sources = []; // Add notebook IDs if available
      } else if (agent?.type === 'producer') {
        // For producer agents, could add template params
        executionRequest.output_format = 'text';
      }
      
      const execution = await startExecution(executionRequest);
      
      setCurrentExecution(execution);
      
      // Add agent response with proper content
      setChatHistory(prev => [...prev, {
        type: 'agent',
        content: execution.output || 'Processing...', 
        execution: execution,
        timestamp: new Date(),
        streaming: false, // Backend doesn't support streaming yet
        sources: execution.sources // For Q&A agents
      }]);

    } catch (error) {
      setChatHistory(prev => [...prev, {
        type: 'error',
        content: error.message || 'Failed to execute agent',
        timestamp: new Date()
      }]);
    }
  };

  const handleStopExecution = async () => {
    if (currentExecution) {
      try {
        await stopExecution(currentExecution.id);
        setCurrentExecution(null);
        
        // Update the streaming message to show it was stopped
        setChatHistory(prev => prev.map(msg => 
          msg.streaming ? { ...msg, streaming: false, stopped: true } : msg
        ));
      } catch (error) {
        console.error('Failed to stop execution:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(4)}`;
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const ExecutionMetrics = ({ execution }) => {
    if (!execution) return null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 text-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-500" />
            <span className="text-gray-600">
              {execution.response_time_ms ? formatDuration(execution.response_time_ms) : 'Running...'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <DollarSign size={12} className="text-green-600" />
            <span className="text-gray-600">
              {formatCurrency(execution.cost_usd)}
            </span>
          </div>
          
          {execution.retry_attempts > 0 && (
            <div className="flex items-center gap-1">
              <RotateCcw size={12} className="text-orange-500" />
              <span className="text-gray-600">
                {execution.retry_attempts} retries
              </span>
            </div>
          )}
          
          {execution.fallback_used && (
            <div className="flex items-center gap-1">
              <ArrowRight size={12} className="text-blue-500" />
              <span className="text-gray-600">
                Fallback used
              </span>
            </div>
          )}
        </div>
        
        {execution.provider_chain && execution.provider_chain.length > 1 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-gray-500 mb-1">Provider chain:</div>
            <div className="flex items-center gap-1 flex-wrap">
              {execution.provider_chain.map((provider, index) => (
                <React.Fragment key={provider}>
                  <span className={`px-2 py-1 rounded text-xs ${
                    index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {provider}
                  </span>
                  {index < execution.provider_chain.length - 1 && (
                    <ArrowRight size={10} className="text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-100' : isError ? 'bg-red-100' : 'bg-purple-100'
          }`}>
            {isUser ? (
              <User size={16} className="text-blue-600" />
            ) : isError ? (
              <AlertTriangle size={16} className="text-red-600" />
            ) : (
              <Bot size={16} className="text-purple-600" />
            )}
          </div>
          
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-(--color-primary-600) text-(--color-primary-contrast)' 
              : isError 
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-white border border-gray-200'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {message.streaming && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="ml-2">Thinking...</span>
              </div>
            )}
            
            {message.stopped && (
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                <Square size={10} />
                <span>Execution stopped</span>
              </div>
            )}
            
            {/* Show sources for Q&A agent responses */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Sources used:</div>
                {message.sources.map((source, idx) => (
                  <div key={idx} className="text-xs bg-blue-50 rounded p-2 mb-1">
                    <div className="font-medium text-blue-900">{source.notebook_name || 'Knowledge Base'}</div>
                    <div className="text-blue-700 mt-1 line-clamp-2">{source.content}</div>
                    <div className="text-blue-600 mt-1">Relevance: {Math.round((source.relevance || 0) * 100)}%</div>
                  </div>
                ))}
              </div>
            )}
            
            <ExecutionMetrics execution={message.execution} />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Test Agent</h2>
              <p className="text-sm text-gray-600">{agent?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  agent?.type === 'conversational' ? 'bg-purple-100 text-purple-700' :
                  agent?.type === 'qa' ? 'bg-blue-100 text-blue-700' :
                  agent?.type === 'producer' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {agent?.type === 'conversational' ? '💬 Conversational' :
                   agent?.type === 'qa' ? '❓ Q&A' :
                   agent?.type === 'producer' ? '✨ Producer' :
                   `Unknown Type (raw: "${agent?.type}")`}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Agent Info */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <strong>Provider:</strong> {agent?.llm_config?.provider || 'Unknown'}
              </span>
              <span className="text-gray-600">
                <strong>Model:</strong> {agent?.llm_config?.model || 'Unknown'}
              </span>
              {agent?.llm_config?.retry_config && (
                <span className="text-gray-600">
                  <strong>Max Retries:</strong> {agent.llm_config.retry_config.max_attempts - 1}
                </span>
              )}
              {agent?.llm_config?.fallback_config?.enabled && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle size={12} />
                  Fallback enabled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Bot size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm">Send a message to test your agent's capabilities</p>
            </div>
          ) : (
            <div>
              {chatHistory.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) resize-none"
                disabled={loading}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading}
                className="px-4 py-3 bg-(--color-primary-600) text-(--color-primary-contrast) rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Running</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
              
              {loading && currentExecution && (
                <button
                  onClick={handleStopExecution}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                >
                  <Square size={14} />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to send, 
            <kbd className="px-1 py-0.5 bg-gray-100 rounded ml-1">Shift + Enter</kbd> for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTestModal;