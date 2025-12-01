-- =========================================================
-- Naprawa polityk RLS dla bucketa task-responses
-- =========================================================
-- Problem: Polityki RLS używają 'TASK-RESPONSES', 
-- ale bucket nazywa się 'task-responses' (małe litery)
-- =========================================================

-- Usuń stare polityki (jeśli istnieją)
DROP POLICY IF EXISTS "Users can upload their own task responses" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own task responses" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own task responses" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all task responses" ON storage.objects;

-- Utwórz nowe polityki z poprawną nazwą bucketa (małe litery)
CREATE POLICY "Users can upload their own task responses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own task responses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own task responses"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read all task responses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-responses' 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- Sprawdzenie:
-- 1. Uruchom ten skrypt w Supabase SQL Editor
-- 2. Sprawdź w Storage → Policies czy polityki są aktywne
-- 3. Spróbuj przesłać zdjęcie ponownie
-- =========================================================

