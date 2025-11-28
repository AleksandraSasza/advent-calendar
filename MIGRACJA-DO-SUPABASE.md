# 🔄 Migracja do Supabase - Dokumentacja

## 📍 Gdzie były ciekawostki i zadania?

**PRZED migracją:**
- Ciekawostki i zadania były **hardcodowane** w pliku `script.js` (linia 26)
- Obiekt `adventTasks` zawierał wszystkie dane dla 24 dni
- Dane były statyczne i nie można było ich zmieniać bez edycji kodu

**PO migracji:**
- Ciekawostki są teraz w tabeli `calendar_days` w Supabase
- Zadania są w tabelach `task_templates` i `assigned_tasks` w Supabase
- Dane są dynamiczne - możesz je zmieniać przez panel admina lub bezpośrednio w Supabase

## 🗄️ Jak działa system teraz?

### 1. **Ciekawostki (Fun Facts)**
- **Tabela:** `calendar_days`
- **Kolumny:**
  - `day_number` (1-24)
  - `fun_fact` - ciekawostka wyświetlana w małym popupie
  - `country` - nazwa państwa
  - `coordinates` - współrzędne geograficzne [latitude, longitude] jako JSONB
  - `is_active` - czy dzień jest aktywny

### 2. **Zadania (Tasks)**
- **Tabela:** `task_templates` - szablony zadań
  - `calendar_day_id` - powiązanie z dniem kalendarza
  - `title` - tytuł zadania
  - `description` - opis zadania
  - `task_type` - typ zadania (text_response, quiz, photo_upload, etc.)
  - `metadata` - dodatkowe dane (pytania quizowe, opcje, etc.)

- **Tabela:** `assigned_tasks` - zadania przypisane do użytkowników
  - `user_id` - ID użytkownika
  - `calendar_day_id` - ID dnia kalendarza
  - `task_template_id` - ID szablonu zadania
  - `status` - status (pending, in_progress, completed)
  - `response_text` - odpowiedź tekstowa użytkownika
  - `response_media_url` - URL do zdjęcia/pliku
  - `response_metadata` - metadane odpowiedzi (odpowiedzi quizowe, etc.)

## ✅ Co musisz zrobić?

### Krok 1: Zaktualizuj schemat bazy danych

Uruchom w Supabase SQL Editor plik `aktualizacja-schematu.sql`:

```sql
-- Dodaj kolumny country i coordinates do calendar_days
ALTER TABLE calendar_days 
ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE calendar_days 
ADD COLUMN IF NOT EXISTS coordinates JSONB;
```

### Krok 2: Dodaj dane do `calendar_days`

Możesz to zrobić przez:
1. **Panel admina** - użyj formularza "Dodaj dzień"
2. **Supabase Dashboard** - Table Editor → `calendar_days` → Insert row
3. **SQL** - bezpośrednio w SQL Editor

**Przykład SQL:**
```sql
-- Aktualizuj dzień 1
UPDATE calendar_days 
SET country = 'Polska', 
    coordinates = '[52.2297, 21.0122]'::jsonb
WHERE day_number = 1;
```

**Format współrzędnych:**
- JSONB array: `[latitude, longitude]`
- Przykład: `[52.2297, 21.0122]` dla Warszawy

### Krok 3: Utwórz szablony zadań (`task_templates`)

Przez panel admina lub Supabase:

1. **Panel admina:**
   - Przejdź do sekcji "Szablony zadań"
   - Kliknij "Dodaj szablon"
   - Wybierz dzień kalendarza
   - Wpisz tytuł i opis zadania
   - Wybierz typ zadania
   - Zapisz

2. **Supabase SQL:**
```sql
INSERT INTO task_templates (calendar_day_id, title, description, task_type)
VALUES (
    (SELECT id FROM calendar_days WHERE day_number = 1),
    'Przygotuj listę prezentów',
    'Przygotuj listę prezentów dla najbliższych!',
    'text_response'
);
```

### Krok 4: Przypisz zadania do użytkowników (`assigned_tasks`)

**Przez panel admina:**
- Przejdź do sekcji "Przypisz zadania"
- Wybierz użytkownika
- Wybierz dzień
- Wybierz szablon zadania
- Kliknij "Przypisz zadanie"

**Przez SQL:**
```sql
INSERT INTO assigned_tasks (user_id, calendar_day_id, task_template_id)
VALUES (
    'user-uuid-here',
    (SELECT id FROM calendar_days WHERE day_number = 1),
    'template-uuid-here'
);
```

## 🔄 Jak działa przepływ danych?

1. **Użytkownik loguje się** → aplikacja sprawdza sesję Supabase
2. **Aplikacja ładuje dane:**
   - `loadCalendarData()` → pobiera dni z `calendar_days` (ciekawostki, państwa, współrzędne)
   - `loadUserTasks()` → pobiera zadania użytkownika z `assigned_tasks`
   - `loadUserProgress()` → pobiera wykonane zadania
3. **Użytkownik klika marker** → wyświetla się popup z ciekawostką
4. **Użytkownik klika "Otwórz zadanie"** → wyświetla się modal z zadaniem
5. **Użytkownik oznacza zadanie jako wykonane** → aktualizacja w `assigned_tasks` (status = 'completed')

## ❓ FAQ

### Czy zadania dodane w Supabase będą się wyświetlać w aplikacji?

**TAK!** Aplikacja teraz pobiera wszystkie dane z Supabase:
- Ciekawostki z `calendar_days`
- Zadania z `assigned_tasks` (przypisane do użytkownika)
- Postęp użytkownika z `assigned_tasks` (status = 'completed')

### Czemu wcześniej były hardcodowane?

Aplikacja była początkowo zbudowana z lokalną bazą SQLite i hardcodowanymi danymi. Teraz została zmigrowana do Supabase, aby:
- Dane były dynamiczne
- Można było zarządzać przez panel admina
- Każdy użytkownik mógł mieć inne zadania
- Zadania mogły być różnych typów (quiz, photo, text, etc.)

### Jak dodać współrzędne geograficzne?

Współrzędne są przechowywane w kolumnie `coordinates` jako JSONB:
```json
[52.2297, 21.0122]
```

Format: `[latitude, longitude]`

Możesz je dodać przez:
- Panel admina (formularz "Dodaj dzień")
- Supabase Table Editor
- SQL: `UPDATE calendar_days SET coordinates = '[52.2297, 21.0122]'::jsonb WHERE day_number = 1;`

### Co jeśli użytkownik nie ma przypisanego zadania dla danego dnia?

Aplikacja wyświetli komunikat: "Zadanie nie zostało jeszcze przypisane dla tego dnia."

Admin musi przypisać zadanie przez panel admina lub bezpośrednio w Supabase.

## 🚀 Następne kroki

1. ✅ Uruchom `aktualizacja-schematu.sql` w Supabase
2. ✅ Dodaj dane do `calendar_days` (państwa, ciekawostki, współrzędne)
3. ✅ Utwórz szablony zadań w `task_templates`
4. ✅ Przypisz zadania do użytkowników w `assigned_tasks`
5. ✅ Przetestuj aplikację - dane powinny się wyświetlać z Supabase!

