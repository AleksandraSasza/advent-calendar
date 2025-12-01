-- =========================================================
-- DODANIE KOLUMNY country DO calendar_days
-- Uruchom to w Supabase SQL Editor jeśli kolumna nie istnieje
-- =========================================================

-- Dodaj kolumnę country (państwo) jeśli nie istnieje
ALTER TABLE calendar_days 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Dodaj indeks dla country (opcjonalnie, dla lepszej wydajności)
CREATE INDEX IF NOT EXISTS idx_calendar_days_country ON calendar_days(country);

-- =========================================================
-- UWAGA: Kolumna coordinates nie jest potrzebna
-- Współrzędne są obliczane dynamicznie na podstawie państwa w kodzie JavaScript
-- =========================================================

