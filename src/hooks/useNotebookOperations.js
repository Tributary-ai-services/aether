import { useState } from 'react';
import notebookService from '../services/notebookService.js';
import { 
  canMoveNotebook, 
  generateUniqueNotebookName, 
  validateNotebook,
  exportNotebooksToJSON 
} from '../utils/notebookUtils.js';

/**
 * Hook for advanced notebook operations
 */
export const useNotebookOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Duplicate a notebook
   */
  const duplicateNotebook = async (notebook, includeChildren = false) => {
    setLoading(true);
    setError(null);

    try {
      const allNotebooks = (await notebookService.getAllNotebooks()).notebooks;
      const newName = generateUniqueNotebookName(notebook.name, allNotebooks);
      
      const duplicatedNotebook = await notebookService.createNotebook({
        name: newName,
        description: `Copy of ${notebook.description}`,
        visibility: notebook.visibility,
        tags: [...notebook.tags, 'duplicate'],
        parentId: notebook.parentId
      });

      // If including children, recursively duplicate them
      if (includeChildren && notebook.children && notebook.children.length > 0) {
        for (const childId of notebook.children) {
          const child = allNotebooks.find(nb => nb.id === childId);
          if (child) {
            await duplicateNotebook(child, true);
          }
        }
      }

      return duplicatedNotebook;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Move notebook to a new parent
   */
  const moveNotebook = async (notebookId, newParentId) => {
    setLoading(true);
    setError(null);

    try {
      const allNotebooks = (await notebookService.getAllNotebooks()).notebooks;
      
      if (!canMoveNotebook(notebookId, newParentId, allNotebooks)) {
        throw new Error('Cannot move notebook: would create circular reference');
      }

      const updatedNotebook = await notebookService.updateNotebook(notebookId, {
        parentId: newParentId
      });

      return updatedNotebook;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bulk delete notebooks
   */
  const bulkDeleteNotebooks = async (notebookIds, deleteChildren = false) => {
    setLoading(true);
    setError(null);

    try {
      const results = [];
      for (const id of notebookIds) {
        const result = await notebookService.deleteNotebook(id, deleteChildren);
        results.push(result);
      }
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bulk update notebooks
   */
  const bulkUpdateNotebooks = async (updates) => {
    setLoading(true);
    setError(null);

    try {
      const results = [];
      for (const { id, data } of updates) {
        const result = await notebookService.updateNotebook(id, data);
        results.push(result);
      }
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Archive/unarchive notebook
   */
  const toggleNotebookArchive = async (notebookId, archived = true) => {
    setLoading(true);
    setError(null);

    try {
      const updatedNotebook = await notebookService.updateNotebook(notebookId, {
        archived,
        archivedAt: archived ? new Date().toISOString() : null
      });
      return updatedNotebook;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create notebook from template
   */
  const createFromTemplate = async (templateData, parentId = null) => {
    setLoading(true);
    setError(null);

    try {
      const validation = validateNotebook(templateData);
      if (!validation.isValid) {
        throw new Error(`Invalid template data: ${Object.values(validation.errors).join(', ')}`);
      }

      const notebook = await notebookService.createNotebook({
        ...templateData,
        parentId,
        tags: [...(templateData.tags || []), 'from-template']
      });

      return notebook;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export notebooks data
   */
  const exportNotebooks = async (notebookIds = null) => {
    setLoading(true);
    setError(null);

    try {
      const { notebooks, metadata } = await notebookService.getAllNotebooks();
      
      const notebooksToExport = notebookIds 
        ? notebooks.filter(nb => notebookIds.includes(nb.id))
        : notebooks;

      exportNotebooksToJSON(notebooksToExport, metadata);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Import notebooks from JSON
   */
  const importNotebooks = async (jsonData, parentId = null) => {
    setLoading(true);
    setError(null);

    try {
      const importData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!importData.notebooks || !Array.isArray(importData.notebooks)) {
        throw new Error('Invalid import data: missing notebooks array');
      }

      const results = [];
      for (const notebookData of importData.notebooks) {
        const validation = validateNotebook(notebookData);
        if (validation.isValid) {
          // Remove conflicting properties and set new parent
          delete notebookData.id;
          delete notebookData.createdAt;
          delete notebookData.updatedAt;
          delete notebookData.children;
          
          const importedNotebook = await notebookService.createNotebook({
            ...notebookData,
            parentId,
            tags: [...(notebookData.tags || []), 'imported']
          });
          
          results.push(importedNotebook);
        }
      }

      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reorganize notebooks (batch move operation)
   */
  const reorganizeNotebooks = async (moves) => {
    setLoading(true);
    setError(null);

    try {
      const allNotebooks = (await notebookService.getAllNotebooks()).notebooks;
      
      // Validate all moves first
      for (const { notebookId, newParentId } of moves) {
        if (!canMoveNotebook(notebookId, newParentId, allNotebooks)) {
          throw new Error(`Cannot move notebook ${notebookId}: would create circular reference`);
        }
      }

      // Execute all moves
      const results = [];
      for (const { notebookId, newParentId } of moves) {
        const result = await notebookService.updateNotebook(notebookId, {
          parentId: newParentId
        });
        results.push(result);
      }

      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    duplicateNotebook,
    moveNotebook,
    bulkDeleteNotebooks,
    bulkUpdateNotebooks,
    toggleNotebookArchive,
    createFromTemplate,
    exportNotebooks,
    importNotebooks,
    reorganizeNotebooks
  };
};