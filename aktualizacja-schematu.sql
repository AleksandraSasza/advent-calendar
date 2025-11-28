-- =========================================================
-- AKTUALIZACJA SCHEMATU - DODANIE KOLUMN DO calendar_days
-- Uruchom to w Supabase SQL Editor
-- =========================================================

-- Dodaj kolumnę country (państwo)
ALTER TABLE calendar_days 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Dodaj kolumnę coordinates (współrzędne geograficzne jako JSONB)
-- Format: [latitude, longitude] np. [52.2297, 21.0122]
ALTER TABLE calendar_days 
ADD COLUMN IF NOT EXISTS coordinates JSONB;

-- Dodaj indeks dla country (opcjonalnie)
CREATE INDEX IF NOT EXISTS idx_calendar_days_country ON calendar_days(country);

-- =========================================================
-- PRZYKŁADOWE DANE - możesz je wstawić przez panel admina
-- =========================================================

-- Przykład aktualizacji dnia 1:
-- UPDATE calendar_days 
-- SET country = 'Polska', 
--     coordinates = '[52.2297, 21.0122]'::jsonb
-- WHERE day_number = 1;

