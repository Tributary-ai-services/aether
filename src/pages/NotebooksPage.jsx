import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext.jsx';
import { 
  useAppDispatch, 
  useAppSelector,
  fetchNotebooks,
  createNotebook as createNotebookAction,
  updateNotebook as updateNotebookAction, 
  deleteNotebook as deleteNotebookAction,
  setSelectedNotebook,
  openModal,
  closeModal,
  setViewMode,
  addNotification
} from '../store/index.js';
import NotebookCard from '../components/cards/NotebookCard.jsx';
import NotebookDetailModal from '../components/modals/NotebookDetailModal.jsx';
import ExportDataModal from '../components/modals/ExportDataModal.jsx';
import ContentsViewModal from '../components/modals/ContentsViewModal.jsx';
import CreateNotebookModal from '../components/notebooks/CreateNotebookModal.jsx';
import NotebookTreeView from '../components/notebooks/NotebookTreeView.jsx';
import NotebookDetailView from '../components/notebooks/NotebookDetailView.jsx';
import DocumentUploadModal from '../components/notebooks/DocumentUploadModal.jsx';
import NotebookSettingsModal from '../components/notebooks/NotebookSettingsModal.jsx';
import NotebookManager from '../components/notebooks/NotebookManager.jsx';
import ShareDialog from '../components/collaboration/ShareDialog.jsx';
import ShareNotebookModal from '../components/notebooks/ShareNotebookModal.jsx';
import { LoadingWrapper, NotebookCardSkeleton } from '../components/skeletons/index.js';
import { FolderTree, Grid, Plus, Settings, AlertCircle, Share2, Download, ChevronLeft, ChevronRight, GripVertical, FileText } from 'lucide-react';

const NotebooksPage = () => {
  // Redux selectors
  const dispatch = useAppDispatch();
  const { 
    data: notebooks, 
    tree: notebookTree, 
    loading, 
    error, 
    selectedNotebook,
    metadata 
  } = useAppSelector(state => state.notebooks);
  
  const { 
    modals, 
    viewMode: currentViewMode 
  } = useAppSelector(state => state.ui);
  
  const { filterNotebooks } = useFilters();
  
  // Local state for things not in Redux yet
  const [parentForCreate, setParentForCreate] = useState(null);
  const [uploadNotebook, setUploadNotebook] = useState(null);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [settingsNotebook, setSettingsNotebook] = useState(null);
  const [exportNotebook, setExportNotebook] = useState(null);
  const [contentsNotebook, setContentsNotebook] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareNotebookModalOpen, setShareNotebookModalOpen] = useState(false);
  const [shareNotebook, setShareNotebook] = useState(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  
  // Initialize data on component mount
  useEffect(() => {
    dispatch(fetchNotebooks());
  }, [dispatch]);

  // Listen for reset to list view event from top nav
  useEffect(() => {
    const handleResetToListView = () => {
      dispatch(setSelectedNotebook(null));
      dispatch(setViewMode('cards'));
    };
    
    window.addEventListener('resetToListView', handleResetToListView);
    return () => window.removeEventListener('resetToListView', handleResetToListView);
  }, [dispatch]);

  // Apply filters to notebooks
  const allFilteredNotebooks = filterNotebooks(notebooks);
  
  // For card view, only show root notebooks (no parent_id) but include children count
  const filteredNotebooks = currentViewMode === 'cards' 
    ? allFilteredNotebooks.filter(notebook => {
        const parentId = notebook.parent_id || notebook.parentId;
        return !parentId || parentId === '' || parentId === null || parentId === undefined;
      }).map(rootNotebook => ({
        ...rootNotebook,
        children: allFilteredNotebooks.filter(nb => {
          const parent = nb.parent_id || nb.parentId;
          return parent === rootNotebook.id;
        })
      }))
    : allFilteredNotebooks;

  const handleCreateNotebook = async () => {
    dispatch(openModal('createNotebook'));
  };

  const handleCreateSubNotebook = (parentNotebook) => {
    setParentForCreate(parentNotebook);
    dispatch(openModal('createNotebook'));
  };

  const handleSelectNotebook = (notebook) => {
    // Ensure the selected notebook includes its children
    const notebookWithChildren = {
      ...notebook,
      children: notebooks.filter(nb => {
        const parent = nb.parent_id || nb.parentId;
        return parent === notebook.id;
      })
    };
    dispatch(setSelectedNotebook(notebookWithChildren));
    if (currentViewMode === 'tree') {
      dispatch(setViewMode('detail'));
    }
  };

  const handleUploadDocuments = (notebook, files = null) => {
    setUploadNotebook(notebook);
    setUploadFiles(files);
    dispatch(openModal('uploadDocument'));
  };

  const handleOpenSettings = (notebook) => {
    setSettingsNotebook(notebook);
    dispatch(openModal('notebookSettings'));
  };

  const handleOpenExport = (notebook) => {
    setExportNotebook(notebook);
    dispatch(openModal('exportData'));
  };

  const handleViewContents = (notebook) => {
    setContentsNotebook(notebook);
    dispatch(openModal('contentsView'));
  };

  const handleDeleteNotebook = async (notebook) => {
    try {
      await dispatch(deleteNotebookAction(notebook.id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Notebook Deleted',
        message: `"${notebook.name}" has been deleted successfully.`
      }));
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error || 'Failed to delete notebook. Please try again.'
      }));
    }
  };

  const handleCreateNotebookSubmit = async (notebookData) => {
    try {
      await dispatch(createNotebookAction(notebookData)).unwrap();
      dispatch(closeModal('createNotebook'));
      setParentForCreate(null);
      dispatch(addNotification({
        type: 'success',
        title: 'Notebook Created',
        message: `"${notebookData.name}" has been created successfully.`
      }));
    } catch (error) {
      console.error('Failed to create notebook:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error || 'Failed to create notebook. Please try again.'
      }));
    }
  };

  const handleUpdateNotebook = async (id, updates) => {
    try {
      await dispatch(updateNotebookAction({ id, updates })).unwrap();
      dispatch(addNotification({
        type: 'success',
        title: 'Notebook Updated',
        message: 'Notebook has been updated successfully.'
      }));
    } catch (error) {
      console.error('Failed to update notebook:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error || 'Failed to update notebook. Please try again.'
      }));
    }
  };

  const handleShare = (notebook) => {
    setShareNotebook(notebook);
    setShareNotebookModalOpen(true);
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {selectedNotebook ? (
            <>
              <button 
                onClick={() => {
                  dispatch(setSelectedNotebook(null));
                  dispatch(setViewMode('cards'));
                }}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <h2 className="text-xl font-semibold">Notebooks</h2>
              </button>
              <span className="text-gray-400">/</span>
              <h2 className="text-xl font-semibold text-gray-900">{selectedNotebook.name}</h2>
            </>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">Notebooks</h2>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle and Manage Button - only show in list view */}
          {!selectedNotebook && (
            <div className="flex items-center gap-3">
              {/* Manage Notebooks Button */}
              <button
                onClick={() => dispatch(openModal('notebookManager'))}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                title="Manage notebooks"
              >
                Manage
              </button>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => dispatch(setViewMode('cards'))}
                  className={`p-2 rounded-lg transition-colors ${
                    currentViewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Card view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => dispatch(setViewMode('tree'))}
                  className={`p-2 rounded-lg transition-colors ${
                    currentViewMode === 'tree' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tree view"
                >
                  <FolderTree size={16} />
                </button>
              </div>
            </div>
          )}
          
          {/* Action Buttons - only show in detail view */}
          {selectedNotebook && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleShare(selectedNotebook)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 size={16} />
              </button>
              <button 
                onClick={() => handleOpenSettings(selectedNotebook)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">Error loading notebooks:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {currentViewMode === 'cards' ? (
          <LoadingWrapper
            loading={loading}
            error={error}
            SkeletonComponent={NotebookCardSkeleton}
            skeletonCount={6}
            loadingText="Loading notebooks..."
            errorTitle="Error loading notebooks"
          >
            {filteredNotebooks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No notebooks found</div>
                <div className="text-gray-500 text-sm">Try adjusting your filters or create a new notebook</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotebooks.map(notebook => (
                  <NotebookCard 
                    key={notebook.id} 
                    notebook={notebook} 
                    onOpenDetail={() => {
                      dispatch(setSelectedNotebook(notebook));
                      dispatch(setViewMode('detail'));
                    }}
                    onUploadDocuments={handleUploadDocuments}
                    onOpenSettings={handleOpenSettings}
                    onDelete={handleDeleteNotebook}
                  />
                ))}
              </div>
            )}
          </LoadingWrapper>
        ) : currentViewMode === 'tree' ? (
          <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
            <LoadingWrapper
              loading={loading}
              error={error}
              loadingText="Loading notebook tree..."
              errorTitle="Error loading notebook tree"
            >
              {notebookTree.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm mb-2">No notebooks found</div>
                  <div className="text-xs text-gray-400">Create a notebook to get started</div>
                </div>
              ) : (
                <NotebookTreeView
                  notebooks={notebookTree}
                  onSelectNotebook={handleSelectNotebook}
                  onCreateSubNotebook={handleCreateSubNotebook}
                  selectedNotebookId={selectedNotebook?.id}
                />
              )}
            </LoadingWrapper>
          </div>
        ) : (
          <div className="flex h-full gap-1">
            {/* Left Panel - Documents Tree */}
            {!leftPanelCollapsed && (
              <>
                <div 
                  className="bg-white border border-gray-200 rounded-lg p-4 flex-shrink-0 relative"
                  style={{ width: `${leftPanelWidth}px` }}
                >
                  <div className="mb-4 pb-2 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Documents</h3>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handleCreateNotebook}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Plus size={14} />
                        New
                      </button>
                      <button 
                        onClick={() => setLeftPanelCollapsed(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 ml-2"
                        title="Collapse panel"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>
                  {selectedNotebook ? (
                    <div className="space-y-4">
                      {/* Sub-notebooks section */}
                      {selectedNotebook.children && selectedNotebook.children.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                            <FolderTree size={14} />
                            Sub-notebooks ({selectedNotebook.children.length})
                          </h4>
                          <div className="space-y-1">
                            {selectedNotebook.children.map(subNotebook => (
                              <div 
                                key={subNotebook.id} 
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                onClick={() => handleSelectNotebook(subNotebook)}
                              >
                                <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                  <FolderTree size={10} className="text-blue-600" />
                                </div>
                                <span className="text-sm text-gray-700 hover:text-gray-900 flex-1 truncate">
                                  {subNotebook.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Documents section */}
                      <div className={selectedNotebook.children && selectedNotebook.children.length > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                        <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                          <FileText size={14} />
                          Documents (0)
                        </h4>
                        <div className="text-center py-4 text-gray-500">
                          <div className="text-sm">No documents uploaded</div>
                          <button 
                            onClick={() => handleUploadDocuments(selectedNotebook)}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                          >
                            Upload documents
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Select a notebook to view documents
                    </div>
                  )}
                </div>
                
                {/* Left Resize Handle */}
                <div 
                  className="w-1 cursor-col-resize hover:bg-blue-300 bg-gray-200 rounded"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = leftPanelWidth;
                    
                    const handleMouseMove = (e) => {
                      const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
                      setLeftPanelWidth(newWidth);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </>
            )}
            
            {/* Left Panel Collapsed Button */}
            {leftPanelCollapsed && (
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-2">
                <button 
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Expand Documents panel"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="text-xs text-gray-400 mt-2 transform -rotate-90 whitespace-nowrap">Docs</div>
              </div>
            )}
            
            {/* Center Panel - Chat History */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">
                  {selectedNotebook ? `Chat: ${selectedNotebook.name}` : 'Chat History'}
                </h3>
              </div>
              
              {selectedNotebook ? (
                <div className="flex flex-col h-full">
                  {/* Chat Messages Area */}
                  <div className="flex-1 overflow-y-auto mb-4">
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No messages yet. Start a conversation about your notebook content.
                    </div>
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t border-gray-200 pt-3 mb-4">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Ask questions about your notebook content..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Send
                      </button>
                    </div>
                    
                    {/* Quick Action Buttons */}
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors">
                        Summarize
                      </button>
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors">
                        Extract Key Points
                      </button>
                      <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors">
                        Generate Questions
                      </button>
                      <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors">
                        Create Outline
                      </button>
                      <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition-colors">
                        Deep Research
                      </button>
                    </div>
                  </div>
                  
                  {/* Collaborator Comments at Bottom */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Collaborator Comments</h4>
                    <div className="max-h-32 overflow-y-auto mb-3">
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No comments yet. Start the conversation below.
                      </div>
                    </div>
                    
                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment for collaborators..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <button className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-lg mb-2">Select a notebook to start chatting</div>
                    <p className="text-sm">Choose a notebook to begin your AI-powered conversation</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Resize Handle */}
            {!rightPanelCollapsed && (
              <div 
                className="w-1 cursor-col-resize hover:bg-blue-300 bg-gray-200 rounded"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = rightPanelWidth;
                  
                  const handleMouseMove = (e) => {
                    const newWidth = Math.max(200, Math.min(500, startWidth - (e.clientX - startX)));
                    setRightPanelWidth(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
            
            {/* Right Panel - Producers */}
            {!rightPanelCollapsed && (
              <div 
                className="bg-white border border-gray-200 rounded-lg p-4 flex-shrink-0"
                style={{ width: `${rightPanelWidth}px` }}
              >
                <div className="mb-4 pb-2 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">Producers</h3>
                    <p className="text-xs text-gray-500 mt-1">Generate content for your notebook</p>
                  </div>
                  <button 
                    onClick={() => setRightPanelCollapsed(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Collapse panel"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              
              {selectedNotebook ? (
                <div className="space-y-3">
                  {/* Stylized Producer Buttons */}
                  <button className="w-full p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-150 transition-all text-left font-medium text-blue-900 text-sm">
                    📄 Summarize Documents
                  </button>
                  
                  <button className="w-full p-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg hover:from-green-100 hover:to-green-150 transition-all text-left font-medium text-green-900 text-sm">
                    ❓ Generate Q&A
                  </button>
                  
                  <button className="w-full p-3 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-purple-150 transition-all text-left font-medium text-purple-900 text-sm">
                    📋 Create Outline
                  </button>
                  
                  <button className="w-full p-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-orange-150 transition-all text-left font-medium text-orange-900 text-sm">
                    💡 Extract Insights
                  </button>
                  
                  
                  {/* Productions Section */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Productions</h4>
                    </div>
                    
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No productions yet. Run a producer to generate content.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <div className="text-sm mb-1">Select a notebook</div>
                    <p className="text-xs">Producers will appear here</p>
                  </div>
                </div>
              )}
              </div>
            )}
            
            {/* Right Panel Collapsed Button */}
            {rightPanelCollapsed && (
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg p-2">
                <button 
                  onClick={() => setRightPanelCollapsed(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Expand Producers panel"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs text-gray-400 mt-2 transform rotate-90 whitespace-nowrap">Producers</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <CreateNotebookModal
        isOpen={modals.createNotebook}
        onClose={() => {
          dispatch(closeModal('createNotebook'));
          setParentForCreate(null);
        }}
        parentNotebook={parentForCreate}
        onCreateNotebook={handleCreateNotebookSubmit}
      />

      <NotebookDetailModal 
        isOpen={modals.notebookDetail}
        onClose={() => {
          dispatch(closeModal('notebookDetail'));
          dispatch(setSelectedNotebook(null));
        }}
        notebook={selectedNotebook}
        onOpenSettings={handleOpenSettings}
        onOpenExport={handleOpenExport}
        onViewContents={handleViewContents}
      />

      <DocumentUploadModal
        isOpen={modals.uploadDocument}
        onClose={() => {
          dispatch(closeModal('uploadDocument'));
          setUploadNotebook(null);
          setUploadFiles(null);
        }}
        notebook={uploadNotebook}
        preSelectedFiles={uploadFiles}
      />

      <NotebookSettingsModal
        isOpen={modals.notebookSettings}
        onClose={() => {
          dispatch(closeModal('notebookSettings'));
          setSettingsNotebook(null);
        }}
        notebook={settingsNotebook}
        onUpdateNotebook={handleUpdateNotebook}
      />

      <NotebookManager
        isOpen={modals.notebookManager}
        onClose={() => dispatch(closeModal('notebookManager'))}
        notebooks={notebooks}
        metadata={metadata}
        onRefetch={() => dispatch(fetchNotebooks())}
        onDeleteNotebook={(id) => dispatch(deleteNotebookAction(id))}
        loading={loading}
        error={error}
      />

      <ExportDataModal
        isOpen={modals.exportData}
        onClose={() => {
          dispatch(closeModal('exportData'));
          setExportNotebook(null);
        }}
        notebook={exportNotebook}
      />

      <ContentsViewModal
        isOpen={modals.contentsView}
        onClose={() => {
          dispatch(closeModal('contentsView'));
          setContentsNotebook(null);
        }}
        notebook={contentsNotebook}
      />
      
      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        resourceId={selectedNotebook?.id}
        resourceType="notebook"
        resourceName={selectedNotebook?.name}
      />
      
      <ShareNotebookModal
        isOpen={shareNotebookModalOpen}
        onClose={() => {
          setShareNotebookModalOpen(false);
          setShareNotebook(null);
        }}
        notebook={shareNotebook}
      />
    </div>
  );
};

export default NotebooksPage;