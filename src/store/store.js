import { configureStore } from '@reduxjs/toolkit';
import notebooksReducer from './slices/notebooksSlice.js';
import authReducer from './slices/authSlice.js';
import uiReducer from './slices/uiSlice.js';

const store = configureStore({
  reducer: {
    notebooks: notebooksReducer,
    auth: authReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// TypeScript types (exported for TypeScript files)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;