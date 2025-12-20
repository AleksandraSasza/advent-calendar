-- Aktualizacja dnia 22 - Indie z ciekawostką o Diwali
-- =========================================================
-- UWAGA: Państwo (country) jest w kodzie JavaScript, nie w bazie danych!
-- Ten skrypt aktualizuje tylko fun_fact w bazie danych.

-- Krok 1: Zaktualizuj tylko fun_fact dla dnia 22 w tabeli calendar_days
UPDATE calendar_days 
SET 
    fun_fact = '✨ W Indiach podczas święta Diwali, zwanego Świętem Świateł, wierzy się, że sen w tę noc ma wyjątkową moc. Po zapaleniu lampek i modlitwach ludzie kładą się spać w spokojnej atmosferze, bo to, co im się przyśni, może zapowiadać szczęście na cały nadchodzący rok. Dlatego przed snem sprząta się dom i unika kłótni – aby sny były jasne i dobre, tak jak światła Diwali ✨'
WHERE day_number = 22;

-- Krok 2: Sprawdź czy aktualizacja się powiodła
SELECT 
    day_number,
    fun_fact,
    is_active
FROM calendar_days 
WHERE day_number = 22;

