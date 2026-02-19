import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Database,
  Play,
  Save,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  User,
  Tag,
  MoreVertical,
  Copy,
  Trash2,
  Share2,
  Edit2,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Users,
  PlusCircle,
  Table,
  Columns,
  Key,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  Loader2,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Sparkles
} from 'lucide-react';
import {
  selectConnections,
  selectConnectionsLoading,
  fetchDatabaseConnections,
  fetchDatabaseTables,
  fetchTableColumns,
  selectTablesForConnection,
  selectTablesLoading,
  selectTableColumns,
  selectTableColumnsLoading,
  executeQuery,
  selectQueryExecution,
  resetQueryExecution
} from '../../store/slices/databaseConnectionsSlice';
import { getDatabaseTypeById, DATABASE_CATEGORIES } from '../../config/databaseTypes';
import {
  fetchSavedQueries,
  createSavedQuery,
  updateSavedQuery,
  addFolder,
  selectQueries as selectSavedQueries,
  selectQueriesLoading as selectSavedQueriesLoading,
  selectFolders as selectSavedQueryFolders
} from '../../store/slices/savedQueriesSlice';
import { selectCurrentSpace } from '../../store/slices/spacesSlice';
import ConnectionFormModal from '../database/ConnectionFormModal';
import QueryAssistDialog from './QueryAssistDialog';
import { hasQueryAssistant } from '../../hooks/useQueryAssist';

const SQLQueriesTab = () => {
  const dispatch = useDispatch();
  const connections = useSelector(selectConnections);
  const connectionsLoading = useSelector(selectConnectionsLoading);

  // Space context - required for fetching connections
  const currentSpace = useSelector(selectCurrentSpace);
  const hasSpaceContext = currentSpace && currentSpace.space_id;

  // Redux selectors for saved queries
  const savedQueries = useSelector(selectSavedQueries);
  const savedQueriesLoading = useSelector(selectSavedQueriesLoading);
  const savedQueryFolders = useSelector(selectSavedQueryFolders);

  // Redux selector for query execution
  const queryExecution = useSelector(selectQueryExecution);

  const [selectedConnection, setSelectedConnection] = useState(null);

  // ============================================================================
  // Tab-Based Query Editor State
  // ============================================================================
  const [queryTabs, setQueryTabs] = useState([
    {
      id: 'tab-1',
      title: 'Unnamed',
      query: '',
      results: null,
      isExecuting: false,
      savedQueryId: null,
      error: null
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Get current active tab
  const activeTab = queryTabs.find(tab => tab.id === activeTabId) || queryTabs[0];

  // ============================================================================
  // Pagination State
  // ============================================================================
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Calculate pagination
  const totalRows = activeTab?.results?.rows?.length || 0;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedRows = activeTab?.results?.rows?.slice(startIndex, endIndex) || [];

  // ============================================================================
  // Column Management State
  // ============================================================================
  const [visibleColumnStart, setVisibleColumnStart] = useState(0);
  const [visibleColumnCount, setVisibleColumnCount] = useState(10);
  const [columnWidths, setColumnWidths] = useState({});
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Calculate visible columns
  const allColumns = activeTab?.results?.columns || [];
  const totalColumns = allColumns.length;
  const visibleColumns = allColumns.slice(visibleColumnStart, visibleColumnStart + visibleColumnCount);
  const canScrollColumnsLeft = visibleColumnStart > 0;
  const canScrollColumnsRight = visibleColumnStart + visibleColumnCount < totalColumns;

  // Sort rows if sort is active
  const sortedRows = React.useMemo(() => {
    if (!sortColumn || !activeTab?.results?.rows) return paginatedRows;

    const columnIndex = allColumns.indexOf(sortColumn);
    if (columnIndex === -1) return paginatedRows;

    return [...paginatedRows].sort((a, b) => {
      const aVal = Array.isArray(a) ? a[columnIndex] : Object.values(a)[columnIndex];
      const bVal = Array.isArray(b) ? b[columnIndex] : Object.values(b)[columnIndex];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [paginatedRows, sortColumn, sortDirection, allColumns, activeTab?.results?.rows]);

  // Reset column navigation when results change
  useEffect(() => {
    setVisibleColumnStart(0);
    setSortColumn(null);
    setSortDirection('asc');
    setColumnWidths({});
  }, [activeTab?.results]);

  // ============================================================================
  // Drag and Drop State for Query Organization
  // ============================================================================
  const [draggedQuery, setDraggedQuery] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState('');
  // Note: newFolderName state is shared with save dialog (defined in Other State section)

  // ============================================================================
  // Other State
  // ============================================================================
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [visibility, setVisibility] = useState('private');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showQueryAssistDialog, setShowQueryAssistDialog] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Collapsible panel state with localStorage persistence
  const [savedQueriesExpanded, setSavedQueriesExpanded] = useState(() => {
    const stored = localStorage.getItem('devtools-savedqueries-expanded');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [explorerExpanded, setExplorerExpanded] = useState(() => {
    const stored = localStorage.getItem('devtools-explorer-expanded');
    return stored !== null ? JSON.parse(stored) : true;
  });

  // User-created folders (persisted to localStorage so empty folders don't disappear)
  const [userCreatedFolders, setUserCreatedFolders] = useState(() => {
    const stored = localStorage.getItem('devtools-user-folders');
    return stored !== null ? JSON.parse(stored) : [];
  });

  // Table explorer state
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState({});

  // Redux selectors for table explorer
  const tables = useSelector((state) => selectTablesForConnection(state, selectedConnection));
  const tablesLoading = useSelector(selectTablesLoading);
  const allTableColumns = useSelector(selectTableColumns);
  const tableColumnsLoading = useSelector(selectTableColumnsLoading);

  // Get selected connection details for Query Assist
  const selectedConnectionObj = connections.find(c => c.id === selectedConnection);
  const selectedDatabaseType = selectedConnectionObj?.databaseType || selectedConnectionObj?.type || null;
  const selectedConnectionName = selectedConnectionObj?.name || '';

  // Build schema-qualified table names (e.g., "public.users", "agent_builder.agents")
  const tableNames = useMemo(() => {
    return tables?.map(t => {
      const name = t.table_name || t.name;
      const schema = t.schema || t.table_schema || t.schemaName || null;
      return schema ? `${schema}.${name}` : name;
    }) || [];
  }, [tables]);

  // Build detailed schema info for Query Assist (includes columns when available)
  const schemaInfo = useMemo(() => {
    if (!tables || !selectedConnection) return null;

    const tableDetails = tables.map(t => {
      const tableName = t.table_name || t.name;
      // Check for schema in multiple possible field names
      const tableSchema = t.schema || t.table_schema || t.schemaName || null;
      const fullName = tableSchema ? `${tableSchema}.${tableName}` : tableName;

      // Get columns from cache - try both with and without schema
      let columns = [];
      if (tableSchema) {
        const cacheKeyWithSchema = `${selectedConnection}:${tableSchema}.${tableName}`;
        columns = allTableColumns[cacheKeyWithSchema]?.columns || [];
      }
      if (columns.length === 0) {
        const cacheKeyWithoutSchema = `${selectedConnection}:${tableName}`;
        columns = allTableColumns[cacheKeyWithoutSchema]?.columns || [];
      }

      return {
        name: fullName,
        schema: tableSchema,
        columns: columns.map(col => ({
          name: col.name || col.column_name,
          type: col.data_type || col.type,
          nullable: col.is_nullable === 'YES' || col.nullable === true
        }))
      };
    });

    return tableDetails;
  }, [tables, selectedConnection, allTableColumns]);

  // ============================================================================
  // Tab Management Functions
  // ============================================================================
  const createNewTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    setQueryTabs(prev => [...prev, {
      id: newId,
      title: 'Unnamed',
      query: '',
      results: null,
      isExecuting: false,
      savedQueryId: null,
      error: null
    }]);
    setActiveTabId(newId);
  }, []);

  const closeTab = useCallback((tabId) => {
    if (queryTabs.length === 1) return; // Keep at least one tab
    const tabIndex = queryTabs.findIndex(t => t.id === tabId);
    const newTabs = queryTabs.filter(t => t.id !== tabId);
    setQueryTabs(newTabs);
    if (activeTabId === tabId) {
      // Switch to adjacent tab
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
      setActiveTabId(newTabs[newActiveIndex].id);
    }
  }, [queryTabs, activeTabId]);

  const updateTabQuery = useCallback((tabId, query) => {
    setQueryTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, query } : t
    ));
  }, []);

  const updateTabResults = useCallback((tabId, results, isExecuting = false, error = null) => {
    setQueryTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, results, isExecuting, error } : t
    ));
  }, []);

  const updateTabTitle = useCallback((tabId, title) => {
    setQueryTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, title } : t
    ));
  }, []);

  const updateTabSavedQueryId = useCallback((tabId, savedQueryId, title) => {
    setQueryTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, savedQueryId, title: title || t.title } : t
    ));
  }, []);

  // ============================================================================
  // Column Management Functions
  // ============================================================================
  const scrollColumnsLeft = useCallback(() => {
    setVisibleColumnStart(prev => Math.max(0, prev - visibleColumnCount));
  }, [visibleColumnCount]);

  const scrollColumnsRight = useCallback(() => {
    setVisibleColumnStart(prev => Math.min(totalColumns - visibleColumnCount, prev + visibleColumnCount));
  }, [totalColumns, visibleColumnCount]);

  const handleColumnSort = useCallback((columnName) => {
    if (sortColumn === columnName) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const handleColumnResizeStart = useCallback((e, columnIndex) => {
    e.preventDefault();
    setResizingColumn(columnIndex);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnIndex] || 150);
  }, [columnWidths]);

  const handleColumnResizeMove = useCallback((e) => {
    if (resizingColumn === null) return;
    const diff = e.clientX - resizeStartX;
    const newWidth = Math.max(80, resizeStartWidth + diff);
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const handleColumnResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  // Add mouse event listeners for column resizing
  useEffect(() => {
    if (resizingColumn !== null) {
      document.addEventListener('mousemove', handleColumnResizeMove);
      document.addEventListener('mouseup', handleColumnResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleColumnResizeMove);
        document.removeEventListener('mouseup', handleColumnResizeEnd);
      };
    }
  }, [resizingColumn, handleColumnResizeMove, handleColumnResizeEnd]);

  // ============================================================================
  // Drag and Drop Handlers for Query Organization
  // ============================================================================
  const handleQueryDragStart = useCallback((e, query) => {
    setDraggedQuery(query);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', query.id);
  }, []);

  const handleQueryDragEnd = useCallback(() => {
    setDraggedQuery(null);
    setDragOverFolder(null);
  }, []);

  const handleFolderDragOver = useCallback((e, folderName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderName);
  }, []);

  const handleFolderDragLeave = useCallback(() => {
    setDragOverFolder(null);
  }, []);

  const handleFolderDrop = useCallback(async (e, targetFolder) => {
    e.preventDefault();
    setDragOverFolder(null);

    if (!draggedQuery) return;

    // Don't do anything if dropping in the same folder
    if (draggedQuery.folder === targetFolder) {
      setDraggedQuery(null);
      return;
    }

    try {
      console.log('Moving query', draggedQuery.id, 'to folder:', targetFolder);
      const result = await dispatch(updateSavedQuery({
        id: draggedQuery.id,
        updates: { folder: targetFolder }
      })).unwrap();
      console.log('Move result:', result);
      // Refresh the queries list
      dispatch(fetchSavedQueries());
    } catch (error) {
      console.error('Failed to move query:', error);
      alert(`Failed to move query: ${error.message || error}`);
    }

    setDraggedQuery(null);
  }, [draggedQuery, dispatch]);

  const handleCreateFolder = useCallback(() => {
    const folderName = newFolderName.trim();
    if (!folderName) return;

    // Build the full folder path
    const fullFolderName = newFolderParent
      ? `${newFolderParent}/${folderName}`
      : folderName;

    // Add to user-created folders (persisted to localStorage)
    setUserCreatedFolders(prev => {
      if (prev.includes(fullFolderName)) return prev;
      return [...prev, fullFolderName];
    });

    // Also add to Redux state
    dispatch(addFolder(fullFolderName));

    // Expand the new folder so it's visible
    setExpandedFolders(prev => ({ ...prev, [fullFolderName]: true }));

    // Reset modal state
    setNewFolderName('');
    setNewFolderParent('');
    setShowNewFolderModal(false);
  }, [newFolderName, newFolderParent, dispatch]);

  // Persist panel states to localStorage
  useEffect(() => {
    localStorage.setItem('devtools-savedqueries-expanded', JSON.stringify(savedQueriesExpanded));
  }, [savedQueriesExpanded]);

  useEffect(() => {
    localStorage.setItem('devtools-explorer-expanded', JSON.stringify(explorerExpanded));
  }, [explorerExpanded]);

  // Persist user-created folders to localStorage
  useEffect(() => {
    localStorage.setItem('devtools-user-folders', JSON.stringify(userCreatedFolders));
  }, [userCreatedFolders]);

  // Load database connections and saved queries when space context is available
  useEffect(() => {
    if (hasSpaceContext) {
      dispatch(fetchDatabaseConnections());
      dispatch(fetchSavedQueries());
    }
  }, [dispatch, hasSpaceContext]);

  // Check for query to load from Add Data dialog (stored in localStorage)
  useEffect(() => {
    const storedData = localStorage.getItem('devtools-load-query');
    if (storedData) {
      try {
        const { query, connectionId, timestamp } = JSON.parse(storedData);
        // Only use if stored within last 30 seconds (to avoid stale data)
        if (Date.now() - timestamp < 30000 && query) {
          // Clear the stored data immediately
          localStorage.removeItem('devtools-load-query');

          // Set the connection
          if (connectionId) {
            setSelectedConnection(connectionId);
          }

          // Load the query into a new tab
          const newTabId = `tab-${Date.now()}`;
          setQueryTabs(prev => [...prev, {
            id: newTabId,
            title: query.name || 'Loaded Query',
            query: query.query || query.sql || '',
            results: null,
            isExecuting: false,
            savedQueryId: query.id || null,
            error: null
          }]);
          setActiveTabId(newTabId);
        } else {
          // Data is stale, remove it
          localStorage.removeItem('devtools-load-query');
        }
      } catch (e) {
        console.error('Failed to load query from localStorage:', e);
        localStorage.removeItem('devtools-load-query');
      }
    }
  }, []);

  // Load tables when connection changes
  useEffect(() => {
    if (selectedConnection) {
      dispatch(fetchDatabaseTables(selectedConnection));
      setExpandedTables({});
    }
  }, [dispatch, selectedConnection]);

  // Reset pagination when results change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab?.results]);

  // Auto-load columns for all tables when AI Assist dialog opens
  useEffect(() => {
    if (showQueryAssistDialog && selectedConnection && tables && tables.length > 0) {
      // Load columns for tables that don't have columns cached yet
      // Limit to first 20 tables to avoid too many API calls
      const tablesToLoad = tables.slice(0, 20);

      tablesToLoad.forEach(table => {
        const tableName = table.table_name || table.name;
        const tableSchema = table.schema || table.table_schema || table.schemaName || null;

        // Build cache key to check if columns are already loaded
        const cacheKey = tableSchema
          ? `${selectedConnection}:${tableSchema}.${tableName}`
          : `${selectedConnection}:${tableName}`;

        // Only fetch if not already cached
        if (!allTableColumns[cacheKey]) {
          dispatch(fetchTableColumns({
            connectionId: selectedConnection,
            tableName: tableName,
            schema: tableSchema,
          }));
        }
      });
    }
  }, [showQueryAssistDialog, selectedConnection, tables, allTableColumns, dispatch]);

  // Get columns for a table from cache
  const getColumnsForTable = useCallback((tableName, tableSchema) => {
    const cacheKey = tableSchema
      ? `${selectedConnection}:${tableSchema}.${tableName}`
      : `${selectedConnection}:${tableName}`;
    return allTableColumns[cacheKey]?.columns || [];
  }, [selectedConnection, allTableColumns]);

  // Handle table toggle (expand/collapse) with optional schema
  const handleTableToggle = (tableName, tableSchema = null) => {
    const expandKey = tableSchema ? `${tableSchema}.${tableName}` : tableName;

    setExpandedTables(prev => ({
      ...prev,
      [expandKey]: !prev[expandKey],
    }));

    // Load columns if expanding and not already loaded
    if (!expandedTables[expandKey]) {
      const cacheKey = tableSchema
        ? `${selectedConnection}:${tableSchema}.${tableName}`
        : `${selectedConnection}:${tableName}`;
      if (!allTableColumns[cacheKey]) {
        dispatch(fetchTableColumns({
          connectionId: selectedConnection,
          tableName: tableName,
          schema: tableSchema,
        }));
      }
    }
  };

  // Check if selected connection is a graph database
  const selectedDbType = getDatabaseTypeById(selectedDatabaseType);
  const isGraphDb = selectedDbType?.category === DATABASE_CATEGORIES.GRAPH;

  // Generate query statement for a table/label
  const generateSelectStatement = (tableName, tableSchema = null, columns = []) => {
    // For Neo4j/graph databases, generate Cypher
    if (isGraphDb) {
      if (tableSchema === 'relationships') {
        return `MATCH ()-[r:\`${tableName}\`]->() RETURN r LIMIT 25`;
      }
      return `MATCH (n:\`${tableName}\`) RETURN n LIMIT 25`;
    }
    // For SQL databases
    const fullTableName = tableSchema ? `${tableSchema}.${tableName}` : tableName;
    if (columns && columns.length > 0) {
      const columnNames = columns.map(col =>
        typeof col === 'string' ? col : col.name
      ).join(',\n  ');
      return `SELECT\n  ${columnNames}\nFROM ${fullTableName}\nLIMIT 100;`;
    }
    return `SELECT *\nFROM ${fullTableName}\nLIMIT 100;`;
  };

  // Handle table selection in explorer - generates SELECT statement
  const handleExplorerTableSelect = (tableName, tableSchema = null) => {
    const columns = getColumnsForTable(tableName, tableSchema);
    const query = generateSelectStatement(tableName, tableSchema, columns);
    updateTabQuery(activeTabId, query);

    // If columns aren't loaded yet, load them and then update the query
    const cacheKey = tableSchema
      ? `${selectedConnection}:${tableSchema}.${tableName}`
      : `${selectedConnection}:${tableName}`;
    if (!allTableColumns[cacheKey]) {
      dispatch(fetchTableColumns({
        connectionId: selectedConnection,
        tableName: tableName,
        schema: tableSchema,
      }));
    }
  };

  // Filter tables based on search
  const filteredTables = tables.filter(table => {
    const tableName = typeof table === 'string' ? table : table.name;
    return tableName.toLowerCase().includes(tableSearchTerm.toLowerCase());
  });

  // Refresh tables
  const handleRefreshTables = () => {
    if (selectedConnection) {
      dispatch(fetchDatabaseTables(selectedConnection));
      setExpandedTables({});
    }
  };

  // Get icon for column type
  const getColumnTypeIcon = (columnType) => {
    const type = (columnType || '').toLowerCase();
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
      return <Hash className="w-3 h-3 text-(--color-primary-500)" />;
    }
    if (type.includes('char') || type.includes('text') || type.includes('string')) {
      return <Type className="w-3 h-3 text-green-500" />;
    }
    if (type.includes('date') || type.includes('time') || type.includes('timestamp')) {
      return <Calendar className="w-3 h-3 text-purple-500" />;
    }
    if (type.includes('bool')) {
      return <ToggleLeft className="w-3 h-3 text-orange-500" />;
    }
    return <Columns className="w-3 h-3 text-gray-400" />;
  };

  const handleExecuteQuery = async () => {
    if (!selectedConnection || !activeTab.query.trim()) return;

    // Mark tab as executing
    updateTabResults(activeTabId, null, true, null);

    try {
      const response = await dispatch(executeQuery({
        connectionId: selectedConnection,
        query: activeTab.query
      })).unwrap();

      // The thunk returns { connectionId, result: response.data }
      // Extract the actual query result from response.result
      const result = response.result || response;

      // Parse result - API may return rows as array of arrays or array of objects
      let columns = [];
      let rows = [];

      if (result.columns) {
        columns = result.columns;
      } else if (result.rows && result.rows.length > 0) {
        // Extract columns from first row if object
        const firstRow = result.rows[0];
        if (Array.isArray(firstRow)) {
          columns = firstRow.map((_, i) => `column_${i + 1}`);
        } else {
          columns = Object.keys(firstRow);
        }
      }

      if (result.rows) {
        rows = result.rows.map(row => {
          if (Array.isArray(row)) {
            return row;
          }
          // Convert object rows to array format
          return columns.map(col => row[col]);
        });
      }

      // Store results in tab
      updateTabResults(activeTabId, {
        columns,
        rows,
        rowCount: result.row_count || result.rowCount || rows.length,
        executionTime: result.execution_time || result.executionTime || 0
      }, false, null);
    } catch (error) {
      updateTabResults(activeTabId, null, false, error.message || 'Query execution failed');
    }
  };

  // Get unique folder names from saved queries
  const existingFolders = [...new Set(savedQueries.map(q => q.folder).filter(Boolean))].sort();

  const handleSaveQuery = async () => {
    console.log('[Save] handleSaveQuery called', {
      activeTabId,
      savedQueryId: activeTab.savedQueryId,
      queryLength: activeTab.query?.length,
      tabTitle: activeTab.title,
    });
    // Pre-populate from saved query if editing
    if (activeTab.savedQueryId) {
      const existingQuery = savedQueries.find(q => q.id === activeTab.savedQueryId);
      if (existingQuery) {
        setQueryName(existingQuery.name);
        setQueryDescription(existingQuery.description || '');
        setVisibility(existingQuery.visibility || 'private');
        setSelectedFolder(existingQuery.folder || '');
      }
    } else {
      setQueryName(activeTab.title !== 'Unnamed' ? activeTab.title : '');
      setQueryDescription('');
      setVisibility('private');
      setSelectedFolder('');
    }
    setNewFolderName('');
    setSaveError(null);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!queryName.trim()) {
      setSaveError('Query name is required');
      return;
    }

    // Validate new folder name if creating new folder
    if (selectedFolder === '__new__' && !newFolderName.trim()) {
      setSaveError('Please enter a name for the new folder');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // Determine folder: new folder takes precedence if __new__ selected, then selected folder, then empty (top level)
    let folderToUse = '';
    if (selectedFolder === '__new__' && newFolderName.trim()) {
      folderToUse = newFolderName.trim();
    } else if (selectedFolder && selectedFolder !== '__new__') {
      folderToUse = selectedFolder;
    }

    try {
      const queryData = {
        name: queryName.trim(),
        description: queryDescription.trim(),
        query: activeTab.query,
        database_id: selectedConnection,
        visibility,
        folder: folderToUse || null  // null means top level / uncategorized
      };

      console.log('[Save] handleConfirmSave', {
        savedQueryId: activeTab.savedQueryId,
        isUpdate: !!activeTab.savedQueryId,
        queryText: JSON.stringify(activeTab.query),
        queryDataQuery: JSON.stringify(queryData.query),
        activeTabId,
      });

      if (activeTab.savedQueryId) {
        // Update existing query
        console.log('[Save] Dispatching updateSavedQuery', { id: activeTab.savedQueryId });
        const result = await dispatch(updateSavedQuery({
          id: activeTab.savedQueryId,
          updates: queryData
        })).unwrap();
        console.log('[Save] Update succeeded', result);
        updateTabTitle(activeTabId, queryName.trim());
      } else {
        // Create new query
        console.log('[Save] Dispatching createSavedQuery');
        const result = await dispatch(createSavedQuery(queryData)).unwrap();
        console.log('[Save] Create succeeded', result);
        // Update tab with saved query ID
        updateTabSavedQueryId(activeTabId, result.id, queryName.trim());
      }

      setShowSaveModal(false);
      setQueryName('');
      setQueryDescription('');
      setSelectedFolder('');
      setNewFolderName('');
    } catch (error) {
      console.error('[Save] Save failed', error);
      setSaveError(typeof error === 'string' ? error : (error.message || 'Failed to save query'));
    } finally {
      setIsSaving(false);
    }
  };

  // Open a saved query - either in existing tab or new tab
  const handleSelectQuery = (query) => {
    // Check if already open in a tab
    const existingTab = queryTabs.find(t => t.savedQueryId === query.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    let queryText = query.query || '';

    // Open in new tab
    const newId = `tab-${Date.now()}`;
    setQueryTabs(prev => [...prev, {
      id: newId,
      title: query.name,
      query: queryText,
      results: null,
      isExecuting: false,
      savedQueryId: query.id,
      error: null
    }]);
    setActiveTabId(newId);

    // Set connection if specified
    if (query.database_id || query.databaseId) {
      setSelectedConnection(query.database_id || query.databaseId);
    }

    setSelectedQuery(query);
  };

  const handleConnectionCreated = (newConnection) => {
    setShowConnectionModal(false);
    // Refresh connections list
    dispatch(fetchDatabaseConnections());
    // Auto-select the newly created connection
    if (newConnection?.id) {
      setSelectedConnection(newConnection.id);
    }
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Group queries by folder
  const groupedQueries = savedQueries.reduce((acc, query) => {
    const folder = query.folder || 'Uncategorized';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    // Normalize field names from API
    acc[folder].push({
      ...query,
      databaseId: query.database_id || query.databaseId,
      databaseName: query.database_name || query.databaseName ||
        connections.find(c => c.id === (query.database_id || query.databaseId))?.name || 'Unknown'
    });
    return acc;
  }, {});

  // Start with user-created folders (so empty folders persist)
  const filteredGroupedQueries = userCreatedFolders.reduce((acc, folder) => {
    acc[folder] = [];
    return acc;
  }, {});

  // Then add query-derived folders and their queries
  Object.entries(groupedQueries).forEach(([folder, queries]) => {
    const filtered = queries.filter(q =>
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0 || userCreatedFolders.includes(folder)) {
      // Merge with existing (in case folder was user-created)
      filteredGroupedQueries[folder] = [...(filteredGroupedQueries[folder] || []), ...filtered];
    }
  });

  // If searching, hide empty folders
  if (searchTerm) {
    Object.keys(filteredGroupedQueries).forEach(folder => {
      if (filteredGroupedQueries[folder].length === 0) {
        delete filteredGroupedQueries[folder];
      }
    });
  }

  const getVisibilityIcon = (vis) => {
    switch (vis) {
      case 'private': return <Lock size={12} className="text-gray-400" />;
      case 'shared': return <Users size={12} className="text-blue-500" />;
      case 'public': return <Globe size={12} className="text-green-500" />;
      default: return <Lock size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex h-full gap-0">
      {/* Left Panel - Saved Queries List (Collapsible) */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        savedQueriesExpanded ? 'w-64' : 'w-10'
      }`}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
          {savedQueriesExpanded && (
            <span className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <FileText size={14} className="text-gray-500" />
              Saved Queries
            </span>
          )}
          <button
            onClick={() => setSavedQueriesExpanded(!savedQueriesExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={savedQueriesExpanded ? 'Collapse' : 'Expand Saved Queries'}
          >
            {savedQueriesExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {savedQueriesExpanded && (
          <>
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={createNewTab}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="New Query Tab"
                >
                  <Plus size={12} />
                  Query
                </button>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="New Folder"
                >
                  <Folder size={12} />
                  Folder
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {savedQueriesLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                  <Loader2 size={20} className="animate-spin mb-2" />
                  <span className="text-xs">Loading queries...</span>
                </div>
              ) : Object.keys(filteredGroupedQueries).length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  {searchTerm ? 'No queries found' : 'No saved queries yet'}
                </div>
              ) : (
                Object.entries(filteredGroupedQueries).map(([folder, queries]) => (
                  <div
                    key={folder}
                    className={`mb-2 rounded transition-colors ${
                      dragOverFolder === folder ? 'bg-(--color-primary-100) ring-2 ring-(--color-primary-400)' : ''
                    }`}
                    onDragOver={(e) => handleFolderDragOver(e, folder)}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={(e) => handleFolderDrop(e, folder)}
                  >
                    <button
                      onClick={() => toggleFolder(folder)}
                      className="w-full flex items-center gap-1 px-1 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded"
                    >
                      {expandedFolders[folder] ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                      {expandedFolders[folder] ? (
                        <FolderOpen size={14} className="text-yellow-500" />
                      ) : (
                        <Folder size={14} className="text-yellow-500" />
                      )}
                      <span className="truncate">{folder}</span>
                      <span className="ml-auto text-xs text-gray-400">{queries.length}</span>
                    </button>
                    {expandedFolders[folder] && (
                      <div
                        className="ml-4 mt-1 space-y-0.5 min-h-[20px]"
                        onDragOver={(e) => handleFolderDragOver(e, folder)}
                        onDragLeave={handleFolderDragLeave}
                        onDrop={(e) => handleFolderDrop(e, folder)}
                      >
                        {queries.length === 0 ? (
                          <div className="text-[10px] text-gray-400 italic py-2 px-1">
                            Empty folder - drag queries here
                          </div>
                        ) : (
                          queries.map(query => (
                            <div
                              key={query.id}
                              draggable
                              onDragStart={(e) => handleQueryDragStart(e, query)}
                              onDragEnd={handleQueryDragEnd}
                              onClick={() => handleSelectQuery(query)}
                              className={`w-full flex items-start gap-1.5 p-1.5 text-left rounded transition-colors cursor-grab active:cursor-grabbing ${
                                draggedQuery?.id === query.id
                                  ? 'opacity-50 bg-gray-100'
                                  : activeTab.savedQueryId === query.id
                                    ? 'bg-(--color-primary-50) border border-(--color-primary-200)'
                                    : 'hover:bg-gray-50'
                              }`}
                            >
                              <FileText size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-medium text-gray-900 truncate">{query.name}</span>
                                  {getVisibilityIcon(query.visibility)}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate">{query.databaseName}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Middle Panel - Table Explorer (Collapsible) */}
      <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${
        explorerExpanded ? 'w-64' : 'w-10'
      }`}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
          {explorerExpanded && (
            <span className="font-medium text-sm text-gray-700 flex items-center gap-2">
              <Table size={14} className="text-gray-500" />
              Tables
            </span>
          )}
          <button
            onClick={() => setExplorerExpanded(!explorerExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={explorerExpanded ? 'Collapse' : 'Expand Table Explorer'}
          >
            {explorerExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {explorerExpanded && (
          <>
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleRefreshTables}
                  disabled={tablesLoading || !selectedConnection}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
                  title="Refresh Tables"
                >
                  <RefreshCw size={14} className={tablesLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={tableSearchTerm}
                  onChange={(e) => setTableSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  disabled={!selectedConnection}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {!selectedConnection ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  Select a database connection
                </div>
              ) : tablesLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                  <Loader2 size={20} className="animate-spin mb-2" />
                  <span className="text-xs">Loading tables...</span>
                </div>
              ) : filteredTables.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  {tableSearchTerm ? 'No tables match search' : 'No tables found'}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredTables.map((table) => {
                    const tableName = typeof table === 'string' ? table : table.name;
                    const tableSchema = typeof table === 'object' ? table.schema : null;
                    const tableKey = tableSchema ? `${tableSchema}.${tableName}` : tableName;
                    const isExpanded = expandedTables[tableKey];
                    const tableColumns = getColumnsForTable(tableName, tableSchema);
                    const isLoadingColumns = tableColumnsLoading && isExpanded && tableColumns.length === 0;

                    return (
                      <div key={tableKey}>
                        {/* Table row */}
                        <div
                          className="flex items-center px-1 py-1 cursor-pointer rounded hover:bg-gray-100"
                          onClick={() => handleExplorerTableSelect(tableName, tableSchema)}
                        >
                          <button
                            className="p-0.5 hover:bg-gray-200 rounded mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTableToggle(tableName, tableSchema);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-500" />
                            )}
                          </button>
                          <Table className="w-3.5 h-3.5 text-(--color-primary-500) mr-1.5 flex-shrink-0" />
                          <span className="text-xs font-medium truncate flex-1">{tableName}</span>
                          {tableSchema && (
                            <span className="text-[10px] text-gray-400 ml-1">{tableSchema}</span>
                          )}
                        </div>

                        {/* Expanded columns */}
                        {isExpanded && (
                          <div className="ml-5 border-l border-gray-200 pl-2 mt-0.5 space-y-0.5">
                            {isLoadingColumns ? (
                              <div className="flex items-center text-[10px] text-gray-500 py-1">
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                Loading...
                              </div>
                            ) : tableColumns.length > 0 ? (
                              tableColumns.map((column, idx) => {
                                const columnName = typeof column === 'string' ? column : column.name;
                                const columnType = typeof column === 'object' ? column.type : '';
                                const isPrimaryKey = typeof column === 'object' && column.isPrimaryKey;

                                return (
                                  <div
                                    key={`${tableKey}-${columnName}-${idx}`}
                                    className="flex items-center px-1 py-0.5 text-[10px] text-gray-600"
                                  >
                                    {getColumnTypeIcon(columnType)}
                                    {isPrimaryKey && (
                                      <Key className="w-2.5 h-2.5 text-yellow-500 ml-0.5" />
                                    )}
                                    <span className="ml-1 truncate flex-1 font-mono">{columnName}</span>
                                    {columnType && (
                                      <span className="text-gray-400 ml-1 font-mono">{columnType}</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-[10px] text-gray-400 py-1 italic">
                                No columns
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Table count footer */}
            {selectedConnection && !tablesLoading && (
              <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                <span className="text-[10px] text-gray-500">
                  {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
                  {tableSearchTerm && ` (filtered from ${tables.length})`}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Panel - Query Editor */}
      <div className="flex-1 bg-white rounded-r-lg border border-gray-200 border-l-0 flex flex-col min-w-0">
        {/* Connection Selector Header */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Database size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedConnection || ''}
                  onChange={(e) => setSelectedConnection(e.target.value)}
                  disabled={connectionsLoading}
                  className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) min-w-[200px] appearance-none bg-white"
                >
                  <option value="">
                    {connectionsLoading ? 'Loading connections...' :
                     connections.length === 0 ? 'No databases (click + to add)' :
                     'Select Database...'}
                  </option>
                  {connections.map(conn => (
                    <option key={conn.id} value={conn.id}>{conn.name}</option>
                  ))}
                </select>
                {connectionsLoading && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                )}
              </div>
              <button
                onClick={() => setShowConnectionModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 bg-white"
                title="Add New Database Connection"
              >
                <PlusCircle size={16} />
                <span className="hidden sm:inline">Add Connection</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* Panel Toggle Icons */}
              <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-1">
                <button
                  onClick={() => setSavedQueriesExpanded(!savedQueriesExpanded)}
                  className={`p-1.5 rounded transition-colors ${
                    savedQueriesExpanded
                      ? 'bg-(--color-primary-100) text-(--color-primary-600)'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  }`}
                  title={savedQueriesExpanded ? 'Hide Saved Queries' : 'Show Saved Queries'}
                >
                  {savedQueriesExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                </button>
                <button
                  onClick={() => setExplorerExpanded(!explorerExpanded)}
                  className={`p-1.5 rounded transition-colors ${
                    explorerExpanded
                      ? 'bg-(--color-primary-100) text-(--color-primary-600)'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  }`}
                  title={explorerExpanded ? 'Hide Table Explorer' : 'Show Table Explorer'}
                >
                  <Table size={16} />
                </button>
              </div>
              {/* AI Query Assist Button */}
              <button
                onClick={() => setShowQueryAssistDialog(true)}
                disabled={!selectedConnection || !hasQueryAssistant(selectedDatabaseType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedConnection && hasQueryAssistant(selectedDatabaseType)
                    ? 'text-purple-600 hover:bg-purple-50 border border-purple-200 bg-white'
                    : 'text-gray-400 border border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
                title={
                  !selectedConnection
                    ? 'Select a database connection first'
                    : !hasQueryAssistant(selectedDatabaseType)
                      ? `AI assist not available for ${selectedDatabaseType || 'this database'}`
                      : 'Get AI help writing queries'
                }
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">AI Assist</span>
              </button>
              <button
                onClick={handleSaveQuery}
                disabled={!activeTab.query.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={handleExecuteQuery}
                disabled={!selectedConnection || !activeTab.query.trim() || activeTab.isExecuting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeTab.isExecuting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {activeTab.isExecuting ? 'Running...' : 'Run Query'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabbed Query Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Tab Bar - Prominent tabs above the editor */}
          <div className="bg-gray-100 border-b border-gray-300 px-2 pt-2">
            <div className="flex items-end gap-1 overflow-x-auto">
              {queryTabs.map(tab => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm font-medium transition-all rounded-t-lg ${
                    activeTabId === tab.id
                      ? 'bg-white text-(--color-primary-700) border border-gray-300 border-b-0 shadow-sm relative z-10'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 border border-transparent'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <FileText size={14} className={activeTabId === tab.id ? 'text-(--color-primary-600)' : 'text-gray-400'} />
                  <span className="max-w-40 truncate">{tab.title}</span>
                  {tab.isExecuting && <Loader2 size={14} className="animate-spin text-(--color-primary-600)" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (queryTabs.length > 1) closeTab(tab.id); }}
                    disabled={queryTabs.length === 1}
                    className={`ml-1 p-1 rounded transition-colors ${
                      queryTabs.length === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:bg-gray-300 hover:text-gray-700'
                    }`}
                    title={queryTabs.length === 1 ? "Can't close last tab" : "Close tab"}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={createNewTab}
                className="flex items-center gap-1 px-3 py-2 mb-0.5 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors text-sm"
                title="New Query Tab"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>

          {/* Tab Content - Query Editor */}
          <div className="flex-1 flex flex-col bg-white border-l border-r border-gray-300 -mt-px">
            {/* Saved Query Info (if applicable) */}
            {activeTab.savedQueryId && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm">
                <FileText size={14} className="text-blue-500" />
                <span className="text-blue-700">Saved Query:</span>
                <span className="font-medium text-blue-900">{activeTab.title}</span>
                {getVisibilityIcon(savedQueries.find(q => q.id === activeTab.savedQueryId)?.visibility || 'private')}
              </div>
            )}

            {/* SQL Editor Textarea */}
            <div className="flex-1 p-4 min-h-[200px]">
              <textarea
                value={activeTab.query}
                onChange={(e) => updateTabQuery(activeTabId, e.target.value)}
                placeholder="Enter your SQL query here..."
                className="w-full h-full font-mono text-sm p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) resize-none bg-gray-50"
                spellCheck={false}
              />
            </div>

          {/* Error Display */}
          {activeTab.error && (
            <div className="border-t border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Query Error:</span>
                  <p className="mt-1">{activeTab.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Panel */}
          {activeTab.results && (
            <div className="border-t border-gray-200 flex-1 min-h-0 max-h-80 flex flex-col">
              {/* Results Header with Row/Column Info and Controls */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{activeTab.results.rowCount} rows</span>
                  <span>{totalColumns} columns</span>
                  {activeTab.results.executionTime > 0 && (
                    <span>{activeTab.results.executionTime}ms</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Column Navigation */}
                  {totalColumns > visibleColumnCount && (
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-3">
                      <button
                        onClick={scrollColumnsLeft}
                        disabled={!canScrollColumnsLeft}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Previous columns"
                      >
                        <ChevronsLeft size={16} />
                      </button>
                      <span className="text-xs text-gray-500 min-w-20 text-center">
                        Cols {visibleColumnStart + 1}-{Math.min(visibleColumnStart + visibleColumnCount, totalColumns)} of {totalColumns}
                      </span>
                      <button
                        onClick={scrollColumnsRight}
                        disabled={!canScrollColumnsRight}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Next columns"
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  )}
                  {/* Visible Column Count Selector */}
                  <select
                    value={visibleColumnCount}
                    onChange={(e) => { setVisibleColumnCount(Number(e.target.value)); setVisibleColumnStart(0); }}
                    className="border border-gray-200 rounded px-2 py-1 text-xs"
                    title="Columns to display"
                  >
                    <option value={5}>5 cols</option>
                    <option value={10}>10 cols</option>
                    <option value={15}>15 cols</option>
                    <option value={20}>20 cols</option>
                    <option value={totalColumns}>All cols</option>
                  </select>
                  <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Download CSV"
                      onClick={() => {
                        const res = activeTab.results;
                        if (!res) return;
                        const csvContent = [
                          res.columns.join(','),
                          ...res.rows.map(row =>
                            row.map(val => {
                              if (val == null) return '';
                              const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                                return `"${str.replace(/"/g, '""')}"`;
                              }
                              return str;
                            }).join(',')
                          )
                        ].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
                        link.click();
                      }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Copy Results"
                      onClick={async () => {
                        const res = activeTab.results;
                        if (!res) return;
                        const text = [
                          res.columns.join('\t'),
                          ...res.rows.map(row =>
                            row.map(val => val == null ? '' : (typeof val === 'object' ? JSON.stringify(val) : String(val))).join('\t')
                          )
                        ].join('\n');
                        try {
                          await navigator.clipboard.writeText(text);
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="flex-1 overflow-auto" style={{ cursor: resizingColumn !== null ? 'col-resize' : 'default' }}>
                <table className="text-sm border-collapse" style={{ tableLayout: 'fixed', minWidth: 'max-content' }}>
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.map((col, i) => {
                        const actualIndex = visibleColumnStart + i;
                        const width = columnWidths[actualIndex] || 150;
                        const isSorted = sortColumn === col;
                        return (
                          <th
                            key={actualIndex}
                            className="relative px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200 select-none group"
                            style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                          >
                            <div
                              className="flex items-center gap-1 cursor-pointer hover:text-(--color-primary-600)"
                              onClick={() => handleColumnSort(col)}
                              title={`${col}\nClick to sort`}
                            >
                              <span className="truncate flex-1">{col}</span>
                              {isSorted && (
                                sortDirection === 'asc'
                                  ? <ArrowUp size={12} className="flex-shrink-0 text-(--color-primary-600)" />
                                  : <ArrowDown size={12} className="flex-shrink-0 text-(--color-primary-600)" />
                              )}
                              {!isSorted && (
                                <ArrowUp size={12} className="flex-shrink-0 text-gray-300 opacity-0 group-hover:opacity-100" />
                              )}
                            </div>
                            {/* Resize Handle */}
                            <div
                              className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-(--color-primary-200) active:bg-(--color-primary-300)"
                              onMouseDown={(e) => handleColumnResizeStart(e, actualIndex)}
                              title="Drag to resize"
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, i) => {
                      const rowValues = Array.isArray(row) ? row : Object.values(row);
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          {visibleColumns.map((col, j) => {
                            const actualIndex = visibleColumnStart + j;
                            const cell = rowValues[actualIndex];
                            const width = columnWidths[actualIndex] || 150;
                            const isObj = cell !== null && typeof cell === 'object';
                            return (
                              <td
                                key={actualIndex}
                                className="px-3 py-2 text-gray-600 border-b border-r border-gray-100 align-top"
                                style={isObj ? { minWidth: `${width}px` } : { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
                                title={isObj ? undefined : (cell?.toString() || '')}
                              >
                                <div className={cell !== null && typeof cell === 'object' ? '' : 'truncate'}>
                                  {cell === null || cell === undefined ? (
                                    <span className="text-gray-300 italic">null</span>
                                  ) : typeof cell === 'object' ? (
                                    <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(cell, null, 2)}</pre>
                                  ) : (
                                    cell.toString()
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalRows > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Rows {startIndex + 1}-{endIndex} of {totalRows}</span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-gray-200 rounded px-2 py-1 text-sm"
                    >
                      <option value={25}>25 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                      <option value={250}>250 rows</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 text-sm">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Save Query Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {activeTab.savedQueryId ? 'Update Query' : 'Save Query'}
            </h3>

            {/* Error Display */}
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  placeholder="My Query"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={queryDescription}
                  onChange={(e) => setQueryDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  disabled={isSaving}
                />
              </div>
              {/* Folder Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => {
                    setSelectedFolder(e.target.value);
                    if (e.target.value !== '__new__') {
                      setNewFolderName('');
                    }
                  }}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500) disabled:opacity-50"
                >
                  <option value="">(No folder - top level)</option>
                  {existingFolders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                  <option value="__new__">+ Create new folder...</option>
                </select>

                {/* New folder input - shown when "Create new folder" is selected */}
                {selectedFolder === '__new__' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter new folder name..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                      disabled={isSaving}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <div className="flex gap-3">
                  {['private', 'shared', 'public'].map(vis => (
                    <button
                      key={vis}
                      onClick={() => setVisibility(vis)}
                      disabled={isSaving}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        visibility === vis
                          ? 'border-(--color-primary-500) bg-(--color-primary-50) text-(--color-primary-700)'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {getVisibilityIcon(vis)}
                      <span className="capitalize">{vis}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveError(null);
                }}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={!queryName.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-(--color-primary-600) text-white rounded-lg hover:bg-(--color-primary-700) disabled:opacity-50"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {activeTab.savedQueryId ? 'Update Query' : 'Save Query'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {showConnectionModal && (
        <ConnectionFormModal
          onClose={() => setShowConnectionModal(false)}
          onSuccess={handleConnectionCreated}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Folder size={20} className="text-yellow-500" />
                Create New Folder
              </h3>
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                  setNewFolderParent('');
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Folder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                  autoFocus
                />
              </div>

              {/* Parent Folder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Folder <span className="text-gray-400">(optional)</span>
                </label>
                <select
                  value={newFolderParent}
                  onChange={(e) => setNewFolderParent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary-500) focus:border-(--color-primary-500)"
                >
                  <option value="">No parent (root level)</option>
                  {/* Merge Redux folders with user-created folders */}
                  {[...new Set([...savedQueryFolders, ...userCreatedFolders])].sort().map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a parent to create a nested folder structure.
                </p>
              </div>

              {/* Preview */}
              {newFolderName.trim() && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">New folder path:</span>
                  <div className="flex items-center gap-1 mt-1 text-sm font-medium text-gray-700">
                    <Folder size={14} className="text-yellow-500" />
                    {newFolderParent ? `${newFolderParent}/${newFolderName.trim()}` : newFolderName.trim()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                  setNewFolderParent('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-(--color-primary-600) hover:bg-(--color-primary-700) rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Query Assist Dialog */}
      <QueryAssistDialog
        isOpen={showQueryAssistDialog}
        onClose={() => setShowQueryAssistDialog(false)}
        onApply={(query) => {
          updateTabQuery(activeTabId, query);
          setShowQueryAssistDialog(false);
        }}
        databaseType={selectedDatabaseType}
        currentQuery={activeTab?.query || ''}
        tables={tableNames}
        schemaInfo={schemaInfo}
        connectionName={selectedConnectionName}
      />
    </div>
  );
};

export default SQLQueriesTab;
