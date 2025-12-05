# 🔍 Opis problemu z pytaniami użytkownika

## 📊 Gdzie są przechowywane dane?

### 1. **Baza danych: Supabase (PostgreSQL)**
- **Tabela:** `user_quiz_questions`
- **Lokalizacja:** Supabase Cloud (nie lokalna baza SQLite)
- **Dostęp:** Przez API Supabase z autoryzacją JWT

### 2. **Struktura tabeli `user_quiz_questions`:**
```sql
CREATE TABLE user_quiz_questions (
  id UUID PRIMARY KEY,
  target_user_id UUID REFERENCES auth.users(id),
  question_text TEXT NOT NULL,
  option_1 TEXT NOT NULL,
  option_2 TEXT NOT NULL,
  target_user_answer INTEGER, -- 1 lub 2
  answered_at TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **Row Level Security (RLS) Policies:**
- **SELECT:** Użytkownicy widzą tylko swoje pytania (`target_user_id = auth.uid()`)
- **UPDATE:** Użytkownicy mogą aktualizować tylko swoje odpowiedzi
- **INSERT:** Tylko admini mogą tworzyć pytania

## ❌ Problem: Dlaczego lokalnie działa, a na Vercel nie?

### **Główne przyczyny:**

#### 1. **Problem z inicjalizacją Supabase**
- **Lokalnie:** `config.js` jest dostępny i ładuje się od razu
- **Na Vercel:** `config.js` nie istnieje (jest w `.gitignore`), więc konfiguracja musi być załadowana z:
  - Meta tagów (wstrzykiwane przez `scripts/inject-config.js` podczas build)
  - `vercel-config.js` (sprawdza meta tagi i zmienne środowiskowe)

**Problem:** `profile-script.js` sprawdzał konfigurację synchronicznie na początku, zanim `vercel-config.js` zdążył się wykonać.

#### 2. **Problem z kolejnością wywołań**
W `user-questions.html` jest osobny skrypt, który wywołuje `loadUserQuestions()`:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof loadUserQuestions === 'function') {
        await loadUserQuestions();
    }
});
```

**Problem:** Ten skrypt może się wykonać PRZED inicjalizacją Supabase w `profile-script.js`, więc `supabase` jest `null`.

#### 3. **Brak obsługi błędów dla użytkownika**
Funkcja `loadUserQuestions()` nie wyświetla komunikatów o błędzie użytkownikowi:
```javascript
if (error) {
    console.error('Błąd ładowania pytań:', error);
    return; // ❌ Tylko loguje do konsoli, użytkownik nic nie widzi!
}
```

**Problem:** Jeśli jest błąd RLS lub problem z sesją, użytkownik widzi tylko "Ładowanie pytań..." i nic się nie dzieje.

#### 4. **Możliwe problemy z RLS**
- **Lokalnie:** Możesz mieć inne ustawienia RLS lub testować jako admin
- **Na Vercel:** RLS jest włączone i może blokować dostęp, jeśli:
  - Sesja nie jest poprawnie przekazana
  - `auth.uid()` zwraca `null`
  - Polityka RLS nie pozwala na dostęp

## ✅ Rozwiązanie (już zaimplementowane)

### 1. **Naprawiono inicjalizację Supabase**
- `profile-script.js` teraz czeka na konfigurację (max 500ms)
- Nie wyświetla błędów synchronicznie na początku
- Sprawdza konfigurację asynchronicznie w `DOMContentLoaded`

### 2. **Naprawiono kolejność wywołań**
- `loadUserQuestions()` jest wywoływane w `loadUserProfile()` po inicjalizacji Supabase
- Osobny skrypt w `user-questions.html` jest backupem

### 3. **Dodano obsługę błędów**
- Funkcja `loadUserQuestions()` powinna wyświetlać błędy użytkownikowi
- Sprawdza, czy `supabase` jest zainicjalizowany przed użyciem

## 🔧 Co jeszcze trzeba sprawdzić?

### 1. **Sprawdź zmienne środowiskowe na Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL do Twojego projektu Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Klucz anon z Supabase Dashboard

### 2. **Sprawdź RLS policies w Supabase:**
```sql
-- Sprawdź, czy polityka SELECT istnieje
SELECT * FROM pg_policies 
WHERE tablename = 'user_quiz_questions' 
AND policyname = 'user_quiz_questions_select';

-- Sprawdź, czy RLS jest włączone
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_quiz_questions';
```

### 3. **Sprawdź sesję użytkownika:**
- Otwórz konsolę przeglądarki na Vercel
- Sprawdź, czy `supabase.auth.getSession()` zwraca poprawną sesję
- Sprawdź, czy `auth.uid()` nie jest `null`

### 4. **Sprawdź logi Supabase:**
- Przejdź do Supabase Dashboard → Logs
- Sprawdź, czy są błędy RLS lub autoryzacji

## 📝 Jak debugować problem?

### Krok 1: Sprawdź konfigurację
```javascript
// W konsoli przeglądarki na Vercel
console.log('SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
console.log('supabase:', window.supabase);
```

### Krok 2: Sprawdź sesję
```javascript
// W konsoli przeglądarki
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User ID:', session?.user?.id);
```

### Krok 3: Sprawdź zapytanie do bazy
```javascript
// W konsoli przeglądarki
const { data, error } = await supabase
    .from('user_quiz_questions')
    .select('*')
    .eq('target_user_id', session.user.id);

console.log('Questions:', data);
console.log('Error:', error);
```

### Krok 4: Sprawdź RLS
```sql
-- W Supabase SQL Editor
SELECT 
    id, 
    target_user_id, 
    question_text,
    auth.uid() as current_user_id
FROM user_quiz_questions
WHERE target_user_id = auth.uid();
```

## 🎯 Najczęstsze przyczyny błędów na Vercel:

1. **Brak zmiennych środowiskowych** - `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` nie są ustawione
2. **Błędne wartości zmiennych** - URL lub klucz są nieprawidłowe
3. **Problem z sesją** - Token JWT wygasł lub jest nieprawidłowy
4. **Problem z RLS** - Polityka RLS blokuje dostęp
5. **Problem z kolejnością skryptów** - Supabase nie jest zainicjalizowany przed użyciem

## ✅ Sprawdź listę:

- [ ] Zmienne środowiskowe są ustawione na Vercel
- [ ] Build command jest ustawiony: `npm run build`
- [ ] `scripts/inject-config.js` jest wykonywany podczas build
- [ ] Meta tagi są wstrzykiwane do HTML podczas build
- [ ] RLS policies są poprawnie skonfigurowane w Supabase
- [ ] Sesja użytkownika jest poprawnie przekazywana
- [ ] Funkcja `loadUserQuestions()` wyświetla błędy użytkownikowi

