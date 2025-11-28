# 👤 Jak utworzyć użytkownika w Kalendarzu Adwentowym

## 🚀 **Krok po kroku:**

### **1. Uruchom serwer:**
```bash
cd /Users/saszalysokon/advent-calendar
npm start
```

### **2. Otwórz aplikację:**
Przejdź do: `http://localhost:3000`

### **3. Przejdź do strony logowania:**
Kliknij przycisk **"ZALOGUJ SIĘ"** na głównej stronie

### **4. Zarejestruj nowego użytkownika:**
- Kliknij **"ZAREJESTRUJ SIĘ"** w formularzu logowania
- Wpisz swój **email** (np. `test@example.com`)
- Wpisz **hasło** (minimum 6 znaków)
- **Potwierdź hasło** (musi być identyczne)
- Kliknij **"ZAREJESTRUJ SIĘ"**

### **5. Zaloguj się:**
- Po rejestracji wróć do formularza logowania
- Wpisz swój **email** i **hasło**
- Kliknij **"ZALOGUJ SIĘ"**

### **6. Ciesz się aplikacją!**
- Zostaniesz przekierowany do głównej strony
- Twój postęp będzie zapisywany automatycznie
- Możesz wylogować się przyciskiem "Wyloguj się"

## 🔧 **Przykładowe dane testowe:**

### **Użytkownik 1:**
- **Email:** `anna@example.com`
- **Hasło:** `haslo123`

### **Użytkownik 2:**
- **Email:** `jan@example.com`
- **Hasło:** `test123`

### **Użytkownik 3:**
- **Email:** `maria@example.com`
- **Hasło:** `password123`

## 🎯 **Funkcje po zalogowaniu:**

✅ **Zapisywanie postępu** - wykonane zadania są zapisywane w bazie danych
✅ **Synchronizacja** - postęp jest zachowywany między sesjami
✅ **Osobiste konto** - każdy użytkownik ma swój własny postęp
✅ **Bezpieczeństwo** - hasła są szyfrowane

## 🗄️ **Gdzie są przechowywane dane:**

- **Baza danych:** `advent_calendar.db` w folderze aplikacji
- **Tabela użytkowników:** `users` - dane logowania
- **Tabela postępu:** `user_progress` - wykonane zadania

## 🔍 **Jak sprawdzić użytkowników w bazie:**

```bash
sqlite3 advent_calendar.db
.tables
SELECT * FROM users;
SELECT * FROM user_progress;
.quit
```

## ⚠️ **Ważne informacje:**

- **Hasła są szyfrowane** - nie można ich odczytać z bazy danych
- **Każdy użytkownik ma osobny postęp** - nie ma dostępu do danych innych
- **Tokeny wygasają** po 7 dniach - trzeba się ponownie zalogować
- **Baza jest lokalna** - dane są tylko na Twoim komputerze

## 🎄 **Gotowe!**

Teraz możesz:
- ✅ Tworzyć konta użytkowników
- ✅ Logować się i wylogowywać
- ✅ Zapisywać postęp w kalendarzu
- ✅ Cieszyć się świątecznymi zadaniami!

**Wesołych Świąt! 🎄✨**
