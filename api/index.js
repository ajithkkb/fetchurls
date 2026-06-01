const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your frontend page to talk to this backend
app.use(express.json());

app.get('/api/preview', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'URL parameter is required' });

    try {
        // We add a User-Agent header so websites don't block us as a bot
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 5000 // Automatically cancel if the site takes over 5 seconds to respond
        });

        // Load the HTML string into Cheerio for easy jQuery-like parsing
        const $ = cheerio.load(response.data);

        // Extract metadata (with fallbacks)
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'No Title';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || 'No description available.';
        let image = $('meta[property="og:image"]').attr('content') || '';

        // Clean up relative image paths to absolute paths
        if (image && !image.startsWith('http')) {
            const parsedUrl = new URL(targetUrl);
            image = parsedUrl.origin + (image.startsWith('/') ? '' : '/') + image;
        }

        res.json({
            title,
            description,
            image,
            domain: new URL(targetUrl).hostname
        });

    } catch (error) {
        console.error('Scraping failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch website metadata' });
    }
});
module.exports = app;
