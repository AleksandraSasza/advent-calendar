-- =========================================================
-- ZAMIANA DNIA 9 (JAPONIA -> KANADA) I DNIA 13 (KANADA -> JAPONIA)
-- Uruchom to w Supabase SQL Editor
-- =========================================================

-- Zaktualizuj dzień 9 - zmień z Japonii na Kanadę
UPDATE calendar_days 
SET country = 'Kanada'
WHERE day_number = 9;

-- Zaktualizuj dzień 13 - zmień z Kanady na Japonię
UPDATE calendar_days 
SET country = 'Japonia'
WHERE day_number = 13;

-- Sprawdź czy aktualizacja się powiodła
SELECT day_number, country 
FROM calendar_days 
WHERE day_number IN (9, 13)
ORDER BY day_number;

-- =========================================================
-- UWAGA: Po uruchomieniu tego skryptu:
-- 1. Odśwież stronę aplikacji (F5 lub Cmd+R)
-- 2. Sprawdź czy dzień 9 pokazuje Kanadę na mapie
-- 3. Sprawdź czy dzień 13 pokazuje Japonię na mapie
-- 4. Sprawdź panel admina - powinny być zaktualizowane
-- =========================================================

