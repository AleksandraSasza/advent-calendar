-- =========================================================
-- SPRAWDŹ ROLĘ UŻYTKOWNIKA
-- =========================================================
-- Wykonaj to w Supabase SQL Editor
-- =========================================================

-- Sprawdź wszystkich użytkowników i ich role
SELECT 
    p.id,
    p.email,
    p.role,
    p.display_name,
    p.created_at,
    u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- Sprawdź konkretnego użytkownika (ZASTĄP EMAIL SWOIM EMAILEM!)
SELECT 
    p.email,
    p.role,
    p.display_name,
    u.email_confirmed_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'twoj-email@example.com';

-- Jeśli rola nie jest 'admin', ustaw ją:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'twoj-email@example.com';

-- =========================================================
-- INSTRUKCJA:
-- 1. Uruchom pierwsze zapytanie, aby zobaczyć wszystkich użytkowników
-- 2. Sprawdź czy Twój email ma role = 'admin'
-- 3. Jeśli nie, uruchom UPDATE (zastąp email)
-- 4. Zaloguj się ponownie - powinieneś być przekierowany do /admin
-- =========================================================


