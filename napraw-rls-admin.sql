-- =========================================================
-- NAPRAWA RLS DLA PROFILES - ADMIN POWINIEN WIDZIEĆ WSZYSTKICH
-- =========================================================

-- Usuń istniejące polityki
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;

-- Polityka 1: Użytkownicy widzą siebie
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Polityka 2: Admini widzą wszystkich
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

-- Sprawdź czy polityki zostały utworzone
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

