import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize sessions file if it doesn't exist
if (!fs.existsSync(SESSIONS_FILE)) {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
}

// Routes
app.get('/api/sessions', (req, res) => {
    try {
        const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read sessions data' });
    }
});

app.post('/api/sessions', (req, res) => {
    try {
        const newSession = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...req.body
        };
        
        const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
        data.push(newSession);
        
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save session' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
