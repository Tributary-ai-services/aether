/**
 * Auth Components
 *
 * Components for authentication status display and permission-based rendering.
 */

// Authentication status components
export { default as AuthLoadingIndicator } from './AuthLoadingIndicator.jsx';
export { AuthRefreshIndicator, AuthErrorDisplay } from './AuthLoadingIndicator.jsx';

// Permission-based rendering components
export { default as RequirePermission } from './RequirePermission.jsx';
export {
  RequirePermission as RequirePermissionComponent,
  RequireNoPermission,
  withPermission,
  useCheckPermission
} from './RequirePermission.jsx';

// Protected interactive components
export { default as ProtectedButton } from './ProtectedButton.jsx';
export {
  ProtectedButton as ProtectedButtonComponent,
  ProtectedIconButton,
  ProtectedMenuItem,
  ProtectedLink
} from './ProtectedButton.jsx';
