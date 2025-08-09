import { configureStore } from '@reduxjs/toolkit';
import notebooksReducer from './slices/notebooksSlice.js';
import authReducer from './slices/authSlice.js';
import uiReducer from './slices/uiSlice.js';
import teamsReducer from './slices/teamsSlice.js';
import organizationsReducer from './slices/organizationsSlice.js';
import usersReducer from './slices/usersSlice.js';
import { syncMiddleware } from './middleware/syncMiddleware.js';

const store = configureStore({
  reducer: {
    notebooks: notebooksReducer,
    auth: authReducer,
    ui: uiReducer,
    teams: teamsReducer,
    organizations: organizationsReducer,
    users: usersReducer
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

export default store;