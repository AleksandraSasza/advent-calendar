-- =========================================================
-- USTAW UŻYTKOWNIKA JAKO ADMINA
-- =========================================================
-- Wykonaj to w Supabase SQL Editor
-- =========================================================

-- Sprawdź wszystkich użytkowników
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- Ustaw użytkownika jako admina (ZASTĄP EMAIL SWOIM EMAILEM!)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'twoj-email@example.com';

-- Sprawdź czy zmiana się powiodła
SELECT email, role 
FROM profiles 
WHERE email = 'twoj-email@example.com';

-- =========================================================
-- INSTRUKCJA:
-- 1. Skopiuj powyższe zapytanie
-- 2. Wklej w Supabase SQL Editor
-- 3. Zastąp 'twoj-email@example.com' swoim emailem
-- 4. Uruchom zapytanie (Run)
-- 5. Zaloguj się ponownie w aplikacji
-- 6. Przejdź do /admin - powinieneś mieć dostęp!
-- =========================================================


