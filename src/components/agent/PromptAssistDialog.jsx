import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { usePromptAssist } from '../../hooks/usePromptAssist.js';

/**
 * PromptAssistDialog - A chat dialog for AI-assisted prompt authoring
 * Uses the Prompt Assistant internal agent to help users improve agent descriptions and system prompts
 */
const PromptAssistDialog = ({
  isOpen,
  onClose,
  onApply,
  assistFor = 'description', // 'description' or 'system_prompt'
  agentName = '',
  agentType = 'conversational',
  currentValue = ''
}) => {
  const {
    loading,
    error,
    messages,
    sendMessage,
    startConversation,
    extractSuggestion,
    clearConversation
  } = usePromptAssist();

  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Clear conversation when assistFor changes (switching between description and system_prompt)
  useEffect(() => {
    clearConversation();
  }, [assistFor, clearConversation]);

  // Start conversation when dialog opens and no messages exist
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const context = {
        assistFor,
        agentName,
        agentType,
        currentDescription: assistFor === 'description' ? currentValue : '',
        currentSystemPrompt: assistFor === 'system_prompt' ? currentValue : ''
      };
      startConversation(context);
    }
  }, [isOpen, messages.length, assistFor, agentName, agentType, currentValue, startConversation]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const message = inputValue.trim();
    setInputValue('');

    await sendMessage(message, {
      assistFor,
      agentName,
      agentType,
      currentDescription: assistFor === 'description' ? currentValue : '',
      currentSystemPrompt: assistFor === 'system_prompt' ? currentValue : ''
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = () => {
    const suggestion = extractSuggestion();
    if (suggestion && suggestion.recommendation) {
      onApply(suggestion.recommendation);
      onClose();
    }
  };

  const handleCopy = async () => {
    const suggestion = extractSuggestion();
    if (suggestion && suggestion.recommendation) {
      await navigator.clipboard.writeText(suggestion.recommendation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get the current suggestion for displaying reasoning/comments
  const currentSuggestion = messages.length > 0 ? extractSuggestion() : null;

  // Helper to convert a structured recommendation object to a formatted string
  const formatStructuredRecommendation = (rec) => {
    if (typeof rec === 'string') {
      return rec.trim();
    }

    if (typeof rec === 'object' && rec !== null) {
      const parts = [];

      // Add role/main description
      if (rec.role) {
        parts.push(rec.role);
      }

      // Add capabilities
      if (rec.capabilities && Array.isArray(rec.capabilities) && rec.capabilities.length > 0) {
        parts.push('\n\nCapabilities:');
        rec.capabilities.forEach((cap, i) => {
          parts.push(`${i + 1}. ${cap}`);
        });
      }

      // Add constraints/guidelines
      if (rec.constraints && Array.isArray(rec.constraints) && rec.constraints.length > 0) {
        parts.push('\n\nGuidelines:');
        rec.constraints.forEach((con, i) => {
          parts.push(`${i + 1}. ${con}`);
        });
      }

      return parts.join('\n').trim();
    }

    return String(rec);
  };

  // Helper to format assistant message content for display
  // If it's JSON, extract and display the recommendation nicely
  const formatAssistantContent = (content) => {
    if (!content) return '';

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.recommendation) {
        return formatStructuredRecommendation(parsed.recommendation);
      }
    } catch {
      // Not JSON
    }

    // Try extracting JSON from markdown code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]+?)\n?```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (parsed && parsed.recommendation) {
          return formatStructuredRecommendation(parsed.recommendation);
        }
      } catch {
        // Not valid JSON in code block
      }
    }

    // Try finding a JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*"recommendation"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.recommendation) {
          return formatStructuredRecommendation(parsed.recommendation);
        }
      } catch {
        // Not valid JSON
      }
    }

    // Return original content for non-JSON responses
    return content;
  };

  const handleNewConversation = () => {
    clearConversation();
    const context = {
      assistFor,
      agentName,
      agentType,
      currentDescription: assistFor === 'description' ? currentValue : '',
      currentSystemPrompt: assistFor === 'system_prompt' ? currentValue : ''
    };
    startConversation(context);
  };

  if (!isOpen) return null;

  const fieldLabel = assistFor === 'description' ? 'Description' : 'System Prompt';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Prompt Assistant</h2>
              <p className="text-sm text-gray-500">Improving {fieldLabel.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Start new conversation"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-(--color-primary-600) text-(--color-primary-contrast)'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.role === 'assistant'
                    ? formatAssistantContent(message.content)
                    : message.content}
                </div>
                {message.role === 'assistant' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    {/* Show reasoning if available (from JSON response) */}
                    {index === messages.length - 1 && currentSuggestion?.reasoning && (
                      <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                        <span className="font-medium">Why: </span>
                        {currentSuggestion.reasoning}
                      </div>
                    )}
                    {/* Show comments/questions if available */}
                    {index === messages.length - 1 && currentSuggestion?.comments && (
                      <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        {currentSuggestion.comments}
                      </div>
                    )}
                    <button
                      onClick={handleCopy}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy suggestion
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for adjustments or refinements..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 text-sm"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500">
            Suggestions will be applied to the {fieldLabel.toLowerCase()} field
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={messages.length < 2}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
            >
              <Check size={16} />
              Apply to {fieldLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptAssistDialog;
