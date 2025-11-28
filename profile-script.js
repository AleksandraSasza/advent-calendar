// Sprawdź czy użytkownik jest zalogowany
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Przekieruj do strony logowania jeśli nie jest zalogowany
        window.location.href = 'login.html';
        return;
    }
    
    loadUserProfile();
    setupEventListeners();
});

// Ładowanie profilu użytkownika
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            displayUserInfo(userData);
            loadUserStats();
        } else {
            // Token nieprawidłowy, przekieruj do logowania
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Błąd ładowania profilu:', error);
        showNotification('Błąd ładowania profilu', 'error');
    }
}

// Wyświetlanie informacji o użytkowniku
function displayUserInfo(userData) {
    document.getElementById('user-email-display').textContent = userData.email;
    document.getElementById('user-name-display').textContent = userData.name || 'Nie ustawiono';
    document.getElementById('user-created-display').textContent = userData.created_at ? 
        new Date(userData.created_at).toLocaleDateString('pl-PL') : 'Nieznana';
}

// Ładowanie statystyk użytkownika
async function loadUserStats() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/progress', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const completedTasks = data.completedDays ? data.completedDays.length : 0;
            const remainingTasks = 24 - completedTasks;
            const progressPercentage = Math.round((completedTasks / 24) * 100);
            
            document.getElementById('completed-tasks').textContent = completedTasks;
            document.getElementById('remaining-tasks').textContent = remainingTasks;
            document.getElementById('progress-percentage').textContent = progressPercentage + '%';
        }
    } catch (error) {
        console.error('Błąd ładowania statystyk:', error);
    }
}

// Konfiguracja eventów
function setupEventListeners() {
    // Edycja imienia - nowy interfejs
    document.getElementById('edit-name-btn').addEventListener('click', () => {
        document.getElementById('edit-name-btn').style.display = 'none';
        document.getElementById('name-edit-controls').style.display = 'inline-block';
        document.getElementById('new-name').value = document.getElementById('user-name-display').textContent;
        document.getElementById('new-name').focus();
    });
    
    document.getElementById('cancel-name-btn').addEventListener('click', () => {
        document.getElementById('name-edit-controls').style.display = 'none';
        document.getElementById('edit-name-btn').style.display = 'inline-block';
    });
    
    document.getElementById('save-name-btn').addEventListener('click', async () => {
        const newName = document.getElementById('new-name').value.trim();
        
        if (!newName) {
            showNotification('Imię nie może być puste', 'error');
            return;
        }
        
        await updateUserName(newName);
    });
    
    // Formularz zmiany hasła
    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        
        if (newPassword.length < 6) {
            showNotification('Nowe hasło musi mieć co najmniej 6 znaków', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('Nowe hasła nie są identyczne', 'error');
            return;
        }
        
        await changePassword(currentPassword, newPassword);
    });
    
    // Wylogowanie
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    });
    
    // Usuwanie konta
    document.getElementById('delete-account-btn').addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna!')) {
            deleteAccount();
        }
    });
}

// Aktualizacja imienia użytkownika
async function updateUserName(newName) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/profile/name', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            document.getElementById('user-name-display').textContent = newName;
            document.getElementById('name-edit-controls').style.display = 'none';
            document.getElementById('edit-name-btn').style.display = 'inline-block';
            showNotification('Imię zostało zaktualizowane', 'success');
        } else {
            const data = await response.json();
            showNotification(data.error || 'Błąd aktualizacji imienia', 'error');
        }
    } catch (error) {
        console.error('Błąd aktualizacji imienia:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
    }
}

// Zmiana hasła
async function changePassword(currentPassword, newPassword) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/profile/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                currentPassword: currentPassword,
                newPassword: newPassword 
            })
        });
        
        if (response.ok) {
            // Wyczyść formularz
            document.getElementById('change-password-form').reset();
            showNotification('Hasło zostało zmienione', 'success');
        } else {
            const data = await response.json();
            showNotification(data.error || 'Błąd zmiany hasła', 'error');
        }
    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
    }
}

// Usuwanie konta
async function deleteAccount() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/profile/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('authToken');
            showNotification('Konto zostało usunięte', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            const data = await response.json();
            showNotification(data.error || 'Błąd usuwania konta', 'error');
        }
    } catch (error) {
        console.error('Błąd usuwania konta:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
    }
}

// Funkcja powiadomień
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}
