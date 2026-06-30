export { fakeAuthAdapter } from "./adapter/fake-adapter";
export { useAuth } from "./lib/use-auth";
export { usePermission } from "./lib/use-permission";
export { setAuthAdapter, useAuthStore } from "./model/auth-store";
export { tokenStorage } from "./lib/token-storage";
export { RequireAuth } from "./ui/require-auth";
export { RequireRole } from "./ui/require-role";
export type {
  AuthAdapter,
  AuthSession,
  AuthStatus,
  Credentials,
  Role,
  User,
} from "./model/types";
