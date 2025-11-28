-- =========================================================
-- SPRAWDŹ PROFIL I RLS (Row Level Security)
-- =========================================================
-- Wykonaj to w Supabase SQL Editor
-- =========================================================

-- 1. Sprawdź profil użytkownika
SELECT 
    id,
    email,
    role,
    display_name,
    created_at,
    LENGTH(role) as role_length,
    ASCII(role) as role_ascii
FROM profiles
WHERE email = 'alekssasha2705@gmail.com';  -- ← Zastąp swoim emailem

-- 2. Sprawdź czy RLS jest włączone
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 3. Sprawdź polityki RLS dla profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Sprawdź czy użytkownik może odczytać swój profil (jako test)
-- Uruchom to jako zalogowany użytkownik w Supabase SQL Editor
SELECT * FROM profiles WHERE id = auth.uid();

-- =========================================================
-- INSTRUKCJA:
-- 1. Uruchom pierwsze zapytanie - sprawdź czy rola jest dokładnie 'admin'
-- 2. Sprawdź czy RLS jest włączone (powinno być true)
-- 3. Sprawdź polityki - powinna być polityka pozwalająca użytkownikom czytać swoje profile
-- 4. Jeśli polityki nie działają, może trzeba je naprawić
-- =========================================================

