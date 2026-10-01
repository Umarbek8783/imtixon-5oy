import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

export default function Verify() {
  const [params] = useSearchParams();
  const email = (params.get('email') || '').trim().toLowerCase();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function verify(e) {
    e.preventDefault();
    if (!email) {
      setMsg({ ok: false, text: 'Email manzili topilmadi. Register sahifasidan qayta boshlang.' });
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const data = await api('/auth/verify', {
        method: 'POST',
        body: { email, code },
      });

      localStorage.setItem('token', data.data.token);
      setMsg({ ok: true, text: 'Email tasdiqlandi. Hisobingizga kirdingiz.' });

      setTimeout(() => nav('/'), 500);
    } catch (error) {
      setMsg({ ok: false, text: error.message });
      setBusy(false);
    }
  }

  async function resend() {
    if (!email || cooldown > 0) return;

    setResendBusy(true);
    setMsg(null);

    try {
      const data = await api('/auth/resend', {
        method: 'POST',
        body: { email },
      });
      setMsg({ ok: true, text: data.message });
      setCooldown(60);
    } catch (error) {
      setMsg({ ok: false, text: error.message });
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <AuthShell
      tone="found"
      asideTitle="Kod yo‘lda"
      asideText="Pochtangizni tekshiring. Kod 10 daqiqa amal qiladi."
      title="Emailni tasdiqlang"
      lead={email ? `${email} manziliga 6 xonali kod yuborildi.` : '6 xonali kodni kiriting.'}
    >
      <form onSubmit={verify} className="stack">
        {msg && <div className={msg.ok ? 'notice' : 'error'} role="alert">{msg.text}</div>}

        <Field label="Tasdiqlash kodi">
          <input
            className="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />
        </Field>

        <button className="btn dark wide" disabled={busy || code.length !== 6 || !email}>
          {busy ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </button>

        <button
          type="button"
          className="btn wide"
          disabled={resendBusy || cooldown > 0 || !email}
          onClick={resend}
        >
          {resendBusy ? 'Yuborilmoqda...' : cooldown ? `Yangi kod ${cooldown}s dan keyin` : 'Kodni qayta yuborish'}
        </button>
      </form>
    </AuthShell>
  );
}
