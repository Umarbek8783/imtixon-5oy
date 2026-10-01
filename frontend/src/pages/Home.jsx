import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import HangTag from '../components/HangTag';
import ItemCard from '../components/ItemCard';
import { Search } from '../components/Icons';

const TYPES = [
  { v: '', label: 'Hammasi' },
  { v: 'lost', label: 'Yo‘qolgan' },
  { v: 'found', label: 'Topilgan' },
];

export default function Home() {
  const [items, setItems] = useState(null); // null = yuklanmoqda
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [type, setType] = useState('');
  const [cat, setCat] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/categories').then((x) => setCats(x.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setErr('');
    const p = new URLSearchParams();
    if (applied) p.set('search', applied);
    if (type) p.set('type', type);
    if (cat) p.set('category_id', cat);
    api('/items?' + p.toString())
      .then((x) => alive && setItems(x.data))
      .catch((e) => {
        if (!alive) return;
        setErr(e.message);
        setItems([]);
      });
    return () => { alive = false; };
  }, [applied, type, cat]);

  const filtered = applied || type || cat;
  const reset = () => { setQ(''); setApplied(''); setType(''); setCat(''); };

  return (
    <main>
      <section className="hero">
        <div className="heroText">
          <h1>Yo‘qolgan buyumni egasiga qaytaramiz.</h1>
          <p>Telefon, hujjat, hamyon yoki kalit — yo‘qotgan yoki topgan bo‘lsangiz, e’lon bering. Qolganini biz hal qilamiz.</p>
          <form
            className="search"
            role="search"
            onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()); document.getElementById('elonlar')?.scrollIntoView({ behavior: 'smooth' }); }}
          >
            <Search className="searchIcon" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buyum yoki joy nomi" aria-label="Buyum yoki joy nomi bo‘yicha qidirish" />
            <button className="btn found">Qidirish</button>
          </form>
        </div>

        <div className="pegboard">
          <div className="rail" />
          <div className="tags">
            <HangTag tone="lost" to="/create?type=lost" title="Yo‘qotdim" text="Buyumingizni e’lon qiling, topganlar sizga yetkazadi." action="E’lon berish" delay={0.05} />
            <HangTag tone="found" to="/create?type=found" title="Topdim" text="Topilgan narsani joylang, egasi o‘zi topib keladi." action="E’lon berish" delay={0.25} />
          </div>
        </div>
      </section>

      <section className="listing" id="elonlar" aria-labelledby="elonlar-h">
        <div className="listHead">
          <div>
            <h2 id="elonlar-h">So‘nggi e’lonlar</h2>
            <p className="count" aria-live="polite">{items ? `${items.length} ta e’lon` : 'Yuklanmoqda'}</p>
          </div>
          <div className="filters">
            <div className="seg" role="group" aria-label="E’lon turi">
              {TYPES.map((t) => (
                <button key={t.v} type="button" className={type === t.v ? 'on' : ''} aria-pressed={type === t.v} onClick={() => setType(t.v)}>
                  {t.label}
                </button>
              ))}
            </div>
            <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Kategoriya">
              <option value="">Barcha kategoriyalar</option>
              {cats.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {err && <div className="error" role="alert">{err}</div>}

        {items === null && (
          <div className="grid" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, k) => <div className="skeleton" key={k} />)}
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid">{items.map((i) => <ItemCard item={i} key={i.id} />)}</div>
        )}

        {items && items.length === 0 && !err && (
          <div className="empty">
            <h3>{filtered ? 'Bu qidiruv bo‘yicha e’lon topilmadi' : 'Hozircha e’lonlar yo‘q'}</h3>
            <p>{filtered ? 'Boshqa so‘z yozing yoki filtrlarni tozalang.' : 'Birinchi e’lonni siz joylang.'}</p>
            <div className="row">
              {filtered && <button className="btn ghost" onClick={reset}>Filtrlarni tozalash</button>}
              <Link className="btn dark" to="/create">E’lon berish</Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
