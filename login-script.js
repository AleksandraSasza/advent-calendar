// Konfiguracja Supabase - ładowana z config.js
if (!window.SUPABASE_CONFIG) {
    console.error('⚠️ BŁĄD: Plik config.js nie jest załadowany!');
    alert('⚠️ BŁĄD KONFIGURACJI:\n\nPlik config.js nie jest załadowany!\n\nUpewnij się, że plik config.js istnieje i jest załadowany przed login-script.js');
}

const SUPABASE_URL = window.SUPABASE_CONFIG?.URL;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️ BŁĄD: Konfiguracja Supabase nie jest ustawiona!');
    alert('⚠️ BŁĄD KONFIGURACJI:\n\nSkopiuj config.example.js jako config.js i wypełnij swoimi danymi z Supabase Dashboard.');
}

// Inicjalizacja klienta Supabase
// Używamy IIFE aby uniknąć konfliktów z innymi skryptami
(function() {
    // Sprawdź czy już istnieje w window (z poprzedniego ładowania)
    if (window.loginSupabaseClient) {
        window.loginSupabase = window.loginSupabaseClient;
        console.log('Supabase już zainicjalizowany, używam istniejącej instancji');
        return;
    }
    
    try {
        // Sprawdź różne sposoby dostępu do biblioteki Supabase
        let client = null;
        if (typeof window.supabaseLib !== 'undefined' && window.supabaseLib.createClient) {
            client = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('Supabase library nie jest załadowana!');
            alert('Błąd: Biblioteka Supabase nie jest załadowana. Odśwież stronę.');
            throw new Error('Supabase library not loaded');
        }
        
        // Zapisz w window jako loginSupabase i loginSupabaseClient
        window.loginSupabase = client;
        window.loginSupabaseClient = client;
        console.log('Supabase zainicjalizowany pomyślnie');
    } catch (error) {
        console.error('Błąd inicjalizacji Supabase:', error);
        alert('Błąd inicjalizacji Supabase: ' + error.message);
    }
})();

// Użyj zmiennej z window
var supabase = window.loginSupabase;

// Flaga wskazująca, że przekierowanie jest w toku
let isRedirecting = false;

// Sprawdź czy użytkownik jest już zalogowany
document.addEventListener('DOMContentLoaded', async function() {
    // Sprawdź czy użytkownik właśnie się wylogował - jeśli tak, nie przekierowuj z powrotem
    const logoutFlag = sessionStorage.getItem('logoutInProgress');
    if (logoutFlag === 'true') {
        sessionStorage.removeItem('logoutInProgress');
        console.log('✅ Wylogowanie w toku - pozwól użytkownikowi się zalogować');
        setupAuthEvents();
        return;
    }
    
    // Zabezpieczenie przed pętlą przekierowań
    const redirectFlag = sessionStorage.getItem('redirecting');
    if (redirectFlag === 'true') {
        sessionStorage.removeItem('redirecting');
        console.log('✅ Flaga przekierowania usunięta - pozwól użytkownikowi się zalogować');
        setupAuthEvents();
        return;
    }
    
    // Jeśli przekierowanie jest w toku, nie sprawdzaj sesji
    if (isRedirecting) {
        console.log('⚠️ Przekierowanie w toku, pomijam sprawdzanie sesji');
        return;
    }
    
    if (!supabase) {
        console.error('Supabase nie jest zainicjalizowany!');
        setupAuthEvents();
        return;
    }
    
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Błąd sprawdzania sesji:', sessionError);
            setupAuthEvents();
            return;
        }
        
        if (session && session.user) {
            console.log('✅ Znaleziono istniejącą sesję dla:', session.user.email);
            
            // Sprawdź czy użytkownik ma profil (czy jest w bazie)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profileError || !profile) {
                console.log('Użytkownik nie ma profilu, pozwól się zalogować');
                setupAuthEvents();
                return;
            }
            
            // Użytkownik jest zalogowany i ma profil - sprawdź rolę
            const redirectUrl = profile.role === 'admin' ? 'admin.html' : 'index.html';
            console.log('🔄 Przekierowanie istniejącej sesji do:', redirectUrl);
            isRedirecting = true;
            sessionStorage.setItem('redirecting', 'true');
            window.location.replace(redirectUrl);
            return;
        }
    } catch (error) {
        console.error('Błąd sprawdzania sesji:', error);
    }
    
    setupAuthEvents();
});

// Obsługa logowania
// Zwraca true przy sukcesie, false przy błędzie
async function handleLogin(email, password) {
    try {
        if (!supabase) {
            showNotification('Błąd konfiguracji Supabase. Sprawdź ustawienia.', 'error');
            return false;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // Sprawdź czy błąd dotyczy niepotwierdzonego emaila
            if (error.message && (error.message.includes('email') || error.message.includes('confirm') || error.message.includes('Email not confirmed'))) {
                console.error('Błąd: Email nie jest potwierdzony. Próbuję potwierdzić ręcznie...');
                
                // Spróbuj wysłać ponownie email potwierdzający
                const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: email
                });
                
                if (resendError) {
                    showNotification('Email nie jest potwierdzony. Wykonaj SQL zapytanie w Supabase, aby potwierdzić email ręcznie. (Zobacz plik potwierdz-email.sql)', 'error');
                } else {
                    showNotification('Email potwierdzający został wysłany ponownie. Sprawdź skrzynkę lub wykonaj SQL zapytanie w Supabase.', 'error');
                }
            } else {
                showNotification(error.message || 'Błąd logowania', 'error');
            }
            console.error('Błąd logowania:', error);
            return false;
        }
        
        if (data.session) {
            console.log('✅ Sesja utworzona:', data.session.user.email);
            
            // Sprawdź rolę użytkownika i przekieruj odpowiednio
            try {
                console.log('🔍 Sprawdzanie profilu użytkownika...');
                console.log('User ID:', data.session.user.id);
                console.log('User Email:', data.session.user.email);
                
                // Pobierz profil przez ID
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, email, role, display_name')
                    .eq('id', data.session.user.id)
                    .single();
                
                console.log('📋 Wynik pobierania profilu:');
                console.log('  - Profile:', profile);
                console.log('  - Error:', profileError);
                
                if (profileError) {
                    console.error('❌ Błąd pobierania profilu:', profileError);
                    
                    // Jeśli błąd RLS
                    if (profileError.code === 'PGRST116' || profileError.message?.includes('row-level security')) {
                        console.log('⚠️ Problem z RLS - sprawdź polityki bezpieczeństwa w Supabase');
                        showNotification('Błąd: Polityki RLS blokują dostęp do profilu. Uruchom skrypt napraw-rls-admin.sql w Supabase.', 'error');
                        return false;
                    }
                    
                    // W razie błędu przekieruj do kalendarza
                    showNotification('Zalogowano, ale wystąpił problem z profilem. Przekierowanie...', 'warning');
                    sessionStorage.setItem('redirecting', 'true');
                    window.location.href = 'index.html';
                    return true; // Przekierowanie w toku, nie przywracaj przycisku
                }
                
                if (!profile) {
                    console.log('❌ Profil nie istnieje dla użytkownika');
                    showNotification('Profil użytkownika nie istnieje. Przekierowanie...', 'warning');
                    sessionStorage.setItem('redirecting', 'true');
                    window.location.href = 'index.html';
                    return true; // Przekierowanie w toku, nie przywracaj przycisku
                }
                
                console.log('✅ Profil znaleziony:', profile);
                console.log('🔍 Rola użytkownika:', profile.role);
                
                // Sprawdź rolę (case-insensitive dla bezpieczeństwa)
                const userRole = profile.role?.toString().trim().toLowerCase();
                const isAdmin = userRole === 'admin';
                
                console.log('🔍 Finalne sprawdzenie:');
                console.log('  - userRole:', userRole);
                console.log('  - isAdmin:', isAdmin);
                
                const redirectUrl = isAdmin ? 'admin.html' : 'index.html';
                
                // Wyświetl powiadomienie
                showNotification('Zalogowano pomyślnie! Przekierowywanie...', 'success');
                
                console.log('🔄 ========== PRZEKIEROWANIE ==========');
                console.log('🔄 URL:', redirectUrl);
                console.log('🔄 User role:', profile.role);
                console.log('🔄 Is admin:', isAdmin);
                console.log('🔄 Session exists:', !!data.session);
                
                // Przekieruj natychmiast - sesja jest już ustawiona w supabase.auth
                // Supabase automatycznie zapisuje sesję w localStorage
                console.log('🔄 Wykonuję przekierowanie teraz...');
                window.location.href = redirectUrl;
                
            } catch (error) {
                console.error('❌ Błąd sprawdzania roli:', error);
                showNotification('Zalogowano, ale wystąpił błąd. Przekierowanie...', 'warning');
                sessionStorage.setItem('redirecting', 'true');
                window.location.href = 'index.html';
                return true; // Przekierowanie w toku, nie przywracaj przycisku
            }
            
            return true; // Sukces - przekierowanie nastąpi
        }
        
        return false; // Brak sesji
    } catch (error) {
        console.error('Błąd logowania:', error);
        showNotification('Błąd połączenia z serwerem', 'error');
        return false;
    }
}


// Konfiguracja eventów autoryzacji
function setupAuthEvents() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        console.error('Nie znaleziono formularza logowania!');
        return;
    }
    
    // Formularz logowania - użyj onclick zamiast submit, aby całkowicie kontrolować zachowanie
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.type = 'button'; // Zmień typ na button, aby zapobiec domyślnemu submit
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (!emailInput || !passwordInput) {
                showNotification('Błąd: Nie znaleziono pól formularza', 'error');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            if (!email || !password) {
                showNotification('Wypełnij wszystkie pola', 'error');
                return;
            }
            
            console.log('🚀 ========== ROZPOCZYNAM LOGOWANIE ==========');
            console.log('🚀 Email:', email);
            console.log('🚀 Hasło:', password ? '***' : 'BRAK');
            
            // Wyłącz przycisk submit, aby zapobiec wielokrotnemu kliknięciu
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logowanie...';
            
            try {
                const success = await handleLogin(email, password);
                // Jeśli logowanie nie powiodło się, przywróć przycisk
                if (!success) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                // Jeśli sukces, przycisk pozostanie zablokowany (nastąpi przekierowanie)
            } catch (error) {
                console.error('❌ Błąd w handleLogin:', error);
                // Przywróć przycisk w przypadku błędu
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
    
    // Dodatkowo zablokuj domyślne submit formularza
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }, true);
    
    // Obsługa naciśnięcia Enter w polach formularza
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && passwordInput) {
        // Funkcja pomocnicza do obsługi logowania
        const triggerLogin = async () => {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            if (!email || !password) {
                showNotification('Wypełnij wszystkie pola', 'error');
                return;
            }
            
            // Wyłącz przycisk submit, aby zapobiec wielokrotnemu kliknięciu
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Logowanie...';
                
                try {
                    const success = await handleLogin(email, password);
                    // Jeśli logowanie nie powiodło się, przywróć przycisk
                    if (!success) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    // Jeśli sukces, przycisk pozostanie zablokowany (nastąpi przekierowanie)
                } catch (error) {
                    console.error('❌ Błąd w handleLogin:', error);
                    // Przywróć przycisk w przypadku błędu
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        };
        
        // Dodaj obsługę Enter w polu email
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Przenieś fokus na pole hasła lub zaloguj jeśli hasło jest już wypełnione
                if (passwordInput.value.trim()) {
                    triggerLogin();
                } else {
                    passwordInput.focus();
                }
            }
        });
        
        // Dodaj obsługę Enter w polu hasła
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerLogin();
            }
        });
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
