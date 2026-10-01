import { Link } from 'react-router-dom';
import { Plus } from './Icons';

// Yo‘qotdim / Topdim — panelga osilgan yorliq. `to` berilsa bosiladigan havola bo‘ladi.
export default function HangTag({ tone, title, text, action, to, delay = 0 }) {
  const body = (
    <>
      <span className="hole" />
      <strong>{title}</strong>
      <span className="tagText">{text}</span>
      {action && (
        <span className="tagAction">
          <Plus width={16} height={16} />
          {action}
        </span>
      )}
    </>
  );
  return (
    <div className="hang" style={{ '--delay': `${delay}s` }}>
      <span className="string" />
      {to ? (
        <Link to={to} className={`hangtag ${tone}`}>{body}</Link>
      ) : (
        <div className={`hangtag ${tone}`}>{body}</div>
      )}
    </div>
  );
}
