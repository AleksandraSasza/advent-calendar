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
        country: "Niemcy",
        funFact: "🎅 W Niemczech tradycja jarmarków bożonarodzeniowych sięga średniowiecza! Słynne są pierniki norymberskie.",
        coordinates: [51.1657, 10.4515] // Berlin
    },
    2: {
        country: "Finlandia",
        funFact: "🎅 W Finlandii Święty Mikołaj mieszka w Rovaniemi na kole podbiegunowym! Można go odwiedzić przez cały rok w Wiosce Świętego Mikołaja.",
        coordinates: [60.1699, 24.9384] // Helsinki
    },
    3: {
        country: "Wielka Brytania",
        funFact: "🎄 Tradycja choinek bożonarodzeniowych przyszła do UK z Niemiec dzięki księciu Albertowi w czasach królowej Wiktorii!",
        coordinates: [51.5074, -0.1278] // Londyn
    },
    4: {
        country: "Meksyk",
        funFact: "🌟 W Meksyku tradycją są Las Posadas - 9-dniowe procesje i imprezy upamiętniające wędrówkę Marii i Józefa do Betlejem.",
        coordinates: [23.6345, -102.5528] // Meksyk
    },
    5: {
        country: "Hiszpania",
        funFact: "👑 W Hiszpanii główne prezenty przychodzą 6 stycznia od Trzech Króli! Dzieci zostawiają im buty wypełnione słomą dla wielbłądów.",
        coordinates: [40.4637, -3.7492] // Madryt
    },
    6: {
        country: "Francja",
        funFact: "🎁 We Francji prezenty przynosi Père Noël (Ojciec Święty Mikołaj), a dzieci zostawiają mu wino i ciastka!",
        coordinates: [46.2276, 2.2137] // Paryż
    },
    7: {
        country: "Kolumbia",
        funFact: "🕯️ W Kolumbii Día de las Velitas (Dzień Świeczek) 7 grudnia rozpoczyna sezon świąteczny - miasta świecą tysiącami świec!",
        coordinates: [4.7110, -74.0721] // Bogota
    },
    8: {
        country: "Włochy",
        funFact: "🍝 We Włoszech tradycją jest jedzenie ryb w Wigilię! Włosi przygotowują La Vigilia - wielodaniową kolację z owocami morza, ale bez mięsa.",
        coordinates: [41.9028, 12.4964] // Rzym
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
        country: "Włochy",
        funFact: "🎄 We Włoszech prezenty przynosi Babbo Natale, ale prawdziwa magia dzieje się 6 stycznia - Święto Trzech Króli!",
        coordinates: [41.9028, 12.4964] // Rzym
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
        country: "Rosja",
        funFact: "❄️ W Rosji Nowy Rok jest ważniejszy niż Boże Narodzenie! Dziadek Mróz (Ded Moroz) przynosi prezenty 31 grudnia.",
        coordinates: [61.5240, 105.3188] // Moskwa
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
    { name: "Finlandia", coordinates: [60.1699, 24.9384] },
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
    await checkUserQuestions(); // Sprawdź czy użytkownik ma pytania
    createWorldMap();
    updateProgress();
    setupModalEvents();
    setupLogoutEvent();
    
    // Automatyczne odświeżanie danych przy powrocie do zakładki (np. po edycji w panelu admina)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && currentUser) {
            // Odśwież dane dni kalendarza (ciekawostki)
            await loadCalendarDays();
        }
    });
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
    
    // Zamykanie popupów po kliknięciu w mapę (poza markerem)
    map.on('click', function(e) {
        // Sprawdź czy kliknięcie było w marker (jeśli tak, nie zamykaj popupu)
        const clickedMarker = e.originalEvent?.target?.closest('.advent-marker-container');
        if (!clickedMarker) {
            // Zamknij wszystkie otwarte popupy
            map.closePopup();
        }
    });
    
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
        const country = defaultData?.country || 'Brak państwa';
        const funFact = dbData?.fun_fact || defaultData?.funFact || 'Brak ciekawostki';
        
        // Współrzędne: najpierw z mapowania państwa, potem domyślne
        let coordinates = null;
        if (getCoordinatesForCountry(country)) {
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
        
        // Funkcja do otwierania ciekawostki (modal na mobile, popup na desktop)
        const openFunFact = (e) => {
            if (isMobileDevice()) {
                // Na urządzeniach mobilnych - otwórz modal i zablokuj domyślne zachowanie
                if (e.originalEvent) {
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                }
                // Zamknij popup jeśli jest otwarty
                marker.closePopup();
                openFunFactModal(dayNumber, country, funFact, isLocked);
            }
            // Na desktop - popup otworzy się automatycznie przez Leaflet
        };
        
        // Dodaj obsługę kliknięcia (tylko dla mobile, desktop używa popupu)
        if (isMobileDevice()) {
            marker.on('click', openFunFact);
        }
        
        // Dodaj popup z ciekawostką lub informacją o blokadzie (tylko dla desktop)
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
        
        // Bind popup tylko dla desktop (na mobile będzie modal)
        if (!isMobileDevice()) {
            marker.bindPopup(popupContent, {
                maxWidth: 400,
                className: 'advent-popup-container',
                autoPan: true,
                autoPanPadding: [100, 50],
                autoPanPaddingTopLeft: [100, 50],
                autoPanPaddingBottomRight: [100, 50],
                keepInView: true,
                closeOnClick: true, // Pozwól zamykać popup klikając w mapę
                autoClose: true // Automatycznie zamykaj popup przy otwarciu innego
            });
        }
        
        // Zapisz marker w obiekcie markers
        markers[dayString] = marker;
    }
}

// Odśwież markery na mapie po załadowaniu nowych danych
function refreshMapMarkers() {
    // Usuń wszystkie istniejące markery
    if (markers) {
        Object.values(markers).forEach(marker => {
            if (marker && map) {
                map.removeLayer(marker);
            }
        });
        markers = {};
    }
    
    // Dodaj markery ponownie z zaktualizowanymi danymi
    if (map) {
        addAdventMarkers();
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

// Funkcja wykrywania urządzeń mobilnych
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Otwieranie modala z ciekawostką (dla urządzeń mobilnych)
function openFunFactModal(day, country, funFact, isLocked) {
    const modal = document.getElementById('funfact-modal');
    const modalDay = document.getElementById('funfact-modal-day');
    const modalCountry = document.getElementById('funfact-country');
    const modalText = document.getElementById('funfact-text');
    const openTaskBtn = document.getElementById('funfact-open-task-btn');
    const closeBtn = document.getElementById('funfact-close-btn');
    const closeX = document.querySelector('.funfact-close');
    
    if (!modal) return;
    
    if (isLocked) {
        modalDay.textContent = `🔒 Dzień ${day} - Zablokowany`;
        modalCountry.textContent = `🔒 Dzień ${day} - Zablokowany`;
        modalText.textContent = `Ten dzień będzie dostępny ${day} grudnia 2025!`;
        modalText.style.fontStyle = 'normal';
        openTaskBtn.style.display = 'none';
    } else {
        modalDay.textContent = `Dzień ${day}`;
        modalCountry.textContent = `📍 Dzień ${day} - ${country}`;
        modalText.textContent = funFact;
        modalText.style.fontStyle = 'italic';
        openTaskBtn.style.display = 'inline-flex';
        openTaskBtn.onclick = () => {
            closeFunFactModal();
            openTaskModal(day);
        };
    }
    
    // Obsługa zamykania
    closeBtn.onclick = closeFunFactModal;
    closeX.onclick = closeFunFactModal;
    
    // Zamykanie po kliknięciu poza modalem (w tło)
    modal.onclick = (e) => {
        // Sprawdź czy kliknięcie było w tle modala (nie w modal-content)
        if (e.target === modal) {
            closeFunFactModal();
        }
    };
    
    // Zapobiegaj propagacji kliknięć wewnątrz modal-content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.onclick = (e) => {
            e.stopPropagation();
        };
    }
    
    // Otwórz modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Zamykanie modala z ciekawostką
function closeFunFactModal() {
    const modal = document.getElementById('funfact-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
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
    const country = defaultData?.country || 'Brak państwa';
    const funFact = dbData?.fun_fact || defaultData?.funFact || 'Brak ciekawostki';
    
    // Użyj dayNumber (liczba) jako klucza, bo w loadUserTasks zadania są zapisywane z kluczem liczbowym
    const taskData = userTasks[dayNumber]; // Dynamiczne zadanie z Supabase
    
    console.log('🔍 openTaskModal - dzień:', dayNumber, 'typ:', typeof dayNumber);
    console.log('🔍 openTaskModal - userTasks:', userTasks);
    console.log('🔍 openTaskModal - taskData dla dnia', dayNumber, ':', taskData);
    console.log('🔍 openTaskModal - currentUser:', currentUser);
    
    const modal = document.getElementById('task-modal');
    
    // Wyświetl tylko dzień w nagłówku
    document.getElementById('modal-day').textContent = `Dzień ${day}`;
    
    // Wyświetl zadanie z Supabase lub komunikat
    const taskDescription = document.getElementById('task-description');
    const markButton = document.getElementById('mark-completed');
    const photoUploadSection = document.getElementById('photo-upload-section');
    
    // Reset badge statusu na początku - ukryj go domyślnie
    const statusBadge = document.getElementById('task-status-badge');
    if (statusBadge) {
        statusBadge.style.display = 'none';
    }
    const photoInput = document.getElementById('task-photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewContainer = document.getElementById('photo-preview-container');
    const uploadedPhotoContainer = document.getElementById('uploaded-photo-container');
    const uploadedPhoto = document.getElementById('uploaded-photo');
    const photoFilename = document.getElementById('photo-filename');
    
    // Reset sekcji zdjęcia
    photoInput.value = '';
    photoPreviewContainer.style.display = 'none';
    photoFilename.textContent = '';
    
    // Sprawdź czy zadanie rzeczywiście istnieje i ma tytuł
    if (taskData && taskData.task_title) {
        // Wyświetl nazwę zadania w nagłówku razem z "Zadanie:" w tej samej linii
        const taskTitleNameElement = document.getElementById('task-title-name');
        if (taskTitleNameElement) {
            taskTitleNameElement.textContent = taskData.task_title;
        }
        // Wyświetl tylko opis w paragrafie
        taskDescription.innerHTML = taskData.task_description || '';
        
        // Pokaż sekcję uploadu zdjęcia tylko dla zadań typu photo_upload
        const verificationMessage = document.getElementById('verification-message');
        const selectPhotoBtn = document.getElementById('select-photo-btn');
        const photoFilename = document.getElementById('photo-filename');
        const addPhotoSection = document.getElementById('add-photo-section');
        const viewPhotoLinkContainer = document.getElementById('view-photo-link-container');
        const viewPhotoLink = document.getElementById('view-photo-link');
        
        // Sekcja odpowiedzi tekstowej z weryfikacją
        const textResponseSection = document.getElementById('text-response-section');
        const viewTextResponseContainer = document.getElementById('view-text-response-container');
        const viewTextResponse = document.getElementById('view-text-response');
        const addTextResponseSection = document.getElementById('add-text-response-section');
        const taskTextResponse = document.getElementById('task-text-response');
        const textVerificationMessage = document.getElementById('text-verification-message');
        
        // Sprawdź status tylko jeśli zadanie istnieje
        const isCompleted = taskData.status === 'completed' || taskData.status === 'pending_verification' || completedDays.has(dayNumber);
        
        // Obsługa odpowiedzi tekstowej z weryfikacją
        if (taskData.task_type === 'text_response_verified') {
            textResponseSection.style.display = 'block';
            
            // Jeśli zadanie jest wykonane lub czeka na weryfikację
            if (isCompleted) {
                // Ukryj sekcję dodawania odpowiedzi
                if (addTextResponseSection) {
                    addTextResponseSection.style.display = 'none';
                }
                
                // Pokaż przesłaną odpowiedź (jeśli istnieje)
                if (taskData.response_text) {
                    if (viewTextResponseContainer) {
                        viewTextResponseContainer.style.display = 'block';
                    }
                    if (viewTextResponse) {
                        viewTextResponse.textContent = taskData.response_text;
                    }
                } else {
                    if (viewTextResponseContainer) {
                        viewTextResponseContainer.style.display = 'none';
                    }
                }
                
                // Pokaż komunikat o weryfikacji tylko dla pending_verification
                if (textVerificationMessage) {
                    if (taskData.status === 'pending_verification') {
                        textVerificationMessage.style.display = 'block';
                    } else {
                        textVerificationMessage.style.display = 'none';
                    }
                }
            } else {
                // Zadanie nie jest wykonane - pokaż możliwość dodania odpowiedzi
                if (addTextResponseSection) {
                    addTextResponseSection.style.display = 'block';
                }
                if (viewTextResponseContainer) {
                    viewTextResponseContainer.style.display = 'none';
                }
                
                // Jeśli odpowiedź już została przesłana (ale zadanie nie jest wykonane), wypełnij pole
                if (taskData.response_text && taskTextResponse) {
                    taskTextResponse.value = taskData.response_text;
                } else if (taskTextResponse) {
                    taskTextResponse.value = '';
                }
                
                // Pokaż komunikat o weryfikacji dla zadań z odpowiedzią tekstową
                if (textVerificationMessage) {
                    textVerificationMessage.style.display = 'block';
                }
            }
        } else {
            textResponseSection.style.display = 'none';
            if (textVerificationMessage) {
                textVerificationMessage.style.display = 'none';
            }
        }
        
        if (taskData.task_type === 'photo_upload') {
            photoUploadSection.style.display = 'block';
            
            // Jeśli zadanie jest wykonane lub czeka na weryfikację
            if (isCompleted) {
                // Ukryj sekcję dodawania zdjęcia
                if (addPhotoSection) {
                    addPhotoSection.style.display = 'none';
                }
                photoPreviewContainer.style.display = 'none';
                // Ukryj pole z przesłanym zdjęciem - pokazujemy tylko link
                uploadedPhotoContainer.style.display = 'none';
                
                // Pokaż link do zobaczenia zdjęcia (jeśli istnieje)
                if (taskData.response_media_url) {
                    if (viewPhotoLinkContainer) {
                        viewPhotoLinkContainer.style.display = 'block';
                    }
                    if (viewPhotoLink) {
                        const photoUrl = taskData.response_media_url;
                        console.log('🔗 URL zdjęcia:', photoUrl);
                        
                        // Sprawdź dostępność URL przed ustawieniem
                        viewPhotoLink.href = '#';
                        viewPhotoLink.onclick = async function(e) {
                            e.preventDefault();
                            
                            try {
                                // Sprawdź czy URL jest poprawny
                                if (!photoUrl) {
                                    console.error('❌ Nieprawidłowy URL zdjęcia:', photoUrl);
                                    showNotification('Błąd: Nieprawidłowy URL zdjęcia', 'error');
                                    return;
                                }
                                
                                console.log('🔗 Próba wyświetlenia zdjęcia:', photoUrl);
                                
                                // Najpierw spróbuj użyć publicznego URL
                                let finalUrl = photoUrl;
                                
                                // Jeśli URL nie zawiera pełnej ścieżki, spróbuj go naprawić
                                if (!finalUrl.includes('/storage/v1/object/public/')) {
                                    const projectUrl = window.SUPABASE_CONFIG?.URL || SUPABASE_URL || '';
                                    if (projectUrl) {
                                        const baseUrl = projectUrl.replace(/\/$/, '');
                                        let filePath = photoUrl;
                                        if (photoUrl.includes('task-responses/')) {
                                            const match = photoUrl.match(/task-responses[\/]?(.+)$/);
                                            if (match) filePath = match[1].replace(/^\/+/, '');
                                        } else if (!photoUrl.startsWith('http')) {
                                            filePath = photoUrl;
                                        }
                                        finalUrl = `${baseUrl}/storage/v1/object/public/task-responses/${filePath}`;
                                    }
                                }
                                
                                // Sprawdź dostępność publicznego URL
                                try {
                                    const response = await fetch(finalUrl, { method: 'HEAD' });
                                    if (response.ok) {
                                        await showPhotoInModal(finalUrl);
                                        return;
                                    }
                                } catch (fetchError) {
                                    console.warn('⚠️ Publiczny URL nie działa, próbuję signed URL');
                                }
                                
                                // Jeśli publiczny URL nie działa, użyj signed URL
                                const signedUrl = await loadSignedUrlForPhoto(finalUrl || photoUrl);
                                if (signedUrl) {
                                    await showPhotoInModal(signedUrl);
                                } else {
                                    // Spróbuj jeszcze raz z oryginalnym URL
                                    await showPhotoInModal(finalUrl || photoUrl);
                                }
                            } catch (error) {
                                console.error('❌ Błąd otwierania zdjęcia:', error);
                                showNotification('Błąd: Nie można wyświetlić zdjęcia', 'error');
                            }
                        };
                    }
                } else {
                    if (viewPhotoLinkContainer) {
                        viewPhotoLinkContainer.style.display = 'none';
                    }
                }
                
                // Pokaż komunikat o weryfikacji tylko dla pending_verification
                if (verificationMessage) {
                    if (taskData.status === 'pending_verification') {
                        verificationMessage.style.display = 'block';
                    } else {
                        verificationMessage.style.display = 'none';
                    }
                }
            } else {
                // Zadanie nie jest wykonane - pokaż możliwość dodania zdjęcia
                if (addPhotoSection) {
                    addPhotoSection.style.display = 'block';
                }
                if (viewPhotoLinkContainer) {
                    viewPhotoLinkContainer.style.display = 'none';
                }
                
                // Jeśli zdjęcie już zostało przesłane (ale zadanie nie jest wykonane), pokaż podgląd
                if (taskData.response_media_url) {
                    const photoUrl = taskData.response_media_url;
                    
                    // Jeśli URL nie zawiera pełnej ścieżki, spróbuj go naprawić
                    let finalUrl = photoUrl;
                    if (!finalUrl.includes('/storage/v1/object/public/')) {
                        const projectUrl = window.SUPABASE_CONFIG?.URL || SUPABASE_URL || '';
                        if (projectUrl) {
                            const baseUrl = projectUrl.replace(/\/$/, '');
                            let filePath = photoUrl;
                            if (photoUrl.includes('task-responses/')) {
                                const match = photoUrl.match(/task-responses[\/]?(.+)$/);
                                if (match) filePath = match[1].replace(/^\/+/, '');
                            } else if (!photoUrl.startsWith('http')) {
                                filePath = photoUrl;
                            }
                            finalUrl = `${baseUrl}/storage/v1/object/public/task-responses/${filePath}`;
                        }
                    }
                    
                    uploadedPhoto.src = finalUrl;
                    uploadedPhotoContainer.style.display = 'block';
                    photoPreviewContainer.style.display = 'none';
                    
                    // Obsługa błędu ładowania - użyj signed URL jako fallback
                    uploadedPhoto.onerror = async function() {
                        console.warn('⚠️ Błąd ładowania przesłanego zdjęcia publicznym URL, próbuję signed URL');
                        const signedUrl = await loadSignedUrlForPhoto(finalUrl || photoUrl);
                        if (signedUrl) {
                            uploadedPhoto.src = signedUrl;
                        } else {
                            console.error('❌ Nie udało się załadować zdjęcia nawet z signed URL');
                            uploadedPhotoContainer.style.display = 'none';
                        }
                    };
                } else {
                    uploadedPhotoContainer.style.display = 'none';
                }
                
                // Pokaż komunikat o weryfikacji dla zadań ze zdjęciami
                if (verificationMessage) {
                    verificationMessage.style.display = 'block';
                }
            }
        } else {
            photoUploadSection.style.display = 'none';
            if (verificationMessage) {
                verificationMessage.style.display = 'none';
            }
        }
        
        // Status zadania - wyświetl jako badge zamiast przycisku
        const closeButton = document.getElementById('close-modal');
        
        // Sprawdź czy zadanie jest już wykonane lub czeka na weryfikację
        if (isCompleted) {
            // Ukryj przycisk "Oznacz jako wykonane"
            markButton.style.display = 'none';
            
            // Pokaż status jako badge w headerze
            if (statusBadge) {
                statusBadge.style.display = 'block';
                if (taskData.status === 'pending_verification') {
                    statusBadge.textContent = '⏳ Oczekuje na weryfikację';
                    statusBadge.style.background = '#fff3cd';
                    statusBadge.style.color = '#856404';
                    statusBadge.style.border = '1px solid #ffc107';
                } else {
                    statusBadge.textContent = '✓ Wykonane';
                    statusBadge.style.background = '#d4edda';
                    statusBadge.style.color = '#155724';
                    statusBadge.style.border = '1px solid #28a745';
                }
            }
        } else {
            // Pokaż przycisk "Oznacz jako wykonane" tylko dla niezakończonych zadań
            markButton.style.display = 'inline-flex';
            
            // Dla zadań ze zdjęciami i odpowiedzią tekstową z weryfikacją zmień tekst przycisku
            if (taskData.task_type === 'photo_upload') {
                markButton.textContent = 'Prześlij zdjęcie do weryfikacji';
            } else if (taskData.task_type === 'text_response_verified') {
                markButton.textContent = 'Prześlij odpowiedź do weryfikacji';
            } else {
                markButton.textContent = 'Oznacz jako wykonane';
            }
            
            markButton.disabled = false;
            markButton.style.background = '';
            
            // Ukryj badge statusu
            if (statusBadge) {
                statusBadge.style.display = 'none';
            }
        }
    } else {
        taskDescription.textContent = 'Zadanie nie zostało jeszcze przypisane dla tego dnia. Skontaktuj się z administratorem.';
        // Ukryj przycisk i sekcję zdjęcia jeśli nie ma zadania
        markButton.style.display = 'none';
        photoUploadSection.style.display = 'none';
        
        // Ukryj badge statusu jeśli nie ma zadania
        const statusBadge = document.getElementById('task-status-badge');
        if (statusBadge) {
            statusBadge.style.display = 'none';
        }
        
        // Ukryj komunikat o weryfikacji
        const verificationMessage = document.getElementById('verification-message');
        if (verificationMessage) {
            verificationMessage.style.display = 'none';
        }
    }
    
    modal.style.display = 'block';
    currentDay = dayNumber;
}

// Zamykanie modala
function closeModal() {
    document.getElementById('task-modal').style.display = 'none';
}

// Funkcja pomocnicza do generowania signed URL jako fallback
async function loadSignedUrlForPhoto(photoUrl) {
    try {
        if (!supabase || !photoUrl) {
            console.error('❌ Brak supabase lub URL zdjęcia');
            return null;
        }
        
        // Wyciągnij ścieżkę pliku z URL
        let filePath = photoUrl;
        
        // Jeśli URL zawiera /task-responses/, wyciągnij ścieżkę po tym
        if (photoUrl.includes('/task-responses/')) {
            const match = photoUrl.match(/task-responses\/(.+?)(\?|$)/);
            if (match) {
                filePath = match[1];
            }
        } else if (photoUrl.includes('task-responses/')) {
            const match = photoUrl.match(/task-responses[\/]?(.+?)(\?|$)/);
            if (match) {
                filePath = match[1].replace(/^\/+/, '');
            }
        } else if (!photoUrl.startsWith('http')) {
            // Jeśli to już sama ścieżka
            filePath = photoUrl;
        }
        
        if (!filePath || filePath === photoUrl) {
            console.warn('⚠️ Nie udało się wyciągnąć ścieżki pliku z URL:', photoUrl);
            return null;
        }
        
        console.log('🔐 Generowanie signed URL dla ścieżki:', filePath);
        
        // Generuj signed URL ważny przez 1 godzinę
        const { data, error } = await supabase.storage
            .from('task-responses')
            .createSignedUrl(filePath, 3600);
        
        if (error) {
            console.error('❌ Błąd generowania signed URL:', error);
            return null;
        }
        
        if (data && data.signedUrl) {
            console.log('✅ Wygenerowano signed URL');
            return data.signedUrl;
        }
        
        return null;
    } catch (err) {
        console.error('❌ Błąd w loadSignedUrlForPhoto:', err);
        return null;
    }
}

// Pokaż zdjęcie w modalu
async function showPhotoInModal(photoUrl) {
    // Utwórz modal do wyświetlenia zdjęcia
    let photoModal = document.getElementById('photo-modal');
    
    if (!photoModal) {
        // Utwórz modal jeśli nie istnieje
        photoModal = document.createElement('div');
        photoModal.id = 'photo-modal';
        photoModal.className = 'modal';
        photoModal.style.display = 'none';
        photoModal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh; padding: 20px;">
                <span class="close" id="close-photo-modal" style="position: absolute; top: 10px; right: 20px; font-size: 28px; font-weight: bold; cursor: pointer; color: #1a5d1a;">&times;</span>
                <div style="text-align: center;">
                    <img id="modal-photo-img" src="" alt="Zdjęcie zadania" style="max-width: 100%; max-height: 85vh; border-radius: 8px; border: 1px solid #e8e8ed;">
                </div>
            </div>
        `;
        document.body.appendChild(photoModal);
        
        // Obsługa zamykania modala
        document.getElementById('close-photo-modal').addEventListener('click', () => {
            photoModal.style.display = 'none';
        });
        
        // Zamknij przy kliknięciu poza modalem
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) {
                photoModal.style.display = 'none';
            }
        });
    }
    
    // Ustaw zdjęcie i pokaż modal
    const photoImg = document.getElementById('modal-photo-img');
    if (photoImg) {
        photoImg.src = photoUrl;
        photoImg.onerror = async function() {
            console.error('❌ Błąd ładowania zdjęcia publicznym URL:', photoUrl);
            
            // Spróbuj użyć signed URL jako fallback
            const signedUrl = await loadSignedUrlForPhoto(photoUrl);
            if (signedUrl) {
                console.log('✅ Używam signed URL jako fallback');
                photoImg.src = signedUrl;
                photoImg.onerror = function() {
                    console.error('❌ Błąd ładowania zdjęcia signed URL');
                    showNotification('Błąd: Nie można załadować zdjęcia. Sprawdź czy masz dostęp do tego pliku.', 'error');
                    photoModal.style.display = 'none';
                };
            } else {
                showNotification('Błąd: Nie można załadować zdjęcia. Sprawdź czy masz dostęp do tego pliku.', 'error');
                photoModal.style.display = 'none';
            }
        };
    }
    
    photoModal.style.display = 'block';
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
        
        let mediaUrl = taskData.response_media_url || null;
        let responseText = taskData.response_text || null;
        
        // Jeśli zadanie wymaga odpowiedzi tekstowej z weryfikacją, sprawdź czy została wpisana
        if (taskData.task_type === 'text_response_verified') {
            const textResponseInput = document.getElementById('task-text-response');
            const responseTextValue = textResponseInput?.value.trim() || '';
            
            if (!responseTextValue) {
                showNotification('Musisz wpisać odpowiedź, aby oznaczyć zadanie jako wykonane', 'error');
                return;
            }
            
            responseText = responseTextValue;
        }
        
        // Jeśli zadanie wymaga zdjęcia, sprawdź czy zostało przesłane
        if (taskData.task_type === 'photo_upload') {
            const photoInput = document.getElementById('task-photo-input');
            const photoPreview = document.getElementById('photo-preview');
            const photoPreviewContainer = document.getElementById('photo-preview-container');
            
            // Sprawdź czy jest nowy plik w input lub czy jest podgląd (zdjęcie wybrane ale jeszcze nie przesłane)
            const file = photoInput?.files[0];
            const hasPreview = photoPreviewContainer?.style.display !== 'none' && photoPreview?.src;
            
            if (!file && !hasPreview && !taskData.response_media_url) {
                showNotification('Musisz dodać zdjęcie, aby oznaczyć zadanie jako wykonane', 'error');
                return;
            }
            
            // Jeśli wybrano nowe zdjęcie, prześlij je do Supabase Storage
            if (file) {
                try {
                    console.log('📤 Przesyłanie zdjęcia:', file.name, file.size, 'bytes');
                    
                    let fileToUpload = file;
                    let fileExt = file.name.split('.').pop().toLowerCase();
                    
                    // Sprawdź czy to plik HEIC/HEIF i skonwertuj na JPEG
                    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                                   file.name.toLowerCase().endsWith('.heif') ||
                                   file.type === 'image/heic' || 
                                   file.type === 'image/heif';
                    
                    if (isHeic && typeof heic2any !== 'undefined') {
                        console.log('🔄 Konwertowanie HEIC na JPEG przed uploadem...');
                        
                        try {
                            // Konwertuj HEIC na JPEG
                            const convertedBlob = await heic2any({
                                blob: file,
                                toType: 'image/jpeg',
                                quality: 0.9
                            });
                            
                            // heic2any zwraca tablicę, weź pierwszy element
                            const convertedFile = convertedBlob instanceof Array ? convertedBlob[0] : convertedBlob;
                            
                            // Utwórz nowy plik JPEG
                            const jpegFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
                            fileToUpload = new File([convertedFile], jpegFileName, { type: 'image/jpeg' });
                            fileExt = 'jpg';
                            
                            console.log('✅ Skonwertowano HEIC na JPEG');
                        } catch (conversionError) {
                            console.error('❌ Błąd konwersji HEIC:', conversionError);
                            showNotification('Błąd: Nie można przekonwertować pliku HEIC. Spróbuj użyć innego formatu.', 'error');
                            return;
                        }
                    }
                    
                    // Utwórz unikalną nazwę pliku
                    // Format: {user_id}/{task_id}/{timestamp}.{ext}
                    // To pozwala RLS sprawdzić uprawnienia użytkownika
                    const fileName = `${currentUser.id}/${taskData.id}/${Date.now()}.${fileExt}`;
                    
                    console.log('📁 Nazwa pliku:', fileName);
                    
                    // Prześlij plik do Supabase Storage
                    // Uwaga: folder musi zaczynać się od user_id dla RLS
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('task-responses')
                        .upload(fileName, fileToUpload, {
                            cacheControl: '3600',
                            upsert: false
                        });
                    
                    if (uploadError) {
                        console.error('❌ Błąd uploadu zdjęcia:', uploadError);
                        console.error('Szczegóły błędu:', {
                            message: uploadError.message,
                            statusCode: uploadError.statusCode,
                            error: uploadError.error
                        });
                        showNotification('Błąd przesyłania zdjęcia: ' + (uploadError.message || 'Nieznany błąd'), 'error');
                        return;
                    }
                    
                    console.log('✅ Plik przesłany:', uploadData);
                    
                    // Pobierz publiczny URL zdjęcia
                    // Używamy getPublicUrl z pełną ścieżką
                    const { data: urlData } = supabase.storage
                        .from('task-responses')
                        .getPublicUrl(fileName);
                    
                    if (!urlData || !urlData.publicUrl) {
                        console.error('❌ Nie udało się pobrać publicznego URL');
                        showNotification('Błąd: Nie udało się pobrać URL zdjęcia', 'error');
                        return;
                    }
                    
                    // Sprawdź czy URL jest poprawny
                    let finalUrl = urlData.publicUrl;
                    
                    // Jeśli URL nie zawiera pełnej ścieżki, dodaj ją
                    if (!finalUrl.includes('/task-responses/')) {
                        // Pobierz URL projektu z konfiguracji
                        const projectUrl = window.SUPABASE_CONFIG?.SUPABASE_URL || '';
                        if (projectUrl) {
                            // Usuń końcowy slash jeśli istnieje
                            const baseUrl = projectUrl.replace(/\/$/, '');
                            finalUrl = `${baseUrl}/storage/v1/object/public/task-responses/${fileName}`;
                        }
                    }
                    
                    mediaUrl = finalUrl;
                    console.log('✅ Zdjęcie przesłane, URL:', mediaUrl);
                    console.log('📁 Nazwa pliku:', fileName);
                    console.log('🔗 Pełny URL:', mediaUrl);
                } catch (uploadErr) {
                    console.error('❌ Błąd przesyłania zdjęcia (catch):', uploadErr);
                    showNotification('Błąd przesyłania zdjęcia: ' + (uploadErr.message || 'Nieznany błąd'), 'error');
                    return;
                }
            } else if (hasPreview && !taskData.response_media_url) {
                // Jeśli jest podgląd ale nie ma pliku w input, to znaczy że coś poszło nie tak
                console.warn('⚠️ Jest podgląd zdjęcia, ale brak pliku w input');
                showNotification('Błąd: Wybierz zdjęcie ponownie', 'error');
                return;
            }
        }
        
        // Dla zadań ze zdjęciami i odpowiedzią tekstową z weryfikacją ustaw status 'pending_verification', dla innych 'completed'
        // Sprawdź czy zadanie wymaga zdjęcia/odpowiedzi i czy zostało przesłane
        let newStatus;
        if (taskData.task_type === 'photo_upload') {
            if (mediaUrl) {
                newStatus = 'pending_verification';
            } else {
                // Jeśli zadanie wymaga zdjęcia, ale nie ma zdjęcia, nie można oznaczyć jako wykonane
                showNotification('Musisz dodać zdjęcie, aby oznaczyć zadanie jako wykonane', 'error');
                return;
            }
        } else if (taskData.task_type === 'text_response_verified') {
            if (responseText) {
                newStatus = 'pending_verification';
            } else {
                // Jeśli zadanie wymaga odpowiedzi, ale nie ma odpowiedzi, nie można oznaczyć jako wykonane
                showNotification('Musisz wpisać odpowiedź, aby oznaczyć zadanie jako wykonane', 'error');
                return;
            }
        } else {
            newStatus = 'completed';
        }
        
        console.log('📝 Aktualizacja zadania:', {
            taskId: taskData.id,
            userId: currentUser.id,
            newStatus: newStatus,
            mediaUrl: mediaUrl,
            responseText: responseText,
            taskType: taskData.task_type
        });
        
        // Zaktualizuj status zadania w Supabase
        const updateData = {
            status: newStatus
        };
        
        // Ustaw completed_at tylko dla zadań completed
        if (newStatus === 'completed') {
            updateData.completed_at = new Date().toISOString();
        } else {
            // Dla pending_verification nie ustawiamy completed_at
            updateData.completed_at = null;
        }
        
        // Jeśli jest zdjęcie, dodaj je do aktualizacji
        if (mediaUrl) {
            updateData.response_media_url = mediaUrl;
        }
        
        // Jeśli jest odpowiedź tekstowa, dodaj ją do aktualizacji
        if (responseText) {
            updateData.response_text = responseText;
        }
        
        console.log('📤 Dane do aktualizacji:', updateData);
        console.log('🔍 Sprawdzam sesję użytkownika:', {
            userId: currentUser?.id,
            email: currentUser?.email
        });
        
        const { data: updateResult, error } = await supabase
            .from('assigned_tasks')
            .update(updateData)
            .eq('id', taskData.id)
            .eq('user_id', currentUser.id) // Dodatkowe sprawdzenie user_id dla bezpieczeństwa
            .select();
        
        if (error) {
            console.error('❌ Błąd aktualizacji zadania:', error);
            console.error('Szczegóły błędu:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            
            // Sprawdź czy to błąd RLS
            if (error.code === 'PGRST116' || error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
                showNotification('Błąd uprawnień: Sprawdź polityki RLS dla tabeli assigned_tasks. Upewnij się, że możesz aktualizować swoje zadania.', 'error');
            } else if (error.code === '23505') {
                showNotification('Błąd: Zadanie już istnieje dla tego dnia', 'error');
            } else {
                showNotification('Błąd zapisywania postępu: ' + (error.message || 'Nieznany błąd'), 'error');
            }
            return;
        }
        
        if (!updateResult || updateResult.length === 0) {
            console.error('❌ Brak zaktualizowanych rekordów');
            showNotification('Błąd: Nie udało się zaktualizować zadania. Sprawdź czy zadanie istnieje i należy do Ciebie.', 'error');
            return;
        }
        
        console.log('✅ Zadanie zaktualizowane:', updateResult);
        
        // Zaktualizuj lokalny stan
        if (newStatus === 'completed') {
            completedDays.add(currentDay);
        }
        userTasks[currentDay].status = newStatus;
        if (mediaUrl) {
            userTasks[currentDay].response_media_url = mediaUrl;
        }
        if (responseText) {
            userTasks[currentDay].response_text = responseText;
        }
        updateProgress();
        updateAllMarkers(); // Odśwież wszystkie markery (mogą się odblokować inne dni)
    closeModal();
    
    if (newStatus === 'pending_verification') {
        showNotification(`Zadanie na dzień ${currentDay} zostało przesłane do weryfikacji przez administratora!`, 'success');
    } else {
        showNotification(`Zadanie na dzień ${currentDay} zostało oznaczone jako wykonane!`, 'success');
    }
    } catch (error) {
        console.error('Błąd oznaczania zadania jako wykonane:', error);
        showNotification('Błąd zapisywania postępu', 'error');
    }
}

// Aktualizacja paska postępu (nieużywane - pasek został usunięty)
function updateProgress() {
    // Funkcja zachowana dla kompatybilności, ale nie wykonuje żadnych działań
    // Pasek z postępami został usunięty z interfejsu
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
    const photoInput = document.getElementById('task-photo-input');
    const selectPhotoBtn = document.getElementById('select-photo-btn');
    
    closeBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    markCompletedBtn.addEventListener('click', markTaskCompleted);
    
    // Obsługa wyboru zdjęcia
    if (selectPhotoBtn) {
        selectPhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });
    }
    
    // Obsługa zmiany zdjęcia
    if (photoInput) {
        photoInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const photoFilename = document.getElementById('photo-filename');
                const photoPreview = document.getElementById('photo-preview');
                const photoPreviewContainer = document.getElementById('photo-preview-container');
                const uploadedPhotoContainer = document.getElementById('uploaded-photo-container');
                
                uploadedPhotoContainer.style.display = 'none';
                
                // Sprawdź czy to plik HEIC/HEIF
                const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                               file.name.toLowerCase().endsWith('.heif') ||
                               file.type === 'image/heic' || 
                               file.type === 'image/heif';
                
                try {
                    let fileToPreview = file;
                    let fileName = file.name;
                    
                    // Jeśli to HEIC, skonwertuj na JPEG
                    if (isHeic && typeof heic2any !== 'undefined') {
                        photoFilename.textContent = 'Konwertowanie HEIC...';
                        
                        // Konwertuj HEIC na JPEG
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: 0.9
                        });
                        
                        // heic2any zwraca tablicę, weź pierwszy element
                        const convertedFile = convertedBlob instanceof Array ? convertedBlob[0] : convertedBlob;
                        
                        // Utwórz nowy plik z nową nazwą
                        fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
                        fileToPreview = new File([convertedFile], fileName, { type: 'image/jpeg' });
                        
                        // Zastąp plik w input
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(fileToPreview);
                        photoInput.files = dataTransfer.files;
                        
                        photoFilename.textContent = fileName;
                        console.log('✅ Skonwertowano HEIC na JPEG');
                    } else {
                        photoFilename.textContent = fileName;
                    }
                    
                    // Pokaż podgląd
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        photoPreview.src = e.target.result;
                        photoPreviewContainer.style.display = 'block';
                    };
                    reader.readAsDataURL(fileToPreview);
                } catch (error) {
                    console.error('❌ Błąd konwersji HEIC:', error);
                    showNotification('Błąd: Nie można przekonwertować pliku HEIC. Spróbuj użyć innego formatu.', 'error');
                    photoInput.value = '';
                    photoFilename.textContent = '';
                }
            }
        });
    }
    
    // Obsługa usuwania zdjęcia z podglądu
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            const photoInput = document.getElementById('task-photo-input');
            const photoPreviewContainer = document.getElementById('photo-preview-container');
            const photoFilename = document.getElementById('photo-filename');
            
            if (photoInput) {
                photoInput.value = '';
            }
            if (photoPreviewContainer) {
                photoPreviewContainer.style.display = 'none';
            }
            if (photoFilename) {
                photoFilename.textContent = '';
            }
        });
    }
    
    // Usuwanie przesłanego zdjęcia jest wyłączone - użytkownik nie może usuwać już przesłanych zdjęć
    
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
            .select('day_number, fun_fact')
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
                    fun_fact: day.fun_fact || null
                };
            });
        }
        
        console.log('✅ Załadowano dane dni kalendarza z bazy:', Object.keys(calendarDaysData).length, 'dni');
        
        // Odśwież markery na mapie jeśli mapa już istnieje
        if (map && markers) {
            refreshMapMarkers();
        }
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
    
    console.log('🔍 Ładowanie zadań dla użytkownika:', currentUser.id, currentUser.email, 'rola:', currentUser.role);
    
    try {
        // Pobierz zadania użytkownika - najpierw bez join, potem pobierz day_number osobno
        const { data: tasksData, error: tasksError } = await supabase
            .from('assigned_tasks')
            .select(`
                *,
                task_templates(title, description, task_type, metadata)
            `)
            .eq('user_id', currentUser.id);
        
        if (tasksError) {
            console.error('❌ Błąd ładowania zadań użytkownika:', tasksError);
            console.error('❌ Szczegóły błędu:', {
                message: tasksError.message,
                code: tasksError.code,
                details: tasksError.details,
                hint: tasksError.hint
            });
            return;
        }
        
        console.log('📋 Pobrane zadania z bazy (bez join):', tasksData);
        console.log('📋 Liczba zadań:', tasksData?.length || 0);
        
        if (!tasksData || tasksData.length === 0) {
            console.log('⚠️ Brak zadań dla użytkownika');
            userTasks = {};
            return;
        }
        
        // Pobierz wszystkie calendar_day_id z zadań
        const calendarDayIds = [...new Set(tasksData.map(t => t.calendar_day_id).filter(id => id))];
        console.log('📋 Calendar day IDs:', calendarDayIds);
        
        // Pobierz informacje o dniach kalendarza
        const { data: daysData, error: daysError } = await supabase
            .from('calendar_days')
            .select('id, day_number')
            .in('id', calendarDayIds);
        
        if (daysError) {
            console.error('❌ Błąd ładowania dni kalendarza:', daysError);
        }
        
        console.log('📋 Pobrane dni kalendarza:', daysData);
        
        // Utwórz mapę: calendar_day_id -> day_number
        const dayIdToDayNumber = {};
        if (daysData) {
            daysData.forEach(day => {
                dayIdToDayNumber[day.id] = day.day_number;
            });
        }
        
        console.log('📋 Mapa dayIdToDayNumber:', dayIdToDayNumber);
        
        // Przekształć dane do formatu userTasks
        // Klucz to day_number (1-24)
        userTasks = {};
        tasksData.forEach(task => {
            const dayNumber = dayIdToDayNumber[task.calendar_day_id];
            if (!dayNumber) {
                console.warn('⚠️ Zadanie bez day_number dla calendar_day_id:', task.calendar_day_id, task);
                return;
            }
            console.log(`📝 Dodaję zadanie dla dnia ${dayNumber} (calendar_day_id: ${task.calendar_day_id}):`, task.task_templates?.title);
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
        
        console.log('✅ Załadowano zadania użytkownika dla dni:', Object.keys(userTasks).map(d => `Dzień ${d}`).join(', '));
        console.log('✅ Obiekt userTasks:', userTasks);
    } catch (error) {
        console.error('❌ Błąd ładowania zadań użytkownika:', error);
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
    const topRightButtons = document.getElementById('top-right-buttons');
    if (topRightButtons) {
        topRightButtons.style.display = 'none';
    }
    document.getElementById('auth-buttons').style.display = 'block';
}

// Pokazywanie informacji o użytkowniku
function showUserInfo() {
    if (!currentUser) return;
    
    // Pokaż przyciski w prawym górnym rogu
    const topRightButtons = document.getElementById('top-right-buttons');
    if (topRightButtons) {
        topRightButtons.style.display = 'flex';
    }
    
    // Ukryj przycisk logowania dla zalogowanych użytkowników
    document.getElementById('auth-buttons').style.display = 'none';
    
    // Pokaż link do panelu admina jeśli użytkownik jest adminem
    const adminLink = document.getElementById('admin-link');
    if (adminLink && currentUser.role === 'admin') {
        adminLink.style.display = 'inline-flex';
    }
}


// Wylogowanie (Supabase)
async function logout() {
    if (!supabase) {
        console.error('Supabase nie jest zainicjalizowany');
        // Nawet bez Supabase, wyczyść dane lokalne i przekieruj
        localStorage.removeItem('supabase_session');
        currentUser = null;
        completedDays.clear();
        updateProgress();
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Sprawdź czy sesja istnieje przed próbą wylogowania
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Jeśli sesja istnieje, wyloguj się
        if (session) {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                // Nie wyświetlaj błędu jeśli sesja już nie istnieje (częsty przypadek na Vercel)
                if (error.message && error.message.includes('Auth session missing')) {
                    console.log('Sesja już nie istnieje, kontynuuję wylogowanie...');
                } else {
                    console.error('Błąd wylogowania:', error);
                    // Nie przerywaj procesu wylogowania nawet przy błędzie
                }
            }
        } else {
            console.log('Brak aktywnej sesji, kontynuuję wylogowanie...');
        }
    } catch (error) {
        // Ignoruj błąd jeśli sesja nie istnieje
        if (error.message && error.message.includes('Auth session missing')) {
            console.log('Sesja już nie istnieje, kontynuuję wylogowanie...');
        } else {
            console.error('Błąd wylogowania:', error);
        }
    }
    
    // Zawsze wyczyść dane lokalne niezależnie od stanu sesji
    try {
        localStorage.removeItem('supabase_session');
        currentUser = null;
        completedDays.clear();
        updateProgress();
    } catch (error) {
        console.error('Błąd czyszczenia danych lokalnych:', error);
    }
    
    showNotification('Wylogowano pomyślnie', 'success');
    
    // Zawsze przekieruj do strony logowania
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
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
        const country = defaultData?.country || 'Brak państwa';
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
// Sprawdź czy użytkownik ma przypisane pytania
async function checkUserQuestions() {
    if (!supabase || !currentUser) return;
    
    try {
        const { data: questions, error } = await supabase
            .from('user_quiz_questions')
            .select('id')
            .eq('target_user_id', currentUser.id)
            .limit(1);
        
        if (error) {
            console.error('Błąd sprawdzania pytań użytkownika:', error);
            return;
        }
        
        // Pokaż przycisk jeśli użytkownik ma pytania
        const buttonContainer = document.getElementById('user-questions-button-container');
        if (buttonContainer) {
            if (questions && questions.length > 0) {
                buttonContainer.style.display = 'block';
            } else {
                buttonContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Błąd sprawdzania pytań użytkownika:', error);
    }
}

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

