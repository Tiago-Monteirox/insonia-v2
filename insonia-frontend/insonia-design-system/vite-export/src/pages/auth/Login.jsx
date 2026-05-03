import { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import PasswordField from './PasswordField.jsx';
import { api } from '../../lib/api.js';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

export default function Login({ onLogin, onForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.login(email, password);
      onLogin();
    } catch (err) {
      if (err.detail === 'LOGIN_BAD_CREDENTIALS') setError('E-mail ou senha incorretos.');
      else if (err.detail === 'LOGIN_USER_NOT_VERIFIED') setError('Conta ainda não verificada. Confira seu e-mail.');
      else setError('Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1>Entrar</h1>
          <p>Acesse sua conta para continuar.</p>
        </div>

        <div className="field">
          <label>E-mail</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <PasswordField
          label="Senha"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <button type="button" className="auth-link" onClick={onForgot}>
          Esqueceu a senha?
        </button>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn primary lg"
          style={{ justifyContent: 'center' }}
          disabled={loading}
        >
          {loading ? <span>Entrando…</span> : <><LogIn size={16} />Entrar</>}
        </button>

        <div className="auth-divider">ou</div>

        <button
          type="button"
          className="btn google lg"
          style={{ width: '100%', justifyContent: 'center', gap: 10 }}
          onClick={() => { window.location.href = api.googleLoginUrl(); }}
        >
          <GoogleIcon /> Continuar com Google
        </button>
      </form>
    </AuthShell>
  );
}
