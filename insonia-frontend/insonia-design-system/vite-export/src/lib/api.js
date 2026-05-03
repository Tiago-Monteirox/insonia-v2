// Insonia API client + auth token store
// Backend: FastAPI + GraphQL (http://localhost:8000)
// JWT salvo em localStorage com chave 'ins.token'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export const auth = {
  setToken(t) { try { localStorage.setItem('ins.token', t); } catch (e) {} },
  getToken() { try { return localStorage.getItem('ins.token'); } catch (e) { return null; } },
  clear()    { try { localStorage.removeItem('ins.token'); } catch (e) {} },
  isAuthed() { return !!this.getToken(); },
};

function authHeader() {
  const t = auth.getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export const api = {
  base: API_BASE,

  async login(email, password) {
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.detail || 'login_failed');
      err.detail = data.detail;
      throw err;
    }
    const data = await res.json();
    auth.setToken(data.access_token);
    return data;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authHeader(),
      });
    } catch (e) {}
    auth.clear();
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  },

  async resetPassword(token, password) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.detail || 'reset_failed');
      err.detail = data.detail;
      throw err;
    }
    return true;
  },

  googleLoginUrl() {
    return `${API_BASE}/auth/google/authorize`;
  },

  // GraphQL helper
  async gql(query, variables = {}) {
    const res = await fetch(`${API_BASE}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 401) {
      auth.clear();
      throw new Error('unauthorized');
    }
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'graphql_error');
    return data.data;
  },
};
