const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Inicjalizacja bazy danych
const db = new sqlite3.Database('./advent_calendar.db');

// Tworzenie tabel
db.serialize(() => {
    // Tabela użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Dodaj kolumnę name jeśli nie istnieje
    db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
        // Ignoruj błąd jeśli kolumna już istnieje
    });
    
    // Tabela postępu użytkowników
    db.run(`CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        completed_days TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// Middleware autoryzacji
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Endpoint rejestracji
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email i hasło są wymagane' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
        }
        
        // Sprawdź czy użytkownik już istnieje
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd bazy danych' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'Użytkownik z tym emailem już istnieje' });
            }
            
            // Hash hasła
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Dodaj użytkownika
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Błąd tworzenia użytkownika' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Konto zostało utworzone pomyślnie' 
                });
            });
        });
    } catch (error) {
        console.error('Błąd rejestracji:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Endpoint logowania
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email i hasło są wymagane' });
        }
        
        // Znajdź użytkownika
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd bazy danych' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
            }
            
            // Sprawdź hasło
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
            }
            
            // Generuj token JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Endpoint weryfikacji tokenu
app.get('/api/verify', authenticateToken, (req, res) => {
    db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Błąd bazy danych' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at
        });
    });
});

// Endpoint pobierania postępu użytkownika
app.get('/api/progress', authenticateToken, (req, res) => {
    db.get(
        'SELECT completed_days FROM user_progress WHERE user_id = ?',
        [req.user.userId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd bazy danych' });
            }
            
            const completedDays = row ? JSON.parse(row.completed_days || '[]') : [];
            res.json({ completedDays });
        }
    );
});

// Endpoint zapisywania postępu użytkownika
app.post('/api/progress', authenticateToken, (req, res) => {
    const { completedDays } = req.body;
    
    if (!Array.isArray(completedDays)) {
        return res.status(400).json({ error: 'completedDays musi być tablicą' });
    }
    
    const completedDaysJson = JSON.stringify(completedDays);
    
    // Sprawdź czy postęp już istnieje
    db.get(
        'SELECT id FROM user_progress WHERE user_id = ?',
        [req.user.userId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd bazy danych' });
            }
            
            if (row) {
                // Aktualizuj istniejący postęp
                db.run(
                    'UPDATE user_progress SET completed_days = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [completedDaysJson, req.user.userId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Błąd aktualizacji postępu' });
                        }
                        res.json({ success: true });
                    }
                );
            } else {
                // Utwórz nowy postęp
                db.run(
                    'INSERT INTO user_progress (user_id, completed_days) VALUES (?, ?)',
                    [req.user.userId, completedDaysJson],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Błąd zapisywania postępu' });
                        }
                        res.json({ success: true });
                    }
                );
            }
        }
    );
});

// Endpoint aktualizacji imienia użytkownika
app.put('/api/profile/name', authenticateToken, (req, res) => {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Imię nie może być puste' });
    }
    
    db.run(
        'UPDATE users SET name = ? WHERE id = ?',
        [name.trim(), req.user.userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Błąd aktualizacji imienia' });
            }
            
            res.json({ success: true, message: 'Imię zostało zaktualizowane' });
        }
    );
});

// Endpoint zmiany hasła
app.put('/api/profile/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Obecne i nowe hasło są wymagane' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' });
        }
        
        // Pobierz użytkownika z bazy
        db.get('SELECT password FROM users WHERE id = ?', [req.user.userId], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Błąd bazy danych' });
            }
            
            if (!user) {
                return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
            }
            
            // Sprawdź obecne hasło
            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Nieprawidłowe obecne hasło' });
            }
            
            // Hash nowego hasła
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            
            // Aktualizuj hasło
            db.run(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedNewPassword, req.user.userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Błąd aktualizacji hasła' });
                    }
                    
                    res.json({ success: true, message: 'Hasło zostało zmienione' });
                }
            );
        });
    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Endpoint usuwania konta
app.delete('/api/profile/delete', authenticateToken, (req, res) => {
    // Usuń postęp użytkownika
    db.run('DELETE FROM user_progress WHERE user_id = ?', [req.user.userId], (err) => {
        if (err) {
            console.error('Błąd usuwania postępu:', err);
        }
        
        // Usuń użytkownika
        db.run('DELETE FROM users WHERE id = ?', [req.user.userId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Błąd usuwania konta' });
            }
            
            res.json({ success: true, message: 'Konto zostało usunięte' });
        });
    });
});

// Endpoint głównej strony
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint strony logowania
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Endpoint strony profilu
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

// Endpoint panelu administracyjnego
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Obsługa błędów
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Coś poszło nie tak!' });
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`🎄 Serwer kalendarza adwentowego działa na porcie ${PORT}`);
    console.log(`🌍 Otwórz http://localhost:${PORT} w przeglądarce`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Zamykanie serwera...');
    db.close((err) => {
        if (err) {
            console.error('Błąd zamykania bazy danych:', err.message);
        } else {
            console.log('✅ Baza danych zamknięta pomyślnie');
        }
        process.exit(0);
    });
});
