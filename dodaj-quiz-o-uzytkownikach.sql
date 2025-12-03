-- =========================================================
-- MIGRACJA: Quiz o użytkownikach
-- Dodaje tabele dla systemu quiz o użytkownikach
-- =========================================================

-- =========================================================
-- TABELA: user_quiz_questions
-- Pytania przypisane do konkretnych użytkowników
-- Użytkownik odpowiada na nie, a jego odpowiedź staje się poprawną
-- =========================================================

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
  target_user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
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
-- TABELA: quiz_attempts
-- Próby rozwiązania quizu o innych użytkownikach
-- =========================================================

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
-- KOMENTARZE
-- =========================================================

COMMENT ON TABLE user_quiz_questions IS 'Pytania przypisane do użytkowników - ich odpowiedzi stają się poprawnymi';
COMMENT ON TABLE quiz_attempts IS 'Próby rozwiązania quizu o innych użytkownikach';

-- =========================================================
-- KONIEC MIGRACJI
-- =========================================================

