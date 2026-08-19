const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `API ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      else if (data.detail) message = data.detail;
    } catch {
      /* non-JSON error body: keep default message */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  meta: () => request("/api/meta"),
  departments: (university, campus) =>
    request(`/api/meta/departments?university=${encodeURIComponent(university)}&campus=${encodeURIComponent(campus)}`),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  getHealth: () => request("/api/health"),
  getFaculties: () => request("/api/faculties"),
  getFaculty: (id) => request(`/api/faculties/${id}`),
  getMyFaculty: () => request("/api/faculties/me"),
  getDashboard: () => request("/api/dashboard"),
  recompute: () => request("/api/recompute", { method: "POST" }),
};

export const getHealth = () => api.getHealth();
export const getFaculties = () => api.getFaculties();
export const getFaculty = (id) => api.getFaculty(id);
export const getDashboard = () => api.getDashboard();
export const recompute = () => api.recompute();