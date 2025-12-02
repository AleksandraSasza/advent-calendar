-- =========================================================
-- NAPRAWA WYŚWIETLANIA ZDJĘĆ - POLITYKI RLS DLA PUBLICZNEGO DOSTĘPU
-- =========================================================
-- Ten skrypt dodaje polityki, które pozwalają na publiczny dostęp
-- do zdjęć w bucketcie task-responses
-- =========================================================

-- Najpierw usuń stare polityki (jeśli istnieją)
DROP POLICY IF EXISTS "Public can read task responses" ON storage.objects;
DROP POLICY IF EXISTS "Public can read task responses by path" ON storage.objects;

-- Polityka 1: Publiczny dostęp do wszystkich plików w bucketcie task-responses
-- (tylko do odczytu - SELECT)
CREATE POLICY "Public can read task responses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-responses'
);

-- Alternatywna polityka: Publiczny dostęp tylko do plików w określonych folderach
-- Jeśli chcesz bardziej restrykcyjną politykę, użyj tej zamiast powyższej:
-- CREATE POLICY "Public can read task responses by path"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'task-responses'
--   AND (storage.foldername(name))[1] IS NOT NULL
-- );

-- =========================================================
-- UWAGI:
-- 1. Upewnij się, że bucket 'task-responses' jest ustawiony jako PUBLIC
--    w Supabase Dashboard → Storage → Settings → Public bucket: ON
-- 2. Ta polityka pozwala każdemu (nawet niezalogowanym) na odczyt plików
-- 3. Jeśli chcesz bardziej bezpieczne rozwiązanie, użyj signed URL-i zamiast publicznych
-- =========================================================


