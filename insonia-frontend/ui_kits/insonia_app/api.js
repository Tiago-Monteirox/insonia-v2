// api.js — auth & GraphQL client para Insonia
const API_BASE = 'http://localhost:8000';
const TOKEN_KEY = 'ins.token';

const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

// fastapi-users espera OAuth2 form data, não JSON
async function login(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Credenciais inválidas');
  }
  const { access_token } = await res.json();
  auth.setToken(access_token);
  return access_token;
}

function logout() {
  auth.clear();
  // Dispara o callback de logout registrado pelo App
  window.__insOnLogout?.();
}

// Todas as queries/mutations GraphQL passam por aqui
async function gql(query, variables = {}) {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  // Token expirado ou inválido — desloga automaticamente
  if (res.status === 401) {
    logout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

Object.assign(window, { insApi: { login, logout, gql, auth } });
