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
   * Extract the suggested text from assistant messages
   * Searches ALL assistant messages (most recent first) for JSON recommendations
   * Falls back to legacy regex patterns on the last message if no JSON found
   * Returns: { recommendation: string, reasoning: string|null, comments: string|null }
   */
  const extractSuggestion = useCallback(() => {
    // Get all assistant messages in reverse order (most recent first)
    const assistantMessages = [...messages].reverse().filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) return null;

    // Helper to create a structured result
    const createResult = (recommendation, reasoning = null, comments = null) => ({
      recommendation,
      reasoning,
      comments
    });

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

        // Add any other string fields
        Object.entries(rec).forEach(([key, value]) => {
          if (typeof value === 'string' && !['role'].includes(key)) {
            // Skip already handled fields
            if (!['capabilities', 'constraints'].includes(key)) {
              parts.push(`\n\n${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
            }
          }
        });

        return parts.join('\n').trim();
      }

      return String(rec);
    };

    // Helper to try parsing JSON from content
    const tryParseJSON = (text) => {
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.recommendation) {
          const formattedRec = formatStructuredRecommendation(parsed.recommendation);
          if (formattedRec) {
            return createResult(
              formattedRec,
              parsed.reasoning || null,
              parsed.comments || null
            );
          }
        }
      } catch {
        // Not valid JSON, continue to other methods
      }
      return null;
    };

    // Helper to try extracting JSON from a message content
    const tryExtractJSONFromContent = (content) => {
      if (!content) return null;

      // Try parsing the content directly as JSON
      let result = tryParseJSON(content);
      if (result) return result;

      // Try extracting JSON from markdown code blocks (```json ... ``` or ``` ... ```)
      const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]+?)\n?```/);
      if (codeBlockMatch) {
        result = tryParseJSON(codeBlockMatch[1].trim());
        if (result) return result;
      }

      // Try finding a JSON object in the content (may be surrounded by text)
      const jsonMatch = content.match(/\{[\s\S]*"recommendation"[\s\S]*\}/);
      if (jsonMatch) {
        result = tryParseJSON(jsonMatch[0]);
        if (result) return result;
      }

      return null;
    };

    // 1. Search ALL assistant messages for JSON recommendations (most recent first)
    for (const message of assistantMessages) {
      const result = tryExtractJSONFromContent(message.content);
      if (result) {
        return result;
      }
    }

    // 2. No JSON found in any message - fall back to legacy extraction on the last message
    const lastContent = assistantMessages[0]?.content;
    if (!lastContent) return null;

    // 2a. Try to extract from markdown code blocks (substantial content)
    const codeBlockMatch = lastContent.match(/```(?:json)?\s*\n?([\s\S]+?)\n?```/);
    if (codeBlockMatch && codeBlockMatch[1].trim().length >= 20) {
      return createResult(codeBlockMatch[1].trim());
    }

    // 2b. Look for text between standard double quotes (substantial quoted block)
    const standardQuoteMatch = lastContent.match(/"([^"]{20,})"/);
    if (standardQuoteMatch) {
      return createResult(standardQuoteMatch[1]);
    }

    // 2c. Look for text between smart/curly double quotes
    const smartQuoteMatch = lastContent.match(/[""]([^""]{20,})[""]/);
    if (smartQuoteMatch) {
      return createResult(smartQuoteMatch[1]);
    }

    // 2d. Look for text between single quotes (substantial quoted block)
    const singleQuoteMatch = lastContent.match(/'([^']{20,})'/);
    if (singleQuoteMatch) {
      return createResult(singleQuoteMatch[1]);
    }

    // 2e. Look for a section starting with "Suggested:" or "Here's" followed by text
    const suggestedMatch = lastContent.match(/(?:Suggested|Here's|Here is)[:\s]+[""]?([^"""\n]{20,})[""]?/i);
    if (suggestedMatch) {
      return createResult(suggestedMatch[1].trim());
    }

    // 2f. If there are multiple paragraphs, return the first substantial one
    //    (often the AI puts the suggestion first, then explains)
    const paragraphs = lastContent.split(/\n\n+/).filter(p => p.trim().length >= 20);
    if (paragraphs.length > 0) {
      // Return the first paragraph that looks like content (not a question or instruction)
      const suggestionPara = paragraphs.find(p =>
        !p.trim().endsWith('?') &&
        !p.toLowerCase().startsWith('would you') &&
        !p.toLowerCase().startsWith('do you') &&
        !p.toLowerCase().startsWith('let me know')
      );
      if (suggestionPara) {
        return createResult(suggestionPara.trim());
      }
    }

    // 2g. Last resort: return the entire message
    return createResult(lastContent);
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
