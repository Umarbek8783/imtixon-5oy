import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

export default function Register() {
  const [f, setF] = useState({ full_name: '', email: '', phone: '+998', password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: f,
      });

      setMsg({ ok: true, text: data.message || 'Tasdiqlash kodi emailingizga yuborildi.' });
      setTimeout(() => {
        nav(`/verify?email=${encodeURIComponent(f.email.trim().toLowerCase())}`);
      }, 500);
    } catch (error) {
      setMsg({ ok: false, text: error.message });
      setBusy(false);
    }
  }

  return (
    <AuthShell
      tone="lost"
      asideTitle="Yo‘qotdingizmi?"
      asideText="Ro‘yxatdan o‘ting va buyumingiz haqida e’lon bering."
      title="Ro‘yxatdan o‘tish"
      lead="Emailingizga 6 xonali tasdiqlash kodi yuboramiz."
    >
      <form onSubmit={submit} className="stack">
        {msg && <div className={msg.ok ? 'notice' : 'error'} role="alert">{msg.text}</div>}

        <Field label="To‘liq ism">
          <input
            autoComplete="name"
            maxLength={50}
            value={f.full_name}
            onChange={set('full_name')}
            required
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            placeholder="ism@gmail.com"
            value={f.email}
            onChange={set('email')}
            required
          />
        </Field>

        <Field label="Telefon" hint="Format: +998901234567">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={13}
            value={f.phone}
            onChange={set('phone')}
            required
          />
        </Field>

        <Field label="Parol" hint="Kamida 8 belgi, harf va raqam bo‘lsin">
          <input
            type="password"
            autoComplete="new-password"
            value={f.password}
            onChange={set('password')}
            required
          />
        </Field>

        <button className="btn dark wide" disabled={busy}>
          {busy ? 'Yuborilmoqda...' : 'Ro‘yxatdan o‘tish'}
        </button>

        <p className="soft center">
          Hisobingiz bormi? <Link to="/login">Kirish</Link>
        </p>
      </form>
    </AuthShell>
  );
}
