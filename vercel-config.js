// =========================================================
// KONFIGURACJA SUPABASE DLA VERCEL
// =========================================================
// Ten plik jest commitowany i zawiera logikę ładowania konfiguracji
// z różnych źródeł (config.js lokalnie, zmienne środowiskowe na Vercel)
// =========================================================

// =========================================================
// KONFIGURACJA SUPABASE DLA VERCEL
// =========================================================
// Ten plik jest commitowany i zawiera logikę ładowania konfiguracji
// z różnych źródeł (config.js lokalnie, zmienne środowiskowe na Vercel)
// =========================================================

(function() {
    // Jeśli config.js już załadował konfigurację, nie rób nic
    if (window.SUPABASE_CONFIG) {
        console.log('✅ Konfiguracja już załadowana z config.js');
        return;
    }
    
    // Sprawdź różne źródła konfiguracji (w kolejności priorytetu)
    
    // 1. Sprawdź localStorage (dla developmentu/testów)
    const storedConfig = localStorage.getItem('SUPABASE_CONFIG');
    if (storedConfig) {
        try {
            window.SUPABASE_CONFIG = JSON.parse(storedConfig);
            console.log('✅ Konfiguracja załadowana z localStorage');
            return;
        } catch (e) {
            console.error('Błąd parsowania konfiguracji z localStorage:', e);
        }
    }
    
    // 2. Sprawdź meta tagi (jeśli zostały wstrzyknięte podczas build)
    // Używamy document.head zamiast document.querySelector, bo może być załadowany wcześniej
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head) {
        const metaUrl = head.querySelector('meta[name="supabase-url"]');
        const metaKey = head.querySelector('meta[name="supabase-anon-key"]');
        
        if (metaUrl && metaKey) {
            window.SUPABASE_CONFIG = {
                URL: metaUrl.getAttribute('content'),
                ANON_KEY: metaKey.getAttribute('content')
            };
            console.log('✅ Konfiguracja załadowana z meta tagów');
            return;
        }
    }
    
    // 3. Sprawdź zmienne środowiskowe Vercel (jeśli są dostępne)
    const env = window.__ENV__ || {};
    if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.SUPABASE_CONFIG = {
            URL: env.NEXT_PUBLIC_SUPABASE_URL,
            ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        };
        console.log('✅ Konfiguracja załadowana z zmiennych środowiskowych (NEXT_PUBLIC_)');
        return;
    }
    
    if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
        window.SUPABASE_CONFIG = {
            URL: env.VITE_SUPABASE_URL,
            ANON_KEY: env.VITE_SUPABASE_ANON_KEY
        };
        console.log('✅ Konfiguracja załadowana z zmiennych środowiskowych (VITE_)');
        return;
    }
    
    // Jeśli nic nie zadziałało, wyświetl ostrzeżenie
    console.error('❌ BŁĄD: Brak konfiguracji Supabase!');
    console.error('Upewnij się, że:');
    console.error('   1. Plik config.js istnieje (dla lokalnego developmentu)');
    console.error('   2. Zmienne środowiskowe są ustawione na Vercel:');
    console.error('      - NEXT_PUBLIC_SUPABASE_URL');
    console.error('      - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('   3. Build Command jest ustawiony w Vercel: npm run build');
    console.error('   4. Zobacz VERCEL-KONFIGURACJA.md dla szczegółów');
})();

