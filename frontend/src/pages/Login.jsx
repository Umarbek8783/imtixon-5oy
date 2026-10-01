import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      localStorage.setItem('token', data.data.token);
      nav('/');
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      tone="found"
      asideTitle="Topildi"
      asideText="Yo‘qotgan yoki topgan buyumingiz haqida bir joydan e’lon bering."
      title="Kirish"
      lead="Hisobingizga kiring va e’lon joylang."
    >
      <form onSubmit={submit} className="stack">
        {err && <div className="error" role="alert">{err}</div>}

        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            placeholder="ism@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Parol">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <button className="btn dark wide" disabled={busy}>
          {busy ? 'Kirilmoqda...' : 'Kirish'}
        </button>

        <p className="soft center">
          Hisobingiz yo‘qmi? <Link to="/register">Ro‘yxatdan o‘ting</Link>
        </p>
      </form>
    </AuthShell>
  );
}
