# 📊 Struktura danych - Jak zadania przypisują się do państw?

## 🎯 Główne założenie

**Państwa, współrzędne i ciekawostki są STATYCZNE (w kodzie).**
**Zadania są DYNAMICZNE (w Supabase).**

## 📍 Mapowanie: Dzień → Państwo

W pliku `script.js` jest obiekt `dayToCountry`:

```javascript
const dayToCountry = {
    1: {
        country: "Polska",
        funFact: "🎄 W Polsce Wigilia...",
        coordinates: [52.2297, 21.0122]  // Warszawa
    },
    2: {
        country: "Niemcy",
        funFact: "🎅 W Niemczech...",
        coordinates: [51.1657, 10.4515]  // Berlin
    },
    // ... dni 3-24
};
```

**To mapowanie jest STATYCZNE** - nie zmienia się, jest w kodzie aplikacji.

## 🗄️ Struktura w Supabase

### 1. Tabela `calendar_days`
Zawiera tylko `day_number` (1-24) - **NIE zawiera państwa ani ciekawostki!**

```sql
CREATE TABLE calendar_days (
  id BIGSERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL UNIQUE CHECK (day_number BETWEEN 1 AND 24),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Dlaczego?** Bo państwo i ciekawostka są w kodzie (`dayToCountry`).

### 2. Tabela `task_templates`
Szablony zadań przypisane do dnia (przez `calendar_day_id`):

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY,
  calendar_day_id BIGINT REFERENCES calendar_days(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type task_type NOT NULL,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 3. Tabela `assigned_tasks`
Zadania przypisane do użytkowników:

```sql
CREATE TABLE assigned_tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  calendar_day_id BIGINT REFERENCES calendar_days(id),
  task_template_id UUID REFERENCES task_templates(id),
  status task_status NOT NULL,
  response_text TEXT,
  response_media_url TEXT,
  response_metadata JSONB
);
```

## 🔄 Jak to działa?

### Krok 1: Użytkownik klika marker na mapie
- Marker ma współrzędne z `dayToCountry[1].coordinates` (np. [52.2297, 21.0122] dla Polski)
- Wyświetla się popup z ciekawostką z `dayToCountry[1].funFact`

### Krok 2: Użytkownik klika "Otwórz zadanie"
- Aplikacja szuka zadania w `userTasks[1]` (gdzie `1` to day_number)
- `userTasks` jest ładowane z Supabase:
  ```javascript
  // Pobiera zadania gdzie calendar_days.day_number = 1
  SELECT * FROM assigned_tasks
  JOIN calendar_days ON assigned_tasks.calendar_day_id = calendar_days.id
  WHERE calendar_days.day_number = 1
  ```

### Krok 3: Wyświetlenie zadania
- Jeśli `userTasks[1]` istnieje → wyświetla się zadanie z Supabase
- Jeśli nie → komunikat "Zadanie nie zostało jeszcze przypisane"

## ✅ Jak przypisać zadanie do konkretnego państwa?

### Przykład: Przypisz zadanie dla Polski (Dzień 1)

1. **Utwórz dzień w bazie** (jeśli nie istnieje):
   ```sql
   INSERT INTO calendar_days (day_number, is_active)
   VALUES (1, true);
   ```

2. **Utwórz szablon zadania**:
   ```sql
   INSERT INTO task_templates (calendar_day_id, title, description, task_type)
   VALUES (
       (SELECT id FROM calendar_days WHERE day_number = 1),
       'Przygotuj listę prezentów',
       'Przygotuj listę prezentów dla najbliższych!',
       'text_response'
   );
   ```

3. **Przypisz zadanie do użytkownika**:
   ```sql
   INSERT INTO assigned_tasks (user_id, calendar_day_id, task_template_id, status)
   VALUES (
       'user-uuid-here',
       (SELECT id FROM calendar_days WHERE day_number = 1),
       (SELECT id FROM task_templates WHERE calendar_day_id = (SELECT id FROM calendar_days WHERE day_number = 1) LIMIT 1),
       'pending'
   );
   ```

## 🎯 Mapowanie: Dzień → Państwo → Zadanie

```
Dzień 1 (w kodzie)
  ↓
Polska (w kodzie)
  ↓
Współrzędne [52.2297, 21.0122] (w kodzie)
  ↓
Ciekawostka "🎄 W Polsce..." (w kodzie)
  ↓
calendar_days.day_number = 1 (w Supabase)
  ↓
task_templates.calendar_day_id → calendar_days.id (w Supabase)
  ↓
assigned_tasks.calendar_day_id → calendar_days.id (w Supabase)
  ↓
Zadanie wyświetlane użytkownikowi (z Supabase)
```

## 📝 Przykład przepływu danych

### 1. Użytkownik klika marker dla Dnia 1 (Polska)
```javascript
// Aplikacja używa statycznych danych z kodu
const dayData = dayToCountry[1];
// dayData.country = "Polska"
// dayData.coordinates = [52.2297, 21.0122]
// dayData.funFact = "🎄 W Polsce Wigilia..."
```

### 2. Użytkownik klika "Otwórz zadanie"
```javascript
// Aplikacja szuka zadania w Supabase
const taskData = userTasks[1];
// userTasks[1] jest ładowane z Supabase na podstawie calendar_days.day_number = 1
```

### 3. Wyświetlenie zadania
```javascript
if (taskData && taskData.task_title) {
    // Wyświetl zadanie z Supabase
    showTask(taskData.task_title, taskData.task_description);
} else {
    // Komunikat: "Zadanie nie zostało jeszcze przypisane"
}
```

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

**TAK!** Każdy użytkownik może mieć przypisane inne zadanie dla tego samego dnia.

Przykład:
- Użytkownik A: Dzień 1 → Zadanie "Przygotuj listę prezentów"
- Użytkownik B: Dzień 1 → Zadanie "Upiecz pierniki"

Oba zadania są dla Dnia 1 (Polska), ale różne treści!

### Dlaczego państwa są w kodzie, a nie w bazie?

**Bo są STATYCZNE** - nie zmieniają się często. To upraszcza system:
- Nie trzeba zarządzać państwami w bazie
- Nie trzeba synchronizować państw między kodem a bazą
- Łatwiej jest zmienić państwo dla danego dnia (edytuj kod)

**Zadania są DYNAMICZNE** - zmieniają się często, więc są w bazie:
- Admin może dodawać/edytować zadania bez zmiany kodu
- Każdy użytkownik może mieć inne zadania
- Łatwiejsze zarządzanie przez panel admina

