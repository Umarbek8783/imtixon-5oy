import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Create from './pages/Create';
import Item from './pages/Item';
import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/create" element={<Create />} />
        <Route path="/items/:id" element={<Item />} />
      </Routes>
      <footer className="footer">Topildi. Yo‘qolgan buyumlar egasiga qaytadi.</footer>
    </BrowserRouter>
  );
}
