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
        loadUserQuestions(); // Załaduj pytania przypisane do użytkownika
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
            try {
                // Sprawdź czy sesja istnieje przed próbą wylogowania
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                        // Nie wyświetlaj błędu jeśli sesja już nie istnieje
                        if (error.message && !error.message.includes('Auth session missing')) {
                            console.error('Błąd wylogowania:', error);
                        }
                    }
                }
            } catch (error) {
                // Ignoruj błąd jeśli sesja nie istnieje
                if (!error.message?.includes('Auth session missing')) {
                    console.error('Błąd wylogowania:', error);
                }
            }
        }
        
        // Zawsze przekieruj, nawet jeśli wystąpił błąd
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
        try {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError && !signOutError.message?.includes('Auth session missing')) {
                console.error('Błąd wylogowania:', signOutError);
            }
        } catch (error) {
            // Ignoruj błąd jeśli sesja już nie istnieje
            if (!error.message?.includes('Auth session missing')) {
                console.error('Błąd wylogowania:', error);
            }
        }
        
        showNotification('Konto zostało usunięte', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        console.error('Błąd usuwania konta:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
    }
}

// Ładowanie pytań przypisanych do użytkownika
async function loadUserQuestions() {
    if (!supabase) {
        return;
    }
    
    try {
        // Pobierz sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            return;
        }
        
        // Pobierz pytania przypisane do użytkownika
        const { data: questions, error } = await supabase
            .from('user_quiz_questions')
            .select('*')
            .eq('target_user_id', session.user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Błąd ładowania pytań:', error);
            return;
        }
        
        displayUserQuestions(questions || []);
    } catch (error) {
        console.error('Błąd ładowania pytań:', error);
    }
}

// Wyświetlanie pytań użytkownika
function displayUserQuestions(questions) {
    const container = document.getElementById('user-questions-container');
    
    if (!container) {
        return;
    }
    
    if (questions.length === 0) {
        container.innerHTML = '<p style="color: #6e6e73; font-style: italic;">Nie masz jeszcze przypisanych pytań. Administrator może dodać pytania w panelu administracyjnym.</p>';
        return;
    }
    
    container.innerHTML = questions.map((question, index) => {
        const isAnswered = question.target_user_answer !== null;
        const answeredText = isAnswered 
            ? `Odpowiedziałeś: <strong>${question.target_user_answer === 1 ? question.option_1 : question.option_2}</strong>`
            : '';
        const answeredDate = isAnswered && question.answered_at
            ? ` (${new Date(question.answered_at).toLocaleDateString('pl-PL')})`
            : '';
        
        return `
            <div class="user-question-item" data-question-id="${question.id}" style="
                margin-bottom: 24px;
                padding: 20px;
                background: ${isAnswered ? '#f0f9f0' : '#fff'};
                border: 1px solid ${isAnswered ? '#1a5d1a' : '#e8e8ed'};
                border-radius: 8px;
            ">
                <div style="margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 1rem; font-weight: 600; color: #1d1d1f;">Pytanie ${index + 1}</h4>
                    <div style="display: flex; gap: 16px; margin-bottom: 8px; flex-wrap: wrap;">
                        <span style="font-size: 0.9375rem; color: #1d1d1f;">Opcja 1: <strong>${escapeHtml(question.option_1)}</strong></span>
                        <span style="font-size: 0.9375rem; color: #1d1d1f;">Opcja 2: <strong>${escapeHtml(question.option_2)}</strong></span>
                    </div>
                    ${isAnswered ? `<p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #1a5d1a;">${answeredText}${answeredDate}</p>` : ''}
                </div>
                
                ${!isAnswered ? `
                    <div style="margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e8e8ed; border-radius: 8px; cursor: pointer; margin-bottom: 8px; transition: all 0.2s ease;">
                            <input type="radio" name="question-${question.id}" value="1" style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 0.9375rem; color: #1d1d1f;">${escapeHtml(question.option_1)}</span>
                        </label>
                        <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e8e8ed; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                            <input type="radio" name="question-${question.id}" value="2" style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 0.9375rem; color: #1d1d1f;">${escapeHtml(question.option_2)}</span>
                        </label>
                    </div>
                    <button class="btn btn-primary save-question-btn" data-question-id="${question.id}" style="
                        padding: 10px 20px;
                        background: #1a5d1a;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.875rem;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Zapisz odpowiedź</button>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Dodaj event listenery dla przycisków zapisywania
    container.querySelectorAll('.save-question-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const questionId = this.dataset.questionId;
            const questionItem = container.querySelector(`[data-question-id="${questionId}"]`);
            const selectedOption = questionItem.querySelector(`input[name="question-${questionId}"]:checked`);
            
            if (!selectedOption) {
                showNotification('Wybierz jedną z opcji', 'error');
                return;
            }
            
            const answer = parseInt(selectedOption.value);
            await saveUserAnswer(questionId, answer);
        });
    });
    
    // Dodaj hover effect dla radio buttonów
    container.querySelectorAll('label').forEach(label => {
        label.addEventListener('mouseenter', function() {
            if (!this.querySelector('input').checked) {
                this.style.borderColor = '#1a5d1a';
                this.style.background = '#f0f9f0';
            }
        });
        label.addEventListener('mouseleave', function() {
            if (!this.querySelector('input').checked) {
                this.style.borderColor = '#e8e8ed';
                this.style.background = 'white';
            }
        });
    });
}

// Zapis odpowiedzi użytkownika
async function saveUserAnswer(questionId, answer) {
    if (!supabase) {
        showNotification('Błąd konfiguracji', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('user_quiz_questions')
            .update({
                target_user_answer: answer,
                answered_at: new Date().toISOString()
            })
            .eq('id', questionId);
        
        if (error) throw error;
        
        showNotification('Odpowiedź została zapisana', 'success');
        
        // Przeładuj pytania
        await loadUserQuestions();
    } catch (error) {
        console.error('Błąd zapisywania odpowiedzi:', error);
        showNotification('Błąd zapisywania odpowiedzi: ' + (error.message || 'Nieznany błąd'), 'error');
    }
}

// Funkcja pomocnicza do escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
