import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Plus, TagGlyph } from './Icons';

export default function Nav() {
  const nav = useNavigate();
  useLocation(); // sahifa almashganda token holatini qayta o‘qish uchun
  const token = localStorage.getItem('token');

  return (
    <header className="topbar">
      <nav className="nav" aria-label="Asosiy menyu">
        <Link className="logo" to="/" aria-label="Topildi — bosh sahifa">
          <TagGlyph size={26} style={{ color: 'var(--found)', '--hole': 'var(--paper)' }} />
          <span>Topildi</span>
        </Link>
        <div className="links">
          <NavLink to="/" end className="navlink">E’lonlar</NavLink>
          {token ? (
            <>
              <Link className="btn dark" to="/create"><Plus width={16} height={16} />E’lon berish</Link>
              <button className="btn ghost" onClick={() => { localStorage.clear(); nav('/'); }}>Chiqish</button>
            </>
          ) : (
            <>
              <Link className="btn ghost" to="/register">Ro‘yxatdan o‘tish</Link>
              <Link className="btn dark" to="/login">Kirish</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
