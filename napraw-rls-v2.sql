-- =========================================================
-- NAPRAW POLITYKI RLS DLA PROFILES - WERSJA 2
-- =========================================================
-- Problem: Polityka ma cykliczne zapytanie
-- Rozwiązanie: Uproszczona polityka - użytkownik zawsze może odczytać swój profil
-- =========================================================

-- Usuń WSZYSTKIE istniejące polityki SELECT dla profiles
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

-- Polityka: Użytkownicy mogą czytać swój własny profil
-- To jest najprostsza i najbezpieczniejsza polityka
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Sprawdź czy polityka została utworzona
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test: Sprawdź czy możesz odczytać swój profil
-- (Uruchom to jako zalogowany użytkownik w Supabase SQL Editor)
SELECT * FROM profiles WHERE id = auth.uid();

-- =========================================================
-- INSTRUKCJA:
-- 1. Uruchom to zapytanie w Supabase SQL Editor
-- 2. Sprawdź czy polityka "profiles_select_own" została utworzona
-- 3. Spróbuj zalogować się ponownie w aplikacji
-- 4. Sprawdź konsolę przeglądarki - powinno działać!
-- =========================================================


