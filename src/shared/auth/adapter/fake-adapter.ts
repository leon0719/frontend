import type { AuthAdapter, User } from "../model/types";

// 僅供 demo:記住「登入的帳號名稱」讓重新整理後 me() 能還原,不是憑證(真實後端的憑證是 HttpOnly cookie)
const KEY = "auth.fake-user";

const ACCOUNTS: Record<string, { password: string; user: User }> = {
  admin: { password: "admin", user: { id: "1", name: "admin", roles: ["admin", "user"] } },
  user: { password: "user", user: { id: "2", name: "user", roles: ["user"] } },
};

export const fakeAuthAdapter: AuthAdapter = {
  async login(credentials) {
    const entry = ACCOUNTS[credentials.username];
    if (!entry || entry.password !== credentials.password) {
      throw new Error("Invalid credentials");
    }
    localStorage.setItem(KEY, credentials.username);
    return entry.user;
  },
  async logout() {
    localStorage.removeItem(KEY);
  },
  async me() {
    const name = localStorage.getItem(KEY);
    return (name && ACCOUNTS[name]?.user) || null;
  },
};
