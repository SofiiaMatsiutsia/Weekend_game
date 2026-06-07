import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const server = http.createServer((req, res) => {
  let filePath;

  // Try public folder first (for assets, index.html, etc.)
  const publicPath = path.join(__dirname, 'public', req.url);
  
  // If it exists in public, serve from there
  if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
    filePath = publicPath;
  } 
  // Otherwise try project root (for src files)
  else {
    filePath = path.join(__dirname, req.url);
  }

  // Handle directory requests - look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Default to index.html for root
  if (req.url === '/') {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  // Get file extension
  const ext = path.extname(filePath);

  // Set content type
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + err.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎮 Game Fox running at http://localhost:${PORT}`);
});
