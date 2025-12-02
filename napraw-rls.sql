-- =========================================================
-- NAPRAW POLITYKI RLS DLA PROFILES
-- =========================================================
-- Problem: Polityka może mieć cykliczne zapytanie
-- Rozwiązanie: Uproszczona polityka dla SELECT
-- =========================================================

-- Usuń istniejące polityki
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;

-- Polityka 1: Użytkownicy mogą czytać swój własny profil
CREATE POLICY "profiles_select_self"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Polityka 2: Admini mogą czytać wszystkie profile
-- (Używamy prostszego sprawdzenia - jeśli użytkownik ma rolę admin w swojej sesji)
CREATE POLICY "profiles_select_admin"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Sprawdź czy polityki są aktywne
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

-- =========================================================
-- INSTRUKCJA:
-- 1. Uruchom to zapytanie w Supabase SQL Editor
-- 2. Sprawdź czy polityki zostały utworzone
-- 3. Spróbuj zalogować się ponownie
-- =========================================================


