import { Link } from 'react-router-dom';
import { server } from '../services/api';
import { fmtDate, TYPE_LABEL } from '../utils/format';
import { Calendar, Pin, TagGlyph } from './Icons';

export default function ItemCard({ item: i }) {
  return (
    <Link className={`card ${i.type}`} to={`/items/${i.id}`}>
      <div className="thumb">
        {i.cover ? (
          <img src={server + i.cover} alt="" loading="lazy" />
        ) : (
          <div className="noimg"><TagGlyph size={44} /></div>
        )}
        <span className={`chip ${i.type}`}>{TYPE_LABEL[i.type]}</span>
        {i.category && <span className="catchip">{i.category}</span>}
      </div>
      <div className="cardBody">
        <h3>{i.title}</h3>
        <p>{i.description}</p>
      </div>
      <div className="stub">
        <span><Pin width={15} height={15} /><i>{i.location}</i></span>
        <span><Calendar width={15} height={15} /><i>{fmtDate(i.event_date)}</i></span>
      </div>
    </Link>
  );
}
