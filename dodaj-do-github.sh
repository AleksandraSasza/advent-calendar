#!/bin/bash

# Skrypt do dodania projektu na GitHub
# Użycie: ./dodaj-do-github.sh TWOJA_NAZWA_UZYTKOWNIKA

if [ -z "$1" ]; then
    echo "❌ Błąd: Musisz podać nazwę użytkownika GitHub"
    echo ""
    echo "Użycie:"
    echo "  ./dodaj-do-github.sh TWOJA_NAZWA_UZYTKOWNIKA"
    echo ""
    echo "Przykład:"
    echo "  ./dodaj-do-github.sh saszalysokon"
    exit 1
fi

USERNAME=$1
REPO_NAME="advent-calendar"

echo "🚀 Dodawanie repozytorium na GitHub..."
echo ""

# Sprawdź czy remote już istnieje
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' już istnieje!"
    echo "Aktualny URL: $(git remote get-url origin)"
    read -p "Czy chcesz go zastąpić? (t/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Tt]$ ]]; then
        git remote remove origin
    else
        echo "Anulowano."
        exit 1
    fi
fi

# Dodaj remote
echo "📡 Dodawanie remote..."
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# Ustaw branch na main
echo "🌿 Ustawianie brancha na main..."
git branch -M main

# Push
echo "⬆️  Wysyłanie kodu na GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sukces! Twój kod został dodany na GitHub!"
    echo "🔗 URL: https://github.com/$USERNAME/$REPO_NAME"
    echo ""
    echo "Następne kroki:"
    echo "1. Przejdź do https://github.com/$USERNAME/$REPO_NAME"
    echo "2. Settings → Collaborators → Add people (aby dodać współpracowników)"
else
    echo ""
    echo "❌ Błąd podczas wysyłania kodu."
    echo "Sprawdź czy:"
    echo "  - Repozytorium zostało utworzone na GitHub"
    echo "  - Masz odpowiednie uprawnienia"
    echo "  - Jesteś zalogowany w Git (git config user.name i user.email)"
fi



