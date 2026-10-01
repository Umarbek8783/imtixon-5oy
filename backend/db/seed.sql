INSERT INTO categories(name) VALUES ('Hujjatlar'),('Telefon'),('Hamyon'),('Kalitlar'),('Sumka'),('Boshqa') ON CONFLICT (name) DO NOTHING;
-- Admin yaratish: server ishga tushgach POST /api/auth/register orqali oddiy user yarating, so'ng role='admin' qiling.
