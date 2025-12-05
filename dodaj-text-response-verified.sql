-- =========================================================
-- DODANIE WARTOŚCI 'text_response_verified' DO ENUM task_type
-- =========================================================
-- Ten skrypt dodaje wartość 'text_response_verified' do enum task_type
-- jeśli jeszcze nie istnieje w bazie danych.
--
-- INSTRUKCJA:
-- 1. Otwórz Supabase Dashboard
-- 2. Przejdź do SQL Editor
-- 3. Wklej ten skrypt i uruchom go
-- 4. Sprawdź czy wartość została dodana (zobacz wynik na końcu)

-- Sprawdź czy wartość już istnieje i dodaj ją jeśli nie
DO $$ 
BEGIN
    -- Sprawdź czy wartość 'text_response_verified' już istnieje w enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'text_response_verified' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_type')
    ) THEN
        -- Dodaj wartość do enum (musi być na końcu, bo PostgreSQL nie pozwala dodawać w środku)
        -- Uwaga: W PostgreSQL nie można dodawać wartości w środku enum, tylko na końcu
        ALTER TYPE task_type ADD VALUE 'text_response_verified';
        RAISE NOTICE '✅ Dodano wartość text_response_verified do enum task_type';
    ELSE
        RAISE NOTICE 'ℹ️ Wartość text_response_verified już istnieje w enum task_type';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Błąd podczas dodawania wartości: %', SQLERRM;
        -- Jeśli błąd, sprawdź czy enum w ogóle istnieje
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
            RAISE EXCEPTION '❌ Enum task_type nie istnieje! Uruchom najpierw supabase-schema.sql';
        END IF;
        -- Rethrow błąd
        RAISE;
END $$;

-- Sprawdź wszystkie dostępne wartości enum (powinno pokazać wszystkie wartości)
SELECT 
    e.enumlabel AS "Wartość enum",
    e.enumsortorder AS "Kolejność"
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'task_type'
ORDER BY e.enumsortorder;

