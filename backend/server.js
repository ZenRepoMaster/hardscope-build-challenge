const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT,
    platform TEXT,
    views INTEGER,
    engagement_rate REAL
  )`);

  db.run(`CREATE TABLE campaigns (
    handle TEXT,
    platform TEXT,
    genre TEXT,
    hashtag TEXT,
    title_keywords TEXT,
    PRIMARY KEY (handle, platform)
  )`);

  db.run(`CREATE TABLE trends (
    year_month TEXT,
    genre TEXT,
    views INTEGER
  )`);

  fs.createReadStream('./data/top_creators_impact_2025.csv')
    .on('error', () => console.error('Error: top_creators_impact missing.'))
    .pipe(csv())
    .on('data', (row) => {
      const handle = row.author_handle || row.creator || 'Unknown';
      const er = parseFloat(row.avg_er || row.engagement_rate || 0);
      db.run(`INSERT INTO creators (handle, platform, views, engagement_rate) VALUES (?, ?, ?, ?)`, 
        [handle, row.platform || 'Unknown', parseInt(row.views || 0), er]);
    });

  // Fast ingestion of 50k youtube/tiktok video dataset for context and trends
  const campaignMap = new Map();
  const trendMap = new Map();

  fs.createReadStream('./data/youtube_shorts_tiktok_trends_2025.csv')
    .on('error', () => console.error('Error: youtube_shorts raw data missing.'))
    .pipe(csv())
    .on('data', (row) => {
      const handle = row.author_handle || 'Unknown';
      const platform = row.platform || 'Unknown';
      const genre = row.genre || 'General';
      const ym = row.year_month;
      const views = parseInt(row.views || 0);

      // Grab first video for creator's campaign context
      const campKey = `${handle}|${platform}`;
      if (!campaignMap.has(campKey)) {
        campaignMap.set(campKey, { 
          handle, platform, genre, 
          hashtag: row.hashtag || '#Viral', 
          title: row.title_keywords || 'Content'
        });
      }

      // Aggregating trends by month + genre
      if (ym && genre) {
        const trendKey = `${ym}|${genre}`;
        trendMap.set(trendKey, (trendMap.get(trendKey) || 0) + views);
      }
    })
    .on('end', () => {
      // Bulk inserting for instant startup
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        const stmtCamp = db.prepare(`INSERT OR IGNORE INTO campaigns (handle, platform, genre, hashtag, title_keywords) VALUES (?, ?, ?, ?, ?)`);
        campaignMap.forEach(v => stmtCamp.run(v.handle, v.platform, v.genre, v.hashtag, v.title));
        stmtCamp.finalize();

        const stmtTrend = db.prepare(`INSERT INTO trends (year_month, genre, views) VALUES (?, ?, ?)`);
        trendMap.forEach((views, key) => {
          const [ym, g] = key.split('|');
          stmtTrend.run(ym, g, views);
        });
        stmtTrend.finalize();

        db.run('COMMIT');
        console.log('✅ Database Seeding Complete (Trends & Context mapped)');
      });
    });
});

// Endpoint for filterable Creators
app.get('/api/creators', (req, res) => {
  const { platform, genre } = req.query;
  
  let query = `
    SELECT c.*, camp.genre, camp.hashtag, camp.title_keywords 
    FROM creators c
    LEFT JOIN campaigns camp ON c.handle = camp.handle AND c.platform = camp.platform
    WHERE 1=1
  `;
  let params = [];

  if (platform && platform !== 'All') {
    query += ' AND c.platform = ?';
    params.push(platform);
  }
  if (genre && genre !== 'All') {
    query += ' AND camp.genre = ?';
    params.push(genre);
  }
  
  query += ' ORDER BY c.views DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// Endpoint for Trends by Genre
app.get('/api/trends', (req, res) => {
  db.all('SELECT year_month, genre, SUM(views) as total_views FROM trends GROUP BY year_month, genre ORDER BY year_month ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    const formattedData = {};
    const genres = new Set();
    
    rows.forEach(row => {
      if (!formattedData[row.year_month]) formattedData[row.year_month] = { date: row.year_month };
      formattedData[row.year_month][row.genre] = row.total_views;
      genres.add(row.genre);
    });
    
    res.json({ data: Object.values(formattedData), genres: Array.from(genres) });
  });
});

// Endpoint to get unique genres for the dropdown
app.get('/api/genres', (req, res) => {
  db.all('SELECT DISTINCT genre FROM campaigns WHERE genre IS NOT NULL ORDER BY genre', [], (err, rows) => {
    res.json(rows.map(r => r.genre));
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));