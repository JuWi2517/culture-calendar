// server/server.js
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());

const calendarId = process.env.CALENDAR_ID;

const auth = new google.auth.JWT(
    process.env.CLIENT_EMAIL,
    null,
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar.readonly']
);

const calendar = google.calendar({ version: 'v3', auth });

app.get('/api/events', async (req, res) => {
    try {
        const response = await calendar.events.list({
            calendarId,
            timeMin: new Date().toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });
        res.json(response.data.items);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).send('Server error');
    }
});

// 🆕 Route to resolve short fb.me links
app.get('/api/resolve-link', async (req, res) => {
    const { url } = req.query;

    // Validate input
    if (!url || !url.startsWith('https://fb.me/')) {
        return res.status(400).json({ error: 'Invalid or missing URL' });
    }

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow'
        });

        res.json({ resolved: response.url });
    } catch (err) {
        console.error('Error resolving fb.me link:', err);
        res.status(500).json({ error: 'Failed to resolve URL' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
