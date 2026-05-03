import { useState } from 'react';
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import { api } from '../../lib/api.js';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError('Não foi possível enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <button type="button" className="auth-back" onClick={onBack}>
          <ArrowLeft size={16} /> Voltar para o login
        </button>
        <div className="auth-success">
          <div className="icon-wrap"><CheckCircle2 size={32} /></div>
          <h2>E-mail enviado</h2>
          <p>
            Verifique sua caixa de entrada. O link expira em 1 hora.<br />
            Se não aparecer, verifique o spam.
          </p>
        </div>
        <button type="button" className="btn ghost lg" style={{ justifyContent: 'center' }} onClick={onBack}>
          Voltar para o login
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <button type="button" className="auth-back" onClick={onBack}>
        <ArrowLeft size={16} /> Voltar para o login
      </button>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1>Recuperar senha</h1>
          <p>Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
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

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn primary lg" style={{ justifyContent: 'center' }} disabled={loading}>
          {loading ? <span>Enviando…</span> : <><Mail size={16} />Enviar link</>}
        </button>
      </form>
    </AuthShell>
  );
}
