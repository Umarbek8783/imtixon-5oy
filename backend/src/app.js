require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const auth = require('./modules/auth/auth.routes');
const categories = require('./modules/categories/categories.routes');
const items = require('./modules/items/items.routes');
const claims = require('./modules/claims/claims.routes');

const app = express();

const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.disable('x-powered-by');

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === FRONTEND_URL) return callback(null, true);
    return callback(new Error('CORS origin ruxsat etilmagan.'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Topildi API ishlayapti',
    data: { status: 'ok' },
  });
});

// Canonical API routes. Frontend VITE_API_URL must end with /api.
app.use('/api/auth', auth);
app.use('/api/categories', categories);
app.use('/api/items', items);
app.use('/api', claims);

app.use((err, req, res, next) => {
  console.error('Unhandled backend error:', err);
  if (err.message === 'CORS origin ruxsat etilmagan.') {
    return res.status(403).json({ success: false, message: 'CORS ruxsat berilmadi.' });
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.status && err.status < 500 ? err.message : 'Server xatosi.',
  });
});

// Root health/status route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend muvaffaqiyatli ishlayapti",
    status: "online"
  });
});

// API health route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API ishlayapti",
    status: "online"
  });
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route topilmadi',
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`Backend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
