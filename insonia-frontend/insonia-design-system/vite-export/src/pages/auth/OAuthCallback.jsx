import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../../lib/api.js';

// Backend redirects here after Google OAuth: /auth/callback?token=...
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      auth.setToken(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [params, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--ins-fg-muted)' }}>Autenticando…</p>
    </div>
  );
}
