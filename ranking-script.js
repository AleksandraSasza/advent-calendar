// Konfiguracja Supabase - ładowana z config.js
if (!window.SUPABASE_CONFIG) {
    console.error('⚠️ BŁĄD: Plik config.js nie jest załadowany!');
}

const SUPABASE_URL = window.SUPABASE_CONFIG?.URL;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️ BŁĄD: Konfiguracja Supabase nie jest ustawiona!');
}

// Inicjalizacja klienta Supabase
let supabase;
try {
    if (typeof window.supabaseLib !== 'undefined' && window.supabaseLib.createClient) {
        supabase = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.error('Błąd inicjalizacji Supabase:', error);
}

let currentUser = null;

// Inicjalizacja strony
document.addEventListener('DOMContentLoaded', async function() {
    // Sprawdź czy użytkownik jest zalogowany
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        sessionStorage.setItem('redirecting', 'true');
        window.location.href = 'login.html';
        return;
    }
    
    // Załaduj ranking
    await loadRanking();
});

// Sprawdzanie czy użytkownik jest zalogowany
async function checkAuth() {
    if (!supabase) {
        console.error('Supabase nie jest zainicjalizowany');
        return false;
    }
    
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Błąd sprawdzania sesji:', sessionError);
            return false;
        }
        
        if (!session || !session.user) {
            console.log('Brak sesji - użytkownik nie jest zalogowany');
            return false;
        }
        
        // Pobierz profil użytkownika
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (profileError || !profile) {
            console.error('Błąd pobierania profilu:', profileError);
            return false;
        }
        
        currentUser = {
            id: session.user.id,
            email: session.user.email,
            ...profile
        };
        
        console.log('Użytkownik jest zalogowany:', currentUser.email);
        return true;
        
    } catch (error) {
        console.error('Błąd autoryzacji:', error);
        return false;
    }
}

// Ładowanie rankingu użytkowników
async function loadRanking() {
    if (!supabase) {
        showError('Błąd konfiguracji Supabase');
        return;
    }
    
    try {
        // Użyj funkcji SQL do pobrania rankingu (automatycznie wyklucza adminów)
        const { data: rankingData, error: rankingError } = await supabase.rpc('get_user_ranking');
        
        if (rankingError) {
            console.error('Błąd pobierania rankingu:', rankingError);
            // Jeśli funkcja nie istnieje, użyj fallback - pobierz użytkowników i dla każdego policz zadania
            console.log('Funkcja get_user_ranking nie istnieje, używam metody alternatywnej...');
            
            // Fallback: Pobierz tylko użytkowników (bez adminów) i dla każdego policz zadania
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, display_name')
                .neq('role', 'admin')
                .order('created_at', { ascending: true });
            
            if (profilesError) {
                console.error('Błąd pobierania profili:', profilesError);
                showError('Błąd pobierania danych użytkowników');
                return;
            }
            
            if (!profiles || profiles.length === 0) {
                showError('Brak użytkowników w systemie');
                return;
            }
            
            const rankingDataFallback = [];
            
            for (const profile of profiles) {
                const { data: completedTasks, error: tasksError } = await supabase
                    .from('assigned_tasks')
                    .select('id')
                    .eq('user_id', profile.id)
                    .eq('status', 'completed');
                
                if (tasksError) {
                    console.error(`Błąd pobierania zadań dla użytkownika ${profile.id}:`, tasksError);
                    continue;
                }
                
                const completedCount = completedTasks?.length || 0;
                
                rankingDataFallback.push({
                    user_id: profile.id,
                    email: profile.email,
                    display_name: profile.display_name || profile.email.split('@')[0],
                    completed_tasks_count: completedCount
                });
            }
            
            // Posortuj według liczby wykonanych zadań (malejąco)
            rankingDataFallback.sort((a, b) => b.completed_tasks_count - a.completed_tasks_count);
            
            // Przekształć na format zgodny z funkcją SQL
            const formattedData = rankingDataFallback.map(item => ({
                id: item.user_id,
                email: item.email,
                display_name: item.display_name,
                completed_tasks: item.completed_tasks_count
            }));
            
            displayRanking(formattedData);
            return;
        }
        
        if (!rankingData || rankingData.length === 0) {
            showError('Brak użytkowników w systemie');
            return;
        }
        
        // Przekształć dane z funkcji SQL na format oczekiwany przez displayRanking
        const formattedData = rankingData.map(item => ({
            id: item.user_id,
            email: item.email,
            display_name: item.display_name,
            completed_tasks: item.completed_tasks_count || 0
        }));
        
        // Wyświetl ranking
        displayRanking(formattedData);
        
    } catch (error) {
        console.error('Błąd ładowania rankingu:', error);
        showError('Błąd ładowania rankingu');
    }
}

// Wyświetlanie rankingu
function displayRanking(rankingData) {
    const loadingElement = document.getElementById('loading');
    const rankingListElement = document.getElementById('ranking-list');
    const errorElement = document.getElementById('error-message');
    
    // Ukryj loading i error
    loadingElement.style.display = 'none';
    errorElement.style.display = 'none';
    
    // Wyczyść poprzednią zawartość
    rankingListElement.innerHTML = '';
    
    if (rankingData.length === 0) {
        rankingListElement.innerHTML = '<p class="no-data">Brak danych do wyświetlenia.</p>';
        rankingListElement.style.display = 'block';
        return;
    }
    
    // Utwórz elementy rankingu
    rankingData.forEach((user, index) => {
        const rank = index + 1;
        const isFirstPlace = rank === 1;
        const isCurrentUser = currentUser && user.id === currentUser.id;
        
        const rankingItem = document.createElement('div');
        rankingItem.className = `ranking-item ${isCurrentUser ? 'current-user' : ''}`;
        
        // Medale dla pierwszych trzech miejsc
        let rankBadge = '';
        if (rank === 1) {
            rankBadge = '<span class="rank-badge gold">🥇</span>';
        } else if (rank === 2) {
            rankBadge = '<span class="rank-badge silver">🥈</span>';
        } else if (rank === 3) {
            rankBadge = '<span class="rank-badge bronze">🥉</span>';
        } else {
            rankBadge = `<span class="rank-number">${rank}</span>`;
        }
        
        rankingItem.innerHTML = `
            <div class="ranking-item-content">
                <span class="rank-display">${rankBadge}</span>
                <span class="user-name-wrapper">
                    ${isFirstPlace ? '<div class="crown">👑</div>' : ''}
                    <span class="user-name">
                        ${isCurrentUser ? '<span class="you-badge">TY</span>' : ''}
                        ${user.display_name || 'Użytkownik'}
                    </span>
                </span>
                <span class="points">${user.completed_tasks}</span>
            </div>
        `;
        
        rankingListElement.appendChild(rankingItem);
    });
    
    // Pokaż ranking
    rankingListElement.style.display = 'block';
}

// Wyświetlanie błędu
function showError(message) {
    const loadingElement = document.getElementById('loading');
    const rankingListElement = document.getElementById('ranking-list');
    const errorElement = document.getElementById('error-message');
    
    loadingElement.style.display = 'none';
    rankingListElement.style.display = 'none';
    errorElement.style.display = 'block';
    errorElement.querySelector('p').textContent = message;
}

// Funkcja powiadomień
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

