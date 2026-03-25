import React, { createContext, useContext, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  selectComments,
  selectCommentsLoading,
  selectCommentsCreating,
  createComment as createCommentThunk,
  fetchComments,
} from '../store/slices/commentsSlice';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export const CollaborationProvider = ({ children, notebookId }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const comments = useSelector((state) => selectComments(state, notebookId));
  const loading = useSelector(selectCommentsLoading);
  const creating = useSelector(selectCommentsCreating);

  // Build current user object from auth context
  const currentUser = user ? {
    id: user.id || user.sub,
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    email: user.email,
    avatar: (user.name || user.email || '??').substring(0, 2).toUpperCase(),
    status: 'online',
    color: '#3b82f6',
  } : null;

  const addComment = useCallback((resourceId, content, parentId = null) => {
    const id = resourceId || notebookId;
    if (!id) return;
    dispatch(createCommentThunk({
      notebookId: id,
      content,
      parentId,
      mentions: [],
    }));
  }, [dispatch, notebookId]);

  const getComments = useCallback((resourceId) => {
    const id = resourceId || notebookId;
    // Comments are already in Redux; the component should subscribe via useSelector.
    // This helper returns current snapshot for backward compat.
    return comments;
  }, [comments, notebookId]);

  const loadComments = useCallback((resourceId) => {
    const id = resourceId || notebookId;
    if (id) {
      dispatch(fetchComments(id));
    }
  }, [dispatch, notebookId]);

  // Active users placeholder — will be populated from notebook shares in the future
  const activeUsers = currentUser ? [currentUser] : [];

  const getMentions = useCallback((content) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      const user = activeUsers.find(u =>
        u.name.toLowerCase().replace(' ', '') === username.toLowerCase() ||
        u.email.split('@')[0] === username.toLowerCase()
      );
      if (user) mentions.push(user);
    }
    return mentions;
  }, [activeUsers]);

  const value = {
    comments,
    loading,
    creating,
    activeUsers,
    currentUser,
    addComment,
    getComments,
    loadComments,
    getMentions,
    // Deprecated stubs for backward compatibility
    sharedItems: {},
    shareResource: () => {},
    getSharedUsers: () => [],
    updateUserStatus: () => {},
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};
