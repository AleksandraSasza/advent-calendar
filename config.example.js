// =========================================================
// PRZYKŁADOWY PLIK KONFIGURACJI SUPABASE
// =========================================================
// Skopiuj ten plik jako config.js i wypełnij swoimi danymi
// =========================================================

const SUPABASE_CONFIG = {
    URL: 'https://twoj-projekt.supabase.co',  // ← Wklej swój URL z Supabase
    ANON_KEY: 'sb_publishable_xxxxxxxxxxxxx'  // ← Wklej swój klucz z Supabase
};

// Eksportuj dla Node.js (jeśli potrzebne)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}

// Eksportuj dla przeglądarki
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}


