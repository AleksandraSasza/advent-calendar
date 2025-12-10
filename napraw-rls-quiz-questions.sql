-- =========================================================
-- NAPRAWA: Row Level Security dla user_quiz_questions
-- Problem: Zwykli użytkownicy nie widzą pytań o innych użytkownikach
--          w quizach przypisanych do nich
-- Rozwiązanie: Rozszerzenie polityki SELECT, aby umożliwić dostęp
--              do pytań używanych w quizach przypisanych do użytkownika
-- =========================================================

-- Usuń starą politykę
DROP POLICY IF EXISTS "user_quiz_questions_select" ON user_quiz_questions;

-- Nowa polityka: Użytkownicy widzą pytania o sobie ORAZ pytania w quizach przypisanych do nich
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

-- =========================================================
-- KOMENTARZE
-- =========================================================

COMMENT ON POLICY "user_quiz_questions_select" ON user_quiz_questions IS 
'Umożliwia użytkownikom widzieć: (1) pytania o sobie, (2) pytania w quizach przypisanych do nich, (3) adminom wszystkie pytania';

