-- =========================================================
-- DODANIE KOLUMNY country DO calendar_days
-- Uruchom to w Supabase SQL Editor
-- =========================================================

-- Dodaj kolumnę country (państwo) jeśli nie istnieje
ALTER TABLE calendar_days 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Dodaj indeks dla country (opcjonalnie, dla lepszej wydajności)
CREATE INDEX IF NOT EXISTS idx_calendar_days_country ON calendar_days(country);

-- Odśwież cache schematu (ważne!)
NOTIFY pgrst, 'reload schema';

-- Sprawdź czy kolumna została dodana
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calendar_days' AND column_name = 'country';

-- =========================================================
-- UWAGA: Po uruchomieniu tego skryptu:
-- 1. Odśwież stronę panelu admina (F5 lub Cmd+R)
-- 2. Spróbuj ponownie zapisać państwo
-- =========================================================


