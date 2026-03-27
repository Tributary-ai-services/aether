import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Thunks
export const fetchConversations = createAsyncThunk(
  'conversations/fetchConversations',
  async (notebookId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.conversations.getConversations(notebookId);
      const payload = response?.data || response;
      return { notebookId, data: { conversations: payload?.conversations || [], total: payload?.total || 0 } };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const createConversation = createAsyncThunk(
  'conversations/createConversation',
  async ({ notebookId, name }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.conversations.createConversation(notebookId, { name });
      return { notebookId, conversation: response?.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create conversation');
    }
  }
);

export const updateConversation = createAsyncThunk(
  'conversations/updateConversation',
  async ({ notebookId, conversationId, name }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.conversations.updateConversation(notebookId, conversationId, { name });
      return { notebookId, conversation: response?.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update conversation');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'conversations/deleteConversation',
  async ({ notebookId, conversationId }, { rejectWithValue }) => {
    try {
      await aetherApi.conversations.deleteConversation(notebookId, conversationId);
      return { notebookId, conversationId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete conversation');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'conversations/fetchMessages',
  async ({ notebookId, conversationId }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.conversations.getMessages(notebookId, conversationId);
      const payload = response?.data || response;
      return { conversationId, data: { messages: payload?.messages || [], total: payload?.total || 0 } };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'conversations/sendChatMessage',
  async ({ notebookId, conversationId, message }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.chat.sendMessage(notebookId, message, [], conversationId || null);
      const data = response?.data || response;
      return {
        notebookId,
        conversationId: data.conversation_id || conversationId,
        userMessage: message,
        assistantMessage: data.message || 'Sorry, I could not generate a response.',
        isNewConversation: !conversationId,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to send message',
        conversationId,
        userMessage: message,
      });
    }
  }
);

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState: {
    conversationsByNotebook: {}, // { notebookId: { conversations: [], total: 0 } }
    activeConversationId: null,
    messagesByConversation: {}, // { conversationId: { messages: [], total: 0 } }
    loading: false,
    creating: false,
    sendingMessage: false,
    error: null,
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
    clearActiveConversation: (state) => {
      state.activeConversationId = null;
    },
    addOptimisticMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = { messages: [], total: 0 };
      }
      state.messagesByConversation[conversationId].messages.push(message);
      state.messagesByConversation[conversationId].total += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversationsByNotebook[action.payload.notebookId] = action.payload.data;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createConversation
      .addCase(createConversation.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.creating = false;
        const { notebookId, conversation } = action.payload;
        if (!state.conversationsByNotebook[notebookId]) {
          state.conversationsByNotebook[notebookId] = { conversations: [], total: 0 };
        }
        state.conversationsByNotebook[notebookId].conversations.unshift(conversation);
        state.conversationsByNotebook[notebookId].total += 1;
        state.activeConversationId = conversation.id;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      // updateConversation
      .addCase(updateConversation.fulfilled, (state, action) => {
        const { notebookId, conversation } = action.payload;
        const existing = state.conversationsByNotebook[notebookId];
        if (existing) {
          const idx = existing.conversations.findIndex(c => c.id === conversation.id);
          if (idx !== -1) {
            existing.conversations[idx] = { ...existing.conversations[idx], ...conversation };
          }
        }
      })
      // deleteConversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const { notebookId, conversationId } = action.payload;
        const existing = state.conversationsByNotebook[notebookId];
        if (existing) {
          existing.conversations = existing.conversations.filter(c => c.id !== conversationId);
          existing.total = existing.conversations.length;
        }
        if (state.activeConversationId === conversationId) {
          state.activeConversationId = null;
        }
        delete state.messagesByConversation[conversationId];
      })
      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messagesByConversation[action.payload.conversationId] = action.payload.data;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // sendChatMessage
      .addCase(sendChatMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { notebookId, conversationId, userMessage, assistantMessage, isNewConversation } = action.payload;

        // Ensure messages array exists
        if (!state.messagesByConversation[conversationId]) {
          state.messagesByConversation[conversationId] = { messages: [], total: 0 };
        }
        const msgStore = state.messagesByConversation[conversationId];

        // Add user message
        msgStore.messages.push({
          id: `user-${Date.now()}`,
          conversationId,
          role: 'user',
          content: userMessage,
          isError: false,
          createdAt: new Date().toISOString(),
        });

        // Add assistant message
        msgStore.messages.push({
          id: `assistant-${Date.now()}`,
          conversationId,
          role: 'assistant',
          content: assistantMessage,
          isError: false,
          createdAt: new Date().toISOString(),
        });

        msgStore.total = msgStore.messages.length;

        // If new conversation was auto-created, update conversation list
        if (isNewConversation && conversationId) {
          if (!state.conversationsByNotebook[notebookId]) {
            state.conversationsByNotebook[notebookId] = { conversations: [], total: 0 };
          }
          // The conversation will be picked up on next fetchConversations
          state.activeConversationId = conversationId;
        }

        // Update conversation's message count and last message in the list
        const convList = state.conversationsByNotebook[notebookId];
        if (convList?.conversations) {
          const conv = convList.conversations.find(c => c.id === conversationId);
          if (conv) {
            conv.messageCount = msgStore.messages.length;
            conv.lastMessage = assistantMessage.substring(0, 100);
            conv.updatedAt = new Date().toISOString();
          }
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        const { conversationId, userMessage } = action.payload || {};
        state.error = action.payload?.message || 'Failed to send message';

        // Add error message to conversation
        if (conversationId && state.messagesByConversation[conversationId]) {
          state.messagesByConversation[conversationId].messages.push({
            id: `error-${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `Error: ${action.payload?.message || 'Failed to get response. Please try again.'}`,
            isError: true,
            createdAt: new Date().toISOString(),
          });
        }
      });
  },
});

export const { setActiveConversation, clearActiveConversation, addOptimisticMessage } = conversationsSlice.actions;

// Selectors
export const selectConversations = (state, notebookId) =>
  state.conversations.conversationsByNotebook[notebookId]?.conversations || [];
export const selectConversationsTotal = (state, notebookId) =>
  state.conversations.conversationsByNotebook[notebookId]?.total || 0;
export const selectActiveConversationId = (state) => state.conversations.activeConversationId;
export const selectMessages = (state, conversationId) =>
  state.conversations.messagesByConversation[conversationId]?.messages || [];
export const selectMessagesTotal = (state, conversationId) =>
  state.conversations.messagesByConversation[conversationId]?.total || 0;
export const selectSendingMessage = (state) => state.conversations.sendingMessage;
export const selectConversationsLoading = (state) => state.conversations.loading;
export const selectConversationsCreating = (state) => state.conversations.creating;
export const selectConversationsError = (state) => state.conversations.error;

export default conversationsSlice.reducer;
