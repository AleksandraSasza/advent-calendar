-- =========================================================
-- NAPRAWA: Usuń kolumnę fun_fact z calendar_days
-- Ciekawostki są teraz w kodzie (dayToCountry), nie w bazie
-- =========================================================

-- KROK 1: Usuń widok user_tasks_view (używa fun_fact)
DROP VIEW IF EXISTS user_tasks_view CASCADE;

-- KROK 2: Usuń kolumnę fun_fact z calendar_days
ALTER TABLE calendar_days 
DROP COLUMN IF EXISTS fun_fact;

-- KROK 3: Odtwórz widok user_tasks_view BEZ fun_fact
-- (fun_fact nie jest już potrzebne, bo jest w kodzie)
CREATE OR REPLACE VIEW user_tasks_view AS
SELECT 
  at.id,
  at.user_id,
  p.email,
  p.display_name,
  at.calendar_day_id,
  cd.day_number,
  -- fun_fact usunięte - jest w kodzie (dayToCountry)
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
JOIN profiles p ON at.user_id = p.id
JOIN calendar_days cd ON at.calendar_day_id = cd.id
LEFT JOIN task_templates tt ON at.task_template_id = tt.id;

-- Sprawdź strukturę tabeli
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_days'
ORDER BY ordinal_position;

