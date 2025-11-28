# 🔧 Konfiguracja Supabase

## 📋 **Kroki konfiguracji:**

### **1. Pobierz dane z Supabase Dashboard:**

1. Otwórz [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key (klucz publiczny)

### **2. Zaktualizuj pliki z danymi Supabase:**

#### **A. login-script.js** (linia 3-4):
```javascript
const SUPABASE_URL = 'https://twoj-projekt.supabase.co'; // ← Wklej swój URL
const SUPABASE_ANON_KEY = 'twoj-klucz-anon'; // ← Wklej swój klucz
```

#### **B. admin-script.js** (linia 3-4):
```javascript
const SUPABASE_URL = 'https://twoj-projekt.supabase.co'; // ← Wklej swój URL
const SUPABASE_ANON_KEY = 'twoj-klucz-anon'; // ← Wklej swój klucz
```

#### **C. script.js** (główna strona - jeśli używasz Supabase):
Dodaj te same wartości na początku pliku.

---

## ✅ **Sprawdzenie konfiguracji:**

1. Otwórz aplikację w przeglądarce
2. Przejdź do strony logowania
3. Spróbuj się zarejestrować
4. Jeśli działa - konfiguracja jest poprawna! ✅

---

## 🔐 **Ustawienie pierwszego admina:**

Po rejestracji pierwszego użytkownika:

1. Otwórz Supabase SQL Editor
2. Wykonaj:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'twoj-email@example.com';
```

3. Zaloguj się ponownie
4. Przejdź do `/admin` - powinieneś mieć dostęp!

---

## 📦 **Bucket Storage (opcjonalnie):**

Jeśli planujesz zadania ze zdjęciami:

1. Przejdź do **Storage** w Supabase Dashboard
2. Kliknij **Create bucket**
3. Nazwa: `task-responses`
4. Public: `false` (lub `true` jeśli chcesz publiczne linki)
5. Kliknij **Create bucket**

---

## ⚠️ **Ważne:**

- **NIE** commituj kluczy Supabase do Git!
- Użyj `.env` w produkcji (dla backendu)
- Klucz `anon` jest bezpieczny do użycia w frontendzie (ma RLS)

---

## 🐛 **Rozwiązywanie problemów:**

### Błąd: "Invalid API key"
- Sprawdź czy URL i klucz są poprawne
- Upewnij się, że nie ma spacji w kluczu

### Błąd: "Row Level Security"
- Sprawdź czy wykonałeś `supabase-schema.sql`
- Sprawdź czy polityki RLS są aktywne

### Błąd: "User not found"
- Upewnij się, że trigger `handle_new_user` działa
- Sprawdź czy profil został utworzony w tabeli `profiles`

---

**Gotowe! 🎉**

