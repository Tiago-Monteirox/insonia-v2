import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  required = true,
  hint,
  hintError,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="auth-pw">
        <input
          className="input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
        />
        <button
          type="button"
          className="eye-btn"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <div className={`auth-hint ${hintError ? 'error' : ''}`}>{hint}</div>}
    </div>
  );
}
