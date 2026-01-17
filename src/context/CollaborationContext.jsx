import React, { createContext, useContext, useState, useEffect } from 'react';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export const CollaborationProvider = ({ children }) => {
  const [comments, setComments] = useState({});
  const [sharedItems, setSharedItems] = useState({});
  const [activeUsers, setActiveUsers] = useState([]);

  // Mock active users
  useEffect(() => {
    const mockUsers = [
      { 
        id: '1', 
        name: 'John Doe', 
        email: 'john.doe@company.com', 
        avatar: 'JD', 
        status: 'online',
        lastSeen: new Date(),
        color: '#3b82f6'
      },
      { 
        id: '2', 
        name: 'Sarah Smith', 
        email: 'sarah.smith@company.com', 
        avatar: 'SS', 
        status: 'online',
        lastSeen: new Date(),
        color: '#10b981'
      },
      { 
        id: '3', 
        name: 'Mike Johnson', 
        email: 'mike.johnson@company.com', 
        avatar: 'MJ', 
        status: 'away',
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        color: '#f59e0b'
      },
      { 
        id: '4', 
        name: 'Lisa Chen', 
        email: 'lisa.chen@company.com', 
        avatar: 'LC', 
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        color: '#8b5cf6'
      }
    ];

    setActiveUsers(mockUsers);

    // Mock comments for different resources
    const mockComments = {
      'notebook-1': [
        {
          id: '1',
          userId: '1',
          user: mockUsers[0],
          content: 'This document analysis looks great! The accuracy improvements are impressive.',
          timestamp: new Date(Date.now() - 3600000),
          replies: [
            {
              id: '2',
              userId: '2',
              user: mockUsers[1],
              content: 'Agreed! The HIPAA compliance scores are also looking much better.',
              timestamp: new Date(Date.now() - 3000000)
            }
          ]
        },
        {
          id: '3',
          userId: '3',
          user: mockUsers[2],
          content: 'Should we consider adding OCR capabilities for handwritten notes?',
          timestamp: new Date(Date.now() - 7200000),
          replies: []
        }
      ],
      'agent-1': [
        {
          id: '4',
          userId: '2',
          user: mockUsers[1],
          content: 'The training metrics show excellent progress. Ready for production deployment.',
          timestamp: new Date(Date.now() - 1800000),
          replies: [
            {
              id: '5',
              userId: '1',
              user: mockUsers[0],
              content: 'Let me review the compliance checklist first before we deploy.',
              timestamp: new Date(Date.now() - 900000)
            }
          ]
        }
      ]
    };

    setComments(mockComments);
  }, []);

  const addComment = (resourceId, content, parentId = null) => {
    const currentUser = activeUsers[0]; // Assume first user is current user
    const newComment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      user: currentUser,
      content,
      timestamp: new Date(),
      replies: []
    };

    setComments(prev => {
      const resourceComments = prev[resourceId] || [];
      
      if (parentId) {
        // Add as reply
        return {
          ...prev,
          [resourceId]: resourceComments.map(comment => 
            comment.id === parentId 
              ? { ...comment, replies: [...comment.replies, newComment] }
              : comment
          )
        };
      } else {
        // Add as top-level comment
        return {
          ...prev,
          [resourceId]: [...resourceComments, newComment]
        };
      }
    });

    return newComment.id;
  };

  const getComments = (resourceId) => {
    return comments[resourceId] || [];
  };

  const shareResource = (resourceId, resourceType, shareWith, permissions = 'view') => {
    const shareData = {
      id: Date.now().toString(),
      resourceId,
      resourceType,
      sharedBy: activeUsers[0], // Current user
      sharedWith: shareWith,
      permissions,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    setSharedItems(prev => ({
      ...prev,
      [resourceId]: [...(prev[resourceId] || []), shareData]
    }));

    return shareData.id;
  };

  const getSharedUsers = (resourceId) => {
    return sharedItems[resourceId] || [];
  };

  const updateUserStatus = (userId, status) => {
    setActiveUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, status, lastSeen: new Date() }
          : user
      )
    );
  };

  const getMentions = (content) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      const user = activeUsers.find(u => 
        u.name.toLowerCase().replace(' ', '') === username.toLowerCase() ||
        u.email.split('@')[0] === username.toLowerCase()
      );
      
      if (user) {
        mentions.push(user);
      }
    }

    return mentions;
  };

  const value = {
    comments,
    sharedItems,
    activeUsers,
    addComment,
    getComments,
    shareResource,
    getSharedUsers,
    updateUserStatus,
    getMentions
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};