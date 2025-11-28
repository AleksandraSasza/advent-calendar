-- =========================================================
-- DODAJ STATUS 'pending_verification' DO ENUM task_status
-- =========================================================
-- Uruchom ten skrypt w Supabase SQL Editor
-- Przejdź do: Supabase Dashboard → SQL Editor → New Query → Wklej ten kod → Run

-- W PostgreSQL nie można bezpośrednio dodać wartości do istniejącego ENUM.
-- Musimy utworzyć nowy typ, przenieść dane, usunąć stary i zmienić nazwę nowego.
-- WAŻNE: Najpierw musimy usunąć widoki i inne obiekty, które używają kolumny status.

-- Krok 1: Usuń widok, który używa kolumny status
DROP VIEW IF EXISTS user_tasks_view CASCADE;

-- Krok 2: Usuń domyślną wartość z kolumny status (jeśli istnieje)
ALTER TABLE assigned_tasks 
  ALTER COLUMN status DROP DEFAULT;

-- Krok 3: Utwórz nowy typ z dodatkowym statusem
CREATE TYPE task_status_new AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'pending_verification'
);

-- Krok 4: Zmień typ kolumny w tabeli assigned_tasks
ALTER TABLE assigned_tasks 
  ALTER COLUMN status TYPE task_status_new 
  USING status::text::task_status_new;

-- Krok 5: Przywróć domyślną wartość
ALTER TABLE assigned_tasks 
  ALTER COLUMN status SET DEFAULT 'pending'::task_status_new;

-- Krok 6: Usuń stary typ
DROP TYPE task_status;

-- Krok 7: Zmień nazwę nowego typu na starą nazwę
ALTER TYPE task_status_new RENAME TO task_status;

-- Krok 8: Odtwórz widok user_tasks_view
CREATE OR REPLACE VIEW user_tasks_view AS
SELECT 
  at.id,
  at.user_id,
  p.email,
  p.display_name,
  at.calendar_day_id,
  cd.day_number,
  cd.fun_fact,
  at.task_template_id,
  tt.title AS task_title,
  tt.description AS task_description,
  tt.task_type,
  tt.metadata AS task_metadata,
  at.status,
  at.response_text,
  at.response_media_url,
  at.response_metadata,
  at.assigned_at,
  at.completed_at
FROM assigned_tasks at
LEFT JOIN profiles p ON at.user_id = p.id
LEFT JOIN calendar_days cd ON at.calendar_day_id = cd.id
LEFT JOIN task_templates tt ON at.task_template_id = tt.id;

-- Krok 9: Przywróć Row Level Security dla widoku
ALTER VIEW user_tasks_view SET (security_invoker = true);

-- Sprawdź czy wszystko działa
SELECT unnest(enum_range(NULL::task_status)) AS available_statuses;

-- Powinieneś zobaczyć:
-- - pending
-- - in_progress
-- - completed
-- - pending_verification
