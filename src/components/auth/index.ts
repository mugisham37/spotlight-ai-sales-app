// Authentication Components
export { AuthGuard } from "./AuthGuard";
export {
  AuthErrorCard,
  InlineAuthError,
  AuthErrorBoundary,
} from "./AuthErrorHandler";
export {
  AuthPageSkeleton,
  InlineAuthLoading,
  AuthFormLoading,
  AuthButtonLoading,
  AuthTransition,
  AuthStepIndicator,
  AuthPulseLoader,
  AuthSpinnerOverlay,
} from "./AuthLoadingStates";
export {
  AuthSuccessMessage,
  AuthErrorMessage,
  AuthInfoMessage,
  AuthRetryMechanism,
  useAuthFeedback,
} from "./AuthFeedback";
export {
  LazyAuthComponent,
  useProgressiveAuth,
  OptimizedAuthComponent,
  AuthBundleOptimizer,
  createAuthRoute,
} from "./AuthLazyLoader";

// Re-export types if needed
export type { default as AuthLoadingStates } from "./AuthLoadingStates";
export type { default as AuthErrorHandler } from "./AuthErrorHandler";
export type { default as AuthFeedback } from "./AuthFeedback";
export type { default as AuthLazyLoader } from "./AuthLazyLoader";
