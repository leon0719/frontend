export { fakeAuthAdapter } from "./adapter/fake-adapter";
export { setAuthAdapter, useAuthStore } from "./model/auth-store";
export { tokenStorage } from "./lib/token-storage";
export type {
  AuthAdapter,
  AuthSession,
  AuthStatus,
  Credentials,
  Role,
  User,
} from "./model/types";
