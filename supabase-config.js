// Konfiguracja Supabase
// UWAGA: W produkcji użyj zmiennych środowiskowych!
// Utwórz plik .env z:
// SUPABASE_URL=twoj-url
// SUPABASE_ANON_KEY=twoj-klucz

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://twoj-projekt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'twoj-klucz-anon';

// Dla frontendu (browser)
if (typeof window !== 'undefined') {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
}

// Dla backendu (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    };
}

