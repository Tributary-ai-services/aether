import { useState, useCallback } from 'react';
import { api } from '../services/api.js';

/**
 * Hook for AI-assisted prompt authoring using the Prompt Assistant agent
 * Provides conversation-based assistance for improving agent descriptions and system prompts
 */
export const usePromptAssist = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  /**
   * Send a message to the Prompt Assistant
   * @param {string} input - User's message
   * @param {object} context - Context about the agent being created
   * @param {string} context.assistFor - What field is being assisted: "description" or "system_prompt"
   * @param {string} context.agentName - Name of the agent being created
   * @param {string} context.agentType - Type of agent: "qa", "conversational", or "producer"
   * @param {string} context.currentDescription - Current description text
   * @param {string} context.currentSystemPrompt - Current system prompt text
   */
  const sendMessage = useCallback(async (input, context = null) => {
    try {
      setLoading(true);
      setError(null);

      // Add user message to history
      const userMessage = {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Convert message history to the format expected by the API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Execute the Prompt Assistant internal agent
      const response = await api.internalAgents.execute(input, history, sessionId, context);

      // Update session ID if returned
      if (response.conversation_id) {
        setSessionId(response.conversation_id);
      }

      // Add assistant message to history
      const assistantMessage = {
        role: 'assistant',
        content: response.output,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      return {
        success: true,
        output: response.output,
        metadata: response.metadata
      };
    } catch (err) {
      console.error('Failed to send message to Prompt Assistant:', err);
      setError(err.message || 'Failed to get assistance');

      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [messages, sessionId]);

  /**
   * Start a new conversation with initial context
   * @param {object} context - Context about what needs assistance
   */
  const startConversation = useCallback(async (context) => {
    // Clear previous conversation
    setMessages([]);
    setSessionId(null);
    setError(null);

    // Build initial prompt based on context
    let initialPrompt = '';

    if (context.assistFor === 'description') {
      if (context.currentDescription) {
        initialPrompt = `I need help improving this agent description:\n\n"${context.currentDescription}"\n\nThe agent is named "${context.agentName || 'Untitled'}" and is a ${context.agentType || 'conversational'} agent.`;
      } else {
        initialPrompt = `I need help writing a description for my ${context.agentType || 'conversational'} agent named "${context.agentName || 'Untitled'}". Can you suggest a compelling description?`;
      }
    } else if (context.assistFor === 'system_prompt') {
      if (context.currentSystemPrompt) {
        initialPrompt = `I need help improving this system prompt:\n\n"${context.currentSystemPrompt}"\n\nThe agent is named "${context.agentName || 'Untitled'}" and is a ${context.agentType || 'conversational'} agent.`;
      } else {
        initialPrompt = `I need help writing a system prompt for my ${context.agentType || 'conversational'} agent named "${context.agentName || 'Untitled'}". The agent should: ${context.currentDescription || 'perform AI tasks'}. Can you suggest an effective system prompt?`;
      }
    }

    // Send the initial message
    return sendMessage(initialPrompt, context);
  }, [sendMessage]);

  /**
   * Extract the suggested text from the last assistant message
   * Looks for text in various formats: quotes, markdown code blocks, etc.
   */
  const extractSuggestion = useCallback(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMessage) return null;

    const content = lastAssistantMessage.content;
    if (!content) return null;

    // 1. Try to extract from markdown code blocks (```text``` or ```\ntext\n```)
    const codeBlockMatch = content.match(/```(?:\w+)?\s*\n?([\s\S]+?)\n?```/);
    if (codeBlockMatch && codeBlockMatch[1].trim().length >= 20) {
      return codeBlockMatch[1].trim();
    }

    // 2. Look for text between standard double quotes (substantial quoted block)
    const standardQuoteMatch = content.match(/"([^"]{20,})"/);
    if (standardQuoteMatch) {
      return standardQuoteMatch[1];
    }

    // 3. Look for text between smart/curly double quotes
    const smartQuoteMatch = content.match(/[""]([^""]{20,})[""]/);
    if (smartQuoteMatch) {
      return smartQuoteMatch[1];
    }

    // 4. Look for text between single quotes (substantial quoted block)
    const singleQuoteMatch = content.match(/'([^']{20,})'/);
    if (singleQuoteMatch) {
      return singleQuoteMatch[1];
    }

    // 5. Look for a section starting with "Suggested:" or "Here's" followed by text
    const suggestedMatch = content.match(/(?:Suggested|Here's|Here is)[:\s]+[""]?([^"""\n]{20,})[""]?/i);
    if (suggestedMatch) {
      return suggestedMatch[1].trim();
    }

    // 6. If there are multiple paragraphs, return the first substantial one
    //    (often the AI puts the suggestion first, then explains)
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length >= 20);
    if (paragraphs.length > 0) {
      // Return the first paragraph that looks like content (not a question or instruction)
      const suggestionPara = paragraphs.find(p =>
        !p.trim().endsWith('?') &&
        !p.toLowerCase().startsWith('would you') &&
        !p.toLowerCase().startsWith('do you') &&
        !p.toLowerCase().startsWith('let me know')
      );
      if (suggestionPara) {
        return suggestionPara.trim();
      }
    }

    // 7. Last resort: return the entire message
    return content;
  }, [messages]);

  /**
   * Clear the conversation and start fresh
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    messages,
    sessionId,
    sendMessage,
    startConversation,
    extractSuggestion,
    clearConversation
  };
};

export default usePromptAssist;
