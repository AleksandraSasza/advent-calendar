// Konfiguracja Supabase - ładowana z config.js
if (!window.SUPABASE_CONFIG) {
    console.error('⚠️ BŁĄD: Plik config.js nie jest załadowany!');
    alert('⚠️ BŁĄD KONFIGURACJI:\n\nPlik config.js nie jest załadowany!\n\nUpewnij się, że plik config.js istnieje i jest załadowany przed profile-script.js');
}

const SUPABASE_URL = window.SUPABASE_CONFIG?.URL;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️ BŁĄD: Konfiguracja Supabase nie jest ustawiona!');
    alert('⚠️ BŁĄD KONFIGURACJI:\n\nSkopiuj config.example.js jako config.js i wypełnij swoimi danymi z Supabase Dashboard.');
}

// Inicjalizacja klienta Supabase
let supabase;
try {
    if (typeof window.supabaseLib !== 'undefined' && window.supabaseLib.createClient) {
        supabase = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library nie jest załadowana!');
        alert('Błąd: Biblioteka Supabase nie jest załadowana. Odśwież stronę.');
        throw new Error('Supabase library not loaded');
    }
    console.log('Supabase zainicjalizowany pomyślnie');
} catch (error) {
    console.error('Błąd inicjalizacji Supabase:', error);
    alert('Błąd inicjalizacji Supabase: ' + error.message);
}

// Sprawdź czy użytkownik jest zalogowany
document.addEventListener('DOMContentLoaded', async function() {
    if (!supabase) {
        console.error('Supabase nie jest zainicjalizowany!');
        return;
    }
    
    // Sprawdź sesję
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        // Przekieruj do strony logowania jeśli nie jest zalogowany
        window.location.href = 'login.html';
        return;
    }
    
    loadUserProfile();
    setupEventListeners();
});

// Ładowanie profilu użytkownika
async function loadUserProfile() {
    if (!supabase) {
        showNotification('Błąd konfiguracji Supabase', 'error');
        return;
    }
    
    try {
        // Pobierz sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            window.location.href = 'login.html';
            return;
        }
        
        // Pobierz profil użytkownika
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (profileError) {
            console.error('Błąd ładowania profilu:', profileError);
            showNotification('Błąd ładowania profilu', 'error');
            return;
        }
        
        // Wyświetl informacje o użytkowniku
        const userData = {
            email: profile.email || session.user.email,
            name: profile.display_name || 'Nie ustawiono',
            created_at: profile.created_at || session.user.created_at
        };
        
        displayUserInfo(userData);
        loadUserStats();
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
    if (!supabase) {
        return;
    }
    
    try {
        // Pobierz sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            return;
        }
        
        // Pobierz ukończone zadania użytkownika
        const { data, error } = await supabase
            .from('assigned_tasks')
            .select('calendar_days!inner(day_number)')
            .eq('user_id', session.user.id)
            .eq('status', 'completed');
        
        if (error) {
            console.error('Błąd ładowania statystyk:', error);
            return;
        }
        
        const completedTasks = data ? data.length : 0;
        const remainingTasks = 24 - completedTasks;
        const progressPercentage = Math.round((completedTasks / 24) * 100);
        
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('remaining-tasks').textContent = remainingTasks;
        document.getElementById('progress-percentage').textContent = progressPercentage + '%';
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
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
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
    if (!supabase) {
        showNotification('Błąd konfiguracji Supabase', 'error');
        return;
    }
    
    try {
        // Pobierz sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            window.location.href = 'login.html';
            return;
        }
        
        // Aktualizuj display_name w profilu
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ display_name: newName })
            .eq('id', session.user.id);
        
        if (updateError) {
            console.error('Błąd aktualizacji imienia:', updateError);
            showNotification(updateError.message || 'Błąd aktualizacji imienia', 'error');
            return;
        }
        
        document.getElementById('user-name-display').textContent = newName;
        document.getElementById('name-edit-controls').style.display = 'none';
        document.getElementById('edit-name-btn').style.display = 'inline-block';
        showNotification('Imię zostało zaktualizowane', 'success');
    } catch (error) {
        console.error('Błąd aktualizacji imienia:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
    }
}

// Zmiana hasła
async function changePassword(currentPassword, newPassword) {
    if (!supabase) {
        showNotification('Błąd konfiguracji Supabase', 'error');
        return;
    }
    
    try {
        // Pobierz sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            window.location.href = 'login.html';
            return;
        }
        
        // Weryfikuj obecne hasło przez próbę logowania
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: currentPassword
        });
        
        if (verifyError) {
            showNotification('Nieprawidłowe obecne hasło', 'error');
            return;
        }
        
        // Aktualizuj hasło
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (updateError) {
            console.error('Błąd zmiany hasła:', updateError);
            showNotification(updateError.message || 'Błąd zmiany hasła', 'error');
            return;
        }
        
        // Wyczyść formularz
        document.getElementById('change-password-form').reset();
        showNotification('Hasło zostało zmienione', 'success');
    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
    }
}

// Usuwanie konta
async function deleteAccount() {
    if (!supabase) {
        showNotification('Błąd konfiguracji Supabase', 'error');
        return;
    }
    
    try {
        // Pobierz sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            window.location.href = 'login.html';
            return;
        }
        
        // Usuń profil (reszta zostanie usunięta przez CASCADE w bazie)
        const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', session.user.id);
        
        if (deleteError) {
            console.error('Błąd usuwania profilu:', deleteError);
            showNotification('Błąd usuwania konta. Skontaktuj się z administratorem.', 'error');
            return;
        }
        
        // Wyloguj użytkownika
        await supabase.auth.signOut();
        
        showNotification('Konto zostało usunięte', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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
