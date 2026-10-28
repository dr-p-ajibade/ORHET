import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Manual Proxy for CORE API to bypass CORS and ensure correct routing
  app.get('/api/core-proxy/*', async (req, res) => {
    const subPath = req.params[0];
    const queryParams = new URLSearchParams(req.query as any).toString();
    const coreUrl = `https://api.core.ac.uk/v3/${subPath}${queryParams ? '?' + queryParams : ''}`;

    try {
      const response = await fetch(coreUrl, {
        method: 'GET',
        headers: {
          'Authorization': req.headers.authorization || '',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ 
        message: 'Failed to proxy request to CORE',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
