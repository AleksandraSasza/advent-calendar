// Skrypt do wstrzykiwania zmiennych środowiskowych Vercel do HTML
// Uruchamiany podczas build na Vercel

const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'index.html',
    'login.html',
    'profile.html',
    'admin.html',
    'ranking.html'
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Brak zmiennych środowiskowych Supabase. Użyj config.js dla lokalnego developmentu.');
    process.exit(0); // Nie przerywaj build, jeśli brak zmiennych
}

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Plik ${file} nie istnieje, pomijam...`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sprawdź czy meta tagi już istnieją
    if (content.includes('meta name="supabase-url"')) {
        // Zaktualizuj istniejące meta tagi
        content = content.replace(
            /<meta name="supabase-url" content="[^"]*">/,
            `<meta name="supabase-url" content="${supabaseUrl}">`
        );
        content = content.replace(
            /<meta name="supabase-anon-key" content="[^"]*">/,
            `<meta name="supabase-anon-key" content="${supabaseAnonKey}">`
        );
    } else {
        // Dodaj meta tagi w <head> (najbardziej niezawodne)
        const metaTags = `    <meta name="supabase-url" content="${supabaseUrl}">
    <meta name="supabase-anon-key" content="${supabaseAnonKey}">`;
        
        // Dodaj meta tagi przed zamknięciem </head>
        if (content.includes('</head>')) {
            content = content.replace('</head>', `${metaTags}\n</head>`);
        } else {
            // Jeśli nie ma </head>, dodaj na początku <body>
            if (content.includes('<body')) {
                content = content.replace('<body', `${metaTags}\n<body`);
            } else {
                // Ostateczność: dodaj przed pierwszym <script>
                content = content.replace(/(<script)/, `${metaTags}\n$1`);
            }
        }
        
        // Dodaj również inline script z konfiguracją PRZED vercel-config.js (backup)
        const configScript = `    <script>
        // Konfiguracja Supabase wstrzyknięta podczas build (backup)
        if (!window.SUPABASE_CONFIG) {
            window.SUPABASE_CONFIG = {
                URL: ${JSON.stringify(supabaseUrl)},
                ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
            };
            console.log('✅ Konfiguracja załadowana z inline script (build)');
        }
    </script>`;
        
        // Dodaj przed vercel-config.js
        if (content.includes('vercel-config.js')) {
            content = content.replace(
                /<script src="vercel-config\.js"><\/script>/,
                `${configScript}\n    <script src="vercel-config.js"></script>`
            );
        } else if (content.includes('config.js')) {
            // Jeśli nie ma vercel-config.js, dodaj po config.js
            content = content.replace(
                /<script src="config\.js"><\/script>/,
                `<script src="config.js"></script>\n${configScript}`
            );
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Zaktualizowano ${file} z konfiguracją Supabase`);
});

console.log('✅ Wstrzyknięto konfigurację Supabase do wszystkich plików HTML');

