# 📦 Konfiguracja Supabase Storage dla uploadu zdjęć

## 🚀 Krok po kroku:

### 1. Utwórz bucket w Supabase Dashboard:

1. Przejdź do **Supabase Dashboard** → **Storage**
2. Kliknij **"New bucket"** lub **"Create bucket"**
3. Wypełnij formularz:
   - **Name:** `task-responses`
   - **Public bucket:** ✅ **TAK** (zaznacz, jeśli chcesz publiczne linki)
   - **File size limit:** `5242880` (5MB) lub inny limit
   - **Allowed MIME types:** `image/*` (lub pozostaw puste dla wszystkich typów)
4. Kliknij **"Create bucket"**

### 2. Polityki RLS są już w schemacie SQL

Polityki RLS dla Storage są już dodane w pliku `supabase-schema.sql`. 
Jeśli jeszcze nie wykonałeś tego skryptu, wykonaj go teraz.

### 3. Sprawdź czy polityki są aktywne:

1. W Supabase Dashboard → **Storage** → **Policies**
2. Sprawdź czy widzisz polityki:
   - "Users can upload their own task responses"
   - "Users can read their own task responses"
   - "Users can delete their own task responses"
   - "Admins can read all task responses"

### 4. Jeśli polityki nie działają, dodaj je ręcznie:

W Supabase Dashboard → **Storage** → **Policies** → **New Policy**:

**Policy 1: Upload (INSERT)**
- Policy name: `Users can upload their own task responses`
- Allowed operation: `INSERT`
- Policy definition:
```sql
bucket_id = 'task-responses' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

**Policy 2: Read (SELECT)**
- Policy name: `Users can read their own task responses`
- Allowed operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'task-responses' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

**Policy 3: Delete**
- Policy name: `Users can delete their own task responses`
- Allowed operation: `DELETE`
- Policy definition:
```sql
bucket_id = 'task-responses' 
AND (storage.foldername(name))[1] = auth.uid()::text
```

**Policy 4: Admin Read (SELECT)**
- Policy name: `Admins can read all task responses`
- Allowed operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'task-responses' 
AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
)
```

## ✅ Testowanie:

1. Zaloguj się jako użytkownik
2. Otwórz zadanie typu "photo_upload"
3. Wybierz zdjęcie i kliknij "Oznacz jako wykonane"
4. Jeśli wszystko działa, zdjęcie powinno zostać przesłane i zapisane

## ⚠️ Rozwiązywanie problemów:

### Błąd: "new row violates row-level security policy"

**Rozwiązanie:**
1. Sprawdź czy bucket `task-responses` istnieje
2. Sprawdź czy polityki RLS są aktywne w Storage → Policies
3. Upewnij się, że ścieżka pliku zaczyna się od `{user_id}/` (to jest automatyczne w kodzie)

### Błąd: "Bucket not found"

**Rozwiązanie:**
- Utwórz bucket `task-responses` w Supabase Dashboard → Storage

### Błąd: "File size exceeds limit"

**Rozwiązanie:**
- Zwiększ limit rozmiaru pliku w ustawieniach bucketu
- Lub zmniejsz rozmiar zdjęcia przed przesłaniem

