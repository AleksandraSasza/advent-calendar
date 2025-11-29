// =========================================================
// KONFIGURACJA SUPABASE DLA VERCEL
// =========================================================
// Ten plik jest commitowany i zawiera logikę ładowania konfiguracji
// z różnych źródeł (config.js lokalnie, zmienne środowiskowe na Vercel)
// =========================================================

(function() {
    // Jeśli config.js już załadował konfigurację, nie rób nic
    if (window.SUPABASE_CONFIG) {
        return;
    }
    
    // Sprawdź różne źródła konfiguracji
    
    // 1. Zmienne środowiskowe Vercel (wstrzyknięte podczas build)
    // Vercel może wstrzyknąć zmienne przez specjalny endpoint lub przez window.__ENV__
    const env = window.__ENV__ || {};
    
    // 2. Sprawdź czy są wstrzyknięte bezpośrednio w HTML (przez vercel.json)
    const injectedConfig = window.__SUPABASE_CONFIG__;
    
    // 3. Sprawdź localStorage (dla developmentu)
    const storedConfig = localStorage.getItem('SUPABASE_CONFIG');
    
    // Priorytet: injectedConfig > env > storedConfig
    if (injectedConfig && injectedConfig.URL && injectedConfig.ANON_KEY) {
        window.SUPABASE_CONFIG = injectedConfig;
        console.log('✅ Konfiguracja załadowana z wstrzykniętej konfiguracji');
    } else if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        window.SUPABASE_CONFIG = {
            URL: env.NEXT_PUBLIC_SUPABASE_URL,
            ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        };
        console.log('✅ Konfiguracja załadowana z zmiennych środowiskowych (NEXT_PUBLIC_)');
    } else if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
        window.SUPABASE_CONFIG = {
            URL: env.VITE_SUPABASE_URL,
            ANON_KEY: env.VITE_SUPABASE_ANON_KEY
        };
        console.log('✅ Konfiguracja załadowana z zmiennych środowiskowych (VITE_)');
    } else if (storedConfig) {
        try {
            window.SUPABASE_CONFIG = JSON.parse(storedConfig);
            console.log('✅ Konfiguracja załadowana z localStorage');
        } catch (e) {
            console.error('Błąd parsowania konfiguracji z localStorage:', e);
        }
    } else {
        // 4. Spróbuj załadować z meta tagów (jeśli zostały wstrzyknięte podczas build)
        const metaUrl = document.querySelector('meta[name="supabase-url"]');
        const metaKey = document.querySelector('meta[name="supabase-anon-key"]');
        
        if (metaUrl && metaKey) {
            window.SUPABASE_CONFIG = {
                URL: metaUrl.getAttribute('content'),
                ANON_KEY: metaKey.getAttribute('content')
            };
            console.log('✅ Konfiguracja załadowana z meta tagów');
        } else {
            // Jeśli nic nie zadziałało, wyświetl ostrzeżenie
            console.warn('⚠️ Brak konfiguracji Supabase. Upewnij się, że:');
            console.warn('   1. Plik config.js istnieje (dla lokalnego developmentu)');
            console.warn('   2. Zmienne środowiskowe są ustawione na Vercel');
            console.warn('   3. Zmienne mają prefiks NEXT_PUBLIC_ lub VITE_');
            console.warn('   4. Zobacz VERCEL-KONFIGURACJA.md dla szczegółów');
        }
    }
})();

