# 🎄 Kalendarz Adwentowy z Mapą Świata

Interaktywny kalendarz adwentowy z systemem logowania i zapisywaniem postępu użytkowników.

## ✨ Funkcje

- 🌍 **Interaktywna mapa świata** z 24 państwami
- 🔐 **System logowania i rejestracji**
- 💾 **Zapisywanie postępu** użytkowników
- 📱 **Responsywny design**
- 🎯 **24 świąteczne zadania** na każdy dzień adwentu
- 📊 **Pasek postępu** i licznik wykonanych zadań

## 🚀 Instalacja i uruchomienie

### Wymagania
- Node.js (wersja 14 lub nowsza)
- npm

### Kroki instalacji

1. **Zainstaluj zależności:**
```bash
npm install
```

2. **Uruchom serwer:**
```bash
npm start
```

3. **Otwórz aplikację:**
Przejdź do `http://localhost:3000` w przeglądarce

### Tryb deweloperski
```bash
npm run dev
```

## 🗄️ Baza danych

Aplikacja używa SQLite do przechowywania danych:
- **users** - dane użytkowników
- **user_progress** - postęp użytkowników

Baza danych jest tworzona automatycznie przy pierwszym uruchomieniu.

## 🔧 Konfiguracja

### Zmienne środowiskowe
Utwórz plik `.env` w głównym katalogu:

```env
PORT=3000
JWT_SECRET=twoj-sekretny-klucz-jwt
```

## 📁 Struktura projektu

```
advent-calendar/
├── index.html          # Główna strona
├── script.js           # Logika frontend
├── styles.css          # Style CSS
├── server.js           # Serwer backend
├── package.json        # Zależności
└── README.md          # Dokumentacja
```

## 🎯 Jak używać

1. **Zarejestruj się** lub **zaloguj** do aplikacji
2. **Kliknij w numerowane państwo** na mapie
3. **Przeczytaj zadanie** na dany dzień
4. **Oznacz jako wykonane** po ukończeniu
5. **Śledź swój postęp** na pasku postępu

## 🔐 Bezpieczeństwo

- Hasła są hashowane przy użyciu bcrypt
- Uwierzytelnianie JWT z tokenami wygasającymi
- Walidacja danych wejściowych
- CORS skonfigurowany dla bezpieczeństwa

## 🛠️ API Endpoints

### Autoryzacja
- `POST /api/register` - Rejestracja użytkownika
- `POST /api/login` - Logowanie
- `GET /api/verify` - Weryfikacja tokenu

### Postęp
- `GET /api/progress` - Pobierz postęp użytkownika
- `POST /api/progress` - Zapisz postęp użytkownika

## 🎨 Personalizacja

Możesz łatwo dostosować:
- **Zadania** w pliku `script.js` (obiekt `adventTasks`)
- **Style** w pliku `styles.css`
- **Kolory** i **animacje** w CSS

## 📱 Responsywność

Aplikacja jest w pełni responsywna i działa na:
- 💻 Komputerach
- 📱 Telefonach
- 📱 Tabletach

## 🐛 Rozwiązywanie problemów

### Błąd "Cannot find module"
```bash
npm install
```

### Błąd bazy danych
Usuń plik `advent_calendar.db` i uruchom ponownie serwer.

### Port już w użyciu
Zmień port w pliku `.env` lub użyj:
```bash
PORT=3001 npm start
```

## 🤝 Współtworzenie

1. Fork projektu
2. Utwórz branch dla nowej funkcji
3. Commit zmiany
4. Push do branch
5. Utwórz Pull Request

## 📄 Licencja

MIT License - zobacz plik LICENSE dla szczegółów.

---

**Wesołych Świąt! 🎄✨**
