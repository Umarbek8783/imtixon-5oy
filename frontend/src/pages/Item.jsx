import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, server } from '../services/api';
import { fmtDate, TYPE_LABEL } from '../utils/format';
import { Calendar, Chevron, Pin, TagGlyph, User } from '../components/Icons';

export default function Item() {
  const { id } = useParams();
  const [i, setI] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [active, setActive] = useState(0);
  const [answer, setAnswer] = useState('');
  const [res, setRes] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setI(null);
    setLoadErr('');
    setActive(0);
    api('/items/' + id).then((x) => setI(x.data)).catch((e) => setLoadErr(e.message));
  }, [id]);

  async function claim(e) {
    e.preventDefault();
    setBusy(true);
    setRes(null);
    try {
      await api(`/items/${id}/claims`, { method: 'POST', body: { answer, message: '' } });
      setRes({ ok: true, text: 'Da’vo yuborildi. E’lon egasiga xabar ketdi.' });
      setAnswer('');
    } catch (err) {
      setRes({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) {
    return (
      <main className="detail">
        <Link className="back" to="/"><Chevron width={16} height={16} />Barcha e’lonlar</Link>
        <div className="empty"><h3>E’lon topilmadi</h3><p>{loadErr}</p></div>
      </main>
    );
  }

  if (!i) {
    return (
      <main className="detail" aria-busy="true">
        <div className="detailGrid">
          <div className="skeleton tall" />
          <div className="skeleton tall" />
        </div>
      </main>
    );
  }

  const imgs = i.images || [];

  return (
    <main className="detail">
      <Link className="back" to="/"><Chevron width={16} height={16} />Barcha e’lonlar</Link>

      <div className="detailGrid">
        <section className="gallery" aria-label="Rasmlar">
          <div className="stage">
            {imgs.length ? <img src={server + imgs[active]} alt={i.title} /> : <div className="noimg"><TagGlyph size={64} /></div>}
          </div>
          {imgs.length > 1 && (
            <div className="thumbs">
              {imgs.map((x, k) => (
                <button key={x} type="button" className={k === active ? 'on' : ''} onClick={() => setActive(k)} aria-label={`${k + 1}-rasm`} aria-pressed={k === active}>
                  <img src={server + x} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="ticket">
          <div className="ticketTop">
            <div className="row">
              <span className={`chip ${i.type}`}>{TYPE_LABEL[i.type]}</span>
              {i.category && <span className="catchip flat">{i.category}</span>}
            </div>
            <h1>{i.title}</h1>
            <p className="desc">{i.description}</p>
            <dl className="facts">
              <div><dt><Pin width={16} height={16} />Joy</dt><dd>{i.location}</dd></div>
              <div><dt><Calendar width={16} height={16} />Sana</dt><dd>{fmtDate(i.event_date)}</dd></div>
              <div><dt><User width={16} height={16} />E’lon egasi</dt><dd>{i.full_name}</dd></div>
            </dl>
          </div>

          <div className="perf" />

          <div className="ticketBottom">
            {i.type === 'found' ? (
              <form className="claim" onSubmit={claim}>
                <h2>Bu buyum siznikimi?</h2>
                {i.secret_question && (
                  <p className="question"><span>Maxfiy savol</span>{i.secret_question}</p>
                )}
                {token ? (
                  <>
                    <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Javobingizni yozing" aria-label="Maxfiy savolga javob" required />
                    <button className="btn found wide" disabled={busy}>{busy ? 'Yuborilmoqda' : 'Da’vo yuborish'}</button>
                  </>
                ) : (
                  <p className="soft">Da’vo yuborish uchun <Link to="/login">tizimga kiring</Link>.</p>
                )}
                {res && <div className={res.ok ? 'notice' : 'error'} role="status">{res.text}</div>}
              </form>
            ) : (
              <div className="claim">
                <h2>Bu buyumni topdingizmi?</h2>
                <p className="soft">Topilgan buyum uchun alohida e’lon joylang, egasi sizni topadi.</p>
                <Link className="btn dark wide" to="/create?type=found">Topilgan e’lon berish</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
