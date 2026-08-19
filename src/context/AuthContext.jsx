import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const AuthContext = createContext(null);

function readStored(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStored(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  function persistSession(newToken, newUser) {
    try {
      window.localStorage.setItem(TOKEN_KEY, newToken);
      window.localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {
      /* storage unavailable: session lives in memory only */
    }
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  async function login(payload) {
    const { token: newToken, user: newUser } = await api.login(payload);
    return persistSession(newToken, newUser);
  }

  async function register(payload) {
    const { token: newToken, user: newUser } = await api.register(payload);
    return persistSession(newToken, newUser);
  }

  async function guest() {
    const { token: newToken, user: newUser } = await api.guest();
    return persistSession(newToken, newUser);
  }

  async function logout() {
    if (token) {
      try {
        await api.logout();
      } catch {
        /* token may already be expired: clear locally regardless */
      }
    }
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore storage errors */
    }
    setToken(null);
    setUser(null);
  }

  async function refresh() {
    if (!token) return null;
    const { user: fresh } = await api.me();
    setUser(fresh);
    return fresh;
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token && !!user, login, register, guest, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}