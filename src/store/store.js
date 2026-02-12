import { configureStore } from '@reduxjs/toolkit';
import notebooksReducer from './slices/notebooksSlice.js';
import authReducer from './slices/authSlice.js';
import uiReducer from './slices/uiSlice.js';
import teamsReducer from './slices/teamsSlice.js';
import organizationsReducer from './slices/organizationsSlice.js';
import usersReducer from './slices/usersSlice.js';
import spacesReducer from './slices/spacesSlice.js';
import dataSourcesReducer from './slices/dataSourcesSlice.js';
import databaseConnectionsReducer from './slices/databaseConnectionsSlice.js';
import complianceReducer from './slices/complianceSlice.js';
import savedQueriesReducer from './slices/savedQueriesSlice.js';
import aiPlaygroundReducer from './slices/aiPlaygroundSlice.js';
import producersReducer from './slices/producersSlice.js';
import workflowsReducer from './slices/workflowsSlice.js';
import { syncMiddleware } from './middleware/syncMiddleware.js';

const store = configureStore({
  reducer: {
    notebooks: notebooksReducer,
    auth: authReducer,
    ui: uiReducer,
    teams: teamsReducer,
    organizations: organizationsReducer,
    users: usersReducer,
    spaces: spacesReducer,
    dataSources: dataSourcesReducer,
    databaseConnections: databaseConnectionsReducer,
    compliance: complianceReducer,
    savedQueries: savedQueriesReducer,
    aiPlayground: aiPlaygroundReducer,
    producers: producersReducer,
    workflows: workflowsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(syncMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// TypeScript types (exported for TypeScript files)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// Make store available globally for API service
if (typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}

export default store;