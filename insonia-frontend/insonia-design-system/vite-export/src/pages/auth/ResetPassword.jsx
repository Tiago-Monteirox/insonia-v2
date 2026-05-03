import { useState } from 'react';
import { Check, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import PasswordField from './PasswordField.jsx';
import { api } from '../../lib/api.js';

export default function ResetPassword({ token, onDone }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const mismatch = pw2.length > 0 && pw !== pw2;
  const tooShort = pw.length > 0 && pw.length < 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) { setError('Senha inválida. Use ao menos 8 caracteres.'); return; }
    if (pw !== pw2)    { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await api.resetPassword(token, pw);
      setOk(true);
    } catch (err) {
      if (err.detail === 'RESET_PASSWORD_BAD_TOKEN') setError('Link inválido ou expirado. Solicite um novo.');
      else if (err.detail === 'RESET_PASSWORD_INVALID_PASSWORD') setError('Senha inválida. Use ao menos 8 caracteres.');
      else setError('Não foi possível redefinir. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <AuthShell>
        <div className="auth-success">
          <div className="icon-wrap"><CheckCircle2 size={32} /></div>
          <h2>Senha redefinida</h2>
          <p>Sua senha foi atualizada. Faça login para continuar.</p>
        </div>
        <button type="button" className="btn primary lg" style={{ justifyContent: 'center' }} onClick={onDone}>
          <LogIn size={16} />Ir para o login
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1>Nova senha</h1>
          <p>Escolha uma senha forte para sua conta.</p>
        </div>

        <PasswordField
          label="Nova senha"
          value={pw}
          onChange={setPw}
          autoComplete="new-password"
          hint={tooShort ? 'Use ao menos 8 caracteres.' : 'Mínimo 8 caracteres.'}
          hintError={tooShort}
        />

        <PasswordField
          label="Confirmar nova senha"
          value={pw2}
          onChange={setPw2}
          autoComplete="new-password"
          hint={mismatch ? 'As senhas não coincidem' : null}
          hintError={mismatch}
        />

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
          disabled={loading || pw.length < 8 || pw !== pw2}
        >
          {loading ? <span>Salvando…</span> : <><Check size={16} />Salvar nova senha</>}
        </button>
      </form>
    </AuthShell>
  );
}
