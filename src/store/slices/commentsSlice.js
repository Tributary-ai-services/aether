import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { aetherApi } from '../../services/aetherApi.js';

// Thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (notebookId, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.getComments(notebookId);
      return { notebookId, data: response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ notebookId, content, parentId, mentions }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.createComment(notebookId, {
        content,
        parentId: parentId || undefined,
        mentions: mentions || [],
      });
      return { notebookId, comment: response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ notebookId, commentId, content, mentions }, { rejectWithValue }) => {
    try {
      const response = await aetherApi.notebooks.updateComment(notebookId, commentId, {
        content,
        mentions: mentions || [],
      });
      return { notebookId, comment: response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ notebookId, commentId }, { rejectWithValue }) => {
    try {
      await aetherApi.notebooks.deleteComment(notebookId, commentId);
      return { notebookId, commentId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete comment');
    }
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    commentsByNotebook: {}, // { notebookId: { comments: [], total: 0 } }
    loading: false,
    creating: false,
    error: null,
  },
  reducers: {
    // SSE event handlers
    commentCreated: (state, action) => {
      const { notebookId, comment } = action.payload;
      if (!state.commentsByNotebook[notebookId]) {
        state.commentsByNotebook[notebookId] = { comments: [], total: 0 };
      }
      const existing = state.commentsByNotebook[notebookId];
      // Check if it's a reply (has parentId)
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
      const existing = state.commentsByNotebook[notebookId];
      if (!existing) return;
      // Check top-level comments
      const idx = existing.comments.findIndex(c => c.id === comment.id);
      if (idx !== -1) {
        existing.comments[idx] = { ...existing.comments[idx], ...comment };
        return;
      }
      // Check replies
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
      const existing = state.commentsByNotebook[notebookId];
      if (!existing) return;
      // Check top-level
      const idx = existing.comments.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        existing.comments.splice(idx, 1);
        existing.total -= 1;
        return;
      }
      // Check replies
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
      const notebookId = action.payload;
      delete state.commentsByNotebook[notebookId];
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
        state.commentsByNotebook[action.payload.notebookId] = action.payload.data;
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
        const { notebookId, comment } = action.payload;
        if (!state.commentsByNotebook[notebookId]) {
          state.commentsByNotebook[notebookId] = { comments: [], total: 0 };
        }
        // Add to appropriate place (SSE may have already added it)
        const existing = state.commentsByNotebook[notebookId];
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
        const { notebookId, comment } = action.payload;
        const existing = state.commentsByNotebook[notebookId];
        if (!existing) return;
        const idx = existing.comments.findIndex(c => c.id === comment.id);
        if (idx !== -1) {
          existing.comments[idx] = { ...existing.comments[idx], ...comment };
        }
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { notebookId, commentId } = action.payload;
        const existing = state.commentsByNotebook[notebookId];
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

// Selectors
export const selectComments = (state, notebookId) =>
  state.comments.commentsByNotebook[notebookId]?.comments || [];
export const selectCommentsTotal = (state, notebookId) =>
  state.comments.commentsByNotebook[notebookId]?.total || 0;
export const selectCommentsLoading = (state) => state.comments.loading;
export const selectCommentsCreating = (state) => state.comments.creating;
export const selectCommentsError = (state) => state.comments.error;

export default commentsSlice.reducer;
