-- =========================================================
-- KALENDARZ ADWENTOWY - SCHEMAT BAZY DANYCH
-- PostgreSQL dla Supabase
-- =========================================================

-- =========================================================
-- 1. TYPY ENUM
-- =========================================================

-- Usuń typy jeśli istnieją (dla ponownego uruchomienia)
DROP TYPE IF EXISTS task_type CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

-- Typ zadania
CREATE TYPE task_type AS ENUM (
  'text_response',           -- Bez weryfikacji - użytkownik klika "wykonane"
  'text_response_verified',  -- Odpowiedź tekstowa z weryfikacją przez admina
  'quiz',
  'photo_upload',
  'checkbox',
  'custom'
);

-- Status zadania
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed'
);

-- =========================================================
-- 2. TABELA: profiles (rozszerzenie auth.users)
-- =========================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy dla profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Row Level Security dla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Polityka: Użytkownicy widzą siebie i admini widzą wszystkich
CREATE POLICY "profiles_select_self_or_admin"
ON profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Polityka: Użytkownicy mogą aktualizować tylko siebie
CREATE POLICY "profiles_update_self"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Polityka: Admini mogą aktualizować wszystkich
CREATE POLICY "profiles_update_admin"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- 3. TABELA: calendar_days (dni 1-24 z fun fact)
-- =========================================================

CREATE TABLE IF NOT EXISTS calendar_days (
  id BIGSERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 24),
  fun_fact TEXT, -- Opcjonalne - ciekawostki są w kodzie (dayToCountry)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy dla calendar_days
CREATE INDEX IF NOT EXISTS idx_calendar_days_day_number ON calendar_days(day_number);
CREATE INDEX IF NOT EXISTS idx_calendar_days_active ON calendar_days(is_active);

-- Row Level Security dla calendar_days
ALTER TABLE calendar_days ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "calendar_days_public_read" ON calendar_days;
DROP POLICY IF EXISTS "calendar_days_admin_manage" ON calendar_days;

-- Polityka: Wszyscy mogą czytać aktywne dni
CREATE POLICY "calendar_days_public_read"
ON calendar_days
FOR SELECT
USING (is_active = TRUE OR EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- Polityka: Tylko admini mogą zarządzać dniami
CREATE POLICY "calendar_days_admin_manage"
ON calendar_days
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- 4. TABELA: task_templates (szablony zadań)
-- =========================================================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_day_id BIGINT REFERENCES calendar_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type task_type NOT NULL DEFAULT 'text_response',
  metadata JSONB, -- Przechowuje pytania quizowe, opcje, wymagania itp.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeksy dla task_templates
CREATE INDEX IF NOT EXISTS idx_task_templates_day ON task_templates(calendar_day_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_task_templates_metadata ON task_templates USING GIN(metadata);

-- Row Level Security dla task_templates
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "task_templates_public_read" ON task_templates;
DROP POLICY IF EXISTS "task_templates_admin_manage" ON task_templates;

-- Polityka: Wszyscy mogą czytać aktywne szablony
CREATE POLICY "task_templates_public_read"
ON task_templates
FOR SELECT
USING (is_active = TRUE OR EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
));

-- Polityka: Tylko admini mogą zarządzać szablonami
CREATE POLICY "task_templates_admin_manage"
ON task_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- 5. TABELA: assigned_tasks (przypisane zadania do użytkowników)
-- =========================================================

CREATE TABLE IF NOT EXISTS assigned_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_day_id BIGINT NOT NULL REFERENCES calendar_days(id) ON DELETE CASCADE,
  task_template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'pending',
  response_text TEXT, -- Odpowiedź tekstowa
  response_media_url TEXT, -- URL do zdjęcia/pliku w Supabase Storage
  response_metadata JSONB, -- Odpowiedzi quizowe, wyniki, metadane
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_day UNIQUE (user_id, calendar_day_id)
);

-- Indeksy dla assigned_tasks
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_user ON assigned_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_day ON assigned_tasks(calendar_day_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_template ON assigned_tasks(task_template_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_status ON assigned_tasks(status);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_user_day ON assigned_tasks(user_id, calendar_day_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_metadata ON assigned_tasks USING GIN(response_metadata);

-- Row Level Security dla assigned_tasks
ALTER TABLE assigned_tasks ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "assigned_tasks_user_read" ON assigned_tasks;
DROP POLICY IF EXISTS "assigned_tasks_user_update" ON assigned_tasks;
DROP POLICY IF EXISTS "assigned_tasks_admin_insert" ON assigned_tasks;
DROP POLICY IF EXISTS "assigned_tasks_admin_manage" ON assigned_tasks;

-- Polityka: Użytkownicy widzą tylko swoje zadania, admini widzą wszystkie
CREATE POLICY "assigned_tasks_user_read"
ON assigned_tasks
FOR SELECT
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Polityka: Użytkownicy mogą aktualizować tylko swoje zadania
CREATE POLICY "assigned_tasks_user_update"
ON assigned_tasks
FOR UPDATE
USING (user_id = auth.uid());

-- Polityka: Tylko admini mogą przypisywać zadania (INSERT)
CREATE POLICY "assigned_tasks_admin_insert"
ON assigned_tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Polityka: Admini mogą zarządzać wszystkimi zadaniami
CREATE POLICY "assigned_tasks_admin_manage"
ON assigned_tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- 6. FUNKCJE POMOCNICZE (opcjonalnie)
-- =========================================================

-- Funkcja do automatycznego tworzenia profilu przy rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: automatyczne tworzenie profilu przy rejestracji
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 7. WIDOKY POMOCNICZE (dla łatwiejszych zapytań)
-- =========================================================

-- Widok: zadania użytkownika z pełnymi informacjami
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

-- Row Level Security dla widoku
ALTER VIEW user_tasks_view SET (security_invoker = true);

-- =========================================================
-- 8. KOMENTARZE (dokumentacja)
-- =========================================================

COMMENT ON TABLE profiles IS 'Profile użytkowników z rolami (user/admin)';
COMMENT ON TABLE calendar_days IS 'Dni kalendarza adwentowego (1-24) z fun fact';
COMMENT ON TABLE task_templates IS 'Szablony zadań (quiz, photo, text, etc.)';
COMMENT ON TABLE assigned_tasks IS 'Zadania przypisane do użytkowników z odpowiedziami';
COMMENT ON COLUMN task_templates.metadata IS 'JSONB: pytania quizowe, opcje, wymagania';
COMMENT ON COLUMN assigned_tasks.response_metadata IS 'JSONB: odpowiedzi quizowe, wyniki, metadane';

-- =========================================================
-- =========================================================
-- STORAGE: Polityki RLS dla bucketu task-responses
-- =========================================================

-- WAŻNE: Najpierw utwórz bucket w Supabase Dashboard:
-- Storage → Create bucket → Nazwa: "task-responses", Public: true

-- Polityka: Użytkownicy mogą uploadować pliki do swoich folderów
CREATE POLICY IF NOT EXISTS "Users can upload their own task responses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Polityka: Użytkownicy mogą czytać swoje pliki
CREATE POLICY IF NOT EXISTS "Users can read their own task responses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Polityka: Użytkownicy mogą usuwać swoje pliki
CREATE POLICY IF NOT EXISTS "Users can delete their own task responses"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-responses' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Polityka: Admini mogą czytać wszystkie pliki
CREATE POLICY IF NOT EXISTS "Admins can read all task responses"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-responses' 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- 9. TABELA: user_quiz_questions (Quiz o użytkownikach)
-- =========================================================
-- Pytania przypisane do konkretnych użytkowników
-- Użytkownik odpowiada na nie, a jego odpowiedź staje się poprawną

CREATE TABLE IF NOT EXISTS user_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_1 TEXT NOT NULL,
  option_2 TEXT NOT NULL,
  target_user_answer INTEGER CHECK (target_user_answer IN (1, 2)), -- NULL jeśli jeszcze nie odpowiedział
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Admin który stworzył pytanie
);

-- Indeksy dla user_quiz_questions
CREATE INDEX IF NOT EXISTS idx_user_quiz_questions_target_user ON user_quiz_questions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_questions_answered ON user_quiz_questions(target_user_id, target_user_answer);
CREATE INDEX IF NOT EXISTS idx_user_quiz_questions_created_by ON user_quiz_questions(created_by);

-- Row Level Security dla user_quiz_questions
ALTER TABLE user_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Polityka: Użytkownicy widzą swoje pytania, admini widzą wszystkie
DROP POLICY IF EXISTS "user_quiz_questions_select" ON user_quiz_questions;
CREATE POLICY "user_quiz_questions_select"
ON user_quiz_questions
FOR SELECT
USING (
  -- 1. Pytania o sobie (target_user_id = auth.uid())
  target_user_id = auth.uid() 
  
  OR
  
  -- 2. Admini widzą wszystkie
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
  
  OR
  
  -- 3. Pytania używane w quizach przypisanych do użytkownika
  EXISTS (
    SELECT 1 
    FROM assigned_tasks at
    INNER JOIN task_templates tt ON at.task_template_id = tt.id
    WHERE at.user_id = auth.uid()
      AND tt.is_active = TRUE
      AND tt.metadata->>'quiz_type' = 'user_quiz'
      AND (tt.metadata->>'target_user_id')::uuid = user_quiz_questions.target_user_id
      AND (
        -- Sprawdź czy question_id jest w tablicy question_ids w metadata
        -- question_ids jest tablicą stringów UUID w JSONB
        -- Używamy operatora @> (zawiera) dla JSONB
        tt.metadata->'question_ids' @> to_jsonb(user_quiz_questions.id::text)
      )
  )
);

-- Polityka: Tylko admini mogą tworzyć pytania
DROP POLICY IF EXISTS "user_quiz_questions_admin_insert" ON user_quiz_questions;
CREATE POLICY "user_quiz_questions_admin_insert"
ON user_quiz_questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Polityka: Użytkownicy mogą aktualizować tylko swoje odpowiedzi (target_user_answer)
DROP POLICY IF EXISTS "user_quiz_questions_user_update" ON user_quiz_questions;
CREATE POLICY "user_quiz_questions_user_update"
ON user_quiz_questions
FOR UPDATE
USING (target_user_id = auth.uid())
WITH CHECK (target_user_id = auth.uid());

-- Polityka: Admini mogą zarządzać wszystkimi pytaniami
DROP POLICY IF EXISTS "user_quiz_questions_admin_manage" ON user_quiz_questions;
CREATE POLICY "user_quiz_questions_admin_manage"
ON user_quiz_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- 10. TABELA: quiz_attempts (Próby rozwiązania quizu)
-- =========================================================
-- Próby rozwiązania quizu o innych użytkownikach

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  assigned_task_id UUID REFERENCES assigned_tasks(id) ON DELETE CASCADE,
  attempting_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_answers JSONB NOT NULL, -- {question_id: selected_option (1 lub 2)}
  score INTEGER NOT NULL DEFAULT 0, -- Liczba poprawnych odpowiedzi
  total_questions INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  task_completed BOOLEAN DEFAULT FALSE -- Czy zadanie zostało automatycznie zaliczone
);

-- Indeksy dla quiz_attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_template ON quiz_attempts(task_template_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_assigned_task ON quiz_attempts(assigned_task_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(attempting_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_target ON quiz_attempts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_task ON quiz_attempts(attempting_user_id, assigned_task_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(task_completed);

-- Row Level Security dla quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Polityka: Użytkownicy widzą swoje próby, target_user widzi kto rozwiązywał o nim, admini widzą wszystkie
DROP POLICY IF EXISTS "quiz_attempts_select" ON quiz_attempts;
CREATE POLICY "quiz_attempts_select"
ON quiz_attempts
FOR SELECT
USING (
  attempting_user_id = auth.uid()
  OR target_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Polityka: Użytkownicy mogą tworzyć swoje próby
DROP POLICY IF EXISTS "quiz_attempts_user_insert" ON quiz_attempts;
CREATE POLICY "quiz_attempts_user_insert"
ON quiz_attempts
FOR INSERT
WITH CHECK (attempting_user_id = auth.uid());

-- Polityka: Użytkownicy mogą aktualizować swoje próby
DROP POLICY IF EXISTS "quiz_attempts_user_update" ON quiz_attempts;
CREATE POLICY "quiz_attempts_user_update"
ON quiz_attempts
FOR UPDATE
USING (attempting_user_id = auth.uid())
WITH CHECK (attempting_user_id = auth.uid());

-- Polityka: Admini mogą zarządzać wszystkimi próbami
DROP POLICY IF EXISTS "quiz_attempts_admin_manage" ON quiz_attempts;
CREATE POLICY "quiz_attempts_admin_manage"
ON quiz_attempts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =========================================================
-- KONIEC SCHEMATU
-- =========================================================

-- UWAGI:
-- 1. Po wykonaniu tego skryptu, utwórz bucket w Supabase Storage:
--    - Przejdź do: Storage → Create bucket
--    - Nazwa: "task-responses"
--    - Public: true (lub false jeśli chcesz prywatne linki)
--    - File size limit: 5MB (lub inny limit)
--    - Allowed MIME types: image/*
--
-- 2. Polityki RLS dla Storage są już dodane powyżej
--    (Supabase automatycznie zastosuje je do bucketu)
--
-- 3. Aby ustawić użytkownika jako admina:
--    UPDATE profiles SET role = 'admin' WHERE email = 'twoj-email@example.com';
--
-- 4. Przykład wypełnienia calendar_days:
--    INSERT INTO calendar_days (day_number, fun_fact) VALUES
--    (1, '🎄 W Polsce Wigilia to najważniejszy dzień świąt!'),
--    (2, '🎅 W Niemczech tradycja jarmarków bożonarodzeniowych...');
--
-- 4. Przykład tworzenia szablonu quizu:
--    INSERT INTO task_templates (calendar_day_id, title, description, task_type, metadata)
--    VALUES (1, 'Quiz o świętach', 'Odpowiedz na pytania', 'quiz', '{
--      "questions": [
--        {"id": 1, "question": "Ile dni ma adwent?", "options": ["20", "24", "30"], "correct_answer": 1}
--      ],
--      "passing_score": 80
--    }'::jsonb);

