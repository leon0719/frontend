import { create } from "zustand";
import { fakeAuthAdapter } from "../adapter/fake-adapter";
import { tokenStorage } from "../lib/token-storage";
import type { AuthAdapter, AuthStatus, Credentials, User } from "./types";

let adapter: AuthAdapter = fakeAuthAdapter;

export function setAuthAdapter(next: AuthAdapter): void {
  adapter = next;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: "idle",
  login: async (credentials) => {
    set({ status: "loading" });
    try {
      const { user, token } = await adapter.login(credentials);
      set({ user, token, status: "authenticated" });
    } catch (error) {
      set({ user: null, token: null, status: "unauthenticated" });
      throw error;
    }
  },
  logout: async () => {
    await adapter.logout();
    set({ user: null, token: null, status: "unauthenticated" });
  },
  clear: () => {
    tokenStorage.clear();
    set({ user: null, token: null, status: "unauthenticated" });
  },
  init: async () => {
    set({ status: "loading" });
    const session = await adapter.me();
    if (session) {
      set({ user: session.user, token: session.token, status: "authenticated" });
    } else {
      set({ user: null, token: null, status: "unauthenticated" });
    }
  },
}));
