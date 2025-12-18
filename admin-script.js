// =========================================================
// ZABEZPIECZENIE PRZED WIELOKROTNYM ŁADOWANIEM
// =========================================================
// Opakuj cały kod w IIFE, aby uniknąć konfliktów przy wielokrotnym ładowaniu
(function() {
    'use strict';
    
    if (window.ADMIN_SCRIPT_LOADED) {
        console.warn('⚠️ admin-script.js jest już załadowany! Pomijam ponowną inicjalizację.');
        // Jeśli skrypt jest już załadowany, upewnij się, że event listenery są skonfigurowane
        if (typeof window.setupEventListeners === 'function' && !window.ADMIN_EVENT_LISTENERS_SETUP) {
            console.log('🔍 Konfiguruję event listenery po ponownym ładowaniu...');
            window.setupEventListeners();
        }
        return; // Zatrzymaj wykonanie tego skryptu
    }
    window.ADMIN_SCRIPT_LOADED = true;

// Konfiguracja Supabase - ładowana z config.js
if (!window.SUPABASE_CONFIG) {
    console.error('⚠️ BŁĄD: Plik config.js nie jest załadowany!');
    console.error('⚠️ Sprawdź kolejność ładowania skryptów w admin.html');
}

// Użyj window.SUPABASE_CONFIG bezpośrednio zamiast const (aby uniknąć błędów przy wielokrotnym ładowaniu)
const SUPABASE_URL = window.SUPABASE_CONFIG?.URL;
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠️ BŁĄD: Konfiguracja Supabase nie jest ustawiona!');
    console.error('⚠️ SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
    alert('⚠️ BŁĄD KONFIGURACJI:\n\nSkopiuj config.example.js jako config.js i wypełnij swoimi danymi z Supabase Dashboard.');
}

// Inicjalizacja klienta Supabase - tylko jeśli jeszcze nie istnieje
let supabase;
if (window.adminSupabaseClient) {
    // Użyj istniejącego klienta
    supabase = window.adminSupabaseClient;
    console.log('✅ Używam istniejącego klienta Supabase');
} else {
    try {
        // Sprawdź różne sposoby dostępu do biblioteki Supabase
        if (typeof window.supabaseLib !== 'undefined' && window.supabaseLib.createClient) {
            supabase = window.supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error('❌ Supabase library nie jest załadowana!');
            console.error('❌ window.supabaseLib:', typeof window.supabaseLib);
            console.error('❌ window.supabase:', typeof window.supabase);
            throw new Error('Supabase library not loaded');
        }
        // Zapisz klienta w window, aby uniknąć wielokrotnej inicjalizacji
        window.adminSupabaseClient = supabase;
        // Eksportuj supabase do window, aby funkcje globalne (jak showAdminPhotoModal) miały dostęp
        window.supabase = supabase;
        console.log('✅ Supabase zainicjalizowany pomyślnie');
    } catch (error) {
        console.error('❌ Błąd inicjalizacji Supabase:', error);
        console.error('❌ Stack trace:', error.stack);
    }
}

let currentUser = null;
let currentUserProfile = null; // Profil zalogowanego użytkownika (admin)
let allUsers = [];
let allTaskTemplates = [];
let allCalendarDays = [];

// Sprawdź autoryzację i załaduj dane
document.addEventListener('DOMContentLoaded', async function() {
    // Kod generowania płatków śniegu
    const snowContainer = document.querySelector(".snow-container");
    
    if (snowContainer) {
        const particlesPerThousandPixels = 0.1;
        const fallSpeed = 1.25;
        const pauseWhenNotActive = true;
        const maxSnowflakes = 200;
        const snowflakes = [];
        
        let snowflakeInterval;
        let isTabActive = true;
        
        function resetSnowflake(snowflake) {
            const size = Math.random() * 5 + 1;
            const viewportWidth = window.innerWidth - size;
            const viewportHeight = window.innerHeight;
            
            snowflake.style.width = `${size}px`;
            snowflake.style.height = `${size}px`;
            snowflake.style.left = `${Math.random() * viewportWidth}px`;
            snowflake.style.top = `-${size}px`;
            
            const animationDuration = (Math.random() * 3 + 2) / fallSpeed;
            snowflake.style.animationDuration = `${animationDuration}s`;
            snowflake.style.animationTimingFunction = "linear";
            snowflake.style.animationName = Math.random() < 0.5 ? "fall" : "diagonal-fall";
            
            setTimeout(() => {
                if (parseInt(snowflake.style.top, 10) < viewportHeight) {
                    resetSnowflake(snowflake);
                } else {
                    snowflake.remove();
                }
            }, animationDuration * 1000);
        }
        
        function createSnowflake() {
            if (snowflakes.length < maxSnowflakes) {
                const snowflake = document.createElement("div");
                snowflake.classList.add("snowflake");
                snowflakes.push(snowflake);
                snowContainer.appendChild(snowflake);
                resetSnowflake(snowflake);
            }
        }
        
        function generateSnowflakes() {
            const numberOfParticles = Math.ceil((window.innerWidth * window.innerHeight) / 1000) * particlesPerThousandPixels;
            const interval = 5000 / numberOfParticles;
            
            clearInterval(snowflakeInterval);
            snowflakeInterval = setInterval(() => {
                if (isTabActive && snowflakes.length < maxSnowflakes) {
                    requestAnimationFrame(createSnowflake);
                }
            }, interval);
        }
        
        function handleVisibilityChange() {
            if (!pauseWhenNotActive) return;
            
            isTabActive = !document.hidden;
            if (isTabActive) {
                generateSnowflakes();
            } else {
                clearInterval(snowflakeInterval);
            }
        }
        
        generateSnowflakes();
        
        window.addEventListener("resize", () => {
            clearInterval(snowflakeInterval);
            setTimeout(generateSnowflakes, 1000);
        });
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    
    console.log('🔍 Admin panel - sprawdzanie autoryzacji...');
    
    // Zabezpieczenie przed pętlą przekierowań
    const redirectFlag = sessionStorage.getItem('redirecting');
    if (redirectFlag === 'true') {
        sessionStorage.removeItem('redirecting');
        console.log('✅ Flaga przekierowania usunięta');
    }
    
    // Poczekaj chwilę na załadowanie Supabase
    if (!supabase) {
        console.error('❌ Supabase nie jest zainicjalizowany - czekam 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!supabase) {
            console.error('❌ Supabase nadal nie jest zainicjalizowany');
            alert('Błąd: Supabase nie jest załadowany. Odśwież stronę.');
            window.location.href = 'login.html';
            return;
        }
    }
    
    console.log('✅ Supabase zainicjalizowany');
    
    // Sprawdź czy użytkownik jest zalogowany
    console.log('🔍 Sprawdzanie sesji...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
        console.error('❌ Błąd sprawdzania sesji:', sessionError);
        alert('Błąd sprawdzania sesji: ' + sessionError.message);
        window.location.href = 'login.html';
        return;
    }
    
    if (!session || !session.user) {
        console.log('❌ Brak sesji - przekierowanie do logowania');
        alert('Musisz się zalogować, aby uzyskać dostęp do panelu admina.');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('✅ Sesja znaleziona, użytkownik:', session.user.email);
    currentUser = session.user;
    
    // Sprawdź czy użytkownik jest adminem
    console.log('🔍 Sprawdzanie roli użytkownika...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (profileError) {
        console.error('❌ Błąd pobierania profilu:', profileError);
        alert('Błąd pobierania profilu: ' + profileError.message);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    if (!profile) {
        console.log('❌ Profil nie istnieje');
        alert('Profil użytkownika nie istnieje. Skontaktuj się z administratorem.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    console.log('✅ Profil znaleziony:', profile);
    console.log('🔍 Rola użytkownika:', profile.role);
    
    // ZAPISZ profil zalogowanego użytkownika (admin) - ważne!
    currentUserProfile = profile;
    
    // Sprawdź rolę (case-insensitive dla bezpieczeństwa)
    const userRole = profile.role?.toString().trim().toLowerCase();
    const isAdmin = userRole === 'admin';
    
    console.log('🔍 Rola użytkownika:', profile.role);
    console.log('🔍 Typ roli:', typeof profile.role);
    console.log('🔍 Porównanie z "admin":', profile.role === 'admin');
    console.log('🔍 Porównanie (case-insensitive):', userRole === 'admin');
    console.log('🔍 Czy jest adminem:', isAdmin);
    
    if (!isAdmin) {
        console.log('❌ Użytkownik nie jest adminem, rola:', profile.role);
        alert('Brak uprawnień administratora. Twoja rola: "' + profile.role + '"\n\nSkontaktuj się z administratorem, aby uzyskać dostęp.');
        sessionStorage.setItem('redirecting', 'true');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    console.log('✅ Użytkownik jest adminem, ładuję panel...');
    
    // Załaduj wszystkie dane
    try {
        await loadAllData();
        await ensureAllDaysExist(); // Automatycznie dodaj wszystkie dni jeśli brakuje
        
        // Upewnij się, że sekcja weryfikacji jest widoczna na starcie
        const verificationSection = document.getElementById('section-verification');
        if (verificationSection) {
            verificationSection.style.display = 'block';
            console.log('✅ Sekcja weryfikacji ustawiona jako widoczna');
        }
        
        // Ukryj wszystkie inne sekcje
        document.querySelectorAll('.admin-section').forEach(section => {
            if (section.id !== 'section-verification') {
                section.style.display = 'none';
            }
        });
        
        setupEventListeners();
        console.log('✅ Panel admina załadowany pomyślnie');
        
        // Załaduj zadania do weryfikacji po załadowaniu
        setTimeout(async () => {
            console.log('🔍 Ładuję zadania do weryfikacji po inicjalizacji...');
            await loadVerificationTasks();
        }, 200);
    } catch (error) {
        console.error('❌ Błąd ładowania panelu:', error);
        console.error('❌ Stack trace:', error.stack);
        alert('Błąd ładowania panelu admina: ' + error.message);
    }
});

// Upewnij się, że wszystkie dni (1-24) istnieją w bazie
async function ensureAllDaysExist() {
    try {
        console.log('🔍 Sprawdzanie czy wszystkie dni istnieją w bazie...');
        
        // Pobierz istniejące dni
        const { data: existingDays, error: fetchError } = await supabase
            .from('calendar_days')
            .select('day_number');
        
        if (fetchError) {
            console.error('Błąd pobierania dni:', fetchError);
            return;
        }
        
        const existingDayNumbers = new Set((existingDays || []).map(d => d.day_number));
        const allDayNumbers = Array.from({ length: 24 }, (_, i) => i + 1);
        const missingDays = allDayNumbers.filter(day => !existingDayNumbers.has(day));
        
        if (missingDays.length === 0) {
            console.log('✅ Wszystkie dni już istnieją w bazie');
            return;
        }
        
        console.log(`📅 Brakuje ${missingDays.length} dni:`, missingDays);
        
        // Dodaj brakujące dni
        const daysToInsert = missingDays.map(dayNumber => ({
            day_number: dayNumber,
            is_active: true
        }));
        
        const { error: insertError } = await supabase
            .from('calendar_days')
            .insert(daysToInsert);
        
        if (insertError) {
            console.error('Błąd dodawania dni:', insertError);
            showNotification('Błąd automatycznego dodawania dni: ' + insertError.message, 'error');
            return;
        }
        
        console.log(`✅ Dodano ${missingDays.length} brakujących dni do bazy`);
        showNotification(`Automatycznie dodano ${missingDays.length} dni do kalendarza`, 'success');
        
        // Odśwież listę dni
        await loadAllData();
        
    } catch (error) {
        console.error('Błąd w ensureAllDaysExist:', error);
    }
}

// Załaduj wszystkie dane potrzebne w panelu
async function loadAllData() {
    try {
        // Załaduj użytkowników - SPRAWDŹ RLS!
        console.log('🔍 Ładowanie użytkowników z profiles...');
        console.log('🔍 Aktualna sesja:', currentUser?.id, currentUser?.email);
        
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, display_name, role, created_at')
            .order('created_at', { ascending: false });
        
        if (usersError) {
            console.error('❌ Błąd ładowania użytkowników:', usersError);
            console.error('❌ Szczegóły błędu:', {
                message: usersError.message,
                code: usersError.code,
                details: usersError.details,
                hint: usersError.hint
            });
            
            // Jeśli błąd RLS, pokaż szczegółową informacjęz
            if (usersError.code === 'PGRST116' || usersError.message?.includes('row-level security')) {
                showNotification('Błąd RLS: Admin nie może zobaczyć wszystkich użytkowników. Uruchom skrypt napraw-rls-admin.sql w Supabase.', 'error');
            }
            
            throw usersError;
        }
        
        console.log('✅ Załadowano użytkowników:', users?.length || 0);
        console.log('📋 Lista użytkowników:', users);
        
        if (users && users.length > 0) {
            console.log('📋 Pierwszy użytkownik:', users[0]);
            console.log('📋 Ostatni użytkownik:', users[users.length - 1]);
        }
        
        allUsers = users || [];
        
        // Załaduj dni kalendarza
        const { data: days, error: daysError } = await supabase
            .from('calendar_days')
            .select('*')
            .order('day_number', { ascending: true });
        
        if (daysError) {
            console.error('Błąd ładowania dni kalendarza:', daysError);
            showNotification('Błąd ładowania dni kalendarza: ' + daysError.message, 'error');
            allCalendarDays = [];
        } else {
            allCalendarDays = days || [];
            console.log('✅ Załadowano dni kalendarza:', allCalendarDays.length);
        }
        
        // Załaduj szablony zadań
        const { data: templates, error: templatesError } = await supabase
            .from('task_templates')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (templatesError) throw templatesError;
        allTaskTemplates = templates || [];
        
        // Wyświetl dane
        displayUsers();
        displayCalendarDays();
        displayTaskTemplates();
        // Załaduj zadania do weryfikacji tylko jeśli sekcja jest widoczna
        // loadVerificationTasks() sprawdzi czy kontener istnieje i nie pokaże błędów
        loadVerificationTasks();
        
        // Wyświetl tabelę zadań (z opóźnieniem, aby upewnić się, że HTML jest gotowy)
        setTimeout(async () => {
            await displayTasksTable();
        }, 100);
        
    } catch (error) {
        console.error('Błąd ładowania danych:', error);
        showNotification('Błąd ładowania danych', 'error');
    }
}

// Wyświetl listę użytkowników
function displayUsers() {
    const usersList = document.getElementById('users-list');
    
    if (allUsers.length === 0) {
        usersList.innerHTML = '<p>Brak użytkowników</p>';
        return;
    }
    
    usersList.innerHTML = `
        <div class="users-grid">
            ${allUsers.map(user => `
                <div class="user-card" data-user-id="${user.id}">
                    <div class="user-info">
                        <div class="user-name-section">
                            <input type="text" 
                                   class="user-name-input" 
                                   value="${user.display_name || ''}" 
                                   placeholder="Imię użytkownika"
                                   data-user-id="${user.id}"
                                   data-original-value="${user.display_name || ''}">
                            <button class="btn-icon save-name-btn" 
                                    onclick="saveUserName('${user.id}')" 
                                    title="Zapisz imię"
                                    style="display: none;">
                                ✓
                            </button>
                        </div>
                        <p class="user-email">${user.email}</p>
                        <span class="role-badge ${user.role}">${user.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Dodaj event listenery dla automatycznego zapisywania przy zmianie
    document.querySelectorAll('.user-name-input').forEach(input => {
        input.addEventListener('input', function() {
            const saveBtn = this.parentElement.querySelector('.save-name-btn');
            const originalValue = this.dataset.originalValue || '';
            if (this.value.trim() !== originalValue.trim()) {
                saveBtn.style.display = 'inline-flex';
            } else {
                saveBtn.style.display = 'none';
            }
        });
        
        input.addEventListener('blur', function() {
            // Opcjonalnie: auto-zapisz przy straceniu fokusa
            const saveBtn = this.parentElement.querySelector('.save-name-btn');
            if (saveBtn.style.display !== 'none') {
                const userId = this.dataset.userId;
                saveUserName(userId);
            }
        });
    });
}

// Wypełnij formularz przypisywania zadań
function populateAssignForm() {
    const userSelect = document.getElementById('assign-user');
    const taskSelect = document.getElementById('assign-task');
    
    // Wypełnij użytkowników
    userSelect.innerHTML = '<option value="">Wybierz użytkownika...</option>';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.display_name || user.email} (${user.role})`;
        userSelect.appendChild(option);
    });
    
    // Wypełnij szablony zadań
    taskSelect.innerHTML = '<option value="">Wybierz zadanie...</option>';
    allTaskTemplates.forEach(template => {
        const day = allCalendarDays.find(d => d.id === template.calendar_day_id);
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = `${template.title} (Dzień ${day ? day.day_number : '?'}, ${template.task_type})`;
        option.dataset.dayId = template.calendar_day_id;
        taskSelect.appendChild(option);
    });
}

// Mapowanie dni do państw (kopiowane z script.js dla użycia w panelu admina)
// W produkcji można to załadować z zewnętrznego pliku
const dayToCountryMap = {
    1: { country: "Niemcy", funFact: "🎅 W Niemczech tradycja jarmarków bożonarodzeniowych sięga średniowiecza! Słynne są pierniki norymberskie." },
    2: { country: "Finlandia", funFact: "🎅 W Finlandii Święty Mikołaj mieszka w Rovaniemi na kole podbiegunowym! Można go odwiedzić przez cały rok w Wiosce Świętego Mikołaja." },
    3: { country: "Wielka Brytania", funFact: "🎄 Tradycja choinek bożonarodzeniowych przyszła do UK z Niemiec dzięki księciu Albertowi w czasach królowej Wiktorii!" },
    4: { country: "Meksyk", funFact: "🌟 W Meksyku tradycją są Las Posadas - 9-dniowe procesje i imprezy upamiętniające wędrówkę Marii i Józefa do Betlejem." },
    5: { country: "Wenezuela", funFact: "⛸️ W Caracas w Wenezueli tradycją jest chodzenie na rolkach do kościoła na poranną mszę w Wigilię! Ulice są zamykane dla samochodów, tworząc wyjątkową świąteczną atmosferę." },
    6: { country: "Irlandia", funFact: "🍀 W Irlandii tradycją jest stawianie świecy w oknie w Wigilię, aby wskazać drogę Maryi i Józefowi. To symbol gościnności i nadziei!" },
    7: { country: "Kolumbia", funFact: "🕯️ W Kolumbii Día de las Velitas (Dzień Świeczek) 7 grudnia rozpoczyna sezon świąteczny - miasta świecą tysiącami świec!" },
    8: { country: "Włochy", funFact: "🍝 We Włoszech tradycją jest jedzenie ryb w Wigilię! Włosi przygotowują La Vigilia - wielodaniową kolację z owocami morza, ale bez mięsa." },
    9: { country: "Kanada", funFact: "🎅 Kanada ma oficjalny kod pocztowy dla Świętego Mikołaja: H0H 0H0! Dzieci mogą wysyłać tam listy i otrzymują odpowiedź." },
    10: { country: "Filipiny", funFact: "🎂 Na Filipinach Boże Narodzenie to prawdziwa fiesta! Jest muzyka, jedzenie, dekoracje i dużo prezentów, jak na wielkich urodzinach. Ludzie często mówią, że to \"urodziny Jezusa\", więc organizują przyjęcie z ciastem i świeczkami – dosłownie tort dla Jezusa!" },
    11: { country: "Brazylia", funFact: "🎅 W Brazylii Święty Mikołaj nazywa się Papai Noel i często nosi lekkie, letnie ubrania zamiast grubego futra!" },
    12: { country: "Czechy", funFact: "🎄 W Czechach tradycją jest wróżenie z jabłek w Wigilię! Po przekrojeniu jabłka na pół, jeśli pestki tworzą gwiazdę, oznacza to szczęście w nadchodzącym roku." },
    13: { country: "Norwegia", funFact: "🎁 W Norwegii tradycją jest ukrywanie miotełek w Wigilię! W przeszłości wierzono, że czarownice i złe duchy używają miotełek do latania, więc chowano je, aby chronić dom." },
    14: { country: "Jamajka", funFact: "🎵 Na Jamajce Boże Narodzenie to czas muzyki reggae i festiwali! Tradycją jest śpiewanie kolęd w stylu jamajskim i jedzenie tradycyjnego owocowego ciasta." },
    15: { country: "Islandia", funFact: "📚 W Islandii tradycją jest dawanie książek jako prezentów w Wigilię! To tzw. \"Jólabókaflóð\" (Świąteczny Potop Książek) - ludzie czytają nowe książki przy czekoladzie przez całą noc." },
    16: { country: "Grecja", funFact: "⛪ W Grecji Boże Narodzenie obchodzone jest 25 grudnia, ale główne świętowanie to 6 stycznia - Święto Trzech Króli! Tradycją jest pływanie po krzyż wrzucony do wody przez kapłana." },
    17: { country: "RPA", funFact: "🌞 W RPA Boże Narodzenie to letnia impreza! Ludzie świętują grillując na świeżym powietrzu i pływając w oceanie." },
    18: { country: "Japonia", funFact: "🍗 W Japonii tradycją jest jedzenie KFC na Boże Narodzenie! Trzeba rezerwować kurczaka z tygodniowym wyprzedzeniem." },
    19: { country: "Polska", funFact: "🍽️ W Polsce tradycją jest 12 potraw na wigilijnym stole, symbolizujących 12 apostołów! Jedną z najważniejszych jest karp, a pod obrusem kładzie się sianko na pamiątkę żłóbka." },
    20: { country: "Peru", funFact: "🌟 W Peru tradycją jest budowanie elaborate szopek (nacimientos) z lokalnych materiałów i figurek z ceramiki z Ayacucho!" },
    21: { country: "Rosja", funFact: "❄️ W Rosji Nowy Rok jest ważniejszy niż Boże Narodzenie! Dziadek Mróz (Ded Moroz) przynosi prezenty 31 grudnia." },
    22: { country: "Hiszpania", funFact: "👑 W Hiszpanii główne prezenty przychodzą 6 stycznia od Trzech Króli! Dzieci zostawiają im buty wypełnione słomą dla wielbłądów." },
    23: { country: "Argentyna", funFact: "🎆 W Argentynie o północy 24 grudnia eksplodują fajerwerki! To moment otwarcia prezentów i rozpoczęcia świętowania." },
    24: { country: "Urugwaj", funFact: "🎄 W Urugwaju Boże Narodzenie to czas rodzinnych spotkań na plaży i tradycyjnego asado (grilla) pod palmami zamiast choinkami!" }
};

// Lista dostępnych państw z mapowaniem do współrzędnych (po polsku)
const countriesList = [
    { name: "Polska", coordinates: [52.2297, 21.0122] },
    { name: "Niemcy", coordinates: [51.1657, 10.4515] },
    { name: "Finlandia", coordinates: [60.1699, 24.9384] },
    { name: "Francja", coordinates: [46.2276, 2.2137] },
    { name: "Irlandia", coordinates: [53.3498, -6.2603] },
    { name: "Włochy", coordinates: [41.9028, 12.4964] },
    { name: "Hiszpania", coordinates: [40.4637, -3.7492] },
    { name: "Wielka Brytania", coordinates: [55.3781, -3.4360] },
    { name: "Rosja", coordinates: [61.5240, 105.3188] },
    { name: "Chiny", coordinates: [35.8617, 104.1954] },
    { name: "Japonia", coordinates: [36.2048, 138.2529] },
    { name: "Australia", coordinates: [-25.2744, 133.7751] },
    { name: "Brazylia", coordinates: [-14.2350, -51.9253] },
    { name: "USA", coordinates: [39.8283, -98.5795] },
    { name: "Kanada", coordinates: [56.1304, -106.3468] },
    { name: "Meksyk", coordinates: [23.6345, -102.5528] },
    { name: "Indie", coordinates: [20.5937, 78.9629] },
    { name: "Egipt", coordinates: [26.0975, 30.0444] },
    { name: "RPA", coordinates: [-30.5595, 22.9375] },
    { name: "Argentyna", coordinates: [-38.4161, -63.6167] },
    { name: "Chile", coordinates: [-35.6751, -71.5430] },
    { name: "Peru", coordinates: [-9.1900, -75.0152] },
    { name: "Kolumbia", coordinates: [4.7110, -74.0721] },
    { name: "Wenezuela", coordinates: [6.4238, -66.5897] },
    { name: "Ekwador", coordinates: [-1.8312, -78.1834] },
    { name: "Urugwaj", coordinates: [-32.5228, -55.7658] }
];

// Funkcja pomocnicza do pobierania współrzędnych dla państwa
function getCoordinatesForCountry(countryName) {
    const country = countriesList.find(c => c.name === countryName);
    return country ? country.coordinates : null;
}

// Przełącz tryb edycji dla dnia
window.toggleEditMode = function(dayId) {
    const dayCard = document.querySelector(`.day-card[data-day-id="${dayId}"]`);
    if (!dayCard) return;
    
    const isEditMode = dayCard.dataset.editMode === 'true';
    const editBtn = dayCard.querySelector('.edit-day-btn');
    const countrySelect = dayCard.querySelector('.day-country-select');
    const customInput = dayCard.querySelector('.day-country-custom-input');
    const funFactInput = dayCard.querySelector('.day-funfact-input');
    const actionsDiv = dayCard.querySelector('.day-actions');
    
    if (!isEditMode) {
        // Włącz tryb edycji
        dayCard.dataset.editMode = 'true';
        // Państwo jest zawsze zablokowane - nie można go zmieniać
        // if (countrySelect) countrySelect.disabled = false;
        // if (customInput) customInput.disabled = false;
        if (funFactInput) funFactInput.disabled = false;
        if (actionsDiv) {
            actionsDiv.style.display = 'flex';
        }
        if (editBtn) {
            const svg = editBtn.querySelector('svg');
            if (svg) {
                svg.querySelectorAll('path').forEach(path => {
                    path.setAttribute('stroke', '#013927');
                });
            }
        }
        
        // Zmień style pól na aktywne (państwo pozostaje zablokowane)
        // if (countrySelect) {
        //     countrySelect.style.background = 'white';
        //     countrySelect.style.cursor = 'pointer';
        // }
        // if (customInput) {
        //     customInput.style.background = 'white';
        //     customInput.style.cursor = 'text';
        // }
        if (funFactInput) {
            funFactInput.style.background = 'white';
            funFactInput.style.cursor = 'text';
        }
    } else {
        // Wyłącz tryb edycji
        cancelEditDay(dayId);
    }
};

// Anuluj edycję i przywróć oryginalne wartości
window.cancelEditDay = function(dayId) {
    const dayCard = document.querySelector(`.day-card[data-day-id="${dayId}"]`);
    if (!dayCard) return;
    
    // Znajdź oryginalne dane z bazy
    const day = allCalendarDays.find(d => d.id == dayId);
    if (!day) return;
    
    // Państwo jest zawsze w kodzie (dayToCountryMap), nie w bazie danych
    const country = dayToCountryMap[day.day_number]?.country || 'Brak państwa';
    const funFact = day.fun_fact || dayToCountryMap[day.day_number]?.funFact || 'Brak ciekawostki';
    const isCustomCountry = !countriesList.find(c => c.name === country) && country;
    
    const editBtn = dayCard.querySelector('.edit-day-btn');
    const countrySelect = dayCard.querySelector('.day-country-select');
    const customInput = dayCard.querySelector('.day-country-custom-input');
    const funFactInput = dayCard.querySelector('.day-funfact-input');
    const actionsDiv = dayCard.querySelector('.day-actions');
    
    // Przywróć oryginalne wartości
    if (countrySelect) {
        if (isCustomCountry) {
            countrySelect.value = '__OTHER__';
        } else {
            countrySelect.value = country;
        }
        countrySelect.disabled = true;
        countrySelect.style.background = '#f5f5f7';
        countrySelect.style.cursor = 'not-allowed';
    }
    
    if (customInput) {
        customInput.value = isCustomCountry ? country : '';
        customInput.disabled = true;
        customInput.style.background = '#f5f5f7';
        customInput.style.cursor = 'not-allowed';
        customInput.style.display = isCustomCountry ? 'block' : 'none';
    }
    
    if (funFactInput) {
        funFactInput.value = funFact;
        funFactInput.disabled = true;
        funFactInput.style.background = '#f5f5f7';
        funFactInput.style.cursor = 'not-allowed';
    }
    
    // Ukryj przyciski akcji
    if (actionsDiv) actionsDiv.style.display = 'none';
    
    // Wyłącz tryb edycji
    dayCard.dataset.editMode = 'false';
    if (editBtn) {
        const svg = editBtn.querySelector('svg');
        if (svg) {
            svg.querySelectorAll('path').forEach(path => {
                path.setAttribute('stroke', '#013927');
            });
        }
    }
    
    // Ukryj hint jeśli nie jest niestandardowe państwo
    const hint = dayCard.querySelector('.country-custom-hint');
    if (hint) {
        hint.style.display = isCustomCountry ? 'block' : 'none';
    }
};

// Obsługa zmiany wyboru państwa - pokaż/ukryj pole tekstowe dla niestandardowego państwa
window.handleCountrySelectChange = function(selectElement) {
    const dayCard = selectElement.closest('.day-card');
    if (!dayCard) return;
    
    const customInput = dayCard.querySelector('.day-country-custom-input');
    const hint = dayCard.querySelector('.country-custom-hint');
    
    if (selectElement.value === '__OTHER__') {
        // Pokaż pole tekstowe dla niestandardowego państwa
        if (customInput) {
            customInput.style.display = 'block';
            customInput.focus();
        }
        if (hint) {
            hint.style.display = 'block';
        }
    } else {
        // Ukryj pole tekstowe
        if (customInput) {
            customInput.style.display = 'none';
            customInput.value = '';
        }
        if (hint) {
            hint.style.display = 'none';
        }
    }
};

// Wyświetl dni kalendarza
function displayCalendarDays() {
    const daysList = document.getElementById('calendar-days-list');
    
    if (allCalendarDays.length === 0) {
        daysList.innerHTML = '<p>Brak dni w kalendarzu. Dodaj pierwszy dzień!</p>';
        return;
    }
    
    daysList.innerHTML = `
        <div class="calendar-days-grid">
            ${allCalendarDays.map(day => {
                // Pobierz państwo i ciekawostkę - najpierw z bazy, potem z mapowania
                const country = day.country || dayToCountryMap[day.day_number]?.country || 'Brak państwa';
                const funFact = day.fun_fact || dayToCountryMap[day.day_number]?.funFact || 'Brak ciekawostki';
                
                const isCustomCountry = !countriesList.find(c => c.name === country) && country;
                
                return `
                <div class="day-card" data-day-id="${day.id}" data-edit-mode="false">
                    <div class="day-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h4 style="margin: 0;">Dzień ${day.day_number}</h4>
                        <button class="edit-day-btn" onclick="toggleEditMode(${day.id})" title="Edytuj dzień" style="background: none; border: none; cursor: pointer; padding: 4px 8px; transition: all 0.2s; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="white" stroke="#013927" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="white" stroke="#013927" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    <div class="day-content">
                        <div class="day-field">
                            <label>Państwo:</label>
                            <select class="day-country-select" data-day-id="${day.id}" onchange="handleCountrySelectChange(this)" disabled style="width: 100%; padding: 8px 12px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 0.9375rem; min-height: 44px; background: #f5f5f7; cursor: not-allowed;">
                                <option value="">-- Wybierz państwo --</option>
                                ${countriesList.map(c => `
                                    <option value="${c.name}" ${c.name === country ? 'selected' : ''}>${c.name}</option>
                                `).join('')}
                                <option value="__OTHER__" ${isCustomCountry ? 'selected' : ''}>➕ Inne państwo...</option>
                            </select>
                            <input type="text" 
                                   class="day-country-custom-input" 
                                   data-day-id="${day.id}" 
                                   value="${isCustomCountry ? country : ''}" 
                                   placeholder="Wpisz nazwę państwa"
                                   disabled
                                   style="width: 100%; padding: 8px 12px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 0.9375rem; min-height: 44px; margin-top: 8px; display: ${isCustomCountry ? 'block' : 'none'}; background: #f5f5f7; cursor: not-allowed;">
                            <small style="display: ${isCustomCountry ? 'block' : 'none'}; color: #6e6e73; margin-top: 4px; font-size: 0.8125rem;" class="country-custom-hint">
                                💡 Dla niestandardowych państw współrzędne będą ustawione na domyślne. Możesz je później zaktualizować w bazie danych.
                            </small>
                        </div>
                        <div class="day-field">
                            <label>Ciekawostka:</label>
                            <textarea class="day-funfact-input" data-day-id="${day.id}" placeholder="Ciekawostka o państwie" disabled style="background: #f5f5f7; cursor: not-allowed;">${funFact}</textarea>
                        </div>
                        <div class="day-actions" style="display: none; margin-top: 12px; gap: 8px;">
                            <button class="btn btn-small btn-save" onclick="saveDayInfo(${day.id})" style="flex: 1; background: white; color: #013927; border: 2px solid #013927; padding: 10px 16px; border-radius: 8px; font-size: 0.9375rem; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                                Zapisz
                            </button>
                            <button class="btn btn-small btn-cancel" onclick="cancelEditDay(${day.id})" style="flex: 1; background: white; color: #d32f2f; border: 2px solid #d32f2f; padding: 10px 16px; border-radius: 8px; font-size: 0.9375rem; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('')}
        </div>
    `;
    
    // Dodaj hover effect dla przycisku edycji
    document.querySelectorAll('.edit-day-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            const dayCard = this.closest('.day-card');
            const isEditMode = dayCard.dataset.editMode === 'true';
            if (!isEditMode) {
                const svg = this.querySelector('svg');
                if (svg) {
                    svg.querySelectorAll('path').forEach(path => {
                        path.setAttribute('stroke', '#0d4d0d');
                    });
                }
            }
        });
        btn.addEventListener('mouseleave', function() {
            const dayCard = this.closest('.day-card');
            const isEditMode = dayCard.dataset.editMode === 'true';
            if (!isEditMode) {
                const svg = this.querySelector('svg');
                if (svg) {
                    svg.querySelectorAll('path').forEach(path => {
                        path.setAttribute('stroke', '#013927');
                    });
                }
            }
        });
    });
}

// Wyświetl szablony zadań
function displayTaskTemplates() {
    const templatesList = document.getElementById('templates-list');
    
    if (allTaskTemplates.length === 0) {
        templatesList.innerHTML = '<p>Brak szablonów zadań. Dodaj pierwszy szablon!</p>';
        return;
    }
    
    // Mapowanie typów zadań na polskie nazwy
    const taskTypeLabels = {
        'text_response': 'Bez weryfikacji',
        'text_response_verified': 'Odpowiedź tekstowa (z weryfikacją)',
        'quiz': 'Quiz',
        'photo_upload': 'Dodaj zdjęcie',
        'checkbox': 'Checkbox',
        'custom': 'Niestandardowe'
    };
    
    // Podziel szablony na dwie grupy: bez przypisania i z przypisaniem
    const unassignedTemplates = allTaskTemplates.filter(t => !t.calendar_day_id);
    const assignedTemplates = allTaskTemplates.filter(t => t.calendar_day_id);
    
    // Sortuj przypisane według numeru dnia
    const sortedAssignedTemplates = [...assignedTemplates].sort((a, b) => {
        const dayA = allCalendarDays.find(d => d.id === a.calendar_day_id);
        const dayB = allCalendarDays.find(d => d.id === b.calendar_day_id);
        const dayNumberA = dayA ? dayA.day_number : 999;
        const dayNumberB = dayB ? dayB.day_number : 999;
        return dayNumberA - dayNumberB;
    });
    
    // Funkcja renderująca pojedynczy szablon
    const renderTemplate = (template) => {
        const day = allCalendarDays.find(d => d.id === template.calendar_day_id);
        const dayNumber = day ? day.day_number : '—';
        const taskTypeLabel = taskTypeLabels[template.task_type] || template.task_type || 'Nieznany typ';
        const hasDay = !!day;
        
        return `
            <div class="template-card" onclick="editTemplate('${template.id}')" style="cursor: pointer; flex-direction: column; align-items: flex-start; padding: 16px; position: relative; overflow: visible;">
                <div style="position: absolute; top: -12px; right: -12px; width: 28px; height: 28px; border-radius: 50%; background: ${hasDay ? '#013927' : '#6e6e73'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    ${dayNumber}
                </div>
                <h4 style="margin: 0 0 8px 0; font-size: 1rem; font-weight: 600; line-height: 1.3; word-wrap: break-word; width: 100%; text-align: center; padding-top: 8px;">${template.title || 'Bez nazwy'}</h4>
                <div style="font-size: 0.8125rem; color: #6e6e73; text-align: center; width: 100%;">
                    ${taskTypeLabel}
                </div>
            </div>
        `;
    };
    
    // Zbuduj HTML z dwoma sekcjami
    let html = '';
    
    // Sekcja zadań nieprzypisanych
    if (unassignedTemplates.length > 0) {
        html += `
            <div class="templates-grid">
                ${unassignedTemplates.map(renderTemplate).join('')}
            </div>
        `;
    }
    
    // Separator (kreska) jeśli są obie grupy
    if (unassignedTemplates.length > 0 && sortedAssignedTemplates.length > 0) {
        html += `
            <div style="margin: 32px 0; border-top: 2px solid #e8e8ed;"></div>
        `;
    }
    
    // Sekcja zadań przypisanych
    if (sortedAssignedTemplates.length > 0) {
        html += `
            <div class="templates-grid">
                ${sortedAssignedTemplates.map(renderTemplate).join('')}
            </div>
        `;
    }
    
    templatesList.innerHTML = html;
}

// Usuń dzień kalendarza (dostępne globalnie)
// Zapisz imię użytkownika
window.saveUserName = async function(userId) {
    const userCard = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    if (!userCard) return;
    
    const nameInput = userCard.querySelector('.user-name-input');
    const saveBtn = userCard.querySelector('.save-name-btn');
    
    if (!nameInput) return;
    
    const displayName = nameInput.value.trim();
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ display_name: displayName || null })
            .eq('id', userId);
        
        if (error) throw error;
        
        // Aktualizuj lokalne dane
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            user.display_name = displayName || null;
        }
        
        // Ukryj przycisk zapisu
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        // Zaktualizuj oryginalną wartość
        nameInput.dataset.originalValue = displayName;
        
        showNotification('Imię użytkownika zostało zapisane', 'success');
        
    } catch (error) {
        console.error('Błąd zapisywania imienia:', error);
        showNotification('Błąd zapisywania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// Zapisz informacje o dniu (tylko ciekawostka - państwo jest w kodzie i nie można go zmieniać)
window.saveDayInfo = async function(dayId) {
    const dayCard = document.querySelector(`.day-card[data-day-id="${dayId}"]`);
    if (!dayCard) return;
    
    const funFactInput = dayCard.querySelector('.day-funfact-input');
    const countrySelect = dayCard.querySelector('.day-country-select');
    const customInput = dayCard.querySelector('.day-country-custom-input');
    
    // Pobierz wartość i usuń białe znaki - jeśli jest pusty string, zapisz jako null
    const funFactValue = funFactInput?.value?.trim();
    const funFact = (funFactValue && funFactValue.length > 0) ? funFactValue : null;
    
    // Pobierz państwo - z selecta lub z custom inputa
    let country = null;
    if (countrySelect && countrySelect.value) {
        if (countrySelect.value === '__OTHER__' && customInput && customInput.value) {
            country = customInput.value.trim();
        } else if (countrySelect.value !== '__OTHER__') {
            country = countrySelect.value;
        }
    }
    
    console.log('💾 saveDayInfo - zapisuję dla dnia:', dayId);
    console.log('💾 Państwo:', country);
    console.log('💾 Ciekawostka:', funFact);
    
    try {
        // Zapisz fun_fact i country
        const updateData = {
            fun_fact: funFact
        };
        
        // Dodaj country tylko jeśli zostało wybrane
        if (country && country.length > 0) {
            updateData.country = country;
        }
        
        const { error } = await supabase
            .from('calendar_days')
            .update(updateData)
            .eq('id', dayId);
        
        if (error) throw error;
        
        showNotification('Ciekawostka została zapisana', 'success');
        
        // Wyłącz tryb edycji po zapisaniu
        const dayCard = document.querySelector(`.day-card[data-day-id="${dayId}"]`);
        if (dayCard) {
            dayCard.dataset.editMode = 'false';
            const countrySelect = dayCard.querySelector('.day-country-select');
            const customInput = dayCard.querySelector('.day-country-custom-input');
            const funFactInput = dayCard.querySelector('.day-funfact-input');
            const actionsDiv = dayCard.querySelector('.day-actions');
            const editBtn = dayCard.querySelector('.edit-day-btn');
            
            if (countrySelect) {
                countrySelect.disabled = true;
                countrySelect.style.background = '#f5f5f7';
                countrySelect.style.cursor = 'not-allowed';
            }
            if (customInput) {
                customInput.disabled = true;
                customInput.style.background = '#f5f5f7';
                customInput.style.cursor = 'not-allowed';
            }
            if (funFactInput) {
                funFactInput.disabled = true;
                funFactInput.style.background = '#f5f5f7';
                funFactInput.style.cursor = 'not-allowed';
            }
            if (actionsDiv) actionsDiv.style.display = 'none';
            if (editBtn) editBtn.style.color = '#6e6e73';
        }
        
        await loadAllData();
        
    } catch (error) {
        console.error('Błąd zapisywania dnia:', error);
        showNotification('Błąd zapisywania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// Edytuj szablon zadania - otwiera modal edycji (dostępne globalnie)
window.editTemplate = function(templateId) {
    const template = allTaskTemplates.find(t => t.id === templateId);
    if (!template) {
        showNotification('Nie znaleziono szablonu', 'error');
        return;
    }
    
    // Ustaw tryb edycji
    document.getElementById('template-modal-title').textContent = 'Edytuj szablon zadania';
    document.getElementById('template-submit-btn').textContent = 'Zapisz zmiany';
    document.getElementById('template-id').value = template.id;
    
    // Pokaż przycisk usuwania w trybie edycji
    const deleteBtn = document.getElementById('delete-template-btn');
    if (deleteBtn) {
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteTemplate(template.id);
        };
    }
    
    // Wypełnij select z dniami (ważne: musimy wypełnić opcje przed ustawieniem wartości)
    const daySelect = document.getElementById('template-day');
    daySelect.innerHTML = '<option value="">Bez przypisania dnia</option>';
    allCalendarDays.forEach(day => {
        const option = document.createElement('option');
        option.value = day.id;
        option.textContent = `Dzień ${day.day_number}`;
        daySelect.appendChild(option);
    });
    
    // Wypełnij formularz danymi szablonu
    document.getElementById('template-day').value = template.calendar_day_id || '';
    document.getElementById('template-title').value = template.title || '';
    document.getElementById('template-description').value = template.description || '';
    document.getElementById('template-type').value = template.task_type || 'text_response';
    
    // Obsłuż quiz (metadata)
    if (template.task_type === 'quiz' && template.metadata) {
        let metadata;
        try {
            metadata = typeof template.metadata === 'string' 
                ? JSON.parse(template.metadata) 
                : template.metadata;
        } catch (e) {
            console.error('Błąd parsowania metadata:', e);
            metadata = null;
        }
        
        if (metadata && metadata.quiz_type === 'user_quiz') {
            // Quiz o użytkownikach
            const targetUserId = metadata.target_user_id || '';
            document.getElementById('quiz-type-select').value = 'user_quiz';
            document.getElementById('quiz-passing-score').value = metadata.passing_score || 5;
            // Najpierw przełącz typ quizu (to odbuduje select użytkowników z zachowaniem wartości)
            toggleQuizType(targetUserId);
            // Załaduj pytania dla tego użytkownika
            if (targetUserId) {
                loadUserQuestionsForQuiz(targetUserId).then(() => {
                    // Zaznacz pytania które są w quizie
                    if (metadata.question_ids && Array.isArray(metadata.question_ids)) {
                        metadata.question_ids.forEach(qId => {
                            const checkbox = document.querySelector(`.quiz-question-checkbox[value="${qId}"]`);
                            if (checkbox) checkbox.checked = true;
                        });
                    }
                });
            }
        } else if (metadata && metadata.questions && Array.isArray(metadata.questions)) {
            // Klasyczny quiz
            document.getElementById('quiz-type-select').value = 'classic';
            toggleQuizType();
            loadQuizQuestions(metadata.questions);
        } else {
            // Domyślnie klasyczny quiz
            document.getElementById('quiz-type-select').value = 'classic';
            toggleQuizType();
            clearQuizQuestions();
        }
    } else {
        // Domyślnie klasyczny quiz
        if (document.getElementById('quiz-type-select')) {
            document.getElementById('quiz-type-select').value = 'classic';
        }
        clearQuizQuestions();
    }
    
    // Pokaż/ukryj sekcję quizu
    toggleQuizSection();
    
    // Otwórz modal
    document.getElementById('add-template-modal').style.display = 'block';
};

// Usuń szablon zadania (dostępne globalnie)
window.deleteTemplate = async function(templateId) {
    if (!templateId) {
        showNotification('Brak ID szablonu do usunięcia', 'error');
        return;
    }
    
    const template = allTaskTemplates.find(t => t.id === templateId);
    if (!template) {
        showNotification('Nie znaleziono szablonu', 'error');
        return;
    }
    
    const confirmMessage = `Czy na pewno chcesz usunąć szablon "${template.title || 'Bez nazwy'}"?\n\nTa operacja jest nieodwracalna.`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('task_templates')
            .delete()
            .eq('id', templateId);
        
        if (error) throw error;
        
        // Usuń z lokalnej tablicy
        allTaskTemplates = allTaskTemplates.filter(t => t.id !== templateId);
        
        // Odśwież wyświetlanie
        displayTaskTemplates();
        
        // Zamknij modal
        closeAddTemplateModal();
        
        showNotification('Szablon został usunięty', 'success');
        
    } catch (error) {
        console.error('Błąd usuwania szablonu:', error);
        showNotification('Błąd usuwania szablonu: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// Załaduj pytania quizowe do formularza
function loadQuizQuestions(questions) {
    const container = document.getElementById('quiz-questions-container');
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        addQuestionToForm(question, index);
    });
}

// Wyczyść pytania quizowe
function clearQuizQuestions() {
    document.getElementById('quiz-questions-container').innerHTML = '';
}

// Dodaj pytanie do formularza
function addQuestionToForm(question = null, index = null) {
    const container = document.getElementById('quiz-questions-container');
    const questionIndex = index !== null ? index : container.children.length;
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question-item';
    questionDiv.style.cssText = `
        margin-bottom: 24px;
        padding: 24px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #e8e8ed;
        transition: all 0.2s ease;
    `;
    
    questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e8e8ed;">
            <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: #1d1d1f; letter-spacing: -0.2px;">Pytanie ${questionIndex + 1}</h4>
            <button type="button" class="btn btn-small" onclick="removeQuestion(this)" style="background: transparent; color: #6e6e73; border: 1px solid #d2d2d7; padding: 6px 12px; font-size: 0.875rem; min-height: 32px;">
                Usuń
            </button>
        </div>
        
        <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #1d1d1f; margin-bottom: 8px;">Treść pytania</label>
            <input type="text" class="question-text" value="${question?.question || ''}" placeholder="Np. Ile dni ma adwent?" required style="width: 100%; padding: 12px 16px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 0.9375rem; transition: all 0.2s ease; min-height: 44px;">
        </div>
        
        <div class="form-group" style="margin-bottom: 20px;">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #1d1d1f; margin-bottom: 8px;">Opcje odpowiedzi</label>
            <div style="color: #6e6e73; font-size: 0.8125rem; margin-bottom: 8px;">Jedna linia = jedna opcja</div>
            <textarea class="question-options" rows="4" placeholder="Opcja 1&#10;Opcja 2&#10;Opcja 3&#10;Opcja 4" required style="width: 100%; padding: 12px 16px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 0.9375rem; font-family: inherit; line-height: 1.5; resize: vertical; transition: all 0.2s ease; min-height: 100px;">${question?.options ? question.options.join('\n') : ''}</textarea>
        </div>
        
        <div class="form-group">
            <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #1d1d1f; margin-bottom: 8px;">Poprawna odpowiedź</label>
            <div style="display: flex; align-items: center; gap: 12px;">
                <input type="number" class="question-correct" value="${question?.correct_answer !== undefined && question.correct_answer !== null ? (question.correct_answer + 1) : ''}" min="1" required style="width: 80px; padding: 12px 16px; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 0.9375rem; text-align: center; transition: all 0.2s ease; min-height: 44px;">
                <span style="color: #6e6e73; font-size: 0.8125rem;">Wpisz numer opcji (1, 2, 3...)</span>
            </div>
        </div>
    `;
    
    // Dodaj hover effect
    questionDiv.addEventListener('mouseenter', function() {
        this.style.borderColor = '#013927';
        this.style.boxShadow = '0 2px 8px rgba(26, 93, 26, 0.08)';
    });
    
    questionDiv.addEventListener('mouseleave', function() {
        this.style.borderColor = '#e8e8ed';
        this.style.boxShadow = 'none';
    });
    
    // Dodaj focus states dla inputów
    const inputs = questionDiv.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#013927';
            this.style.boxShadow = '0 0 0 3px rgba(26, 93, 26, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '#d2d2d7';
            this.style.boxShadow = 'none';
        });
    });
    
    container.appendChild(questionDiv);
}

// Usuń pytanie (dostępne globalnie dla onclick)
window.removeQuestion = function(button) {
    if (confirm('Czy na pewno chcesz usunąć to pytanie?')) {
        button.closest('.quiz-question-item').remove();
        // Renumeruj pytania
        const questions = document.querySelectorAll('.quiz-question-item');
        questions.forEach((q, index) => {
            q.querySelector('h4').textContent = `Pytanie ${index + 1}`;
        });
    }
};

// Pokaż/ukryj sekcję quizu w zależności od typu zadania
function toggleQuizSection() {
    const taskType = document.getElementById('template-type').value;
    const quizSection = document.getElementById('quiz-section');
    
    if (taskType === 'quiz') {
        quizSection.style.display = 'block';
        // Załaduj użytkowników do selecta quizu o użytkownikach
        loadUsersForQuiz();
    } else {
        quizSection.style.display = 'none';
    }
}

// Załaduj użytkowników do selecta quizu o użytkownikach
function loadUsersForQuiz(preserveValue = null) {
    const select = document.getElementById('quiz-target-user');
    if (!select) return;
    
    // Zapisz aktualną wartość jeśli ma być zachowana
    const currentValue = preserveValue !== null ? preserveValue : select.value;
    
    select.innerHTML = '<option value="">Wybierz użytkownika</option>';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.display_name || user.email;
        select.appendChild(option);
    });
    
    // Przywróć wartość jeśli była ustawiona i istnieje w nowych opcjach
    if (currentValue) {
        const optionExists = Array.from(select.options).some(opt => opt.value === currentValue);
        if (optionExists) {
            select.value = currentValue;
        }
    }
}

// Przełącz między klasycznym quizem a quizem o użytkownikach
function toggleQuizType(preserveUserId = null) {
    const quizType = document.getElementById('quiz-type-select').value;
    const classicSection = document.getElementById('classic-quiz-section');
    const userSection = document.getElementById('user-quiz-section');
    
    if (quizType === 'user_quiz') {
        classicSection.style.display = 'none';
        userSection.style.display = 'block';
        loadUsersForQuiz(preserveUserId);
    } else {
        classicSection.style.display = 'block';
        userSection.style.display = 'none';
    }
}

// Załaduj pytania użytkownika dla quizu
async function loadUserQuestionsForQuiz(userId) {
    const container = document.getElementById('user-quiz-questions-list');
    if (!container) return;
    
    if (!userId) {
        container.innerHTML = '<p style="color: #6e6e73; font-style: italic;">Wybierz użytkownika, aby zobaczyć dostępne pytania</p>';
        return;
    }
    
    container.innerHTML = '<p style="color: #6e6e73;">Ładowanie pytań...</p>';
    
    try {
        const { data: questions, error } = await supabase
            .from('user_quiz_questions')
            .select('*')
            .eq('target_user_id', userId)
            .not('target_user_answer', 'is', null) // Tylko pytania, na które użytkownik już odpowiedział
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!questions || questions.length === 0) {
            container.innerHTML = '<p style="color: #d32f2f;">Ten użytkownik nie ma jeszcze odpowiedzianych pytań. Najpierw dodaj pytania dla użytkownika i poczekaj, aż na nie odpowie.</p>';
            return;
        }
        
        container.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; font-size: 1rem; font-weight: 600; color: #1d1d1f;">Wybierz pytania do quizu:</h4>
                <p style="margin: 0; font-size: 0.8125rem; color: #6e6e73;">Zaznacz pytania, które mają wejść w skład quizu</p>
            </div>
            ${questions.map(q => `
                <label style="
                    display: flex;
                    align-items: start;
                    padding: 16px;
                    margin-bottom: 12px;
                    background: white;
                    border: 2px solid #e8e8ed;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    <input type="checkbox" class="quiz-question-checkbox" value="${q.id}" style="
                        margin-right: 12px;
                        margin-top: 2px;
                        width: 20px;
                        height: 20px;
                        cursor: pointer;
                    ">
                    <div style="flex: 1;">
                        <div style="display: flex; gap: 16px; margin-bottom: 8px; font-size: 0.9375rem; font-weight: 500; color: #1d1d1f;">
                            <span>Opcja 1: <strong>${escapeHtml(q.option_1)}</strong></span>
                            <span>Opcja 2: <strong>${escapeHtml(q.option_2)}</strong></span>
                        </div>
                        <p style="margin: 0; font-size: 0.8125rem; color: #1a5d1a;">
                            ✓ Poprawna odpowiedź: <strong>${escapeHtml(q.target_user_answer === 1 ? q.option_1 : q.option_2)}</strong>
                        </p>
                    </div>
                </label>
            `).join('')}
        `;
        
        // Dodaj hover effect
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
    } catch (error) {
        console.error('Błąd ładowania pytań użytkownika:', error);
        container.innerHTML = `<p style="color: #d32f2f;">Błąd ładowania pytań: ${error.message}</p>`;
    }
}

// Konfiguracja eventów
// Przełącz sekcję w menu nawigacyjnym - dostępna globalnie (DEFINICJA PRZED setupEventListeners)
window.switchSection = function switchSection(sectionName) {
    console.log('🔍 switchSection wywołana z:', sectionName);
    
    // Ukryj wszystkie sekcje
    const allSections = document.querySelectorAll('.admin-section');
    console.log('🔍 Znaleziono sekcji:', allSections.length);
    allSections.forEach((section, index) => {
        console.log(`🔍 Sekcja ${index + 1}:`, section.id, 'data-section:', section.dataset.section);
        section.style.display = 'none';
    });
    
    // Pokaż wybraną sekcję
    const targetSection = document.getElementById(`section-${sectionName}`);
    console.log('🔍 Szukam sekcji:', `section-${sectionName}`, 'Znaleziono:', !!targetSection);
    if (targetSection) {
        targetSection.style.display = 'block';
        console.log('✅ Sekcja pokazana:', sectionName);
    } else {
        console.error('❌ Nie znaleziono sekcji:', `section-${sectionName}`);
    }
    
    // Zaktualizuj aktywne menu
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
            console.log('✅ Zakładka oznaczona jako aktywna:', sectionName);
        }
    });
    
    // Jeśli przełączamy na sekcję zadań, odśwież tabelę
    if (sectionName === 'tasks') {
        setTimeout(async () => {
            await displayTasksTable();
        }, 100);
    }
    
    // Jeśli przełączamy na sekcję weryfikacji, odśwież listę
    if (sectionName === 'verification') {
        console.log('🔍 Przełączono na sekcję weryfikacji - ładuję zadania...');
        setTimeout(async () => {
            await loadVerificationTasks();
        }, 100);
    }
    
    // Jeśli przełączamy na sekcję pytań użytkowników, odśwież listę
    if (sectionName === 'user-questions') {
        setTimeout(async () => {
            await loadUserQuestionsList();
        }, 100);
    }
};

// Oznacz funkcję jako dostępną globalnie
window.setupEventListeners = function setupEventListeners() {
    // Zabezpieczenie przed wielokrotnym wywołaniem
    if (window.ADMIN_EVENT_LISTENERS_SETUP) {
        console.warn('⚠️ Event listenery są już skonfigurowane! Pomijam...');
        return;
    }
    window.ADMIN_EVENT_LISTENERS_SETUP = true;
    
    console.log('🔍 setupEventListeners wywołana');
    // Formularz przypisywania zadania (stary - może nie istnieć)
    const oldAssignForm = document.getElementById('assign-task-form');
    if (oldAssignForm) {
        oldAssignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await assignTask();
        });
    }
    
    // Auto-wypełnianie dnia przy wyborze zadania (stary - może nie istnieć)
    const oldAssignTask = document.getElementById('assign-task');
    if (oldAssignTask) {
        oldAssignTask.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption.dataset.dayId) {
                const day = allCalendarDays.find(d => d.id == selectedOption.dataset.dayId);
                if (day) {
                    const assignDayInput = document.getElementById('assign-day');
                    if (assignDayInput) {
                        assignDayInput.value = day.day_number;
                    }
                }
            }
        });
    }
    
    // Przycisk dodawania szablonu
    document.getElementById('add-template-btn').addEventListener('click', () => {
        openAddTemplateModal();
    });
    
    // Przycisk dodawania użytkownika
    document.getElementById('add-user-btn').addEventListener('click', () => {
        openAddUserModal();
    });
    
    // Formularz dodawania użytkownika
    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewUser();
    });
    
    // Formularz dodawania dnia (może nie istnieć jeśli modal został usunięty)
    const addDayForm = document.getElementById('add-day-form');
    if (addDayForm) {
        addDayForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addNewDay();
        });
    }
    
    // Formularz dodawania/edycji szablonu
    document.getElementById('add-template-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewTemplate();
    });
    
    // Zmiana typu zadania - pokaż/ukryj sekcję quizu
    document.getElementById('template-type').addEventListener('change', toggleQuizSection);
    
    // Zmiana typu quizu (klasyczny vs o użytkownikach)
    const quizTypeSelect = document.getElementById('quiz-type-select');
    if (quizTypeSelect) {
        quizTypeSelect.addEventListener('change', toggleQuizType);
    }
    
    // Zmiana użytkownika w quizie o użytkownikach
    const quizTargetUser = document.getElementById('quiz-target-user');
    if (quizTargetUser) {
        quizTargetUser.addEventListener('change', (e) => {
            loadUserQuestionsForQuiz(e.target.value);
        });
    }
    
    // Przycisk dodawania pytania quizowego
    document.getElementById('add-question-btn').addEventListener('click', () => {
        addQuestionToForm();
    });
    
    // Zamykanie modali (sprawdzamy czy istnieją)
    const closeDayModal = document.getElementById('close-day-modal');
    if (closeDayModal) {
        closeDayModal.addEventListener('click', closeAddDayModal);
    }
    
    const cancelDayBtn = document.getElementById('cancel-day-btn');
    if (cancelDayBtn) {
        cancelDayBtn.addEventListener('click', closeAddDayModal);
    }
    
    const closeTemplateModal = document.getElementById('close-template-modal');
    if (closeTemplateModal) {
        closeTemplateModal.addEventListener('click', closeAddTemplateModal);
    }
    
    const cancelTemplateBtn = document.getElementById('cancel-template-btn');
    if (cancelTemplateBtn) {
        cancelTemplateBtn.addEventListener('click', closeAddTemplateModal);
    }
    
    // Zamykanie modali po kliknięciu poza nimi
    // UWAGA: Modal szablonu i modal dodawania dnia NIE zamykają się po kliknięciu poza nimi - tylko przez przycisk Anuluj lub Zapisz
    // const addDayModal = document.getElementById('add-day-modal');
    // if (addDayModal) {
    //     addDayModal.addEventListener('click', (e) => {
    //         if (e.target.id === 'add-day-modal') {
    //             closeAddDayModal();
    //         }
    //     });
    // }
    
    // Modal szablonu - NIE zamyka się po kliknięciu poza nim
    // Zamyka się tylko przez przycisk "Anuluj" lub po pomyślnym dodaniu
    // const addTemplateModal = document.getElementById('add-template-modal');
    // if (addTemplateModal) {
    //     addTemplateModal.addEventListener('click', (e) => {
    //         if (e.target.id === 'add-template-modal') {
    //             closeAddTemplateModal();
    //         }
    //     });
    // }
    
    // Zamykanie modalu użytkownika
    const closeUserModal = document.getElementById('close-user-modal');
    if (closeUserModal) {
        closeUserModal.addEventListener('click', closeAddUserModal);
    }
    
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', closeAddUserModal);
    }
    
    const addUserModal = document.getElementById('add-user-modal');
    if (addUserModal) {
        addUserModal.addEventListener('click', (e) => {
            if (e.target.id === 'add-user-modal') {
                closeAddUserModal();
            }
        });
    }
    
    // Zamykanie modalu szczegółów zadania
    const closeTaskDetailsModalBtn = document.getElementById('close-task-details-modal');
    if (closeTaskDetailsModalBtn) {
        closeTaskDetailsModalBtn.addEventListener('click', closeTaskDetailsModal);
    }
    
    const taskDetailsModal = document.getElementById('task-details-modal');
    if (taskDetailsModal) {
        taskDetailsModal.addEventListener('click', (e) => {
            if (e.target.id === 'task-details-modal') {
                closeTaskDetailsModal();
            }
        });
    }
    
    // Przyciski tabeli zadań
    document.getElementById('assign-bulk-btn')?.addEventListener('click', () => {
        openAssignTaskModal();
    });
    
    // Menu nawigacyjne - przełączanie sekcji
    console.log('🔍 Konfigurowanie nawigacji...');
    const navItems = document.querySelectorAll('.admin-nav-item');
    console.log('🔍 Znaleziono elementów nawigacji:', navItems.length);
    
    if (navItems.length === 0) {
        console.error('❌ BŁĄD: Nie znaleziono elementów .admin-nav-item!');
        console.error('❌ Sprawdź czy HTML jest poprawnie załadowany');
    }
    
    navItems.forEach((item, index) => {
        const sectionName = item.dataset.section;
        console.log(`🔍 Element ${index + 1}:`, sectionName, item);
        
        // Usuń stare event listenery jeśli istnieją
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const section = this.dataset.section;
            console.log('🔍 Kliknięto w zakładkę:', section);
            
            // Spróbuj użyć window.switchSection najpierw
            if (window.switchSection && typeof window.switchSection === 'function') {
                console.log('✅ Używam window.switchSection');
                window.switchSection(section);
            } else if (typeof switchSection === 'function') {
                console.log('✅ Funkcja switchSection jest dostępna, wywołuję...');
                switchSection(section);
            } else {
                console.error('❌ Funkcja switchSection nie jest dostępna!');
                console.error('❌ Typ switchSection:', typeof switchSection);
                console.error('❌ window.switchSection:', typeof window.switchSection);
                alert('Błąd: Funkcja przełączania sekcji nie jest dostępna. Odśwież stronę.');
            }
        });
        
        console.log(`✅ Event listener dodany do zakładki ${index + 1}:`, sectionName);
    });
    
    console.log('✅ Nawigacja skonfigurowana');
    
    // Formularz przypisywania zadania (nowy modal w assign-task-modal)
    const newAssignTaskForm = document.querySelector('#assign-task-modal form#assign-task-form');
    if (newAssignTaskForm) {
        newAssignTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await assignTaskFromModal();
        });
    }
    
    // Checkbox "przypisz do wszystkich"
    document.getElementById('assign-to-all')?.addEventListener('change', (e) => {
        const userSelectGroup = document.getElementById('assign-user-select-group');
        if (e.target.checked) {
            userSelectGroup.style.display = 'none';
        } else {
            userSelectGroup.style.display = 'block';
        }
    });
    
    // Zamykanie modalu przypisywania
    document.getElementById('close-assign-modal')?.addEventListener('click', closeAssignTaskModal);
    document.getElementById('cancel-assign-btn')?.addEventListener('click', closeAssignTaskModal);
    
    document.getElementById('assign-task-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'assign-task-modal') {
            closeAssignTaskModal();
        }
    });
    
    // Formularz dodawania/edycji pytania dla użytkownika
    const addUserQuestionForm = document.getElementById('add-user-question-form');
    if (addUserQuestionForm) {
        addUserQuestionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveUserQuestion();
        });
    }
    
    // Zamykanie modalu pytań użytkowników
    const closeUserQuestionModal = document.getElementById('close-user-question-modal');
    if (closeUserQuestionModal) {
        closeUserQuestionModal.addEventListener('click', closeAddUserQuestionModal);
    }
    
    const cancelUserQuestionBtn = document.getElementById('cancel-user-question-btn');
    if (cancelUserQuestionBtn) {
        cancelUserQuestionBtn.addEventListener('click', closeAddUserQuestionModal);
    }
    
    const addUserQuestionModal = document.getElementById('add-user-question-modal');
    if (addUserQuestionModal) {
        addUserQuestionModal.addEventListener('click', (e) => {
            if (e.target.id === 'add-user-question-modal') {
                closeAddUserQuestionModal();
            }
        });
    }
    
    // Event listenery dla przycisków edycji i usuwania pytań (delegacja zdarzeń)
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-question-btn')) {
            const questionId = e.target.dataset.questionId;
            const userId = e.target.dataset.userId;
            await editUserQuestion(questionId, userId);
        }
        
        if (e.target.classList.contains('delete-question-btn')) {
            const questionId = e.target.dataset.questionId;
            await deleteUserQuestion(questionId);
        }
    });
    
    console.log('✅ setupEventListeners zakończona pomyślnie');
};

// Otwórz modal dodawania dnia
function openAddDayModal() {
    document.getElementById('add-day-modal').style.display = 'block';
    document.getElementById('day-number').value = '';
}

// Zamknij modal dodawania dnia
function closeAddDayModal() {
    document.getElementById('add-day-modal').style.display = 'none';
    document.getElementById('add-day-form').reset();
}

// Otwórz modal dodawania szablonu
function openAddTemplateModal() {
    // Ustaw tryb dodawania
    document.getElementById('template-modal-title').textContent = 'Dodaj szablon zadania';
    document.getElementById('template-submit-btn').textContent = 'Dodaj szablon';
    document.getElementById('template-id').value = '';
    
    // Ukryj przycisk usuwania w trybie dodawania
    const deleteBtn = document.getElementById('delete-template-btn');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    
    // Wypełnij select z dniami
    const daySelect = document.getElementById('template-day');
    daySelect.innerHTML = '<option value="">Bez przypisania dnia</option>';
    allCalendarDays.forEach(day => {
        const option = document.createElement('option');
        option.value = day.id;
        option.textContent = `Dzień ${day.day_number}`;
        daySelect.appendChild(option);
    });
    
    // Wyczyść formularz
    document.getElementById('add-template-form').reset();
    clearQuizQuestions();
    
    // Resetuj typ quizu do klasycznego
    const quizTypeSelect = document.getElementById('quiz-type-select');
    if (quizTypeSelect) {
        quizTypeSelect.value = 'classic';
        toggleQuizType();
    }
    
    toggleQuizSection();
    
    document.getElementById('add-template-modal').style.display = 'block';
}

// Zamknij modal dodawania/edycji szablonu
function closeAddTemplateModal() {
    document.getElementById('add-template-modal').style.display = 'none';
    document.getElementById('add-template-form').reset();
    document.getElementById('template-id').value = '';
    clearQuizQuestions();
}

// Otwórz modal dodawania użytkownika
function openAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'block';
    document.getElementById('user-email').value = '';
}

// Zamknij modal dodawania użytkownika
function closeAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'none';
    document.getElementById('add-user-form').reset();
}

// Dodaj nowego użytkownika
async function addNewUser() {
    const email = document.getElementById('user-email').value.trim();
    const defaultPassword = 'Adwent2025';
    
    if (!email) {
        showNotification('Podaj adres email', 'error');
        return;
    }
    
    // Walidacja emaila
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Podaj poprawny adres email', 'error');
        return;
    }
    
    try {
        // ZAPISZ SESJĘ ADMINA PRZED UTWORZENIEM UŻYTKOWNIKA
        // Supabase signUp() zmienia aktualną sesję, więc musimy ją zachować
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        if (!adminSession) {
            showNotification('Błąd: Brak aktywnej sesji admina', 'error');
            return;
        }
        
        // Zapisz refresh token admina do przywrócenia sesji później
        const adminRefreshToken = adminSession.refresh_token;
        const adminUserId = adminSession.user.id; // Do weryfikacji
        
        console.log('🔐 Zapisano sesję admina przed utworzeniem użytkownika');
        
        // Sprawdź czy użytkownik już istnieje
        const { data: existingUsers, error: checkError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .limit(1);
        
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingUsers && existingUsers.length > 0) {
            showNotification('Użytkownik o tym adresie email już istnieje', 'error');
            return;
        }
        
        // Utwórz użytkownika w Supabase Auth
        // UWAGA: To zmieni aktualną sesję na sesję nowego użytkownika
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password: defaultPassword,
            options: {
                emailRedirectTo: undefined,
                data: {
                    display_name: '',
                    role: 'user'
                }
            }
        });
        
        if (authError) {
            // Jeśli użytkownik już istnieje w Auth (ale nie w profiles)
            if (authError.message && authError.message.includes('already registered')) {
                showNotification('Użytkownik o tym adresie email już istnieje w systemie', 'error');
                return;
            }
            throw authError;
        }
        
        if (!authData.user) {
            throw new Error('Nie udało się utworzyć użytkownika');
        }
        
        console.log('✅ Użytkownik utworzony w Auth:', authData.user.id);
        
        // NATYCHMIAST PRZYWRÓĆ SESJĘ ADMINA
        // Wyloguj się z sesji nowego użytkownika
        try {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError && !signOutError.message?.includes('Auth session missing')) {
                console.error('Błąd wylogowania z sesji nowego użytkownika:', signOutError);
            }
        } catch (error) {
            // Ignoruj błąd jeśli sesja już nie istnieje
            if (!error.message?.includes('Auth session missing')) {
                console.error('Błąd wylogowania z sesji nowego użytkownika:', error);
            }
        }
        
        // Przywróć sesję admina używając refresh token
        console.log('🔄 Przywracanie sesji admina...');
        const { data: restoreData, error: restoreError } = await supabase.auth.refreshSession({
            refresh_token: adminRefreshToken
        });
        
        if (restoreError || !restoreData?.session) {
            console.error('❌ Błąd przywracania sesji admina:', restoreError);
            // Spróbuj zalogować się ponownie używając access token (może działać jeśli token jest jeszcze ważny)
            // Jeśli nie zadziała, użytkownik będzie musiał się ponownie zalogować
            showNotification('Użytkownik został utworzony, ale wystąpił problem z sesją. Odśwież stronę.', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            return;
        }
        
        // Zaktualizuj currentUser po przywróceniu sesji
        currentUser = restoreData.session.user;
        console.log('✅ Sesja admina przywrócona pomyślnie, użytkownik:', currentUser.email);
        
        // Weryfikuj, że przywrócona sesja należy do admina
        if (currentUser.id !== adminUserId) {
            console.error('❌ Błąd: Przywrócona sesja należy do innego użytkownika!');
            showNotification('Użytkownik został utworzony, ale wystąpił problem z sesją. Odśwież stronę.', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            return;
        }
        
        // Poczekaj chwilę, aby trigger handle_new_user mógł utworzyć profil
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sprawdź czy profil został utworzony
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (profileError || !profile) {
            // Jeśli profil nie został utworzony przez trigger, utwórz go ręcznie
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email.toLowerCase(),
                    display_name: '',
                    role: 'user'
                });
            
            if (insertError) {
                console.error('Błąd tworzenia profilu:', insertError);
                showNotification('Użytkownik został utworzony, ale wystąpił problem z profilem. Sprawdź w bazie danych.', 'error');
                return;
            }
        }
        
        console.log('✅ Profil utworzony lub już istnieje');
        
        showNotification(`Użytkownik ${email} został utworzony! Hasło: ${defaultPassword}`, 'success');
        closeAddUserModal();
        
        // Odśwież listę użytkowników
        console.log('🔄 Odświeżanie listy użytkowników...');
        
        // Pobierz nowo utworzony profil
        const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .select('id, email, display_name, role, created_at')
            .eq('id', authData.user.id)
            .single();
        
        if (!newProfileError && newProfile) {
            // Dodaj nowego użytkownika na początku listy
            allUsers.unshift(newProfile);
            console.log('✅ Dodano nowego użytkownika do listy:', newProfile);
            
            // Odśwież tylko wyświetlanie użytkowników i formularz przypisywania
            displayUsers();
            populateAssignForm();
        } else {
            // Jeśli nie udało się pobrać, odśwież wszystkie dane
            console.log('⚠️ Nie udało się pobrać nowego profilu, odświeżam wszystkie dane...');
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadAllData();
        }
        
    } catch (error) {
        console.error('Błąd dodawania użytkownika:', error);
        showNotification(error.message || 'Błąd dodawania użytkownika', 'error');
        
        // W przypadku błędu, spróbuj przywrócić sesję admina
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession && currentSession.user.id !== currentUser?.id) {
                console.log('⚠️ Sesja została zmieniona po błędzie, próba przywrócenia...');
                try {
                    const { error: signOutError } = await supabase.auth.signOut();
                    if (signOutError && !signOutError.message?.includes('Auth session missing')) {
                        console.error('Błąd wylogowania:', signOutError);
                    }
                } catch (signOutErr) {
                    // Ignoruj błąd jeśli sesja już nie istnieje
                    if (!signOutErr.message?.includes('Auth session missing')) {
                        console.error('Błąd wylogowania:', signOutErr);
                    }
                }
                // Użytkownik będzie musiał odświeżyć stronę i zalogować się ponownie
            }
        } catch (restoreErr) {
            console.error('Błąd przywracania sesji po błędzie:', restoreErr);
        }
    }
}

// Dodaj nowy dzień
// UWAGA: Fun fact i państwo są w kodzie (dayToCountry), tutaj tylko tworzymy rekord w bazie
async function addNewDay() {
    const dayNumber = document.getElementById('day-number').value;
    
    if (!dayNumber) {
        showNotification('Podaj numer dnia', 'error');
        return;
    }
    
    const dayNum = parseInt(dayNumber);
    if (dayNum < 1 || dayNum > 24) {
        showNotification('Numer dnia musi być między 1 a 24', 'error');
        return;
    }
    
    try {
        // Sprawdź czy dzień już istnieje
        const { data: existing } = await supabase
            .from('calendar_days')
            .select('*')
            .eq('day_number', dayNum)
            .single();
        
        if (existing) {
            showNotification(`Dzień ${dayNum} już istnieje w bazie`, 'error');
            return;
        }
        
        // Utwórz dzień w bazie (tylko day_number, fun_fact jest w kodzie)
        const { error } = await supabase
            .from('calendar_days')
            .insert({
                day_number: dayNum,
                is_active: true
            });
        
        if (error) throw error;
        
        showNotification(`Dzień ${dayNum} został dodany. Państwo i ciekawostka są w kodzie aplikacji.`, 'success');
        closeAddDayModal();
        await loadAllData();
        
    } catch (error) {
        console.error('Błąd dodawania dnia:', error);
        showNotification(error.message || 'Błąd dodawania dnia', 'error');
    }
}

// Dodaj/edytuj szablon zadania
async function addNewTemplate() {
    const templateId = document.getElementById('template-id').value;
    const dayId = document.getElementById('template-day').value;
    const title = document.getElementById('template-title').value;
    const description = document.getElementById('template-description').value;
    const taskType = document.getElementById('template-type').value;
    const isEdit = !!templateId;
    
    // Sprawdź czy wybrano dzień (jeśli tak, sprawdź czy istnieje)
    if (dayId) {
        const day = allCalendarDays.find(d => d.id == dayId);
        if (!day) {
            showNotification('Nie znaleziono dnia kalendarza', 'error');
            return;
        }
    }
    
    if (!title || !title.trim()) {
        showNotification('Tytuł nie może być pusty', 'error');
        return;
    }
    
    if (!taskType) {
        showNotification('Wybierz typ zadania', 'error');
        return;
    }
    
    // Przygotuj metadata dla quizu
    let metadata = null;
    if (taskType === 'quiz') {
        const quizType = document.getElementById('quiz-type-select').value;
        
        if (quizType === 'user_quiz') {
            // Quiz o użytkownikach
            const targetUserId = document.getElementById('quiz-target-user').value;
            const passingScore = parseInt(document.getElementById('quiz-passing-score').value) || 5;
            
            if (!targetUserId) {
                showNotification('Wybierz użytkownika dla quizu', 'error');
                return;
            }
            
            // Zbierz zaznaczone pytania
            const selectedQuestions = Array.from(document.querySelectorAll('.quiz-question-checkbox:checked'))
                .map(cb => cb.value);
            
            if (selectedQuestions.length === 0) {
                showNotification('Wybierz przynajmniej jedno pytanie do quizu', 'error');
                return;
            }
            
            metadata = {
                quiz_type: 'user_quiz',
                target_user_id: targetUserId,
                question_ids: selectedQuestions,
                passing_score: passingScore
            };
        } else {
            // Klasyczny quiz
            const questions = collectQuizQuestions();
            if (questions.length === 0) {
                showNotification('Dodaj przynajmniej jedno pytanie do quizu', 'error');
                return;
            }
            metadata = {
                quiz_type: 'classic',
                questions: questions
            };
        }
    }
    
    try {
        const dataToSave = {
            calendar_day_id: dayId || null,
            title: title.trim(),
            description: description.trim() || null,
            task_type: taskType
        };
        
        // Dodaj metadata tylko jeśli istnieje (Supabase automatycznie konwertuje obiekty JS na JSONB)
        if (metadata) {
            dataToSave.metadata = metadata;
        }
        
        if (isEdit) {
            // Aktualizuj istniejący szablon
            const { error } = await supabase
                .from('task_templates')
                .update(dataToSave)
                .eq('id', templateId);
            
            if (error) throw error;
            showNotification('Szablon został zaktualizowany', 'success');
        } else {
            // Utwórz nowy szablon
            const { error } = await supabase
                .from('task_templates')
                .insert(dataToSave);
            
            if (error) throw error;
            showNotification('Szablon został dodany', 'success');
        }
        
        closeAddTemplateModal();
        await loadAllData();
        
    } catch (error) {
        console.error('Błąd zapisywania szablonu:', error);
        showNotification(error.message || 'Błąd zapisywania szablonu', 'error');
    }
}

// Zbierz pytania quizowe z formularza
function collectQuizQuestions() {
    const questions = [];
    const questionItems = document.querySelectorAll('.quiz-question-item');
    
    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text').value.trim();
        const optionsText = item.querySelector('.question-options').value.trim();
        const correctAnswer = parseInt(item.querySelector('.question-correct').value) - 1; // -1 bo indeksy od 0
        
        if (!questionText || !optionsText || isNaN(correctAnswer)) {
            return; // Pomiń niekompletne pytania
        }
        
        const options = optionsText.split('\n')
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0);
        
        if (options.length === 0) {
            return; // Pomiń jeśli brak opcji
        }
        
        if (correctAnswer < 0 || correctAnswer >= options.length) {
            showNotification(`Pytanie ${index + 1}: Nieprawidłowy numer poprawnej odpowiedzi`, 'error');
            return;
        }
        
        questions.push({
            id: index + 1,
            question: questionText,
            options: options,
            correct_answer: correctAnswer
        });
    });
    
    return questions;
}

// Przypisz zadanie użytkownikowi (stara funkcja - może nie być używana)
async function assignTask() {
    const userElement = document.getElementById('assign-user');
    const dayElement = document.getElementById('assign-day');
    const taskElement = document.getElementById('assign-task');
    
    // Sprawdź czy elementy istnieją (stary formularz może nie istnieć)
    if (!userElement || !dayElement || !taskElement) {
        console.warn('Stary formularz przypisywania zadań nie istnieje - używaj modala');
        return;
    }
    
    const userId = userElement.value;
    const dayNumber = parseInt(dayElement.value);
    const taskTemplateId = taskElement.value;
    
    if (!userId || !dayNumber || !taskTemplateId) {
        showNotification('Wypełnij wszystkie pola', 'error');
        return;
    }
    
    // Znajdź calendar_day_id dla wybranego dnia
    const calendarDay = allCalendarDays.find(d => d.day_number === dayNumber);
    if (!calendarDay) {
        showNotification('Nie znaleziono dnia kalendarza', 'error');
        return;
    }
    
    try {
        // Sprawdź czy zadanie już istnieje
        const { data: existing } = await supabase
            .from('assigned_tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('calendar_day_id', calendarDay.id)
            .single();
        
        if (existing) {
            // Aktualizuj istniejące zadanie
            const { error } = await supabase
                .from('assigned_tasks')
                .update({
                    task_template_id: taskTemplateId,
                    assigned_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            
            if (error) throw error;
            showNotification('Zadanie zostało zaktualizowane', 'success');
        } else {
            // Utwórz nowe zadanie
            const { error } = await supabase
                .from('assigned_tasks')
                .insert({
                    user_id: userId,
                    calendar_day_id: calendarDay.id,
                    task_template_id: taskTemplateId,
                    status: 'pending'
                });
            
            if (error) throw error;
            showNotification('Zadanie zostało przypisane', 'success');
        }
        
        // Wyczyść formularz
        document.getElementById('assign-task-form').reset();
        
        // Odśwież listę zadań
        if (window.selectedUserId) {
            await viewUserTasks(window.selectedUserId);
        }
        
    } catch (error) {
        console.error('Błąd przypisywania zadania:', error);
        showNotification(error.message || 'Błąd przypisywania zadania', 'error');
    }
}

// Zobacz zadania użytkownika (dostępne globalnie)
window.viewUserTasks = async function(userId, userEmail = '') {
    window.selectedUserId = userId;
    
    try {
        const { data: tasks, error } = await supabase
            .from('assigned_tasks')
            .select(`
                *,
                calendar_days (*),
                task_templates (*)
            `)
            .eq('user_id', userId)
            .order('calendar_days(day_number)', { ascending: true });
        
        if (error) throw error;
        
        const tasksList = document.getElementById('tasks-list');
        
        // Sprawdź czy element istnieje
        if (!tasksList) {
            console.warn('Element tasks-list nie istnieje w HTML');
            return;
        }
        
        // Pokaż element tasks-list
        tasksList.style.display = 'block';
        
        if (!tasks || tasks.length === 0) {
            tasksList.innerHTML = `
                <p>Użytkownik <strong>${userEmail}</strong> nie ma jeszcze przypisanych zadań.</p>
            `;
            return;
        }
        
        tasksList.innerHTML = `
            <h3>Zadania użytkownika: ${userEmail}</h3>
            <div class="tasks-grid">
                ${tasks.map(task => {
                    const day = task.calendar_days;
                    const template = task.task_templates;
                    const statusColors = {
                        'pending': '#8e8e93',
                        'in_progress': '#013927',
                        'completed': '#013927'
                    };
                    const statusLabels = {
                        'pending': 'Oczekujące',
                        'in_progress': 'W trakcie',
                        'completed': 'Wykonane'
                    };
                    
                    const taskType = template?.task_type || 'text_response';
                    const taskTypeLabels = {
                        'text_response': 'Bez weryfikacji',
                        'text_response_verified': 'Odpowiedź tekstowa',
                        'quiz': 'Quiz',
                        'photo_upload': 'Dodaj zdjęcie',
                        'checkbox': 'Checkbox',
                        'custom': 'Niestandardowe'
                    };
                    
                    // Funkcja do wyświetlania odpowiedzi z quizu
                    const renderQuizAnswers = (metadata) => {
                        if (!metadata || !metadata.answers) return '';
                        
                        let html = '<div style="margin-top: 12px; padding: 12px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">';
                        html += '<p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Odpowiedzi użytkownika:</p>';
                        
                        if (Array.isArray(metadata.answers)) {
                            metadata.answers.forEach((answer, index) => {
                                const questionText = answer.question || `Pytanie ${index + 1}`;
                                const userAnswer = answer.user_answer || answer.answer || 'Brak odpowiedzi';
                                const isCorrect = answer.is_correct !== undefined ? answer.is_correct : null;
                                
                                html += `<div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px;">`;
                                html += `<p style="font-weight: 500; font-size: 0.8125rem; margin-bottom: 4px; color: #1d1d1f;">${questionText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
                                html += `<p style="font-size: 0.8125rem; color: #6e6e73;">Odpowiedź: <strong>${String(userAnswer).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></p>`;
                                if (isCorrect !== null) {
                                    html += `<p style="font-size: 0.8125rem; color: ${isCorrect ? '#013927' : '#d32f2f'}; margin-top: 4px;">${isCorrect ? '✓ Poprawna' : '✗ Niepoprawna'}</p>`;
                                }
                                html += `</div>`;
                            });
                        } else if (typeof metadata.answers === 'object') {
                            // Jeśli answers jest obiektem z kluczami
                            Object.keys(metadata.answers).forEach((key, index) => {
                                const answer = metadata.answers[key];
                                const questionText = answer.question || key || `Pytanie ${index + 1}`;
                                const userAnswer = answer.user_answer || answer.answer || answer || 'Brak odpowiedzi';
                                const isCorrect = answer.is_correct !== undefined ? answer.is_correct : null;
                                
                                html += `<div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px;">`;
                                html += `<p style="font-weight: 500; font-size: 0.8125rem; margin-bottom: 4px; color: #1d1d1f;">${questionText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
                                html += `<p style="font-size: 0.8125rem; color: #6e6e73;">Odpowiedź: <strong>${String(userAnswer).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></p>`;
                                if (isCorrect !== null) {
                                    html += `<p style="font-size: 0.8125rem; color: ${isCorrect ? '#013927' : '#d32f2f'}; margin-top: 4px;">${isCorrect ? '✓ Poprawna' : '✗ Niepoprawna'}</p>`;
                                }
                                html += `</div>`;
                            });
                        }
                        
                        if (metadata.score !== undefined || metadata.total_score !== undefined) {
                            const score = metadata.score || 0;
                            const total = metadata.total_score || metadata.total || 0;
                            html += `<p style="margin-top: 12px; font-weight: 500; font-size: 0.875rem; color: #1d1d1f;">Wynik: ${score}/${total} punktów</p>`;
                        }
                        
                        html += '</div>';
                        return html;
                    };
                    
                    // Funkcja do wyświetlania zdjęcia
                    const renderPhoto = (photoUrl) => {
                        if (!photoUrl) return '';
                        
                        // Wyciągnij ścieżkę pliku z URL
                        let filePath = photoUrl;
                        if (photoUrl.includes('/task-responses/')) {
                            const match = photoUrl.match(/task-responses\/(.+?)(\?|$)/);
                            if (match) {
                                filePath = match[1];
                            }
                        } else if (!photoUrl.startsWith('http')) {
                            filePath = photoUrl.replace(/^\/+/, '');
                        }
                        
                        // Zbuduj publiczny URL
                        let publicUrl = photoUrl;
                        if (!publicUrl.includes('/storage/v1/object/public/')) {
                            const projectUrl = window.SUPABASE_CONFIG?.URL || '';
                            if (projectUrl) {
                                const baseUrl = projectUrl.replace(/\/$/, '');
                                publicUrl = `${baseUrl}/storage/v1/object/public/task-responses/${filePath}`;
                            }
                        }
                        
                        const escapedUrl = publicUrl.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                        const escapedFilePath = filePath.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                        
                        return `
                            <div style="margin-top: 12px; padding: 12px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">
                                <p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Zdjęcie przesłane przez użytkownika:</p>
                                <div style="position: relative; display: inline-block;">
                                    <img src="${escapedUrl}" 
                                         alt="Zdjęcie zadania" 
                                         style="max-width: 100%; max-height: 300px; border-radius: 4px; border: 1px solid #d2d2d7; cursor: pointer;"
                                         onclick="window.showAdminPhotoModal('${escapedUrl}', '${escapedFilePath}')"
                                         onerror="this.style.display='none'; const nextDiv = this.nextElementSibling; if(nextDiv) nextDiv.style.display='block';">
                                    <div class="photo-error" style="display: none; padding: 20px; text-align: center; color: #6e6e73; font-size: 0.875rem;">
                                        <p>Nie można załadować zdjęcia</p>
                                        <button onclick="const img = this.closest('div').previousElementSibling; if(img) window.loadSignedUrlForPhoto(img, '${escapedFilePath}');" 
                                                class="btn btn-small" 
                                                style="margin-top: 8px; background: #013927; color: white; border: none;">
                                            Spróbuj ponownie
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    };
                    
                    return `
                        <div class="task-card">
                            <div class="task-header">
                                <h4>Dzień ${day ? day.day_number : '?'} - ${template ? template.title : 'Brak szablonu'}</h4>
                                <span class="status-badge" style="background: ${statusColors[task.status]}">
                                    ${statusLabels[task.status]}
                                </span>
                            </div>
                            <div class="task-info">
                                <p><strong>Typ zadania:</strong> ${taskTypeLabels[taskType] || taskType}</p>
                                ${template ? `<p><strong>Opis:</strong> ${template.description || 'Brak opisu'}</p>` : ''}
                                ${task.completed_at ? `<p><strong>Wykonano:</strong> ${new Date(task.completed_at).toLocaleString('pl-PL')}</p>` : ''}
                                
                                ${task.status === 'completed' ? `
                                    ${taskType === 'text_response' || taskType === 'text_response_verified' ? `
                                        ${task.response_text ? `
                                            <div style="margin-top: 12px; padding: 12px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">
                                                <p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Odpowiedź użytkownika:</p>
                                                <p style="color: #1d1d1f; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${task.response_text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                                            </div>
                                        ` : '<p style="color: #6e6e73; font-size: 0.875rem; margin-top: 8px;">Użytkownik nie dodał odpowiedzi tekstowej.</p>'}
                                    ` : ''}
                                    
                                    ${taskType === 'photo_upload' ? renderPhoto(task.response_media_url) : ''}
                                    
                                    ${taskType === 'quiz' ? renderQuizAnswers(task.response_metadata) : ''}
                                ` : ''}
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                                ${task.status !== 'completed' ? `
                                    <button class="btn btn-primary btn-small" onclick="changeTaskStatus('${task.id}', 'completed')" style="background: #013927; color: white; border: none;">
                                        ✓ Oznacz jako wykonane
                                    </button>
                                ` : `
                                    <button class="btn btn-secondary btn-small" onclick="changeTaskStatus('${task.id}', 'pending')" style="background: #8e8e93; color: white; border: none;">
                                        ↻ Oznacz jako oczekujące
                                    </button>
                                `}
                                ${task.status !== 'completed' ? `
                                    <button class="btn btn-small" onclick="deleteTask('${task.id}')" style="background: #d32f2f; color: white; border: none;">
                                        Usuń zadanie
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Błąd ładowania zadań:', error);
        showNotification('Błąd ładowania zadań', 'error');
    }
};

// Usuń zadanie (dostępne globalnie)
window.deleteTask = async function(taskId) {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('assigned_tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        showNotification('Zadanie zostało usunięte', 'success');
        
        // Odśwież listę zadań
        if (window.selectedUserId) {
            await viewUserTasks(window.selectedUserId);
        }
        
    } catch (error) {
        console.error('Błąd usuwania zadania:', error);
        showNotification('Błąd usuwania zadania', 'error');
    }
};

// Zmień status zadania (dostępne globalnie)
window.changeTaskStatus = async function(taskId, newStatus, userId = null, dayNumber = null) {
    const statusLabels = {
        'pending': 'Oczekujące',
        'in_progress': 'W trakcie',
        'completed': 'Wykonane'
    };
    
    const currentStatusLabel = statusLabels[newStatus] || newStatus;
    const confirmMessage = `Czy na pewno chcesz zmienić status zadania na "${currentStatusLabel}"?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const updateData = {
            status: newStatus
        };
        
        // Jeśli zmieniamy na completed, ustaw completed_at
        if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString();
        } else if (newStatus === 'pending') {
            // Jeśli zmieniamy na pending, usuń completed_at
            updateData.completed_at = null;
        }
        
        const { error } = await supabase
            .from('assigned_tasks')
            .update(updateData)
            .eq('id', taskId);
        
        if (error) throw error;
        
        showNotification(`Status zadania został zmieniony na "${currentStatusLabel}"`, 'success');
        
        // Odśwież widok zadań użytkownika jeśli jest otwarty
        if (window.selectedUserId) {
            await viewUserTasks(window.selectedUserId);
        }
        
        // Odśwież tabelę zadań jeśli jest otwarta
        await displayTasksTable();
        
    } catch (error) {
        console.error('Błąd zmiany statusu zadania:', error);
        showNotification('Błąd zmiany statusu zadania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// Wyświetl tabelę zadań dla wszystkich użytkowników
async function displayTasksTable() {
    console.log('🔄 Wyświetlanie tabeli zadań...');
    const tbody = document.getElementById('tasks-table-body');
    const thead = document.getElementById('tasks-table-header');
    
    if (!tbody || !thead) {
        console.error('❌ Nie znaleziono tbody lub thead dla tabeli zadań');
        return;
    }
    
    // Uwzględnij wszystkich użytkowników (w tym adminów) - żeby admin mógł testować zadania
    const regularUsers = allUsers;
    
    console.log('✅ Tbody znalezione, użytkowników:', regularUsers.length);
    
    if (regularUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #6e6e73;">Brak użytkowników</td></tr>';
        return;
    }
    
    // Załaduj wszystkie przypisane zadania
    try {
        const { data: allTasks, error: tasksError } = await supabase
            .from('assigned_tasks')
            .select(`
                *,
                calendar_days (day_number),
                task_templates (title, task_type)
            `);
        
        if (tasksError) {
            console.error('Błąd ładowania zadań:', tasksError);
            tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #d32f2f;">Błąd ładowania zadań</td></tr>';
            return;
        }
        
        // Utwórz mapę zadań: userId -> dayNumber -> task
        const tasksMap = {};
        allTasks?.forEach(task => {
            if (!tasksMap[task.user_id]) {
                tasksMap[task.user_id] = {};
            }
            if (task.calendar_days) {
                tasksMap[task.user_id][task.calendar_days.day_number] = task;
            }
        });
        
        // Wygeneruj nagłówek z użytkownikami
        const headerCells = ['<th style="position: sticky; left: 0; background: #f5f5f7; z-index: 10; min-width: 50px; max-width: 50px; width: 50px; color: #1d1d1f; font-weight: 600;">Dzień</th>'];
        regularUsers.forEach(user => {
            const userName = (user.display_name || user.email).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            headerCells.push(`
                <th style="min-width: 200px; max-width: 250px;">
                    <div style="font-weight: 500; font-size: 0.875rem; color: #1d1d1f;">${userName}</div>
                    <div style="font-size: 0.75rem; color: #6e6e73; margin-top: 2px;">${user.email}</div>
                </th>
            `);
        });
        thead.innerHTML = `<tr>${headerCells.join('')}</tr>`;
        
        // Wygeneruj wiersze dla każdego dnia (1-24)
        const rows = [];
        for (let day = 1; day <= 24; day++) {
            const cells = [];
            
            // Komórka z numerem dnia
            cells.push(`
                <td style="position: sticky; left: 0; background: #f5f5f7; z-index: 5; font-weight: 600; text-align: center; min-width: 50px; max-width: 50px; width: 50px; color: #1d1d1f;">
                    ${day}
                </td>
            `);
            
            // Komórki dla każdego użytkownika
            regularUsers.forEach(user => {
                const task = tasksMap[user.id]?.[day];
                if (task) {
                    const statusClass = task.status === 'completed' ? 'task-cell-completed' : 'task-cell-assigned';
                    const statusIcon = task.status === 'completed' ? '✓' : '○';
                    const templateTitle = (task.task_templates?.title || 'Brak tytułu').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                    const escapedUserId = String(user.id).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                    const escapedTaskId = String(task.id).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                    
                    cells.push(`
                        <td class="task-cell ${statusClass}" onclick="window.openTaskCell('${escapedUserId}', ${day}, '${escapedTaskId}')" title="Status: ${task.status === 'completed' ? 'Wykonane' : 'Przypisane'}" style="cursor: pointer; padding: 12px; min-width: 200px; max-width: 250px; position: relative;">
                            <div style="position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; z-index: 10;">
                                ${task.status === 'completed' ? `
                                    <button onclick="event.stopPropagation(); window.changeTaskStatus('${escapedTaskId}', 'pending')" 
                                            title="Oznacz jako oczekujące" 
                                            style="background: white; color: #8e8e93; border: 1px solid #d2d2d7; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; padding: 0; transition: all 0.2s; opacity: 0.7;"
                                            onmouseover="this.style.opacity='1'; this.style.borderColor='#8e8e93'; this.style.color='#8e8e93';"
                                            onmouseout="this.style.opacity='0.7'; this.style.borderColor='#d2d2d7'; this.style.color='#8e8e93';">
                                        ↻
                                    </button>
                                ` : `
                                    <button onclick="event.stopPropagation(); window.changeTaskStatus('${escapedTaskId}', 'completed')" 
                                            title="Oznacz jako wykonane" 
                                            style="background: white; color: #013927; border: 1px solid #d2d2d7; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; padding: 0; transition: all 0.2s; opacity: 0.7;"
                                            onmouseover="this.style.opacity='1'; this.style.borderColor='#013927'; this.style.color='#013927';"
                                            onmouseout="this.style.opacity='0.7'; this.style.borderColor='#d2d2d7'; this.style.color='#013927';">
                                        ✓
                                    </button>
                                `}
                                <button onclick="event.stopPropagation(); window.deleteAssignedTask('${escapedTaskId}', '${escapedUserId}', ${day})" 
                                        title="Usuń zadanie" 
                                        style="background: white; color: #6e6e73; border: 1px solid #d2d2d7; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 300; padding: 0; transition: all 0.2s; opacity: 0.6;"
                                        onmouseover="this.style.opacity='1'; this.style.borderColor='#d32f2f'; this.style.color='#d32f2f';"
                                        onmouseout="this.style.opacity='0.6'; this.style.borderColor='#d2d2d7'; this.style.color='#6e6e73';">
                                    ×
                                </button>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; padding-right: 60px;">
                                <span style="font-size: 1.2rem;">${statusIcon}</span>
                                <span style="font-weight: 500; font-size: 0.875rem;">${templateTitle}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: #6e6e73; margin-top: 4px;">
                                ${task.status === 'completed' ? 'Wykonane' : 'Oczekujące'}
                            </div>
                        </td>
                    `);
                } else {
                    const escapedUserId = String(user.id).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                    cells.push(`
                        <td class="task-cell task-cell-empty" style="padding: 12px; min-width: 200px; max-width: 250px; text-align: center;">
                            <button class="task-cell-action" onclick="window.assignTaskToCell('${escapedUserId}', ${day})" title="Przypisz zadanie" type="button" style="cursor: pointer; background: none; border: none; color: #1a5d1a; font-size: 1.5rem; font-weight: 300; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                                    onmouseover="this.style.transform='scale(1.2)'; this.style.color='#155015';"
                                    onmouseout="this.style.transform='scale(1)'; this.style.color='#1a5d1a';">
                                +
                            </button>
                        </td>
                    `);
                }
            });
            
            rows.push(`<tr>${cells.join('')}</tr>`);
        }
        
        tbody.innerHTML = rows.join('');
        
        console.log('✅ Tabela zadań wygenerowana, wierszy:', 24, 'kolumn:', regularUsers.length);
        
    } catch (error) {
        console.error('❌ Błąd wyświetlania tabeli zadań:', error);
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center; padding: 20px; color: #d32f2f;">Błąd wyświetlania tabeli: ' + error.message + '</td></tr>';
    }
}

// Otwórz modal przypisywania zadania
function openAssignTaskModal(dayNumber = null, userId = null) {
    const modal = document.getElementById('assign-task-modal');
    if (!modal) {
        console.error('Nie znaleziono modalu assign-task-modal');
        return;
    }
    
    const dayInput = document.getElementById('assign-day-modal');
    const userSelect = document.getElementById('assign-user-modal');
    const assignToAll = document.getElementById('assign-to-all');
    
    if (!dayInput || !userSelect || !assignToAll) {
        console.error('Nie znaleziono elementów formularza w modalu');
        return;
    }
    
    // Wypełnij select z zadaniami
    const taskSelect = document.getElementById('assign-task-select-modal');
    if (!taskSelect) {
        console.error('Nie znaleziono selecta z zadaniami');
        return;
    }
    
    taskSelect.innerHTML = '<option value="">Wybierz zadanie...</option>';
    allTaskTemplates.forEach(template => {
        const day = allCalendarDays.find(d => d.id === template.calendar_day_id);
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = `${template.title} (Dzień ${day ? day.day_number : '?'})`;
        taskSelect.appendChild(option);
    });
    
    // Wypełnij select z użytkownikami (w tym adminami)
    userSelect.innerHTML = '<option value="">Wybierz użytkownika...</option>';
    allUsers.forEach(user => {
        const option = document.createElement('option');
        const roleLabel = user.role === 'admin' ? ' (Admin)' : '';
        option.value = user.id;
        option.textContent = `${user.display_name || user.email}${roleLabel}`;
        userSelect.appendChild(option);
    });
    
    // Ukryj/pokaż pola w zależności od tego, czy są podane wartości
    const daySelectGroup = document.getElementById('assign-day-select-group');
    const assignToAllGroup = document.getElementById('assign-to-all-group');
    const userSelectGroup = document.getElementById('assign-user-select-group');
    
    // Jeśli podano dayNumber (kliknięto w konkretny dzień), ukryj pole wyboru dnia
    if (dayNumber) {
        dayInput.value = dayNumber;
        if (daySelectGroup) {
            daySelectGroup.style.display = 'none';
        }
    } else {
        if (daySelectGroup) {
            daySelectGroup.style.display = 'block';
        }
    }
    
    // Jeśli podano userId (kliknięto plusik w tabeli), automatycznie wybierz użytkownika
    if (userId) {
        assignToAll.checked = false;
        // Ukryj checkbox "Przypisz do wszystkich" - nie ma sensu gdy wybrano konkretnego użytkownika
        if (assignToAllGroup) {
            assignToAllGroup.style.display = 'none';
        }
        // Ukryj pole wyboru użytkownika - już został wybrany
        if (userSelectGroup) {
            userSelectGroup.style.display = 'none';
        }
        userSelect.value = userId;
    } else {
        // Jeśli nie podano userId, domyślnie "przypisz do wszystkich"
        assignToAll.checked = true;
        // Pokaż checkbox "Przypisz do wszystkich"
        if (assignToAllGroup) {
            assignToAllGroup.style.display = 'flex';
        }
        // Ukryj pole wyboru użytkownika (będzie pokazane gdy odznaczy checkbox)
        if (userSelectGroup) {
            userSelectGroup.style.display = 'none';
        }
        userSelect.value = '';
    }
    
    modal.style.display = 'block';
}

// Zamknij modal przypisywania zadania
function closeAssignTaskModal() {
    const modal = document.getElementById('assign-task-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.querySelector('#assign-task-modal form');
    if (form) {
        form.reset();
    }
}

// Przypisz zadanie z modala
async function assignTaskFromModal() {
    const dayNumber = parseInt(document.getElementById('assign-day-modal').value);
    const taskTemplateId = document.getElementById('assign-task-select-modal').value;
    const assignToAll = document.getElementById('assign-to-all').checked;
    const userId = document.getElementById('assign-user-modal').value;
    
    if (!dayNumber || !taskTemplateId) {
        showNotification('Wypełnij wszystkie pola', 'error');
        return;
    }
    
    const calendarDay = allCalendarDays.find(d => d.day_number === dayNumber);
    if (!calendarDay) {
        showNotification('Nie znaleziono dnia kalendarza', 'error');
        return;
    }
    
    // Uwzględnij wszystkich użytkowników (w tym adminów) - żeby admin mógł testować zadania
    const usersToAssign = assignToAll ? allUsers : [allUsers.find(u => u.id === userId)];
    
    if (usersToAssign.length === 0) {
        showNotification('Brak użytkowników do przypisania', 'error');
        return;
    }
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const user of usersToAssign) {
            // Sprawdź czy zadanie już istnieje
            const { data: existingTasks, error: checkError } = await supabase
                .from('assigned_tasks')
                .select('*')
                .eq('user_id', user.id)
                .eq('calendar_day_id', calendarDay.id)
                .limit(1);
            
            const existing = existingTasks && existingTasks.length > 0 ? existingTasks[0] : null;
            
            if (existing) {
                // Aktualizuj istniejące zadanie
                const { error } = await supabase
                    .from('assigned_tasks')
                    .update({
                        task_template_id: taskTemplateId,
                        assigned_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                
                if (error) {
                    errorCount++;
                    console.error(`Błąd aktualizacji zadania dla ${user.email}:`, error);
                } else {
                    successCount++;
                }
            } else {
                // Utwórz nowe zadanie
                const { error } = await supabase
                    .from('assigned_tasks')
                    .insert({
                        user_id: user.id,
                        calendar_day_id: calendarDay.id,
                        task_template_id: taskTemplateId,
                        status: 'pending'
                    });
                
                if (error) {
                    errorCount++;
                    console.error(`Błąd tworzenia zadania dla ${user.email}:`, error);
                } else {
                    successCount++;
                }
            }
        }
        
        if (successCount > 0) {
            showNotification(`Zadanie przypisane do ${successCount} użytkowników${errorCount > 0 ? ` (${errorCount} błędów)` : ''}`, 'success');
            closeAssignTaskModal();
            await displayTasksTable();
        } else {
            showNotification('Nie udało się przypisać zadania', 'error');
        }
        
    } catch (error) {
        console.error('Błąd przypisywania zadania:', error);
        showNotification(error.message || 'Błąd przypisywania zadania', 'error');
    }
}

// Przypisz zadanie do konkretnej komórki (z tabeli) - dostępne globalnie
window.assignTaskToCell = function(userId, dayNumber) {
    console.log('assignTaskToCell wywołane:', userId, dayNumber);
    try {
        openAssignTaskModal(dayNumber, userId);
    } catch (error) {
        console.error('Błąd w assignTaskToCell:', error);
        showNotification('Błąd otwierania modalu przypisywania zadania', 'error');
    }
};

// Otwórz szczegóły zadania (z tabeli) - dostępne globalnie
window.openTaskCell = async function(userId, dayNumber, taskId) {
    console.log('openTaskCell wywołane:', userId, dayNumber, taskId);
    try {
        const user = allUsers.find(u => u.id === userId);
        if (!user) {
            console.error('Nie znaleziono użytkownika:', userId);
            showNotification('Nie znaleziono użytkownika', 'error');
            return;
        }
        
        // Pobierz szczegóły zadania
        const { data: taskData, error: taskError } = await supabase
            .from('assigned_tasks')
            .select(`
                *,
                calendar_days (*),
                task_templates (*)
            `)
            .eq('id', taskId)
            .single();
        
        if (taskError) {
            console.error('Błąd pobierania zadania:', taskError);
            showNotification('Błąd pobierania szczegółów zadania', 'error');
            return;
        }
        
        if (!taskData) {
            showNotification('Nie znaleziono zadania', 'error');
            return;
        }
        
        // Wyświetl modal ze szczegółami
        await showTaskDetailsModal(taskData, user);
        
    } catch (error) {
        console.error('Błąd w openTaskCell:', error);
        showNotification('Błąd otwierania szczegółów zadania', 'error');
    }
};

// Funkcja wyświetlająca modal ze szczegółami zadania
async function showTaskDetailsModal(task, user) {
    const modal = document.getElementById('task-details-modal');
    const modalTitle = document.getElementById('task-details-modal-title');
    const modalBody = document.getElementById('task-details-modal-body');
    
    if (!modal || !modalTitle || !modalBody) {
        console.error('Nie znaleziono elementów modalu');
        return;
    }
    
    const day = task.calendar_days;
    const template = task.task_templates;
    const taskType = template?.task_type || 'text_response';
    
    const taskTypeLabels = {
        'text_response': 'Bez weryfikacji',
        'text_response_verified': 'Odpowiedź tekstowa (z weryfikacją)',
        'quiz': 'Quiz',
        'photo_upload': 'Dodaj zdjęcie',
        'checkbox': 'Checkbox',
        'custom': 'Niestandardowe'
    };
    
    const statusLabels = {
        'pending': 'Oczekujące',
        'in_progress': 'W trakcie',
        'completed': 'Wykonane'
    };
    
    const statusColors = {
        'pending': '#8e8e93',
        'in_progress': '#013927',
        'completed': '#013927'
    };
    
    // Tytuł modalu
    modalTitle.textContent = `Dzień ${day ? day.day_number : '?'} - ${template ? template.title : 'Brak szablonu'}`;
    
    // Funkcja do renderowania odpowiedzi quizowych
    const renderQuizAnswers = (metadata) => {
        if (!metadata || !metadata.answers) return '';
        
        let html = '<div style="margin-top: 12px; padding: 12px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">';
        html += '<p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Odpowiedzi użytkownika:</p>';
        
        if (Array.isArray(metadata.answers)) {
            metadata.answers.forEach((answer, index) => {
                const questionText = answer.question || `Pytanie ${index + 1}`;
                const userAnswer = answer.user_answer || answer.answer || 'Brak odpowiedzi';
                const isCorrect = answer.is_correct !== undefined ? answer.is_correct : null;
                
                html += `<div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px;">`;
                html += `<p style="font-weight: 500; font-size: 0.8125rem; margin-bottom: 4px; color: #1d1d1f;">${questionText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
                html += `<p style="font-size: 0.8125rem; color: #6e6e73;">Odpowiedź: <strong>${String(userAnswer).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></p>`;
                if (isCorrect !== null) {
                    html += `<p style="font-size: 0.8125rem; color: ${isCorrect ? '#013927' : '#d32f2f'}; margin-top: 4px;">${isCorrect ? '✓ Poprawna' : '✗ Niepoprawna'}</p>`;
                }
                html += `</div>`;
            });
        } else if (typeof metadata.answers === 'object') {
            Object.keys(metadata.answers).forEach((key, index) => {
                const answer = metadata.answers[key];
                const questionText = answer.question || key || `Pytanie ${index + 1}`;
                const userAnswer = answer.user_answer || answer.answer || answer || 'Brak odpowiedzi';
                const isCorrect = answer.is_correct !== undefined ? answer.is_correct : null;
                
                html += `<div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px;">`;
                html += `<p style="font-weight: 500; font-size: 0.8125rem; margin-bottom: 4px; color: #1d1d1f;">${questionText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
                html += `<p style="font-size: 0.8125rem; color: #6e6e73;">Odpowiedź: <strong>${String(userAnswer).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></p>`;
                if (isCorrect !== null) {
                    html += `<p style="font-size: 0.8125rem; color: ${isCorrect ? '#013927' : '#d32f2f'}; margin-top: 4px;">${isCorrect ? '✓ Poprawna' : '✗ Niepoprawna'}</p>`;
                }
                html += `</div>`;
            });
        }
        
        if (metadata.score !== undefined || metadata.total_score !== undefined) {
            const score = metadata.score || 0;
            const total = metadata.total_score || metadata.total || 0;
            html += `<p style="margin-top: 12px; font-weight: 500; font-size: 0.875rem; color: #1d1d1f;">Wynik: ${score}/${total} punktów</p>`;
        }
        
        html += '</div>';
        return html;
    };
    
    // Funkcja do renderowania zdjęcia (taki sam flow jak w sekcji weryfikacji)
    const renderPhoto = (photoUrl) => {
        if (!photoUrl) return '';
        
        // Zbuduj publiczny URL jak w displayVerificationTasks
        let finalUrl = photoUrl;
        if (!finalUrl.includes('/storage/v1/object/public/')) {
            const projectUrl = window.SUPABASE_CONFIG?.URL || '';
            if (projectUrl) {
                const baseUrl = projectUrl.replace(/\/$/, '');
                
                // Wyciągnij ścieżkę pliku z oryginalnego URL
                let filePathFromUrl = photoUrl;
                if (photoUrl.includes('task-responses/')) {
                    const match = photoUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
                    if (match) {
                        filePathFromUrl = match[1].replace(/^\/+/, '');
                    }
                } else if (!photoUrl.startsWith('http')) {
                    filePathFromUrl = photoUrl.replace(/^\/+/, '');
                } else {
                    const parts = photoUrl.split('/');
                    filePathFromUrl = parts[parts.length - 1];
                }
                
                finalUrl = `${baseUrl}/storage/v1/object/public/task-responses/${filePathFromUrl}`;
            }
        }
        
        // Wyciągnij ścieżkę pliku do ewentualnego pobrania podpisanego URL
        let filePath = '';
        if (finalUrl.includes('/task-responses/')) {
            const match = finalUrl.match(/task-responses\/(.+?)(\?|$)/);
            if (match) {
                filePath = match[1];
            }
        } else if (photoUrl.includes('task-responses/')) {
            const match = photoUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
            if (match) {
                filePath = match[1].replace(/^\/+/, '');
            }
        } else if (!photoUrl.startsWith('http')) {
            filePath = photoUrl.replace(/^\/+/, '');
        }
        if (filePath.includes('?')) {
            filePath = filePath.split('?')[0];
        }
        
        const escapedFinalUrl = finalUrl.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const escapedFilePath = (filePath || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
            <div style="margin-top: 12px; padding: 12px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">
                <p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Zdjęcie przesłane przez użytkownika:</p>
                <div class="verification-photo-container" data-file-path="${escapedFilePath}">
                    <button onclick="showAdminPhotoModal('${escapedFinalUrl}', '${escapedFilePath}')"
                            class="btn btn-secondary"
                            style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 0.875rem; font-weight: 500; border: 2px solid #1a5d1a; background: white; color: #1a5d1a; cursor: pointer; border-radius: 6px; transition: all 0.2s;"
                            onmouseover="this.style.background='#1a5d1a'; this.style.color='white';"
                            onmouseout="this.style.background='white'; this.style.color='#1a5d1a';">
                        📷 Zobacz zdjęcie
                    </button>
                </div>
            </div>
        `;
    };
    
    // Zbuduj zawartość modalu
    let content = `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <p style="margin: 0; font-size: 0.875rem; color: #6e6e73;">Użytkownik: <strong style="color: #1d1d1f;">${(user.display_name || user.email).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></p>
                    <p style="margin: 4px 0 0 0; font-size: 0.875rem; color: #6e6e73;">Email: ${user.email.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                </div>
                <span class="status-badge" style="background: ${statusColors[task.status]}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.8125rem; font-weight: 500;">
                    ${statusLabels[task.status]}
                </span>
            </div>
            
            <div style="padding: 16px; background: #f5f5f7; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-size: 0.875rem; color: #6e6e73;"><strong style="color: #1d1d1f;">Typ zadania:</strong> ${taskTypeLabels[taskType] || taskType}</p>
                ${template ? `<p style="margin: 8px 0; font-size: 0.875rem; color: #6e6e73;"><strong style="color: #1d1d1f;">Opis:</strong> ${(template.description || 'Brak opisu').replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ''}
                ${task.assigned_at ? `<p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #6e6e73;"><strong style="color: #1d1d1f;">Przypisano:</strong> ${new Date(task.assigned_at).toLocaleString('pl-PL')}</p>` : ''}
                ${task.completed_at ? `<p style="margin: 8px 0 0 0; font-size: 0.875rem; color: #6e6e73;"><strong style="color: #1d1d1f;">Wykonano:</strong> ${new Date(task.completed_at).toLocaleString('pl-PL')}</p>` : ''}
            </div>
    `;
    
    // Jeśli zadanie jest wykonane, pokaż odpowiedzi
    if (task.status === 'completed') {
        // Odpowiedź tekstowa
        if (taskType === 'text_response' || taskType === 'text_response_verified') {
            if (task.response_text) {
                content += `
                    <div style="margin-top: 16px; padding: 16px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">
                        <p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Odpowiedź użytkownika:</p>
                        <p style="color: #1d1d1f; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${task.response_text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                    </div>
                `;
            } else {
                content += `<p style="color: #6e6e73; font-size: 0.875rem; margin-top: 16px;">Użytkownik nie dodał odpowiedzi tekstowej.</p>`;
            }
        }
        
        // Zdjęcie
        if (taskType === 'photo_upload') {
            content += renderPhoto(task.response_media_url);
        }
        
        // Quiz
        if (taskType === 'quiz') {
            // Spróbuj obsłużyć quiz o użytkownikach (quiz_type === user_quiz)
            let quizMeta = template?.metadata || {};
            if (typeof quizMeta === 'string') {
                try {
                    quizMeta = JSON.parse(quizMeta);
                } catch (e) {
                    quizMeta = {};
                }
            }
            
            const isUserQuiz = quizMeta?.quiz_type === 'user_quiz' || !!quizMeta?.target_user_id;
            let quizHtml = '';
            
            if (isUserQuiz && supabase) {
                try {
                    // Pobierz próbę quizu
                    let attempt = null;
                    if (task.response_metadata?.quiz_attempt_id) {
                        const { data, error } = await supabase
                            .from('quiz_attempts')
                            .select('*')
                            .eq('id', task.response_metadata.quiz_attempt_id)
                            .maybeSingle();
                        if (!error) attempt = data;
                    }
                    
                    // Jeśli nie ma zapisanej próby, spróbuj wziąć ostatnią dla tego assigned_task
                    if (!attempt) {
                        const { data, error } = await supabase
                            .from('quiz_attempts')
                            .select('*')
                            .eq('assigned_task_id', task.id)
                            .order('completed_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                        if (!error && data) attempt = data;
                    }
                    
                    const questionIds = quizMeta.question_ids || [];
                    const targetUserId = quizMeta.target_user_id;
                    
                    if (attempt && Array.isArray(questionIds) && questionIds.length > 0 && targetUserId) {
                        const { data: questions, error: qErr } = await supabase
                            .from('user_quiz_questions')
                            .select('*')
                            .in('id', questionIds)
                            .eq('target_user_id', targetUserId);
                        
                        if (!qErr && questions && questions.length > 0) {
                            const questionAnswers = attempt.question_answers || {};
                            const passingScore = quizMeta.passing_score || 5;
                            const score = attempt.score || 0;
                            const total = attempt.total_questions || questions.length;
                            const passed = score >= passingScore;
                            
                            quizHtml += `
                                <div style="margin-top: 16px; padding: 16px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">
                                    <p style="font-weight: 600; margin: 0 0 8px 0; color: #1d1d1f;">Wynik quizu o użytkowniku:</p>
                                    <p style="margin: 0; color: ${passed ? '#013927' : '#d32f2f'}; font-weight: 600;">
                                        ${passed ? '✓ Quiz zaliczony' : '✗ Quiz niezaliczony'} — ${score}/${total} (próg: ${passingScore})
                                    </p>
                                </div>
                            `;
                            
                            quizHtml += questions.map((q, idx) => {
                                const userAnswer = questionAnswers[q.id];
                                const isCorrect = userAnswer === q.target_user_answer;
                                const opt1Selected = userAnswer === 1;
                                const opt2Selected = userAnswer === 2;
                                
                                return `
                                    <div style="margin-top: 12px; padding: 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e8e8ed;">
                                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #1d1d1f;">${idx + 1}. ${q.question_text}</p>
                                        <div style="padding: 10px; margin-bottom: 8px; border: 2px solid ${opt1Selected ? (isCorrect ? '#28a745' : '#d32f2f') : '#e8e8ed'}; border-radius: 8px; background: ${opt1Selected ? (isCorrect ? '#d4edda' : '#f8d7da') : 'white'};">
                                            ${q.option_1} ${opt1Selected ? (isCorrect ? '✓' : '✗') : ''}
                                        </div>
                                        <div style="padding: 10px; border: 2px solid ${opt2Selected ? (isCorrect ? '#28a745' : '#d32f2f') : '#e8e8ed'}; border-radius: 8px; background: ${opt2Selected ? (isCorrect ? '#d4edda' : '#f8d7da') : 'white'};">
                                            ${q.option_2} ${opt2Selected ? (isCorrect ? '✓' : '✗') : ''}
                                        </div>
                                        <p style="margin: 8px 0 0 0; font-size: 0.8125rem; color: ${isCorrect ? '#013927' : '#d32f2f'};">${isCorrect ? 'Poprawna odpowiedź' : 'Niepoprawna odpowiedź'}</p>
                                    </div>
                                `;
                            }).join('');
                        }
                    }
                    
                    if (!quizHtml) {
                        quizHtml = renderQuizAnswers(task.response_metadata);
                    }
                } catch (err) {
                    console.error('Błąd pobierania szczegółów quizu o użytkownikach:', err);
                    quizHtml = renderQuizAnswers(task.response_metadata);
                }
            } else {
                quizHtml = renderQuizAnswers(task.response_metadata);
            }
            
            content += quizHtml;
        }
    } else {
        content += `<p style="color: #6e6e73; font-size: 0.875rem; margin-top: 16px; font-style: italic;">Zadanie nie zostało jeszcze wykonane.</p>`;
    }
    
    content += `</div>`;
    
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

// Funkcja zamykania modalu szczegółów zadania
function closeTaskDetailsModal() {
    const modal = document.getElementById('task-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Usuń przypisane zadanie z tabeli - dostępne globalnie
window.deleteAssignedTask = async function(taskId, userId, dayNumber) {
    if (!confirm('Czy na pewno chcesz usunąć to zadanie?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('assigned_tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        showNotification('Zadanie zostało usunięte', 'success');
        
        // Odśwież tabelę zadań
        await displayTasksTable();
        
    } catch (error) {
        console.error('Błąd usuwania zadania:', error);
        showNotification('Błąd usuwania zadania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// Funkcja do wyświetlania zdjęcia w modalu w panelu admina
window.showAdminPhotoModal = async function(photoUrl, filePath) {
    // Utwórz modal do wyświetlenia zdjęcia
    let photoModal = document.getElementById('admin-photo-modal');
    
    if (!photoModal) {
        // Utwórz modal jeśli nie istnieje
        photoModal = document.createElement('div');
        photoModal.id = 'admin-photo-modal';
        photoModal.className = 'modal';
        photoModal.style.display = 'none';
        photoModal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh; padding: 20px; position: relative;">
                <span class="close" id="close-admin-photo-modal" style="position: absolute; top: 10px; right: 20px; font-size: 28px; font-weight: bold; cursor: pointer; color: #1a5d1a; z-index: 10;">&times;</span>
                <div style="text-align: center;">
                    <div id="admin-photo-loading" style="padding: 40px; color: #6e6e73;">Ładowanie zdjęcia...</div>
                    <img id="admin-modal-photo-img" src="" alt="Zdjęcie zadania" style="max-width: 100%; max-height: 85vh; border-radius: 8px; border: 1px solid #e8e8ed; display: none;">
                    <div id="admin-photo-error" style="display: none; padding: 40px; color: #d32f2f;">
                        <p>⚠️ Nie można załadować zdjęcia</p>
                        <p id="admin-photo-error-details" style="font-size: 0.875rem; margin-top: 12px; color: #6e6e73;"></p>
                        <button onclick="this.closest('.modal').style.display='none'" class="btn btn-secondary" style="margin-top: 16px;">Zamknij</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(photoModal);
        
        // Obsługa zamykania modala
        document.getElementById('close-admin-photo-modal').addEventListener('click', () => {
            photoModal.style.display = 'none';
        });
        
        // Zamknij przy kliknięciu poza modalem
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                photoModal.style.display = 'none';
            }
        });
    }
    
    // Pokaż modal
    photoModal.style.display = 'block';
    
    // Pokaż loading
    const loadingDiv = document.getElementById('admin-photo-loading');
    const photoImg = document.getElementById('admin-modal-photo-img');
    const errorDiv = document.getElementById('admin-photo-error');
    
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (photoImg) photoImg.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';
    
    // Walidacja parametrów
    console.log('🔍 showAdminPhotoModal - photoUrl:', photoUrl);
    console.log('🔍 showAdminPhotoModal - filePath:', filePath);
    
    if (!photoUrl) {
        console.error('❌ Brak URL zdjęcia');
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'block';
        return;
    }
    
    // Wyciągnij ścieżkę pliku z URL jeśli nie została podana
    let pathToUse = filePath;
    
    // Jeśli nie mamy ścieżki, spróbuj wyciągnąć ją z URL
    if (!pathToUse || pathToUse.trim() === '') {
        console.log('🔍 Brak ścieżki pliku, próbuję wyciągnąć z URL');
        
        if (photoUrl) {
            // Różne formaty URL
            if (photoUrl.includes('/task-responses/')) {
                const match = photoUrl.match(/task-responses\/(.+?)(\?|$)/);
                if (match) {
                    pathToUse = match[1];
                }
            } else if (photoUrl.includes('task-responses/')) {
                const match = photoUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
                if (match) {
                    pathToUse = match[1].replace(/^\/+/, '');
                }
            } else if (!photoUrl.startsWith('http')) {
                // Może to być już sama ścieżka
                pathToUse = photoUrl.replace(/^\/+/, '');
            } else {
                // Spróbuj wyciągnąć z końca URL
                const parts = photoUrl.split('/');
                const lastPart = parts[parts.length - 1];
                if (lastPart && lastPart !== photoUrl) {
                    pathToUse = lastPart;
                }
            }
        }
    }
    
    // Usuń query string i fragmenty ze ścieżki
    if (pathToUse) {
        pathToUse = pathToUse.split('?')[0].split('#')[0].trim();
        // Usuń bucket name z początku jeśli jest
        if (pathToUse.startsWith('task-responses/')) {
            pathToUse = pathToUse.replace(/^task-responses\//, '');
        }
    }
    
    console.log('🔍 Wyciągnięta ścieżka pliku:', pathToUse);
    
    // Załaduj zdjęcie - najpierw spróbuj publicznego URL
    if (photoImg) {
        let triedSignedUrl = false;
        
        photoImg.onload = function() {
            console.log('✅ Zdjęcie załadowane pomyślnie');
            if (loadingDiv) loadingDiv.style.display = 'none';
            photoImg.style.display = 'block';
        };
        
        photoImg.onerror = async function() {
            if (triedSignedUrl) {
                // Jeśli już próbowaliśmy signed URL, pokaż błąd
                console.error('❌ Nie można załadować zdjęcia nawet z signed URL');
                if (loadingDiv) loadingDiv.style.display = 'none';
                if (errorDiv) errorDiv.style.display = 'block';
                photoImg.style.display = 'none';
                return;
            }
            
            console.warn('⚠️ Błąd ładowania zdjęcia publicznym URL, próbuję signed URL');
            
            // Jeśli URL wygląda na signed URL, nie próbuj generować go ponownie
            if (photoUrl.includes('?token=') || photoUrl.includes('&token=')) {
                console.log('⚠️ URL wygląda na signed URL - sprawdzam czy można go użyć');
                // Spróbuj załadować ponownie (może to problem z CORS lub czasem)
                photoImg.src = photoUrl + (photoUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
                return;
            }
            
            triedSignedUrl = true;
            
            // Spróbuj użyć signed URL jako fallback
            if (pathToUse && pathToUse.trim() !== '' && window.supabase) {
                try {
                    console.log('🔐 Próbuję wygenerować signed URL dla ścieżki:', pathToUse);
                    
                    const { data, error } = await window.supabase.storage
                        .from('task-responses')
                        .createSignedUrl(pathToUse, 3600);
                    
                    if (error) {
                        console.error('❌ Błąd generowania signed URL:', error);
                    } else if (data && data.signedUrl) {
                        console.log('✅ Wygenerowano signed URL');
                        // Resetuj handler błędu aby uniknąć pętli
                        photoImg.onerror = function() {
                            console.error('❌ Błąd ładowania signed URL');
                            if (loadingDiv) loadingDiv.style.display = 'none';
                            if (errorDiv) errorDiv.style.display = 'block';
                            photoImg.style.display = 'none';
                        };
                        photoImg.src = data.signedUrl;
                        return;
                    } else {
                        console.error('❌ Brak signed URL w odpowiedzi');
                    }
                } catch (signedError) {
                    console.error('❌ Błąd generowania signed URL (catch):', signedError);
                }
            } else {
                console.error('❌ Brak ścieżki pliku lub supabase');
            }
            
            // Jeśli wszystko zawiodło, pokaż błąd
            const errorDetails = document.getElementById('admin-photo-error-details');
            if (errorDetails) {
                let details = 'URL: ' + (photoUrl || 'brak');
                if (pathToUse) {
                    details += '<br>Ścieżka: ' + pathToUse;
                }
                errorDetails.innerHTML = details;
            }
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (errorDiv) errorDiv.style.display = 'block';
            photoImg.style.display = 'none';
        };
        
        // Spróbuj załadować zdjęcie
        console.log('📤 Próbuję załadować zdjęcie z URL:', photoUrl);
        photoImg.src = photoUrl;
    }
};

// Funkcja pomocnicza do ładowania zdjęcia z signed URL (jeśli publiczny nie działa)
// Funkcja pomocnicza do ładowania signed URL dla zdjęć w widoku zadań użytkownika
window.loadSignedUrlForPhoto = async function(imgElement, filePath) {
    if (!imgElement || !filePath) {
        console.error('Brak parametrów dla loadSignedUrlForPhoto');
        return;
    }
    
    try {
        // Wyczyść ścieżkę
        let cleanPath = filePath;
        if (cleanPath.includes('task-responses/')) {
            const match = cleanPath.match(/task-responses[\/]?(.+?)(\?|$)/);
            if (match) {
                cleanPath = match[1].replace(/^\/+/, '');
            }
        }
        cleanPath = cleanPath.split('?')[0].split('#')[0].trim();
        
        if (!window.supabase) {
            console.error('Supabase nie jest dostępny');
            return;
        }
        
        // Generuj signed URL
        const { data, error } = await window.supabase.storage
            .from('task-responses')
            .createSignedUrl(cleanPath, 3600);
        
        if (error) {
            console.error('Błąd generowania signed URL:', error);
            return;
        }
        
        if (data && data.signedUrl) {
            imgElement.src = data.signedUrl;
            imgElement.style.display = 'block';
            // Ukryj komunikat błędu jeśli istnieje
            const errorDiv = imgElement.nextElementSibling;
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Błąd w loadSignedUrlForPhoto:', err);
    }
};

window.loadSignedUrl = async function(imgElement, filePathOrUrl) {
    try {
        if (!window.supabase || !filePathOrUrl) {
            console.error('❌ Brak supabase lub ścieżki pliku');
            return;
        }
        
        // Wyciągnij ścieżkę pliku z URL lub użyj bezpośrednio
        let filePath = filePathOrUrl;
        
        // Jeśli to URL, wyciągnij ścieżkę
        if (filePathOrUrl.includes('/task-responses/')) {
            const match = filePathOrUrl.match(/task-responses\/(.+?)(\?|$)/);
            if (match) {
                filePath = match[1];
            }
        } else if (filePathOrUrl.includes('task-responses/')) {
            const match = filePathOrUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
            if (match) {
                filePath = match[1].replace(/^\/+/, '');
            }
        }
        
        // Usuń query string jeśli istnieje
        if (filePath.includes('?')) {
            filePath = filePath.split('?')[0];
        }
        
        if (!filePath || filePath === filePathOrUrl && filePathOrUrl.startsWith('http')) {
            console.warn('⚠️ Nie udało się wyciągnąć ścieżki pliku z:', filePathOrUrl);
            // Spróbuj użyć całości jako ścieżki (może być już ścieżką)
            filePath = filePathOrUrl;
        }
        
        console.log('🔐 Generowanie signed URL dla ścieżki:', filePath);
        
        // Spróbuj pobrać signed URL
        const { data, error } = await window.supabase.storage
            .from('task-responses')
            .createSignedUrl(filePath, 3600); // URL ważny przez 1 godzinę
        
        if (error) {
            console.error('❌ Błąd generowania signed URL:', error);
            console.error('❌ Używana ścieżka:', filePath);
            imgElement.style.display = 'none';
            const errorDiv = imgElement.parentElement?.querySelector('.photo-error');
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        if (data && data.signedUrl) {
            console.log('✅ Użyto signed URL');
            imgElement.src = data.signedUrl;
            imgElement.style.display = 'block';
            imgElement.onerror = null; // Reset error handler
            
            // Zaktualizuj też link jeśli istnieje
            const link = imgElement.closest('.verification-photo-container')?.querySelector('a');
            if (link) {
                link.href = data.signedUrl;
            }
        } else {
            console.error('❌ Brak signed URL w odpowiedzi');
            imgElement.style.display = 'none';
            const errorDiv = imgElement.parentElement?.querySelector('.photo-error');
            if (errorDiv) {
                errorDiv.style.display = 'block';
            }
        }
    } catch (err) {
        console.error('❌ Błąd w loadSignedUrl:', err);
        imgElement.style.display = 'none';
        const errorDiv = imgElement.parentElement?.querySelector('.photo-error');
        if (errorDiv) {
            errorDiv.style.display = 'block';
        }
    }
};

// Załaduj zadania do weryfikacji
async function loadVerificationTasks() {
    console.log('🔍 loadVerificationTasks wywołana');
    const listContainer = document.getElementById('verification-tasks-list');
    
    // Jeśli kontener nie istnieje (sekcja nie jest widoczna), nie ładuj zadań
    if (!listContainer) {
        console.log('⚠️ Sekcja weryfikacji nie jest widoczna - pomijam ładowanie zadań');
        return;
    }
    
    console.log('✅ Kontener verification-tasks-list znaleziony');
    
    try {
        // Pobierz zadania ze statusem pending_verification (zadania czekające na weryfikację)
        // Usunięto warunek o zdjęciu - zadania mogą wymagać weryfikacji bez zdjęcia
        // Używamy left join, aby nie pomijać zadań bez powiązań
        console.log('🔍 Ładowanie zadań do weryfikacji...');
        const { data: tasks, error } = await supabase
            .from('assigned_tasks')
            .select(`
                *,
                calendar_days(day_number),
                task_templates(title, task_type)
            `)
            .eq('status', 'pending_verification')
            .order('completed_at', { ascending: false });
        
        console.log('🔍 Wynik zapytania - zadania:', tasks?.length || 0, 'błąd:', error);
        
        // Pobierz dane użytkowników osobno, bo może nie być foreign key
        let tasksWithUsers = [];
        if (tasks && tasks.length > 0) {
            const userIds = [...new Set(tasks.map(t => t.user_id).filter(id => id))];
            const { data: users, error: usersError } = await supabase
                .from('profiles')
                .select('id, email, display_name')
                .in('id', userIds);
            
            const usersMap = {};
            if (users) {
                users.forEach(user => {
                    usersMap[user.id] = user;
                });
            }
            
            tasksWithUsers = tasks.map(task => ({
                ...task,
                profiles: usersMap[task.user_id] || null
            }));
        }
        
        if (error) {
            console.error('❌ Błąd ładowania zadań do weryfikacji:', error);
            console.error('❌ Szczegóły błędu:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            // NIE pokazuj powiadomienia o błędzie - po prostu wyświetl pustą listę
            displayVerificationTasks([]);
            return;
        }
        
        console.log('📋 Pobrane zadania do weryfikacji:', tasksWithUsers);
        console.log('📋 Liczba zadań:', tasksWithUsers?.length || 0);
        
        // Sprawdź czy zadania mają wszystkie potrzebne dane (joiny)
        if (tasksWithUsers && tasksWithUsers.length > 0) {
            tasksWithUsers.forEach((task, index) => {
                console.log(`📋 Zadanie ${index + 1}:`, {
                    id: task.id,
                    status: task.status,
                    calendar_days: task.calendar_days,
                    task_templates: task.task_templates,
                    profiles: task.profiles,
                    response_media_url: task.response_media_url
                });
            });
        }
        
        displayVerificationTasks(tasksWithUsers || []);
    } catch (error) {
        console.error('Błąd w loadVerificationTasks:', error);
        // NIE pokazuj powiadomienia o błędzie - po prostu wyświetl pustą listę
        displayVerificationTasks([]);
    }
}

// Wyświetl zadania do weryfikacji
function displayVerificationTasks(tasks) {
    const listContainer = document.getElementById('verification-tasks-list');
    
    if (!listContainer) {
        console.error('Nie znaleziono kontenera verification-tasks-list');
        return;
    }
    
    if (tasks.length === 0) {
        listContainer.innerHTML = '<p style="color: #6e6e73; text-align: center; padding: 40px;">Brak zadań oczekujących na weryfikację</p>';
        return;
    }
    
    listContainer.innerHTML = `
        <div class="verification-tasks-grid">
            ${tasks.map(task => {
                const day = task.calendar_days;
                const template = task.task_templates;
                const user = task.profiles;
                const userName = user?.display_name || user?.email || 'Nieznany użytkownik';
                const photoUrl = task.response_media_url;
                const responseText = task.response_text;
                const taskType = template?.task_type || 'text_response';
                
                return `
                    <div class="verification-task-card">
                        <div class="verification-task-header">
                            <div>
                                <h3>Dzień ${day?.day_number || '?'} - ${template?.title || 'Brak tytułu'}</h3>
                                <p style="color: #6e6e73; font-size: 0.875rem; margin-top: 4px;">Użytkownik: ${userName}</p>
                                <p style="color: #6e6e73; font-size: 0.8125rem; margin-top: 2px;">Typ: ${taskType === 'photo_upload' ? 'Zdjęcie' : taskType === 'text_response_verified' ? 'Odpowiedź tekstowa' : 'Inne'}</p>
                                ${task.completed_at ? `<p style="color: #6e6e73; font-size: 0.8125rem; margin-top: 2px;">Przesłano: ${new Date(task.completed_at).toLocaleString('pl-PL')}</p>` : ''}
                            </div>
                        </div>
                        ${taskType === 'text_response_verified' && responseText ? `
                            <div style="margin-top: 16px; padding: 16px; background: #f5f5f7; border-radius: 8px; border: 1px solid #e8e8ed;">
                                <p style="font-weight: 500; margin-bottom: 8px; color: #1d1d1f; font-size: 0.875rem;">Odpowiedź użytkownika:</p>
                                <p style="color: #1d1d1f; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${responseText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                            </div>
                        ` : ''}
                        ${photoUrl ? (() => {
                            // Funkcja do wygenerowania signed URL (jeśli publiczny nie działa)
                            async function getPhotoUrl(url) {
                                if (!url) return null;
                                
                                // Najpierw spróbuj użyć publicznego URL
                                let finalUrl = url;
                                
                                // Jeśli URL nie zawiera pełnej ścieżki, spróbuj go naprawić
                                if (!finalUrl.includes('/storage/v1/object/public/')) {
                                    const projectUrl = window.SUPABASE_CONFIG?.URL || '';
                                    if (projectUrl) {
                                        const baseUrl = projectUrl.replace(/\/$/, '');
                                        
                                        // Wyciągnij ścieżkę pliku
                                        let filePath = url;
                                        if (url.includes('task-responses/')) {
                                            const match = url.match(/task-responses[\/]?(.+)$/);
                                            if (match) filePath = match[1].replace(/^\/+/, '');
                                        } else if (!url.startsWith('http')) {
                                            filePath = url;
                                        }
                                        
                                        finalUrl = `${baseUrl}/storage/v1/object/public/task-responses/${filePath}`;
                                    }
                                }
                                
                                return finalUrl;
                            }
                            
                            // Wygeneruj URL (synchronizacja dla template string)
                            let finalUrl = photoUrl;
                            
                            // Jeśli URL nie zawiera pełnej ścieżki, zbuduj ją
                            if (!finalUrl.includes('/storage/v1/object/public/')) {
                                const projectUrl = window.SUPABASE_CONFIG?.URL || '';
                                if (projectUrl) {
                                    const baseUrl = projectUrl.replace(/\/$/, '');
                                    
                                    // Wyciągnij ścieżkę pliku z oryginalnego URL
                                    let filePathFromUrl = photoUrl;
                                    
                                    // Jeśli URL zawiera już część ścieżki, wyciągnij ją
                                    if (photoUrl.includes('task-responses/')) {
                                        const match = photoUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
                                        if (match) {
                                            filePathFromUrl = match[1].replace(/^\/+/, '');
                                        }
                                    } else if (!photoUrl.startsWith('http')) {
                                        // Jeśli to tylko ścieżka bez http
                                        filePathFromUrl = photoUrl.replace(/^\/+/, '');
                                    } else {
                                        // Jeśli to pełny URL ale bez storage path, spróbuj wyciągnąć ostatnią część
                                        const parts = photoUrl.split('/');
                                        filePathFromUrl = parts[parts.length - 1];
                                    }
                                    
                                    finalUrl = `${baseUrl}/storage/v1/object/public/task-responses/${filePathFromUrl}`;
                                }
                            }
                            
                            // Wyciągnij ścieżkę pliku z finalnego URL (bez bucket name i query string)
                            let filePath = '';
                            if (finalUrl.includes('/task-responses/')) {
                                const match = finalUrl.match(/task-responses\/(.+?)(\?|$)/);
                                if (match) {
                                    filePath = match[1];
                                }
                            } else if (photoUrl.includes('task-responses/')) {
                                // Fallback - wyciągnij z oryginalnego URL
                                const match = photoUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
                                if (match) {
                                    filePath = match[1].replace(/^\/+/, '');
                                }
                            } else if (!photoUrl.startsWith('http')) {
                                // Jeśli to tylko ścieżka
                                filePath = photoUrl.replace(/^\/+/, '');
                            }
                            
                            // Usuń query string jeśli istnieje
                            if (filePath.includes('?')) {
                                filePath = filePath.split('?')[0];
                            }
                            
                            console.log('🔍 displayVerificationTasks - photoUrl:', photoUrl);
                            console.log('🔍 displayVerificationTasks - finalUrl:', finalUrl);
                            console.log('🔍 displayVerificationTasks - filePath:', filePath);
                            
                            // Escapowanie dla JavaScript string w onclick
                            const escapedFinalUrl = finalUrl.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                            const escapedFilePath = (filePath || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                            
                            return `
                            <div class="verification-photo-container" style="margin-top: 16px;" data-file-path="${filePath}">
                                <button onclick="showAdminPhotoModal('${escapedFinalUrl}', '${escapedFilePath}')" 
                                        class="btn btn-secondary" 
                                        style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 0.875rem; font-weight: 500; border: 2px solid #1a5d1a; background: white; color: #1a5d1a; cursor: pointer; border-radius: 6px; transition: all 0.2s;"
                                        onmouseover="this.style.background='#1a5d1a'; this.style.color='white';"
                                        onmouseout="this.style.background='white'; this.style.color='#1a5d1a';">
                                    📷 Zobacz zdjęcie
                                </button>
                            </div>
                            `;
                        })() : '<p style="color: #6e6e73; margin-top: 16px; font-size: 0.875rem;">📝 Zadanie bez załącznika</p>'}
                        <div class="verification-actions" style="margin-top: 16px; display: flex; gap: 12px;">
                            <button class="btn btn-primary" onclick="acceptVerificationTask('${task.id}')" style="flex: 1;">
                                ✅ Zaakceptuj
                            </button>
                            <button class="btn btn-secondary" onclick="rejectVerificationTask('${task.id}')" style="flex: 1; background: #d32f2f; color: white; border-color: #d32f2f;">
                                ❌ Odrzuć
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Zaakceptuj zadanie (dostępne globalnie)
window.acceptVerificationTask = async function(taskId) {
    if (!confirm('Czy na pewno chcesz zaakceptować to zadanie? Zadanie zostanie oznaczone jako wykonane.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('assigned_tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', taskId);
        
        if (error) throw error;
        
        showNotification('Zadanie zostało zaakceptowane', 'success');
        await loadVerificationTasks(); // Odśwież listę
    } catch (error) {
        console.error('Błąd akceptacji zadania:', error);
        showNotification('Błąd akceptacji zadania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// Odrzuć zadanie (dostępne globalnie)
window.rejectVerificationTask = async function(taskId) {
    if (!confirm('Czy na pewno chcesz odrzucić to zadanie? Zdjęcie zostanie usunięte i użytkownik będzie mógł przesłać nowe.')) {
        return;
    }
    
    try {
        // Pobierz zadanie, aby usunąć zdjęcie ze storage
        const { data: task, error: fetchError } = await supabase
            .from('assigned_tasks')
            .select('response_media_url')
            .eq('id', taskId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Usuń zdjęcie ze storage jeśli istnieje
        if (task?.response_media_url) {
            try {
                // Wyciągnij ścieżkę z URL
                const urlParts = task.response_media_url.split('/task-responses/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1].split('?')[0];
                    const { error: deleteError } = await supabase.storage
                        .from('task-responses')
                        .remove([filePath]);
                    
                    if (deleteError) {
                        console.warn('Nie udało się usunąć zdjęcia ze storage:', deleteError);
                    }
                }
            } catch (storageError) {
                console.warn('Błąd usuwania zdjęcia ze storage:', storageError);
            }
        }
        
        // Zaktualizuj status zadania na pending i usuń URL zdjęcia
        const { error } = await supabase
            .from('assigned_tasks')
            .update({
                status: 'pending',
                response_media_url: null,
                completed_at: null
            })
            .eq('id', taskId);
        
        if (error) throw error;
        
        showNotification('Zadanie zostało odrzucone. Użytkownik może przesłać nowe zdjęcie.', 'success');
        await loadVerificationTasks(); // Odśwież listę
    } catch (error) {
        console.error('Błąd odrzucania zadania:', error);
        showNotification('Błąd odrzucania zadania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
};

// =========================================================
// ZARZĄDZANIE PYTANIAMI DLA UŻYTKOWNIKÓW
// =========================================================

// Załaduj listę użytkowników z ich pytaniami
async function loadUserQuestionsList() {
    const container = document.getElementById('user-questions-list');
    if (!container) return;
    
    container.innerHTML = '<p>Ładowanie użytkowników...</p>';
    
    try {
        // Pobierz wszystkich użytkowników
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('*')
            .order('display_name', { ascending: true, nullsFirst: false });
        
        if (usersError) throw usersError;
        
        // Dla każdego użytkownika pobierz pytania
        const usersWithQuestions = await Promise.all(
            (users || []).map(async (user) => {
                const { data: questions, error: questionsError } = await supabase
                    .from('user_quiz_questions')
                    .select('*')
                    .eq('target_user_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (questionsError) {
                    console.error('Błąd ładowania pytań dla użytkownika:', user.id, questionsError);
                    return { ...user, questions: [] };
                }
                
                return { ...user, questions: questions || [] };
            })
        );
        
        displayUserQuestionsList(usersWithQuestions);
    } catch (error) {
        console.error('Błąd ładowania listy pytań użytkowników:', error);
        container.innerHTML = `<p style="color: #d32f2f;">Błąd ładowania: ${error.message}</p>`;
    }
}

// Wyświetl listę użytkowników z ich pytaniami
function displayUserQuestionsList(usersWithQuestions) {
    const container = document.getElementById('user-questions-list');
    if (!container) return;
    
    if (usersWithQuestions.length === 0) {
        container.innerHTML = '<p style="color: #6e6e73;">Brak użytkowników w systemie.</p>';
        return;
    }
    
    container.innerHTML = usersWithQuestions.map(user => {
        const userName = user.display_name || user.email || 'Brak imienia';
        const questionsCount = user.questions?.length || 0;
        const answeredCount = user.questions?.filter(q => q.target_user_answer !== null).length || 0;
        
        return `
            <div class="user-questions-card" style="
                margin-bottom: 24px;
                padding: 24px;
                background: white;
                border: 1px solid #e8e8ed;
                border-radius: 12px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 1.125rem; font-weight: 600; color: #1d1d1f;">${escapeHtml(userName)}</h3>
                        <p style="margin: 0; font-size: 0.875rem; color: #6e6e73;">${user.email}</p>
                        <p style="margin: 8px 0 0 0; font-size: 0.8125rem; color: #6e6e73;">
                            Pytania: ${questionsCount} (Odpowiedziano: ${answeredCount})
                        </p>
                    </div>
                    <button class="btn btn-primary add-question-for-user-btn" data-user-id="${user.id}" data-user-name="${escapeHtml(userName)}" style="
                        padding: 10px 20px;
                        font-size: 0.875rem;
                        min-height: 44px;
                    ">+ Dodaj pytanie</button>
                </div>
                
                <div class="user-questions-list" data-user-id="${user.id}">
                    ${user.questions && user.questions.length > 0 
                        ? user.questions.map(q => displayUserQuestionItem(q, user.id)).join('')
                        : '<p style="color: #6e6e73; font-style: italic; margin: 0;">Brak pytań dla tego użytkownika</p>'
                    }
                </div>
            </div>
        `;
    }).join('');
    
    // Dodaj event listenery dla przycisków dodawania pytań
    container.querySelectorAll('.add-question-for-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userId;
            const userName = this.dataset.userName;
            openAddUserQuestionModal(userId, userName);
        });
    });
}

// Wyświetl pojedyncze pytanie użytkownika
function displayUserQuestionItem(question, userId) {
    const isAnswered = question.target_user_answer !== null;
    const answerText = isAnswered 
        ? (question.target_user_answer === 1 ? question.option_1 : question.option_2)
        : 'Brak odpowiedzi';
    
    return `
        <div class="user-question-item" data-question-id="${question.id}" style="
            margin-bottom: 12px;
            padding: 16px;
            background: ${isAnswered ? '#f0f9f0' : '#f5f5f7'};
            border: 1px solid ${isAnswered ? '#1a5d1a' : '#e8e8ed'};
            border-radius: 8px;
        ">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; gap: 16px; margin-bottom: 8px;">
                        <span style="font-size: 0.9375rem; font-weight: 500; color: #1d1d1f;">Opcja 1: <strong>${escapeHtml(question.option_1)}</strong></span>
                        <span style="font-size: 0.9375rem; font-weight: 500; color: #1d1d1f;">Opcja 2: <strong>${escapeHtml(question.option_2)}</strong></span>
                    </div>
                    <p style="margin: 0; font-size: 0.8125rem; color: ${isAnswered ? '#1a5d1a' : '#6e6e73'};">
                        ${isAnswered ? `✓ Odpowiedź: ${escapeHtml(answerText)}` : '⏳ Oczekuje na odpowiedź'}
                    </p>
                </div>
                <div style="display: flex; gap: 8px; margin-left: 16px;">
                    <button class="btn btn-small edit-question-btn" data-question-id="${question.id}" data-user-id="${userId}" style="
                        padding: 6px 12px;
                        font-size: 0.8125rem;
                        background: white;
                        border: 1px solid #1a5d1a;
                        color: #1a5d1a;
                    ">Edytuj</button>
                    <button class="btn btn-small delete-question-btn" data-question-id="${question.id}" style="
                        padding: 6px 12px;
                        font-size: 0.8125rem;
                        background: white;
                        border: 1px solid #d32f2f;
                        color: #d32f2f;
                    ">Usuń</button>
                </div>
            </div>
        </div>
    `;
}

// Otwórz modal dodawania/edycji pytania dla użytkownika
function openAddUserQuestionModal(userId = null, userName = null) {
    const modal = document.getElementById('add-user-question-modal');
    const form = document.getElementById('add-user-question-form');
    const userSelect = document.getElementById('user-question-user-select');
    const userSelectGroup = document.getElementById('user-question-user-select-group');
    const targetUserIdInput = document.getElementById('user-question-target-user-id');
    
    // Jeśli podano userId (kliknięto przycisk przy użytkowniku), ukryj select i ustaw użytkownika
    if (userId) {
        targetUserIdInput.value = userId;
        if (userSelectGroup) {
            userSelectGroup.style.display = 'none';
        }
        document.getElementById('user-question-modal-title').textContent = `Dodaj pytanie dla: ${userName || 'użytkownika'}`;
    } else {
        // Jeśli nie podano userId, pokaż select (dla edycji z innych miejsc)
        if (userSelectGroup) {
            userSelectGroup.style.display = 'block';
        }
        // Wypełnij select użytkowników
        userSelect.innerHTML = '<option value="">Wybierz użytkownika</option>';
        allUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.display_name || user.email;
            userSelect.appendChild(option);
        });
        targetUserIdInput.value = '';
        document.getElementById('user-question-modal-title').textContent = 'Dodaj pytanie dla użytkownika';
    }
    
    // Wyczyść formularz
    form.reset();
    document.getElementById('user-question-id').value = '';
    
    modal.style.display = 'block';
}

// Zamknij modal dodawania pytania
function closeAddUserQuestionModal() {
    const modal = document.getElementById('add-user-question-modal');
    const form = document.getElementById('add-user-question-form');
    const userSelectGroup = document.getElementById('user-question-user-select-group');
    
    modal.style.display = 'none';
    form.reset();
    if (userSelectGroup) {
        userSelectGroup.style.display = 'none'; // Ukryj select przy zamykaniu
    }
    document.getElementById('user-question-id').value = '';
    document.getElementById('user-question-target-user-id').value = '';
}

// Zapisz pytanie dla użytkownika
async function saveUserQuestion() {
    const questionId = document.getElementById('user-question-id').value;
    const targetUserId = document.getElementById('user-question-target-user-id').value || document.getElementById('user-question-user-select').value;
    const option1 = document.getElementById('user-question-option-1').value.trim();
    const option2 = document.getElementById('user-question-option-2').value.trim();
    
    if (!targetUserId) {
        showNotification('Wybierz użytkownika', 'error');
        return;
    }
    
    if (!option1 || !option2) {
        showNotification('Wypełnij obie opcje', 'error');
        return;
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showNotification('Brak sesji', 'error');
            return;
        }
        
        // Treść pytania jest opcjonalna - jeśli nie podano, użyj domyślnej
        const questionText = `${option1} czy ${option2}?`;
        
        const questionData = {
            target_user_id: targetUserId,
            question_text: questionText,
            option_1: option1,
            option_2: option2,
            created_by: session.user.id
        };
        
        if (questionId) {
            // Edycja
            const { error } = await supabase
                .from('user_quiz_questions')
                .update(questionData)
                .eq('id', questionId);
            
            if (error) throw error;
            showNotification('Pytanie zostało zaktualizowane', 'success');
        } else {
            // Dodawanie
            const { error } = await supabase
                .from('user_quiz_questions')
                .insert(questionData);
            
            if (error) throw error;
            showNotification('Pytanie zostało dodane', 'success');
        }
        
        closeAddUserQuestionModal();
        await loadUserQuestionsList();
    } catch (error) {
        console.error('Błąd zapisywania pytania:', error);
        showNotification('Błąd zapisywania pytania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
}

// Edytuj pytanie użytkownika
async function editUserQuestion(questionId, userId) {
    try {
        const { data: question, error } = await supabase
            .from('user_quiz_questions')
            .select('*')
            .eq('id', questionId)
            .single();
        
        if (error) throw error;
        
        const user = allUsers.find(u => u.id === userId);
        const userName = user ? (user.display_name || user.email) : 'użytkownika';
        
        const userSelectGroup = document.getElementById('user-question-user-select-group');
        if (userSelectGroup) {
            userSelectGroup.style.display = 'none'; // Ukryj select przy edycji
        }
        
        // Wypełnij formularz
        document.getElementById('user-question-id').value = question.id;
        document.getElementById('user-question-target-user-id').value = question.target_user_id;
        document.getElementById('user-question-option-1').value = question.option_1;
        document.getElementById('user-question-option-2').value = question.option_2;
        document.getElementById('user-question-modal-title').textContent = `Edytuj pytanie dla: ${userName}`;
        document.getElementById('user-question-submit-btn').textContent = 'Zapisz zmiany';
        
        document.getElementById('add-user-question-modal').style.display = 'block';
    } catch (error) {
        console.error('Błąd ładowania pytania:', error);
        showNotification('Błąd ładowania pytania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
}

// Usuń pytanie użytkownika
async function deleteUserQuestion(questionId) {
    if (!confirm('Czy na pewno chcesz usunąć to pytanie?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('user_quiz_questions')
            .delete()
            .eq('id', questionId);
        
        if (error) throw error;
        
        showNotification('Pytanie zostało usunięte', 'success');
        await loadUserQuestionsList();
    } catch (error) {
        console.error('Błąd usuwania pytania:', error);
        showNotification('Błąd usuwania pytania: ' + (error.message || 'Nieznany błąd'), 'error');
    }
}

// Funkcja pomocnicza do escape HTML
function escapeHtml(text) {
    if (!text) return '';
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

})(); // Koniec IIFE - zabezpieczenie przed wielokrotnym ładowaniem

