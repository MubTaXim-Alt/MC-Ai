import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; // For ESM __dirname equivalent

dotenv.config();

// ESM equivalent for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // This will be /opt/render/project/src/dist or similar

const PORT = process.env.PORT || 3000;
let botProcess: ChildProcess | null = null;

function startBot() {
  if (botProcess) {
    console.log('Bot process already running. Killing existing process...');
    botProcess.kill();
    botProcess = null;
  }

  console.log('Starting Minecraft bot process...');
  // bot files are in 'dist/bot/index.js' relative to project root
  // __dirname is 'dist', so botScriptPath is 'dist/bot/index.js'
  const botScriptPath = path.join(__dirname, 'bot', 'index.js'); 

  if (!fs.existsSync(botScriptPath)) {
    console.error(`Bot script not found at ${botScriptPath}. Make sure to run 'npm run build'.`);
    return;
  }
  
  botProcess = spawn('node', [botScriptPath], { stdio: 'inherit' });

  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    botProcess = null;
  });

  botProcess.on('error', (err) => {
    console.error('Failed to start bot process:', err);
    botProcess = null;
  });
}

const server = http.createServer((req, res) => {
  // Frontend files are built by Vite into 'dist/client'
  // __dirname is 'dist' (where server.js lives)
  // So, the path to the client files is path.join(__dirname, 'client')
  const frontendBuildPath = path.join(__dirname, 'client'); 

  if (req.url === '/status-page-for-bot-info-only') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Suva Bot Status</title>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0; color: #333; }
              .container { text-align: center; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              h1 { color: #2c3e50; }
              p { font-size: 1.1em; }
              .status { font-weight: bold; }
              .running { color: green; }
              .stopped { color: red; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Suva Minecraft Bot</h1>
              <p>The bot is attempting to run.</p>
              <p>Status: <span class="status ${botProcess && !botProcess.killed ? 'running' : 'stopped'}">${botProcess && !botProcess.killed ? 'Running' : 'Not Running / Starting'}</span></p>
              <p>Check your Minecraft server and the console logs for more details.</p>
          </div>
      </body>
      </html>
    `);
  } else {
    // Construct the file path relative to the 'dist/client' directory
    let requestedPath = req.url === '/' ? 'index.html' : req.url!;
    // Remove leading slash from req.url if present, as path.join handles it
    if (requestedPath.startsWith('/')) {
        requestedPath = requestedPath.substring(1);
    }
    let filePath = path.join(frontendBuildPath, requestedPath);
    
    // Security: Prevent directory traversal
    const resolvedFilePath = path.resolve(filePath);
    if (!resolvedFilePath.startsWith(path.resolve(frontendBuildPath))) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.woff2': 'application/font-woff2',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                // If file not found, serve index.html for SPA routing
                fs.readFile(path.join(frontendBuildPath, 'index.html'), (err, indexContent) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Sorry, check with the site admin for error: '+err.code+' ..\n');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(indexContent, 'utf-8');
                    }
                });
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
  }
});

server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}.`);
  console.log(`Serving frontend from: ${path.resolve(path.join(__dirname, 'client'))}`); // Updated log
  console.log(`Attempting to start bot from: ${path.resolve(path.join(__dirname, 'bot', 'index.js'))}`);
  startBot(); 
});

process.on('SIGINT', () => {
  console.log("Caught interrupt signal, shutting down server and bot...");
  if (botProcess) {
    botProcess.kill('SIGINT');
  }
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log("Caught SIGTERM signal, shutting down server and bot...");
  if (botProcess) {
    botProcess.kill('SIGTERM');
  }
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
