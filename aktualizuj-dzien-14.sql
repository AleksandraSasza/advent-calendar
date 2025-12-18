-- =========================================================
-- AKTUALIZACJA DNIA 14 - ZMIANA Z WŁOCH NA FRANCJĘ
-- Uruchom to w Supabase SQL Editor
-- =========================================================

-- Zaktualizuj dzień 14 - zmień państwo z Włoch na Francję
UPDATE calendar_days 
SET country = 'Francja',
    fun_fact = '🎄 We Francji tradycją jest jedzenie bûche de Noël (bożonarodzeniowego kłoda) - ciasta w kształcie kłoda! W Paryżu na Polach Elizejskich rozbłyskują tysiące światełek.'
WHERE day_number = 14;

-- Sprawdź czy aktualizacja się powiodła
SELECT day_number, country, fun_fact 
FROM calendar_days 
WHERE day_number = 14;

-- =========================================================
-- UWAGA: Po uruchomieniu tego skryptu:
-- 1. Odśwież stronę aplikacji (F5 lub Cmd+R)
-- 2. Sprawdź czy dzień 14 pokazuje Francję na mapie
-- =========================================================


