-- =========================================================
-- FUNKCJA RANKINGU UŻYTKOWNIKÓW
-- Zwraca ranking wszystkich użytkowników z liczbą wykonanych zadań
-- Dostępna dla wszystkich zalogowanych użytkowników
-- =========================================================

-- Utwórz funkcję zwracającą ranking użytkowników
CREATE OR REPLACE FUNCTION get_user_ranking()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    display_name TEXT,
    completed_tasks_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS user_id,
        p.email,
        COALESCE(p.display_name, SPLIT_PART(p.email, '@', 1)) AS display_name,
        COUNT(at.id) FILTER (WHERE at.status = 'completed')::BIGINT AS completed_tasks_count
    FROM profiles p
    LEFT JOIN assigned_tasks at ON at.user_id = p.id
    WHERE p.role != 'admin'
    GROUP BY p.id, p.email, p.display_name
    ORDER BY completed_tasks_count DESC, p.email ASC;
END;
$$;

-- Nadaj uprawnienia do wykonania funkcji dla wszystkich zalogowanych użytkowników
GRANT EXECUTE ON FUNCTION get_user_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ranking() TO anon;

-- Komentarz
COMMENT ON FUNCTION get_user_ranking() IS 'Zwraca ranking użytkowników z liczbą wykonanych zadań. Dostępna dla wszystkich zalogowanych użytkowników.';

