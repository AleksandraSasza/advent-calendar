# 🎯 Quiz o użytkownikach - Podsumowanie implementacji

## ✅ Co zostało zrobione:

### 1. Struktura bazy danych
- ✅ Utworzona tabela `user_quiz_questions` - pytania przypisane do użytkowników
- ✅ Utworzona tabela `quiz_attempts` - próby rozwiązania quizów o użytkownikach
- ✅ Dodane polityki RLS dla bezpieczeństwa
- ✅ Plik migracji: `dodaj-quiz-o-uzytkownikach.sql`
- ✅ Zaktualizowany główny schemat: `supabase-schema.sql`

### 2. Panel użytkownika
- ✅ Dodana sekcja "Zebranie informacji o tobie" w `profile.html`
- ✅ Funkcje w `profile-script.js`:
  - `loadUserQuestions()` - ładowanie pytań
  - `displayUserQuestions()` - wyświetlanie pytań z formularzem odpowiedzi
  - `saveUserAnswer()` - zapisywanie odpowiedzi użytkownika

## 🚧 Co jeszcze trzeba zrobić:

### 3. Panel administracyjny (WYMAGANE)
Trzeba dodać:

**A. Nowa sekcja w menu admina: "Pytania do użytkowników"**
- Sekcja do zarządzania pytaniami przypisanymi do użytkowników
- Lista wszystkich użytkowników
- Dla każdego użytkownika: możliwość dodania pytania (tekst + 2 opcje)
- Możliwość edycji/usuwania pytań

**B. Rozszerzenie formularza quizu:**
- Przy tworzeniu szablonu zadania typu `quiz`:
  - Opcja wyboru: "Klasyczny quiz" vs "Quiz o użytkownikach"
  - Jeśli "Quiz o użytkownikach":
    - Wybór użytkownika (o kim jest quiz)
    - Lista pytań, które zostały już odpowiedziane przez tego użytkownika
    - Checkboxy do wyboru pytań które wejdą w skład quizu
    - Pole "Próg zaliczenia" (np. 5 punktów = zadanie zaliczone)

### 4. Wyświetlanie quizu w zadaniu (WYMAGANE)
W pliku `script.js` trzeba dodać obsługę quizów o użytkownikach:

**A. W funkcji `showTaskModal()`:**
- Sprawdzenie czy zadanie to quiz o użytkownikach (przez metadata)
- Wyświetlenie pytań z dwoma opcjami do wyboru
- Natychmiastowa informacja zwrotna (zielony/czerwony) po zaznaczeniu
- Po zakończeniu quizu: obliczenie punktów i automatyczne zaliczenie

**B. Nowa sekcja w `index.html`:**
- Dodanie sekcji w modalu zadań dla quizu o użytkownikach
- Przyciski radiowe dla każdego pytania (opcja 1 lub 2)

### 5. Automatyczne zaliczanie (WYMAGANE)
- Po zakończeniu quizu sprawdzenie: `score >= passing_score`
- Jeśli tak → automatyczna aktualizacja `assigned_tasks.status = 'completed'`
- Zapisywanie próby w tabeli `quiz_attempts`

## 📋 Instrukcja użycia (po pełnej implementacji):

### Dla administratora:

1. **Tworzenie pytań dla użytkowników:**
   - Przejdź do sekcji "Pytania do użytkowników" w panelu admina
   - Wybierz użytkownika
   - Dodaj pytanie: tekst pytania + opcja 1 + opcja 2
   - Użytkownik zobaczy to pytanie w swoim profilu w sekcji "Zebranie informacji o tobie"

2. **Tworzenie quizu o użytkownikach:**
   - Utwórz nowy szablon zadania
   - Wybierz typ: "Quiz"
   - Wybierz opcję: "Quiz o użytkownikach"
   - Wybierz użytkownika (o kim będzie quiz)
   - Zaznacz pytania które mają wejść w skład quizu (tylko te, na które użytkownik już odpowiedział)
   - Ustaw próg zaliczenia (np. 5 punktów)
   - Przypisz zadanie do konkretnego dnia

3. **Przypisanie zadania do dnia:**
   - Przejdź do sekcji "Zarządzanie zadaniami"
   - Wybierz dzień i zadanie typu quiz o użytkownikach
   - Przypisz do użytkowników

### Dla użytkownika:

1. **Odpowiadanie na pytania:**
   - Przejdź do "Mój Profil"
   - Sekcja "Zebranie informacji o tobie"
   - Zobacz pytania przypisane do Ciebie
   - Wybierz odpowiedź (opcja 1 lub 2)
   - Kliknij "Zapisz odpowiedź"
   - Twoja odpowiedź staje się poprawną dla quizów o Tobie

2. **Rozwiązywanie quizu o innych:**
   - Otwórz zadanie z dnia w kalendarzu
   - Jeśli zadanie to quiz o użytkowniku, zobaczysz pytania
   - Dla każdego pytania wybierz jedną z dwóch opcji
   - Po zaznaczeniu: zobaczysz czy odpowiedź jest poprawna (zielony/czerwony)
   - Po zakończeniu: zobaczysz wynik i czy zadanie zostało zaliczone

## 🗄️ Struktura danych:

### Tabela `user_quiz_questions`:
```sql
- id (UUID)
- target_user_id (UUID) - użytkownik którego dotyczy pytanie
- question_text (TEXT) - treść pytania
- option_1 (TEXT) - pierwsza opcja
- option_2 (TEXT) - druga opcja
- target_user_answer (INTEGER 1 lub 2) - odpowiedź użytkownika (NULL jeśli nie odpowiedział)
- answered_at (TIMESTAMP)
- created_at (TIMESTAMP)
- created_by (UUID) - admin który stworzył pytanie
```

### Tabela `quiz_attempts`:
```sql
- id (UUID)
- task_template_id (UUID) - który szablon quizu
- assigned_task_id (UUID) - przypisane zadanie
- attempting_user_id (UUID) - kto rozwiązuje quiz
- target_user_id (UUID) - o kim jest quiz
- question_answers (JSONB) - {question_id: selected_option}
- score (INTEGER) - liczba poprawnych odpowiedzi
- total_questions (INTEGER)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- task_completed (BOOLEAN) - czy zadanie zostało zaliczone
```

### Metadata w `task_templates` dla quizu o użytkownikach:
```json
{
  "quiz_type": "user_quiz",
  "target_user_id": "uuid-uzytkownika",
  "question_ids": ["uuid1", "uuid2", "uuid3"],
  "passing_score": 5
}
```

## 🚀 Następne kroki:

1. **Wykonaj migrację bazy danych:**
   - W Supabase Dashboard → SQL Editor
   - Wykonaj plik `dodaj-quiz-o-uzytkownikach.sql`

2. **Dokończ implementację panelu admina:**
   - Sekcja zarządzania pytaniami dla użytkowników
   - Rozszerzenie formularza quizu

3. **Dokończ implementację wyświetlania quizów:**
   - Obsługa quizów w `script.js`
   - UI w `index.html`

4. **Przetestuj:**
   - Utwórz pytania dla użytkownika
   - Użytkownik odpowiada na pytania
   - Utwórz quiz o użytkowniku
   - Przypisz quiz do dnia
   - Rozwiąż quiz jako inny użytkownik

## ⚠️ Ważne uwagi:

- Użytkownik może odpowiadać na pytania wielokrotnie (ostatnia odpowiedź nadpisuje poprzednią)
- Quiz można rozwiązywać tylko dla pytań, na które użytkownik już odpowiedział
- Automatyczne zaliczenie następuje po osiągnięciu progu punktów
- Każda poprawna odpowiedź = 1 punkt

