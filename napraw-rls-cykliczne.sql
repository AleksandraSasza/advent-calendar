-- =========================================================
-- NAPRAWA RLS - PROBLEM Z CYKLICZNYM SPRAWDZANIEM
-- =========================================================
-- Problem: Polityka profiles_select_admin używa EXISTS z subquery,
-- która może powodować problem z cyklicznym sprawdzaniem
-- Rozwiązanie: Uproszczona polityka używająca SECURITY DEFINER
-- =========================================================

-- KROK 1: Usuń WSZYSTKIE istniejące polityki SELECT
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- KROK 2: Utwórz funkcję pomocniczą do sprawdzania roli admina
-- Ta funkcja będzie używana przez politykę, aby uniknąć cyklicznego sprawdzania
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- KROK 3: Polityka 1 - Użytkownik zawsze może odczytać swój własny profil
-- Ta polityka działa dla WSZYSTKICH użytkowników (w tym adminów)
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- KROK 4: Polityka 2 - Admini mogą odczytać wszystkie profile
-- Ta polityka używa funkcji pomocniczej, aby uniknąć cyklicznego sprawdzania
CREATE POLICY "profiles_select_admin"
ON profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- KROK 5: Sprawdź czy polityki zostały utworzone
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

-- KROK 6: Sprawdź czy RLS jest włączone
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- =========================================================
-- INSTRUKCJA:
-- 1. Uruchom to zapytanie w Supabase SQL Editor
-- 2. Sprawdź czy polityki zostały utworzone
-- 3. Sprawdź czy RLS jest włączone (powinno być true)
-- 4. Spróbuj zalogować się ponownie w aplikacji
-- =========================================================


