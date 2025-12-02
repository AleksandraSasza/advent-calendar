-- =========================================================
-- NAPRAW POLITYKI RLS - FINALNA WERSJA
-- =========================================================
-- Problem: Polityka blokuje odczyt własnego profilu
-- Rozwiązanie: Prosta polityka - użytkownik zawsze może odczytać swój profil
-- =========================================================

-- KROK 1: Usuń WSZYSTKIE istniejące polityki SELECT
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- KROK 2: Utwórz prostą politykę - użytkownik może odczytać swój własny profil
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- KROK 3: Sprawdź czy polityka została utworzona
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'SELECT';

-- KROK 4: Sprawdź czy RLS jest włączone
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- =========================================================
-- INSTRUKCJA:
-- 1. Uruchom to zapytanie w Supabase SQL Editor
-- 2. Sprawdź czy polityka "profiles_select_own" została utworzona
-- 3. Sprawdź czy RLS jest włączone (powinno być true)
-- 4. Spróbuj zalogować się ponownie w aplikacji
-- =========================================================


