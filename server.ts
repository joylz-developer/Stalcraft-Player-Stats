import express from 'express';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const CLIENT_ID = process.env.STALCRAFT_CLIENT_ID || '42';
const CLIENT_SECRET = process.env.STALCRAFT_CLIENT_SECRET || 'EXPdWXDOfW0jbpqkIjLgboegeajmjNGqjTgiHckg';
const STALCRAFT_API_URL = 'https://eapi.stalcraft.net';
const OAUTH_URL = 'https://exbo.net/oauth/token';

// Database setup
const db = new Database('app.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    exbo_id TEXT UNIQUE,
    username TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    access_token TEXT,
    expires_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS highlights_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    formula TEXT NOT NULL,
    color TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    format TEXT DEFAULT 'number'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Attempt to add access_token column if it doesn't exist (migration)
try {
  db.prepare('ALTER TABLE sessions ADD COLUMN access_token TEXT').run();
} catch (e) {
  // Column likely exists or other error we can ignore for now
}

// Insert default highlights if empty
const count = db.prepare('SELECT COUNT(*) as count FROM highlights_config').get() as {count: number};
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO highlights_config (title, formula, color, order_index, format) VALUES (?, ?, ?, ?, ?)');
  insert.run('K/D Игроки', '{kil} / {dea}', 'text-emerald-400', 1, 'ratio');
  insert.run('Точность', '({sho-hit} / {sho-fir}) * 100', 'text-blue-400', 2, 'percent');
  insert.run('В голову', '({sho-hea} / {sho-hit}) * 100', 'text-amber-400', 3, 'percent');
  insert.run('Время в игре', '{pla-tim}', 'text-purple-400', 4, 'duration');
}

// Clean up corrupted users from previous bugs
try {
    db.prepare('DELETE FROM users WHERE exbo_id IS NULL OR username IS NULL OR exbo_id = "undefined" OR username = "undefined"').run();
} catch (e) {
    console.error('Failed to clean up corrupted users:', e);
}

// Auth Middleware
const pendingAuths = new Map<string, string>();

const requireAuth = (req: any, res: any, next: any) => {
    let sessionId = req.cookies.session_token;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.substring(7);
    }

    if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });

    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?').get(sessionId, Date.now()) as any;
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as any;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user;
    next();
};

const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
};

let accessToken: string | null = null;
let tokenExpiresAt: Date | null = null;

async function getAccessToken() {
    if (accessToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
        return accessToken;
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');
        params.append('scope', '');

        const response = await axios.post(OAUTH_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, expires_in } = response.data;
        
        accessToken = access_token;
        tokenExpiresAt = new Date(new Date().getTime() + (expires_in - 60) * 1000);
        
        console.log('New access token obtained.');
        return accessToken;
    } catch (error: any) {
        console.error('Error getting access token:', error.response ? error.response.data : error.message);
        accessToken = null;
        tokenExpiresAt = null;
        throw new Error('Could not retrieve access token');
    }
}

app.get('/api/profile/:region/:character', async (req, res) => {
    try {
        const { region, character } = req.params;
        const token = await getAccessToken();

        const apiUrl = `${STALCRAFT_API_URL}/${region}/character/by-name/${character}/profile`;
        
        const response = await axios.get(apiUrl, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching profile:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({ 
            message: 'Failed to fetch character profile',
            details: error.response?.data || error.message
        });
    }
});

// OAuth Routes
app.get('/api/auth/url', (req, res) => {
    let clientOrigin = (req.query.origin as string) || process.env.APP_URL || '';
    if (clientOrigin.endsWith('/')) {
        clientOrigin = clientOrigin.slice(0, -1);
    }
    const authId = req.query.auth_id;
    // Use /auth/callback to match standard OAuth patterns and user configuration
    const redirectUri = `${clientOrigin}/auth/callback`;
    
    // Simple JSON stringify + Base64 (standard)
    const stateObj = JSON.stringify({ origin: clientOrigin, auth_id: authId });
    const state = Buffer.from(stateObj).toString('base64');
    
    console.log(`[Auth Start] AuthID: ${authId}, Origin: ${clientOrigin}, State: ${state}`);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: '',
        state: state
    });
    res.json({ url: `https://exbo.net/oauth/authorize?${params.toString()}` });
});

app.get('/api/auth/status', (req, res) => {
    const authId = req.query.auth_id as string;
    if (!authId) return res.status(400).json({ error: 'Missing auth_id' });
    
    const sessionId = pendingAuths.get(authId);
    console.log(`[Auth Status] Checking AuthID: ${authId}. Found Session: ${!!sessionId}`);
    
    if (sessionId) {
        pendingAuths.delete(authId);
        res.json({ success: true, session_id: sessionId });
    } else {
        res.json({ success: false });
    }
});

app.get(['/auth/callback', '/api/auth/callback'], async (req, res) => {
    const { code, state } = req.query;
    console.log(`[Auth Callback] Code present: ${!!code}, State: ${state}`);

    try {
        let clientOrigin = process.env.APP_URL || 'http://localhost:3000';
        let authId = null;
        
        if (state) {
            try {
                // Try standard base64 decode first
                const decodedStr = Buffer.from(state as string, 'base64').toString('utf-8');
                const decodedState = JSON.parse(decodedStr);
                console.log('[Auth Callback] Decoded state:', decodedState);
                if (decodedState.origin) clientOrigin = decodedState.origin;
                if (decodedState.auth_id) authId = decodedState.auth_id;
            } catch (e) {
                console.error('[Auth Callback] Failed to decode state:', e);
                // Fallback: try base64url just in case
                try {
                     const decodedStr = Buffer.from(state as string, 'base64url').toString('utf-8');
                     const decodedState = JSON.parse(decodedStr);
                     console.log('[Auth Callback] Decoded state (base64url):', decodedState);
                     if (decodedState.origin) clientOrigin = decodedState.origin;
                     if (decodedState.auth_id) authId = decodedState.auth_id;
                } catch (e2) {
                    console.error('[Auth Callback] Failed to decode state (base64url):', e2);
                }
            }
        }
        
        // Ensure we use the same redirect URI as requested
        const redirectUri = `${clientOrigin}/auth/callback`;
        console.log('[Auth Callback] Using redirect URI:', redirectUri);

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: redirectUri
        });

        const response = await axios.post(OAUTH_URL, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = response.data;
        console.log('[Auth Callback] Access token received');
        
        if (!access_token) {
            console.error('No access_token in response:', response.data);
            throw new Error('API access token not found in response');
        }

        // Try to fetch characters from all regions to find a stable identity
        let accountId: string | null = null;
        let username: string | null = null;
        
        const regions = ['ru', 'eu', 'na', 'sea'];
        for (const region of regions) {
            try {
                console.log(`[Auth Callback] Fetching characters for region ${region}...`);
                const charsResponse = await axios.get(`${STALCRAFT_API_URL}/${region}/characters`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                });
                console.log(`[Auth Callback] Region ${region} response:`, JSON.stringify(charsResponse.data, null, 2));
                
                if (charsResponse.data && Array.isArray(charsResponse.data) && charsResponse.data.length > 0) {
                    const firstChar = charsResponse.data[0];
                    // API returns { information: { name: '...' } }
                    const charName = firstChar.name || firstChar.information?.name;
                    
                    if (charName) {
                        username = charName;
                        accountId = username; // Use the first found character name as a stable ID
                        console.log(`[Auth Callback] Found character ${username} in region ${region}`);
                        break;
                    } else {
                        console.log(`[Auth Callback] Character found in region ${region} but name is missing:`, JSON.stringify(firstChar));
                    }
                } else {
                    console.log(`[Auth Callback] No characters found in region ${region}`);
                }
            } catch (e: any) {
                console.error(`[Auth Callback] Failed to fetch characters for region ${region}:`, e.message);
                if (e.response) {
                    console.error(`[Auth Callback] Error details:`, e.response.data);
                }
            }
        }

        if (!accountId) {
             // Fallback: try oauth/user if characters fail
             try {
                const userResponse = await axios.get('https://exbo.net/oauth/user', {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                });
                accountId = userResponse.data.uuid || String(userResponse.data.id);
                username = userResponse.data.login || `User_${accountId.substring(0, 6)}`;
             } catch (e) {
                console.log('Could not fetch user info, using hash of token as fallback');
                accountId = crypto.createHash('sha256').update(access_token).digest('hex').substring(0, 16);
                username = `User_${accountId.substring(0, 6)}`;
             }
        }

        let user = db.prepare('SELECT * FROM users WHERE exbo_id = ?').get(accountId) as any;
        
        if (user) {
            // Update existing user's username if it changed
            if (user.username !== username) {
                db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, user.id);
                user.username = username;
            }
        } else {
            const adminCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as any).count;
            const isFirstUser = adminCount === 0;
            const id = crypto.randomUUID();
            db.prepare('INSERT INTO users (id, exbo_id, username, role) VALUES (?, ?, ?, ?)').run(
                id, accountId, username, isFirstUser ? 'admin' : 'user'
            );
            user = { id, exbo_id: accountId, username, role: isFirstUser ? 'admin' : 'user' };
        }

        const sessionId = crypto.randomUUID();
        db.prepare('INSERT INTO sessions (id, user_id, access_token, expires_at) VALUES (?, ?, ?, ?)').run(
            sessionId, user.id, access_token, Date.now() + 1000 * 60 * 60 * 24 * 7
        );

        console.log('Session created:', sessionId, 'for authId:', authId);
        if (authId) {
            pendingAuths.set(authId, sessionId);
            // Clean up after 5 minutes
            setTimeout(() => pendingAuths.delete(authId), 5 * 60 * 1000);
        }

        res.cookie('session_token', sessionId, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });
        
        res.send(`
            <html>
                <body style="background: #09090b; color: #10b981; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                    <div style="text-align: center;">
                        <h2 style="margin-bottom: 8px;">Авторизация успешна!</h2>
                        <p style="color: #a1a1aa; margin-bottom: 20px;">Вы можете закрыть это окно.</p>
                        <button onclick="window.close()" style="background: #10b981; color: #09090b; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Закрыть окно</button>
                        <script>
                            try {
                                if (window.opener) {
                                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                                }
                            } catch (e) {
                                console.error('Failed to post message to opener:', e);
                            }
                            setTimeout(() => window.close(), 2000);
                        </script>
                    </div>
                </body>
            </html>
        `);
    } catch (error: any) {
        console.error('OAuth error:', error.response?.data || error.message);
        res.status(500).send(`Authentication failed: ${error.message}`);
    }
});

app.get('/api/auth/me', requireAuth, (req: any, res) => {
    res.json(req.user);
});

app.get('/api/user/characters', requireAuth, async (req: any, res) => {
    let sessionId = req.cookies.session_token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.substring(7);
    }

    if (!sessionId) {
        console.log('User characters request failed: No session ID found');
        return res.status(401).json({ error: 'No session ID' });
    }

    const session = db.prepare('SELECT access_token FROM sessions WHERE id = ?').get(sessionId) as any;
    
    if (!session || !session.access_token) {
        console.log('User characters request failed: No access token in session', { sessionId });
        return res.status(401).json({ error: 'No access token found' });
    }

    const regions = ['ru', 'eu', 'na', 'sea'];
    const allCharacters = [];

    for (const region of regions) {
        try {
            console.log(`[User Characters] Fetching for region ${region}...`);
            const response = await axios.get(`${STALCRAFT_API_URL}/${region}/characters`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            console.log(`[User Characters] Region ${region} response:`, JSON.stringify(response.data, null, 2));
            if (response.data && Array.isArray(response.data)) {
                const flattenedChars = response.data.map((char: any) => {
                    // Flatten the structure if needed
                    const name = char.name || char.information?.name;
                    const id = char.id || char.information?.id;
                    const creationTime = char.creationTime || char.information?.creationTime;
                    
                    return {
                        ...char,
                        name,
                        id,
                        creationTime,
                        region
                    };
                });
                allCharacters.push(...flattenedChars);
            }
        } catch (e: any) {
            console.error(`[User Characters] Failed for region ${region}:`, e.message);
            if (e.response) {
                console.error(`[User Characters] Error details:`, e.response.data);
            }
        }
    }

    res.json(allCharacters);
});

app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.cookies.session_token;
    if (sessionId) {
        db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }
    res.clearCookie('session_token', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' 
    });
    res.json({ success: true });
});

// Highlights API
app.get('/api/highlights', (req, res) => {
    const highlights = db.prepare('SELECT * FROM highlights_config ORDER BY order_index ASC').all();
    res.json(highlights);
});

app.post('/api/admin/highlights', requireAuth, requireAdmin, (req, res) => {
    const highlights = req.body;
    
    const transaction = db.transaction((items: any[]) => {
        db.prepare('DELETE FROM highlights_config').run();
        const insert = db.prepare('INSERT INTO highlights_config (title, formula, color, order_index, format) VALUES (?, ?, ?, ?, ?)');
        items.forEach((item, index) => {
            insert.run(item.title, item.formula, item.color, index, item.format || 'number');
        });
    });

    try {
        transaction(highlights);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Settings API
app.get('/api/settings/:key', (req, res) => {
    try {
        const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key) as any;
        if (setting) {
            res.json(JSON.parse(setting.value));
        } else {
            res.json(null);
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/settings/:key', requireAuth, requireAdmin, (req, res) => {
    try {
        const value = JSON.stringify(req.body);
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?').run(req.params.key, value, value);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Users API
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
    try {
        const users = db.prepare('SELECT id, exbo_id, username, role FROM users ORDER BY username ASC').all();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/:id/role', requireAuth, requireAdmin, (req: any, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (role !== 'admin' && role !== 'user') {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent removing the last admin
    if (role === 'user') {
        const adminCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as any).count;
        const targetUser = db.prepare("SELECT role FROM users WHERE id = ?").get(id) as any;
        if (targetUser && targetUser.role === 'admin' && adminCount <= 1) {
            return res.status(400).json({ error: 'Cannot remove the last admin' });
        }
    }

    try {
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        app.use(express.static('dist'));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve('dist/index.html'));
        });
    }

app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('SERVER RESTARTED - VERSION WITH DETAILED LOGGING');
    });
}

startServer();
