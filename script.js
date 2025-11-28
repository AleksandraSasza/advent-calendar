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

// Mapowanie dni do państw - STATYCZNE (w kodzie)
// Dzień 1-24 → Państwo + Współrzędne + Ciekawostka
const dayToCountry = {
    1: {
        country: "Polska",
        funFact: "🎄 W Polsce Wigilia to najważniejszy dzień świąt! Tradycyjnie jemy 12 potraw i dzielimy się opłatkiem.",
        coordinates: [52.2297, 21.0122] // Warszawa
    },
    2: {
        country: "Niemcy",
        funFact: "🎅 W Niemczech tradycja jarmarków bożonarodzeniowych sięga średniowiecza! Słynne są pierniki norymberskie.",
        coordinates: [51.1657, 10.4515] // Berlin
    },
    3: {
        country: "Francja",
        funFact: "🎁 We Francji prezenty przynosi Père Noël (Ojciec Święty Mikołaj), a dzieci zostawiają mu wino i ciastka!",
        coordinates: [46.2276, 2.2137] // Paryż
    },
    4: {
        country: "Włochy",
        funFact: "🎄 We Włoszech prezenty przynosi Babbo Natale, ale prawdziwa magia dzieje się 6 stycznia - Święto Trzech Króli!",
        coordinates: [41.9028, 12.4964] // Rzym
    },
    5: {
        country: "Hiszpania",
        funFact: "👑 W Hiszpanii główne prezenty przychodzą 6 stycznia od Trzech Króli! Dzieci zostawiają im buty wypełnione słomą dla wielbłądów.",
        coordinates: [40.4637, -3.7492] // Madryt
    },
    6: {
        country: "Wielka Brytania",
        funFact: "🎄 Tradycja choinek bożonarodzeniowych przyszła do UK z Niemiec dzięki księciu Albertowi w czasach królowej Wiktorii!",
        coordinates: [55.3781, -3.4360] // Londyn
    },
    7: {
        country: "Rosja",
        funFact: "❄️ W Rosji Nowy Rok jest ważniejszy niż Boże Narodzenie! Dziadek Mróz (Ded Moroz) przynosi prezenty 31 grudnia.",
        coordinates: [61.5240, 105.3188] // Moskwa
    },
    8: {
        country: "Chiny",
        funFact: "🍊 W Chinach święta zimowe to Chiński Nowy Rok! Czerwony kolor symbolizuje szczęście i prosperity.",
        coordinates: [35.8617, 104.1954] // Pekin
    },
    9: {
        country: "Japonia",
        funFact: "🍗 W Japonii tradycją jest jedzenie KFC na Boże Narodzenie! Trzeba rezerwować kurczaka z tygodniowym wyprzedzeniem.",
        coordinates: [36.2048, 138.2529] // Tokio
    },
    10: {
        country: "Australia",
        funFact: "🏖️ W Australii Boże Narodzenie wypada w środku lata! Ludzie świętują na plażach i robią BBQ.",
        coordinates: [-25.2744, 133.7751] // Sydney
    },
    11: {
        country: "Brazylia",
        funFact: "🎅 W Brazylii Święty Mikołaj nazywa się Papai Noel i często nosi lekkie, letnie ubrania zamiast grubego futra!",
        coordinates: [-14.2350, -51.9253] // Brasília
    },
    12: {
        country: "USA",
        funFact: "🎄 Nowy Jork ma najbardziej znaną choinkę świata na Rockefeller Center! Tradycja sięga 1931 roku.",
        coordinates: [39.8283, -98.5795] // Kansas City (centrum USA)
    },
    13: {
        country: "Kanada",
        funFact: "🎅 Kanada ma oficjalny kod pocztowy dla Świętego Mikołaja: H0H 0H0! Dzieci mogą wysyłać tam listy i otrzymują odpowiedź.",
        coordinates: [56.1304, -106.3468] // Ottawa
    },
    14: {
        country: "Meksyk",
        funFact: "🌟 W Meksyku tradycją są Las Posadas - 9-dniowe procesje i imprezy upamiętniające wędrówkę Marii i Józefa do Betlejem.",
        coordinates: [23.6345, -102.5528] // Meksyk
    },
    15: {
        country: "Indie",
        funFact: "🪔 W Indiach Boże Narodzenie łączy się z tradycjami Diwali - domyśl świetlne i kolorowe dekoracje wypełniają ulice!",
        coordinates: [20.5937, 78.9629] // New Delhi
    },
    16: {
        country: "Egipt",
        funFact: "⛪ Chrześcijanie w Egipcie (Koptowie) obchodzą Boże Narodzenie 7 stycznia według kalendarza koptyjskiego!",
        coordinates: [26.0975, 30.0444] // Kair
    },
    17: {
        country: "RPA",
        funFact: "🌞 W RPA Boże Narodzenie to letnia impreza! Ludzie świętują grillując na świeżym powietrzu i pływając w oceanie.",
        coordinates: [-30.5595, 22.9375] // Kapsztad
    },
    18: {
        country: "Argentyna",
        funFact: "🎆 W Argentynie o północy 24 grudnia eksplodują fajerwerki! To moment otwarcia prezentów i rozpoczęcia świętowania.",
        coordinates: [-38.4161, -63.6167] // Buenos Aires
    },
    19: {
        country: "Chile",
        funFact: "🎅 W Chile Święty Mikołaj nazywa się Viejito Pascuero (Stary Człowiek Wielkanocny) i przychodzi przez kominek mimo letnich upałów!",
        coordinates: [-35.6751, -71.5430] // Santiago
    },
    20: {
        country: "Peru",
        funFact: "🌟 W Peru tradycją jest budowanie elaborate szopek (nacimientos) z lokalnych materiałów i figurek z ceramiki z Ayacucho!",
        coordinates: [-9.1900, -75.0152] // Lima
    },
    21: {
        country: "Kolumbia",
        funFact: "🕯️ W Kolumbii Día de las Velitas (Dzień Świeczek) 7 grudnia rozpoczyna sezon świąteczny - miasta świecą tysiącami świec!",
        coordinates: [4.7110, -74.0721] // Bogota
    },
    22: {
        country: "Wenezuela",
        funFact: "⛸️ W Caracas w Wenezueli tradycją jest chodzenie na rolkach do kościoła na poranną mszę w Wigilię! Ulice są zamykane dla samochodów.",
        coordinates: [6.4238, -66.5897] // Caracas
    },
    23: {
        country: "Ekwador",
        funFact: "🎭 W Ekwadorze tradycją jest palenie starej szafy (Año Viejo) - kukieł symbolizujących stary rok, 31 grudnia o północy!",
        coordinates: [-1.8312, -78.1834] // Quito
    },
    24: {
        country: "Urugwaj",
        funFact: "🎄 W Urugwaju Boże Narodzenie to czas rodzinnych spotkań na plaży i tradycyjnego asado (grilla) pod palmami zamiast choinkami!",
        coordinates: [-32.5228, -55.7658] // Montevideo
    }
};

// Zadania użytkownika - ładowane z Supabase na podstawie day_number
let userTasks = {}; // { day_number: { task_title, task_description, status, ... } }

// Dane dni kalendarza z bazy - będą ładowane dynamicznie
let calendarDaysData = {}; // { day_number: { country, fun_fact, coordinates } }

// Lista dostępnych państw z mapowaniem do współrzędnych (po polsku)
const countriesList = [
    { name: "Polska", coordinates: [52.2297, 21.0122] },
    { name: "Niemcy", coordinates: [51.1657, 10.4515] },
    { name: "Francja", coordinates: [46.2276, 2.2137] },
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

// Stan aplikacji
let currentDay = 1;
let completedDays = new Set();
let currentUser = null;
let authToken = null;
let map = null;
let markers = {};

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', async function() {
    // Zabezpieczenie przed pętlą przekierowań
    const redirectFlag = sessionStorage.getItem('redirecting');
    if (redirectFlag === 'true') {
        sessionStorage.removeItem('redirecting');
        console.log('Zabezpieczenie przed pętlą przekierowań - kontynuuję inicjalizację');
        // NIE przerywaj - kontynuuj inicjalizację mapy
    }
    
    // Najpierw sprawdź czy użytkownik jest zalogowany
    const isAuthenticated = await checkAuth();
    
    // Jeśli nie jest zalogowany, przekieruj do strony logowania
    if (!isAuthenticated) {
        sessionStorage.setItem('redirecting', 'true');
        window.location.href = 'login.html';
        return;
    }
    
    // Jeśli jest zalogowany, załaduj zadania z Supabase i kontynuuj inicjalizację
    await loadCalendarDays(); // Załaduj dane dni z bazy przed utworzeniem mapy
    await loadUserTasks();
    await loadUserProgress();
    createWorldMap();
    updateProgress();
    setupModalEvents();
    setupLogoutEvent();
});

// Tworzenie mapy świata z Leaflet
function createWorldMap() {
    const worldBounds = [[-85, -180], [85, 180]];

    // Inicjalizuj mapę z ograniczonym obszarem przewijania
    map = L.map('world-map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 6,
        maxBounds: worldBounds,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false
    });
    
    // Dodaj kafelki OpenStreetMap z wyłączonym powielaniem świata
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        noWrap: true,
        bounds: worldBounds
    }).addTo(map);
    
    // Upewnij się, że widok pozostaje w granicach
    map.setMaxBounds(worldBounds);
    
    // Dodaj markery dla każdego dnia
    addAdventMarkers();
}

// Dodawanie markerów adwentowych na mapie
// Używa danych z bazy (calendarDaysData) lub domyślnych z dayToCountry
function addAdventMarkers() {
    // Iteruj przez wszystkie dni 1-24
    for (let day = 1; day <= 24; day++) {
        const dayNumber = day;
        const dayString = day.toString();
        
        // Pobierz dane z bazy lub użyj domyślnych
        const dbData = calendarDaysData[dayNumber];
        const defaultData = dayToCountry[dayString];
        
        // Użyj danych z bazy, jeśli istnieją, w przeciwnym razie użyj domyślnych
        const country = dbData?.country || defaultData?.country || 'Brak państwa';
        const funFact = dbData?.fun_fact || defaultData?.funFact || 'Brak ciekawostki';
        
        // Współrzędne: najpierw z bazy, potem z mapowania państwa, na końcu domyślne
        let coordinates = null;
        if (dbData?.coordinates && Array.isArray(dbData.coordinates) && dbData.coordinates.length === 2) {
            coordinates = dbData.coordinates;
        } else if (getCoordinatesForCountry(country)) {
            coordinates = getCoordinatesForCountry(country);
        } else if (defaultData?.coordinates) {
            coordinates = defaultData.coordinates;
        } else {
            // Dla niestandardowych państw użyj domyślnych współrzędnych (centrum świata)
            coordinates = [20, 0];
        }
        
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
            console.warn(`Brak współrzędnych dla dnia ${day} (państwo: ${country}) - używam domyślnych`);
            coordinates = [20, 0]; // Centrum świata jako fallback
        }
        
        const isLocked = isDayLocked(dayNumber);
        const isCompleted = completedDays.has(dayNumber);
        
        // Określ klasę CSS dla markera
        let markerClass = 'advent-marker';
        if (isCompleted) {
            markerClass += ' completed';
        } else if (isLocked) {
            markerClass += ' locked';
        }
        
        // Utwórz niestandardową ikonę markera
        const customIcon = L.divIcon({
            className: 'advent-marker-container',
            html: `<div class="${markerClass}">${isLocked ? '🔒' : day}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
        
        // Dodaj marker na mapę (bez automatycznego otwierania modala)
        const marker = L.marker(coordinates, { icon: customIcon })
            .addTo(map);
        
        // Dodaj popup z ciekawostką lub informacją o blokadzie
        let popupContent;
        if (isLocked) {
            popupContent = `
                <div class="advent-popup locked">
                    <h3>🔒 Dzień ${day} - Zablokowany</h3>
                    <p>Ten dzień będzie dostępny ${day} grudnia 2025!</p>
                </div>
            `;
        } else {
            popupContent = `
                <div class="advent-popup">
                    <h3>📍 Dzień ${day} - ${country}</h3>
                    <p class="fun-fact">${funFact}</p>
                    <button class="btn" onclick="openTaskModal(${day})">Otwórz zadanie</button>
                </div>
            `;
        }
        
        marker.bindPopup(popupContent);
        
        // Zapisz marker w obiekcie markers
        markers[dayString] = marker;
    }
}

// Sprawdzanie czy dzień jest zablokowany
function isDayLocked(day) {
    const dayNumber = parseInt(day);
    
    // Dla administratora wszystkie dni są zawsze odblokowane
    if (currentUser && currentUser.role === 'admin') {
        return false;
    }
    
    // Dla zwykłych użytkowników: sprawdź datę
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11 (0 = styczeń, 11 = grudzień)
    const currentDay = today.getDate();
    
    // Jeśli nie jest grudzień 2025, wszystkie dni są zablokowane
    if (currentYear !== 2025 || currentMonth !== 11) { // 11 = grudzień (0-indexed)
        return true;
    }
    
    // Jeśli jest grudzień 2025, sprawdź czy dzisiejszy dzień >= numer dnia kalendarza
    // Dzień 1 jest odblokowany 1 grudnia, dzień 2 - 2 grudnia, itd.
    return currentDay < dayNumber;
}

// Otwieranie modala z zadaniem (duży popup)
function openTaskModal(day) {
    const dayNumber = parseInt(day);
    
    // Sprawdź czy dzień jest zablokowany
    if (isDayLocked(dayNumber)) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        
        if (currentYear !== 2025 || currentMonth !== 11) {
            showNotification(
                `🔒 Ten dzień będzie dostępny ${dayNumber} grudnia 2025!`,
                'error'
            );
        } else {
            showNotification(
                `🔒 Ten dzień będzie dostępny ${dayNumber} grudnia 2025!`,
                'error'
            );
        }
        return;
    }
    
    // Pobierz dane z bazy lub użyj domyślnych
    const dbData = calendarDaysData[dayNumber];
    const defaultData = dayToCountry[day];
    const country = dbData?.country || defaultData?.country || 'Brak państwa';
    const funFact = dbData?.fun_fact || defaultData?.funFact || 'Brak ciekawostki';
    
    const taskData = userTasks[day]; // Dynamiczne zadanie z Supabase
    const modal = document.getElementById('task-modal');
    
    // Wyświetl tylko dzień i państwo w nagłówku
    document.getElementById('modal-day').textContent = `Dzień ${day}`;
    document.getElementById('modal-country').textContent = country;
    
    // Wyświetl zadanie z Supabase lub komunikat
    const taskDescription = document.getElementById('task-description');
    if (taskData && taskData.task_title) {
        taskDescription.innerHTML = `<strong>${taskData.task_title}</strong><br>${taskData.task_description || ''}`;
    } else {
        taskDescription.textContent = 'Zadanie nie zostało jeszcze przypisane dla tego dnia. Skontaktuj się z administratorem.';
    }
    
    // Sprawdź czy zadanie jest już wykonane
    const markButton = document.getElementById('mark-completed');
    if (completedDays.has(dayNumber) || (taskData && taskData.status === 'completed')) {
        markButton.textContent = '✓ Wykonane';
        markButton.disabled = true;
        markButton.style.background = '#28a745';
    } else {
        markButton.textContent = 'Oznacz jako wykonane';
        markButton.disabled = false;
        markButton.style.background = '';
    }
    
    modal.style.display = 'block';
    currentDay = dayNumber;
}

// Zamykanie modala
function closeModal() {
    document.getElementById('task-modal').style.display = 'none';
}

// Oznaczanie zadania jako wykonane
async function markTaskCompleted() {
    if (!supabase || !currentUser) {
        showNotification('Błąd: Brak autoryzacji', 'error');
        return;
    }
    
    try {
        // Sprawdź czy zadanie jest przypisane (zadania są przypisane na podstawie day_number)
        const taskData = userTasks[currentDay];
        if (!taskData || !taskData.id) {
            showNotification('Błąd: Zadanie nie jest przypisane dla tego dnia', 'error');
            return;
        }
        
        // Zaktualizuj status zadania w Supabase
        const { error } = await supabase
            .from('assigned_tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', taskData.id);
        
        if (error) {
            console.error('Błąd aktualizacji zadania:', error);
            showNotification('Błąd zapisywania postępu', 'error');
            return;
        }
        
        // Zaktualizuj lokalny stan
    completedDays.add(currentDay);
        userTasks[currentDay].status = 'completed';
    updateProgress();
        updateAllMarkers(); // Odśwież wszystkie markery (mogą się odblokować inne dni)
    closeModal();
    
    showNotification(`Zadanie na dzień ${currentDay} zostało oznaczone jako wykonane!`, 'success');
    } catch (error) {
        console.error('Błąd oznaczania zadania jako wykonane:', error);
        showNotification('Błąd zapisywania postępu', 'error');
    }
}

// Aktualizacja paska postępu
function updateProgress() {
    const progress = (completedDays.size / 24) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    
    // Aktualizuj licznik dni
    const currentDayElement = document.getElementById('current-day');
    currentDayElement.textContent = completedDays.size;
}

// Pokazywanie powiadomienia
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

// Konfiguracja eventów modala
function setupModalEvents() {
    const modal = document.getElementById('task-modal');
    const closeBtn = document.querySelector('.close');
    const closeModalBtn = document.getElementById('close-modal');
    const markCompletedBtn = document.getElementById('mark-completed');
    
    closeBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    markCompletedBtn.addEventListener('click', markTaskCompleted);
    
    // Zamykanie modala po kliknięciu poza nim
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// === FUNKCJE ŁADOWANIA DANYCH Z SUPABASE ===

// Ładowanie dni kalendarza z bazy danych
async function loadCalendarDays() {
    if (!supabase) {
        console.log('Brak Supabase - pomijam ładowanie dni kalendarza');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('calendar_days')
            .select('day_number, country, fun_fact, coordinates')
            .order('day_number', { ascending: true });
        
        if (error) {
            console.error('Błąd ładowania dni kalendarza:', error);
            return;
        }
        
        // Przekształć dane do formatu calendarDaysData
        calendarDaysData = {};
        if (data && data.length > 0) {
            data.forEach(day => {
                calendarDaysData[day.day_number] = {
                    country: day.country || null,
                    fun_fact: day.fun_fact || null,
                    coordinates: day.coordinates || null
                };
            });
        }
        
        console.log('✅ Załadowano dane dni kalendarza z bazy:', Object.keys(calendarDaysData).length, 'dni');
    } catch (error) {
        console.error('Błąd ładowania dni kalendarza:', error);
    }
}

// Ładowanie zadań przypisanych do użytkownika
// Zadania są przypisane na podstawie day_number (1-24)
async function loadUserTasks() {
    if (!supabase || !currentUser) {
        console.log('Brak użytkownika - pomijam ładowanie zadań');
        return;
    }
    
    try {
        // Pobierz zadania użytkownika z joined calendar_days (aby mieć day_number)
        const { data, error } = await supabase
            .from('assigned_tasks')
            .select(`
                *,
                calendar_days!inner(day_number),
                task_templates(title, description, task_type, metadata)
            `)
            .eq('user_id', currentUser.id)
            .order('calendar_days.day_number', { ascending: true });
        
        if (error) {
            console.error('Błąd ładowania zadań użytkownika:', error);
            return;
        }
        
        // Przekształć dane do formatu userTasks
        // Klucz to day_number (1-24)
        userTasks = {};
        if (data && data.length > 0) {
            data.forEach(task => {
                const dayNumber = task.calendar_days.day_number;
                userTasks[dayNumber] = {
                    id: task.id,
                    calendar_day_id: task.calendar_day_id,
                    task_template_id: task.task_template_id,
                    task_title: task.task_templates?.title || 'Zadanie',
                    task_description: task.task_templates?.description || '',
                    task_type: task.task_templates?.task_type || 'text_response',
                    status: task.status,
                    response_text: task.response_text,
                    response_media_url: task.response_media_url,
                    response_metadata: task.response_metadata
                };
                
                // Jeśli zadanie jest wykonane, dodaj do completedDays
                if (task.status === 'completed') {
                    completedDays.add(dayNumber);
                }
            });
        }
        
        console.log('✅ Załadowano zadania użytkownika dla dni:', Object.keys(userTasks).map(d => `Dzień ${d}`).join(', '));
    } catch (error) {
        console.error('Błąd ładowania zadań użytkownika:', error);
    }
}

// Ładowanie postępu użytkownika (wykonane zadania)
async function loadUserProgress() {
    if (!supabase || !currentUser) {
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('assigned_tasks')
            .select('calendar_days!inner(day_number)')
            .eq('user_id', currentUser.id)
            .eq('status', 'completed');
        
        if (error) {
            console.error('Błąd ładowania postępu:', error);
            return;
        }
        
        if (data && data.length > 0) {
            data.forEach(task => {
                completedDays.add(task.calendar_days.day_number);
            });
        }
        
        console.log('✅ Załadowano postęp użytkownika:', completedDays.size, 'wykonanych zadań');
    } catch (error) {
        console.error('Błąd ładowania postępu:', error);
    }
}

// === FUNKCJE AUTORYZACJI ===

// Sprawdzanie czy użytkownik jest zalogowany (Supabase)
async function checkAuth() {
    if (!supabase) {
        console.error('Supabase nie jest zainicjalizowany');
        return false;
    }
    
    try {
        // Sprawdź sesję
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Błąd sprawdzania sesji:', sessionError);
            return false;
        }
        
        if (!session || !session.user) {
            // Brak sesji - użytkownik nie jest zalogowany
            console.log('Brak sesji - użytkownik nie jest zalogowany');
            return false;
        }
        
        // Użytkownik jest zalogowany - pobierz profil
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (profileError) {
            console.error('Błąd pobierania profilu:', profileError);
            // Jeśli profil nie istnieje, użytkownik nie jest w pełni zarejestrowany
            return false;
        }
        
        if (!profile) {
            console.log('Profil nie istnieje');
    return false;
}

        // Ustaw dane użytkownika
        currentUser = {
            id: session.user.id,
            email: session.user.email,
            ...profile
        };
        
        // Pokaż informacje o użytkowniku
        showUserInfo();
        
        // Załaduj postęp użytkownika (jeśli masz funkcję do tego)
        // loadUserProgress();
        
        console.log('Użytkownik jest zalogowany:', currentUser.email);
        return true;
        
    } catch (error) {
        console.error('Błąd autoryzacji:', error);
        return false;
    }
}

// Pokazywanie przycisku logowania (nie używane - przekierowujemy do login.html)
function showLoginButton() {
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('auth-buttons').style.display = 'block';
}

// Pokazywanie informacji o użytkowniku
function showUserInfo() {
    if (!currentUser) return;
    
    const userEmail = currentUser.email || currentUser.display_name || 'Użytkownik';
    document.getElementById('user-email').textContent = userEmail;
    document.getElementById('user-info').style.display = 'flex';
    
    // Ukryj przycisk logowania dla zalogowanych użytkowników
    document.getElementById('auth-buttons').style.display = 'none';
    
    // Pokaż link do panelu admina jeśli użytkownik jest adminem
    const adminLink = document.getElementById('admin-link');
    if (adminLink && currentUser.role === 'admin') {
        adminLink.style.display = 'inline-block';
    }
}


// Wylogowanie (Supabase)
async function logout() {
    if (!supabase) {
        console.error('Supabase nie jest zainicjalizowany');
        return;
    }
    
    try {
        // Wyloguj z Supabase
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Błąd wylogowania:', error);
            showNotification('Błąd wylogowania', 'error');
            return;
        }
        
        // Wyczyść dane lokalne
        localStorage.removeItem('supabase_session');
    currentUser = null;
    completedDays.clear();
    updateProgress();
        
        showNotification('Wylogowano pomyślnie', 'success');
        
        // Przekieruj do strony logowania
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Błąd wylogowania:', error);
        showNotification('Błąd wylogowania', 'error');
    }
}

// Ładowanie postępu użytkownika
async function loadUserProgress() {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/progress', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            completedDays = new Set(data.completedDays || []);
            updateProgress();
            updateAllMarkers();
        }
    } catch (error) {
        console.error('Błąd ładowania postępu:', error);
    }
}

// Aktualizacja wyglądu markera
function updateMarkerAppearance(day) {
    if (markers[day]) {
        const marker = markers[day];
        const dayNumber = parseInt(day);
        const isCompleted = completedDays.has(dayNumber);
        const isLocked = isDayLocked(dayNumber);
        
        // Określ klasę CSS dla markera
        let markerClass = 'advent-marker';
        if (isCompleted) {
            markerClass += ' completed';
        } else if (isLocked) {
            markerClass += ' locked';
        }
        
        // Utwórz nową ikonę z odpowiednim stylem
        const customIcon = L.divIcon({
            className: 'advent-marker-container',
            html: `<div class="${markerClass}">${isLocked ? '🔒' : day}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
        
        marker.setIcon(customIcon);
        
        // Pobierz dane z bazy lub użyj domyślnych
        const dbData = calendarDaysData[dayNumber];
        const defaultData = dayToCountry[day];
        const country = dbData?.country || defaultData?.country || 'Brak państwa';
        const funFact = dbData?.fun_fact || defaultData?.funFact || 'Brak ciekawostki';
        
        let popupContent;
        if (isLocked) {
            popupContent = `
                <div class="advent-popup locked">
                    <h3>🔒 Dzień ${day} - Zablokowany</h3>
                    <p>Ten dzień będzie dostępny ${day} grudnia 2025!</p>
                </div>
            `;
        } else {
            popupContent = `
                <div class="advent-popup">
                    <h3>📍 Dzień ${day} - ${country}</h3>
                    <p class="fun-fact">${funFact}</p>
                    <button class="btn" onclick="openTaskModal(${day})">Otwórz zadanie</button>
                </div>
            `;
        }
        marker.setPopupContent(popupContent);
    }
}

// Aktualizacja wszystkich markerów
function updateAllMarkers() {
    Object.keys(markers).forEach(day => {
        updateMarkerAppearance(parseInt(day));
    });
}

// Zapisywanie postępu użytkownika (nieużywane - używamy markTaskCompleted)
async function saveUserProgress() {
    // Postęp jest zapisywany automatycznie w markTaskCompleted()
    // Ta funkcja jest zachowana dla kompatybilności
    console.log('Postęp jest zapisywany automatycznie przy oznaczaniu zadań');
}

// Konfiguracja eventów wylogowania
function setupLogoutEvent() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Ulepszona funkcja powiadomień
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


// Dodaj style dla animacji powiadomień
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

