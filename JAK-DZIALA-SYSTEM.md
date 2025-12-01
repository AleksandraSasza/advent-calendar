# 🎯 Jak działa system przypisywania zadań do państw?

## 📍 Architektura systemu

### 1. **Statyczne mapowanie (w kodzie)**
W pliku `script.js` jest obiekt `dayToCountry` który mapuje:
- **Dzień 1-24** → **Państwo + Współrzędne + Ciekawostka**

```javascript
const dayToCountry = {
    1: {
        country: "Polska",
        funFact: "🎄 W Polsce Wigilia...",
        coordinates: [52.2297, 21.0122]
    },
    2: {
        country: "Niemcy",
        funFact: "🎅 W Niemczech...",
        coordinates: [51.1657, 10.4515]
    },
    // ... dni 3-24
};
```

**To jest STATYCZNE** - nie zmienia się, jest w kodzie aplikacji.

### 2. **Dynamiczne zadania (w Supabase)**
Zadania są pobierane z Supabase na podstawie **day_number (1-24)**:

- Tabela `calendar_days` - zawiera tylko `day_number` (1-24) i `is_active`
- Tabela `task_templates` - szablony zadań (tytuł, opis, typ)
- Tabela `assigned_tasks` - zadania przypisane do użytkowników
  - `calendar_day_id` → wskazuje na `calendar_days.id`
  - `calendar_days.day_number` → to jest klucz! (1-24)

## 🔄 Jak to działa?

### Krok 1: Użytkownik klika marker na mapie
- Marker ma współrzędne z `dayToCountry[day].coordinates`
- Wyświetla się popup z ciekawostką z `dayToCountry[day].funFact`

### Krok 2: Użytkownik klika "Otwórz zadanie"
- Aplikacja szuka zadania w `userTasks[day]` (gdzie `day` to 1-24)
- `userTasks` jest ładowane z Supabase na podstawie `calendar_days.day_number`

### Krok 3: Wyświetlenie zadania
- Jeśli zadanie istnieje w `userTasks[day]` → wyświetla się
- Jeśli nie → komunikat "Zadanie nie zostało jeszcze przypisane"

## 📊 Struktura danych w Supabase

### Tabela `calendar_days`
```sql
CREATE TABLE calendar_days (
  id BIGSERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 24),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**WAŻNE:** Ta tabela zawiera TYLKO `day_number` (1-24). Państwo, współrzędne i ciekawostka są w kodzie!

### Tabela `task_templates`
```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY,
  calendar_day_id BIGINT REFERENCES calendar_days(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type task_type NOT NULL,
  ...
);
```

### Tabela `assigned_tasks`
```sql
CREATE TABLE assigned_tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  calendar_day_id BIGINT REFERENCES calendar_days(id),
  task_template_id UUID REFERENCES task_templates(id),
  status task_status NOT NULL,
  ...
);
```

## ✅ Jak przypisać zadanie do konkretnego państwa?

### Przez panel admina:

1. **Utwórz dzień kalendarza** (jeśli nie istnieje):
   - Panel admina → "Dni kalendarza" → "Dodaj dzień"
   - Wpisz `day_number` (1-24) - np. `1` dla Polski
   - Zaznacz "Aktywny"
   - Zapisz

2. **Utwórz szablon zadania**:
   - Panel admina → "Szablony zadań" → "Dodaj szablon"
   - Wybierz dzień (np. Dzień 1 - Niemcy)
   - Wpisz tytuł i opis zadania
   - Wybierz typ zadania
   - Zapisz

3. **Przypisz zadanie do użytkownika**:
   - Panel admina → "Przypisz zadania"
   - Wybierz użytkownika
   - Wybierz dzień (np. Dzień 1)
   - Wybierz szablon zadania
   - Kliknij "Przypisz zadanie"

### Przez SQL:

```sql
-- 1. Utwórz dzień kalendarza (jeśli nie istnieje)
INSERT INTO calendar_days (day_number, is_active)
VALUES (1, true)
ON CONFLICT (day_number) DO NOTHING;

-- 2. Utwórz szablon zadania
INSERT INTO task_templates (calendar_day_id, title, description, task_type)
VALUES (
    (SELECT id FROM calendar_days WHERE day_number = 1),
    'Przygotuj listę prezentów',
    'Przygotuj listę prezentów dla najbliższych!',
    'text_response'
);

-- 3. Przypisz zadanie do użytkownika
INSERT INTO assigned_tasks (user_id, calendar_day_id, task_template_id)
VALUES (
    'user-uuid-here',
    (SELECT id FROM calendar_days WHERE day_number = 1),
    (SELECT id FROM task_templates WHERE calendar_day_id = (SELECT id FROM calendar_days WHERE day_number = 1) LIMIT 1)
);
```

## 🎯 Mapowanie: Dzień → Państwo

| Dzień | Państwo | Współrzędne | Ciekawostka |
|-------|---------|-------------|-------------|
| 1 | Polska | [52.2297, 21.0122] | W kodzie |
| 2 | Niemcy | [51.1657, 10.4515] | W kodzie |
| 3 | Francja | [46.2276, 2.2137] | W kodzie |
| ... | ... | ... | ... |
| 24 | Urugwaj | [-32.5228, -55.7658] | W kodzie |

**To mapowanie jest STATYCZNE** - w pliku `script.js`, obiekt `dayToCountry`.

## 🔍 Jak aplikacja znajduje zadanie?

1. Użytkownik klika marker dla **Dnia 1** (Polska)
2. Aplikacja sprawdza `userTasks[1]` (zadania załadowane z Supabase)
3. Jeśli `userTasks[1]` istnieje → wyświetla zadanie
4. Jeśli nie → komunikat "Zadanie nie zostało jeszcze przypisane"

**Klucz:** `day_number` (1-24) łączy:
- Statyczne dane (państwo, współrzędne, ciekawostka) z `dayToCountry`
- Dynamiczne zadania z Supabase przez `calendar_days.day_number`

## ❓ FAQ

### Czy mogę zmienić państwo dla danego dnia?

**TAK**, ale musisz edytować kod w `script.js` - obiekt `dayToCountry`.

### Czy mogę zmienić ciekawostkę?

**TAK**, edytuj `dayToCountry[day].funFact` w `script.js`.

### Czy zadania są przypisane do państwa czy do dnia?

**Zadania są przypisane do DZIEŃ (1-24)**, nie bezpośrednio do państwa.

Państwo jest tylko "opakowaniem" dla dnia - pokazuje się w popupie i w modalu.

### Jak dodać zadanie dla konkretnego państwa?

1. Znajdź numer dnia dla tego państwa (np. Polska = Dzień 1)
2. Utwórz `calendar_days` z `day_number = 1`
3. Utwórz `task_templates` z `calendar_day_id` = ID dnia 1
4. Przypisz zadanie do użytkownika w `assigned_tasks`

### Czy każdy użytkownik może mieć inne zadanie dla tego samego dnia?

**TAK!** To jest możliwe - każdy użytkownik może mieć przypisane inne zadanie dla tego samego dnia.

Przykład:
- Użytkownik A: Dzień 1 → Zadanie "Przygotuj listę prezentów"
- Użytkownik B: Dzień 1 → Zadanie "Upiecz pierniki"

Oba zadania są dla Dnia 1 (Polska), ale różne treści!

