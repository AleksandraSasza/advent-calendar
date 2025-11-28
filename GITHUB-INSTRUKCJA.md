# Instrukcja dodania projektu na GitHub

## Krok 1: Utwórz nowe repozytorium na GitHub

1. Zaloguj się na [GitHub.com](https://github.com)
2. Kliknij przycisk **"+"** w prawym górnym rogu i wybierz **"New repository"**
3. Wypełnij formularz:
   - **Repository name**: `advent-calendar` (lub inna nazwa)
   - **Description**: (opcjonalnie) "Advent Calendar Application"
   - **Visibility**: Wybierz **Private** (dla bezpieczeństwa) lub **Public**
   - **NIE zaznaczaj** "Add a README file", "Add .gitignore", ani "Choose a license" (już masz te pliki)
4. Kliknij **"Create repository"**

## Krok 2: Połącz lokalne repozytorium z GitHub

Po utworzeniu repozytorium, GitHub pokaże Ci instrukcje. Użyj tych komend (zastąp `YOUR_USERNAME` swoją nazwą użytkownika):

```bash
cd /Users/saszalysokon/advent-calendar
git remote add origin https://github.com/YOUR_USERNAME/advent-calendar.git
git branch -M main
git push -u origin main
```

**Alternatywnie**, jeśli używasz SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/advent-calendar.git
git branch -M main
git push -u origin main
```

## Krok 3: Dodaj współpracowników (dla dostępu na serwer)

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **"Settings"** (ustawienia)
3. W lewym menu wybierz **"Collaborators"** (współpracownicy)
4. Kliknij **"Add people"**
5. Wpisz nazwę użytkownika GitHub lub email osoby, którą chcesz dodać
6. Wybierz poziom dostępu:
   - **Read** - tylko odczyt
   - **Write** - może commitować zmiany
   - **Admin** - pełny dostęp (włącznie z usuwaniem repozytorium)
7. Osoba otrzyma email z zaproszeniem do współpracy

## Krok 4: Klonowanie repozytorium na serwer

Gdy współpracownik zaakceptuje zaproszenie, może sklonować repozytorium na serwer:

```bash
git clone https://github.com/YOUR_USERNAME/advent-calendar.git
cd advent-calendar
```

**WAŻNE**: Po sklonowaniu na serwerze, trzeba będzie:
1. Skopiować `config.example.js` do `config.js`
2. Wypełnić `config.js` danymi z Supabase dla środowiska produkcyjnego

## Bezpieczeństwo

✅ **Plik `config.js` jest w `.gitignore`** - nie zostanie dodany do Git
✅ **Używaj `config.example.js`** jako szablonu
✅ **Nie commituj** wrażliwych danych (klucze API, hasła, etc.)

## Przydatne komendy Git

```bash
# Sprawdź status zmian
git status

# Dodaj zmiany
git add .

# Zrób commit
git commit -m "Opis zmian"

# Wyślij zmiany na GitHub
git push

# Pobierz zmiany z GitHub
git pull

# Zobacz historię commitów
git log
```

## Rozwiązywanie problemów

### Jeśli zapomniałeś dodać remote:
```bash
git remote -v  # sprawdź czy remote istnieje
git remote add origin https://github.com/YOUR_USERNAME/advent-calendar.git
```

### Jeśli chcesz zmienić URL remote:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/advent-calendar.git
```

### Jeśli masz konflikt podczas push:
```bash
git pull --rebase origin main
git push
```

