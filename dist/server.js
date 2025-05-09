"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
let botProcess = null;
function startBot() {
    if (botProcess) {
        console.log('Bot process already running. Killing existing process...');
        botProcess.kill();
        botProcess = null;
    }
    console.log('Starting Minecraft bot process...');
    // Ensure the bot is compiled to JS first. The `build` script handles this.
    // 'dist/bot/index.js' will be the entry point.
    const botScriptPath = path_1.default.join(__dirname, 'bot', 'index.js'); // Correct path after tsc compilation
    if (!fs_1.default.existsSync(botScriptPath)) {
        console.error(`Bot script not found at ${botScriptPath}. Make sure to run 'npm run build'.`);
        // Optionally, try to run the build script here, but it's better to ensure it's done beforehand.
        // For Render, the build command in render.yaml will handle this.
        return;
    }
    botProcess = (0, child_process_1.spawn)('node', [botScriptPath], { stdio: 'inherit' });
    botProcess.on('close', (code) => {
        console.log(`Bot process exited with code ${code}`);
        botProcess = null;
        // Optional: auto-restart bot after a delay
        // console.log('Restarting bot in 10 seconds...');
        // setTimeout(startBot, 10000);
    });
    botProcess.on('error', (err) => {
        console.error('Failed to start bot process:', err);
        botProcess = null;
    });
}
// Create a simple HTTP server for Render to bind its port
const server = http_1.default.createServer((req, res) => {
    if (req.url === '/') {
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
    }
    else {
        // Serve static files from Vite's build output (dist/src or similar)
        // This part is for if you want the React frontend to be served by this server.
        // For now, we'll keep it simple. The primary purpose is bot operation.
        // If you build your React app, its assets will be in 'dist/assets' (default Vite output).
        // The main index.html will be in 'dist/index.html'.
        const frontendDistPath = path_1.default.join(__dirname, '..', 'dist'); // Assuming server.js is in dist/
        let filePath = path_1.default.join(frontendDistPath, req.url === '/' ? 'index.html' : req.url);
        // Security: Prevent directory traversal
        if (!filePath.startsWith(frontendDistPath)) {
            res.writeHead(403);
            res.end("Forbidden");
            return;
        }
        const extname = String(path_1.default.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        fs_1.default.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    // If file not found, try serving index.html for SPA routing
                    fs_1.default.readFile(path_1.default.join(frontendDistPath, 'index.html'), (err, indexContent) => {
                        if (err) {
                            res.writeHead(500);
                            res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(indexContent, 'utf-8');
                        }
                    });
                }
                else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
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
    startBot(); // Start the bot when the server starts
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
