# Konfiguracja Vercel dla Kalendarza Adwentowego

## Problem
Plik `config.js` zawiera wrażliwe dane (klucze Supabase) i jest w `.gitignore`, więc nie jest dostępny na Vercel.

## Rozwiązanie (Automatyczne)

### 1. Ustaw zmienne środowiskowe w Vercel

1. **W Vercel Dashboard:**
   - Przejdź do ustawień projektu
   - Otwórz sekcję "Environment Variables"
   - Dodaj następujące zmienne:
     - `NEXT_PUBLIC_SUPABASE_URL` = Twój URL Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Twój klucz anon Supabase

2. **Skrypt build automatycznie wstrzyknie** te zmienne do HTML podczas build.

3. **Plik `vercel-config.js` automatycznie wykryje** konfigurację z meta tagów.

### Opcja 2: Wstrzyknięcie przez Build Script

Jeśli chcesz wstrzyknąć zmienne bezpośrednio do HTML podczas build:

1. Dodaj do `package.json`:
```json
{
  "scripts": {
    "build": "node scripts/inject-config.js"
  }
}
```

2. Utwórz `scripts/inject-config.js` który wstrzyknie zmienne do HTML.

### Opcja 3: Użyj config.js w repo (NIE ZALECANE)

Możesz dodać `config.js` do repo, ale **NIE RÓB TEGO** - klucze będą widoczne publicznie!

## Aktualna implementacja

Plik `vercel-config.js` sprawdza następujące źródła (w kolejności):
1. `window.SUPABASE_CONFIG` z `config.js` (lokalny development)
2. `window.__SUPABASE_CONFIG__` (wstrzyknięte w HTML)
3. `window.__ENV__.NEXT_PUBLIC_SUPABASE_URL` (zmienne środowiskowe Vercel)
4. `localStorage.getItem('SUPABASE_CONFIG')` (dla testów)

## Uwaga

Vercel dla statycznych stron **nie wstrzykuje automatycznie** zmiennych środowiskowych do przeglądarki. Musisz je wstrzyknąć ręcznie przez:
- Build script
- Edge Function
- Lub użyć prefiksu `NEXT_PUBLIC_` i wstrzyknąć przez specjalny endpoint

## Najprostsze rozwiązanie

**Użyj zmiennych środowiskowych Vercel z prefiksem `NEXT_PUBLIC_`** i zaktualizuj `vercel-config.js`, aby ładował je z `window.__ENV__` lub przez specjalny endpoint.

