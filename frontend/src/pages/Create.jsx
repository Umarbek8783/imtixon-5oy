import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { todayISO } from '../utils/format';
import Field from '../components/Field';
import { Close, Photo } from '../components/Icons';

const MAX_FILES = 3;
const MAX_SIZE = 2 * 1024 * 1024;

export default function Create() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({
    type: params.get('type') === 'found' ? 'found' : 'lost',
    title: '', description: '', location: '', event_date: todayISO(),
    category_id: '', secret_question: '', secret_answer: '',
  });
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!localStorage.getItem('token')) nav('/login');
    api('/categories').then((x) => setCats(x.data)).catch(() => {});
  }, [nav]);

  const previews = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function pick(e) {
    const chosen = [...e.target.files];
    e.target.value = '';
    setMsg('');
    if (chosen.some((x) => x.size > MAX_SIZE)) return setMsg('Har bir rasm hajmi 2 MB dan oshmasligi kerak.');
    const next = [...files, ...chosen];
    if (next.length > MAX_FILES) setMsg(`Ko‘pi bilan ${MAX_FILES} ta rasm yuklash mumkin.`);
    setFiles(next.slice(0, MAX_FILES));
  }

  async function submit(e) {
    e.preventDefault();
    if (!files.length) return setMsg('Kamida 1 ta rasm yuklang.');
    setBusy(true);
    setMsg('');
    const fd = new FormData();
    ['type', 'title', 'description', 'location', 'event_date', 'category_id'].forEach((k) => fd.append(k, f[k]));
    if (f.type === 'found') {
      fd.append('secret_question', f.secret_question);
      fd.append('secret_answer', f.secret_answer);
    }
    files.forEach((x) => fd.append('images', x));
    try {
      await api('/items', { method: 'POST', body: fd });
      nav('/');
    } catch (err) {
      setMsg(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="formPage">
      <form onSubmit={submit} className="formCard">
        <h1>Yangi e’lon</h1>

        <fieldset className="choice">
          <legend>E’lon turi</legend>
          <button type="button" className={`opt lost${f.type === 'lost' ? ' on' : ''}`} aria-pressed={f.type === 'lost'} onClick={() => setF({ ...f, type: 'lost' })}>
            <b>Yo‘qotdim</b><span>Buyumimni qidiryapman</span>
          </button>
          <button type="button" className={`opt found${f.type === 'found' ? ' on' : ''}`} aria-pressed={f.type === 'found'} onClick={() => setF({ ...f, type: 'found' })}>
            <b>Topdim</b><span>Egasini qidiryapman</span>
          </button>
        </fieldset>

        <div className="formSection">
          <h2>Buyum haqida</h2>
          <Field label="Nomi">
            <input maxLength={100} placeholder="Masalan: qora hamyon" value={f.title} onChange={set('title')} required />
          </Field>
          <Field label="Kategoriya">
            <select value={f.category_id} onChange={set('category_id')} required>
              <option value="">Tanlang</option>
              {cats.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tavsif" hint="Rangi, belgisi, ichida nima borligi kabi tafsilotlar.">
            <textarea rows={4} value={f.description} onChange={set('description')} required />
          </Field>
        </div>

        <div className="formSection">
          <h2>Qayerda va qachon</h2>
          <div className="two">
            <Field label="Joy">
              <input maxLength={150} placeholder="Masalan: Chilonzor metrosi" value={f.location} onChange={set('location')} required />
            </Field>
            <Field label="Sana">
              <input type="date" max={todayISO()} value={f.event_date} onChange={set('event_date')} required />
            </Field>
          </div>
        </div>

        <div className="formSection">
          <h2>Rasmlar</h2>
          <div className="previews">
            {previews.map((u, k) => (
              <div className="preview" key={u}>
                <img src={u} alt={`${k + 1}-rasm`} />
                <button type="button" aria-label={`${k + 1}-rasmni olib tashlash`} onClick={() => setFiles(files.filter((_, n) => n !== k))}><Close width={14} height={14} /></button>
              </div>
            ))}
            {files.length < MAX_FILES && (
              <label className="drop">
                <input className="sr" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} />
                <Photo width={26} height={26} />
                <span>Rasm qo‘shish</span>
              </label>
            )}
          </div>
          <p className="hint">1 tadan 3 tagacha, JPG, PNG yoki WebP. Har biri 2 MB gacha.</p>
        </div>

        {f.type === 'found' && (
          <div className="formSection secret">
            <h2>Egasini tekshirish</h2>
            <p className="soft">Faqat haqiqiy egasi biladigan narsani so‘rang, masalan telefon orqasidagi yozuv. Javob shifrlangan holda saqlanadi, katta-kichik harf farq qilmaydi.</p>
            <Field label="Maxfiy savol">
              <input maxLength={200} value={f.secret_question} onChange={set('secret_question')} required />
            </Field>
            <Field label="Maxfiy javob">
              <input value={f.secret_answer} onChange={set('secret_answer')} required />
            </Field>
          </div>
        )}

        {msg && <div className="error" role="alert">{msg}</div>}
        <button className="btn dark wide" disabled={busy}>{busy ? 'Joylanmoqda' : 'E’lonni joylash'}</button>
      </form>
    </main>
  );
}
