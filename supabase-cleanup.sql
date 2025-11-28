-- =========================================================
-- SKRYPT CZYSZCZĄCY - USUWA WSZYSTKIE ELEMENTY BAZY
-- Uruchom TYLKO jeśli chcesz usunąć całą strukturę i zacząć od nowa!
-- =========================================================

-- Usuń widoki
DROP VIEW IF EXISTS user_tasks_view CASCADE;

-- Usuń tabele (CASCADE usuwa też zależności)
DROP TABLE IF EXISTS assigned_tasks CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS calendar_days CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Usuń funkcje
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Usuń typy ENUM
DROP TYPE IF EXISTS task_type CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

-- Sprawdź czy wszystko zostało usunięte
SELECT 'Czyszczenie zakończone. Możesz teraz uruchomić supabase-schema.sql' AS status;

