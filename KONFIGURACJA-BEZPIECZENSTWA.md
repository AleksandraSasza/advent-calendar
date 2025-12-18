# 🔐 Konfiguracja Bezpieczeństwa

## ✅ Co zostało zrobione

1. **Jeden plik konfiguracyjny** - `config.js` zawiera wszystkie wrażliwe dane
2. **Plik w .gitignore** - `config.js` nie będzie commitowany do Git
3. **Przykładowy plik** - `config.example.js` jako szablon dla innych deweloperów

## 📋 Instrukcja konfiguracji

### Krok 1: Skopiuj plik przykładowy

```bash
cp config.example.js config.js
```

### Krok 2: Wypełnij dane z Supabase

1. Otwórz `config.js`
2. Wklej swój **URL** z Supabase Dashboard → Settings → API
3. Wklej swój **Publishable key** z Supabase Dashboard → Settings → API

### Krok 3: Sprawdź .gitignore

Upewnij się, że `config.js` jest w `.gitignore` (już jest dodany ✅)

## ⚠️ Ważne

- **NIE** commituj `config.js` do Git!
- **NIE** udostępniaj `config.js` publicznie
- **DO** commituj `config.example.js` (bez prawdziwych danych)

## 🔍 Sprawdzenie

Przed commitem do Git, sprawdź:

```bash
git status
```

Nie powinieneś widzieć `config.js` na liście plików do commitowania.

## 📝 Dla innych deweloperów

Gdy ktoś klonuje repozytorium:

1. Skopiuje `config.example.js` jako `config.js`
2. Wypełni swoimi danymi z Supabase
3. `config.js` nie będzie w repozytorium (jest w .gitignore)

---

**Gotowe! 🎉** Twoje klucze API są teraz bezpieczne.



