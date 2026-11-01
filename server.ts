import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { apiRouter } from './server/routes/api';
import { MODEL_NAME, testGeminiHealth } from './server/ai/geminiClient';
import firebaseConfig from './firebase-applet-config.json';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for server-side lookups
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API endpoints (includes /api/health)
  app.use('/api', apiRouter);

  // OpenGraph & Twitter Card Crawler Interceptor for /share/:eventId
  app.get('/share/:eventId', async (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    const isCrawler =
      /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Discordbot|TelegramBot|Applebot|Googlebot|bingbot/i.test(
        userAgent
      );

    if (isCrawler) {
      const { eventId } = req.params;

      let eventData: { title: string; city: string; date: string; image: string } | null = null;

      // Try loading real event from Firestore
      try {
        const snap = await getDoc(doc(db, 'events', eventId));
        if (snap.exists()) {
          const d = snap.data();
          eventData = {
            title: d.title || 'Curated Celebration Plan',
            city: d.city || 'India',
            date: d.date || '2026',
            image: d.coverImageUrl || d.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
          };
        }
      } catch (err) {
        console.warn('[Share Crawler] Firestore lookup failed, checking static fallback:', err);
      }

      // Fallback demo map if not found in Firestore
      if (!eventData) {
        const demoTitles: Record<
          string,
          { title: string; city: string; date: string; image: string }
        > = {
          evt_wedding_01: {
            title: 'Priya & Rohan — Temple & Garden Wedding',
            city: 'Chennai',
            date: 'Nov 28, 2026',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
          },
          evt_techfest_02: {
            title: 'INNOVENTUM 2027 — National Intercollegiate Tech Fest',
            city: 'Bengaluru',
            date: 'Feb 14, 2027',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
          },
          evt_birthday_03: {
            title: "Ananya's 1st Birthday — Enchanted Woodland & Balloon Safari",
            city: 'Mumbai',
            date: 'Nov 08, 2026',
            image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&auto=format&fit=crop&q=80',
          },
        };
        eventData = demoTitles[eventId] || {
          title: 'Curated Celebration Plan',
          city: 'India',
          date: '2026',
          image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
        };
      }

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const publicUrl = `${protocol}://${host}/share/${escapeHtml(eventId)}`;
      const safeTitle = escapeHtml(eventData.title);
      const safeCity = escapeHtml(eventData.city);
      const safeDate = escapeHtml(eventData.date);
      const safeImage = escapeHtml(eventData.image);
      const description = escapeHtml(
        `Join us for ${eventData.title} in ${eventData.city} on ${eventData.date}. Verified itinerary, theme palette, and guest schedule on Event AI.`
      );

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle} — Event AI</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Event AI" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:url" content="${publicUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${safeImage}" />
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${description}</p>
  <p>Location: ${safeCity} | Date: ${safeDate}</p>
  <a href="${publicUrl}">View Full Event Plan</a>
</body>
</html>`;
      return res.status(200).type('text/html').send(html);
    }

    next();
  });

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Event AI Server] Running on http://0.0.0.0:${PORT} (Node ${process.version})`);
    console.log(`[Event AI Server] Gemini Model: ${MODEL_NAME} | Key Configured: ${!!process.env.GEMINI_API_KEY}`);
  });
}

startServer().catch((err) => {
  console.error('[Event AI Server] Fatal startup error:', err);
  process.exit(1);
});
