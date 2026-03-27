import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (arg, { rejectWithValue }) => {
    // Support both old signature (string notebookId) and new ({ notebookId, conversationId })
    const notebookId = typeof arg === 'string' ? arg : arg.notebookId;
    const conversationId = typeof arg === 'string' ? null : arg.conversationId;
    const resourceKey = conversationId || notebookId;
    try {
      const response = await aetherApi.notebooks.getComments(notebookId, conversationId);
      const payload = response?.data || response;
      return { resourceKey, data: { comments: payload?.comments || [], total: payload?.total || 0 } };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ notebookId, conversationId, content, parentId, mentions }, { rejectWithValue }) => {
    const resourceKey = conversationId || notebookId;
    try {
      const response = await aetherApi.notebooks.createComment(notebookId, {
        content,
        parentId: parentId || undefined,
        conversationId: conversationId || undefined,
        mentions: mentions || [],
      });
      return { resourceKey, comment: response?.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ notebookId, commentId, content, mentions, resourceKey }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.updateComment(notebookId, commentId, {
        content,
        mentions: mentions || [],
      });
      return { resourceKey: resourceKey || notebookId, comment: response?.data || response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ notebookId, commentId, resourceKey }, { rejectWithValue }) => {
    try {
      await aetherApi.notebooks.deleteComment(notebookId, commentId);
      return { resourceKey: resourceKey || notebookId, commentId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete comment');
    }
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    commentsByResource: {}, // { resourceKey: { comments: [], total: 0 } }
    loading: false,
    creating: false,
    error: null,
  },
  reducers: {
    // SSE event handlers (still keyed by notebookId for SSE compatibility)
    commentCreated: (state, action) => {
      const { notebookId, comment } = action.payload;
      if (!state.commentsByResource[notebookId]) {
        state.commentsByResource[notebookId] = { comments: [], total: 0 };
      }
      const existing = state.commentsByResource[notebookId];
      if (comment.parentId) {
        const parent = existing.comments.find(c => c.id === comment.parentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          if (!parent.replies.find(r => r.id === comment.id)) {
            parent.replies.push(comment);
          }
        }
      } else {
        if (!existing.comments.find(c => c.id === comment.id)) {
          existing.comments.unshift(comment);
          existing.total += 1;
        }
      }
    },
    commentUpdated: (state, action) => {
      const { notebookId, comment } = action.payload;
      const existing = state.commentsByResource[notebookId];
      if (!existing) return;
      const idx = existing.comments.findIndex(c => c.id === comment.id);
      if (idx !== -1) {
        existing.comments[idx] = { ...existing.comments[idx], ...comment };
        return;
      }
      for (const c of existing.comments) {
        if (c.replies) {
          const replyIdx = c.replies.findIndex(r => r.id === comment.id);
          if (replyIdx !== -1) {
            c.replies[replyIdx] = { ...c.replies[replyIdx], ...comment };
            return;
          }
        }
      }
    },
    commentDeleted: (state, action) => {
      const { notebookId, commentId } = action.payload;
      const existing = state.commentsByResource[notebookId];
      if (!existing) return;
      const idx = existing.comments.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        existing.comments.splice(idx, 1);
        existing.total -= 1;
        return;
      }
      for (const c of existing.comments) {
        if (c.replies) {
          const replyIdx = c.replies.findIndex(r => r.id === commentId);
          if (replyIdx !== -1) {
            c.replies.splice(replyIdx, 1);
            return;
          }
        }
      }
    },
    clearComments: (state, action) => {
      const key = action.payload;
      delete state.commentsByResource[key];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.commentsByResource[action.payload.resourceKey] = action.payload.data;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createComment.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.creating = false;
        const { resourceKey, comment } = action.payload;
        if (!state.commentsByResource[resourceKey]) {
          state.commentsByResource[resourceKey] = { comments: [], total: 0 };
        }
        const existing = state.commentsByResource[resourceKey];
        if (comment.parentId) {
          const parent = existing.comments.find(c => c.id === comment.parentId);
          if (parent) {
            if (!parent.replies) parent.replies = [];
            if (!parent.replies.find(r => r.id === comment.id)) {
              parent.replies.push(comment);
            }
          }
        } else {
          if (!existing.comments.find(c => c.id === comment.id)) {
            existing.comments.unshift(comment);
            existing.total += 1;
          }
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const { resourceKey, comment } = action.payload;
        const existing = state.commentsByResource[resourceKey];
        if (!existing) return;
        const idx = existing.comments.findIndex(c => c.id === comment.id);
        if (idx !== -1) {
          existing.comments[idx] = { ...existing.comments[idx], ...comment };
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { resourceKey, commentId } = action.payload;
        const existing = state.commentsByResource[resourceKey];
        if (!existing) return;
        const idx = existing.comments.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          existing.comments.splice(idx, 1);
          existing.total -= 1;
        }
      });
  },
});

export const { commentCreated, commentUpdated, commentDeleted, clearComments } = commentsSlice.actions;

// Selectors - use resourceKey (conversationId or notebookId)
export const selectComments = (state, resourceKey) =>
  state.comments.commentsByResource[resourceKey]?.comments || [];
export const selectCommentsTotal = (state, resourceKey) =>
  state.comments.commentsByResource[resourceKey]?.total || 0;
export const selectCommentsLoading = (state) => state.comments.loading;
export const selectCommentsCreating = (state) => state.comments.creating;
export const selectCommentsError = (state) => state.comments.error;

export default commentsSlice.reducer;
