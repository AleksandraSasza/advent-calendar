-- =========================================================
-- POTWIERDŹ EMAIL UŻYTKOWNIKA RĘCZNIE
-- =========================================================
-- Wykonaj to w Supabase SQL Editor
-- =========================================================

-- Sprawdź użytkowników i ich status email
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Potwierdź email użytkownika (ZASTĄP EMAIL SWOIM EMAILEM!)
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'twoj-email@example.com';

-- Sprawdź czy zmiana się powiodła
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email = 'twoj-email@example.com';

-- =========================================================
-- INSTRUKCJA:
-- 1. Skopiuj powyższe zapytanie
-- 2. Wklej w Supabase SQL Editor
-- 3. Zastąp 'twoj-email@example.com' swoim emailem
-- 4. Uruchom zapytanie (Run)
-- 5. Spróbuj zalogować się ponownie w aplikacji
-- =========================================================

