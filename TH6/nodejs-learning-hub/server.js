const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const appEmitter = require('./events/AppEmitter');
const TextTransform = require('./streams/TextTransform');
const EchoDuplex = require('./streams/EchoDuplex');

const PORT = 3000;

function serveHTML(res, filename) {
    const filePath = path.join(__dirname, 'views', filename);
    const readStream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    readStream.pipe(res);
    readStream.on('error', () => { res.writeHead(404); res.end('404 Not Found'); });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    if (method === 'GET') {
        if (pathname === '/') serveHTML(res, 'index.html');
        else if (pathname === '/streams') serveHTML(res, 'streams.html');
        else if (pathname === '/request') serveHTML(res, 'request.html');
        else if (pathname === '/events') serveHTML(res, 'events.html'); // Route mới
        
        else if (pathname === '/json') {
            const logPath = path.join(__dirname, 'data', 'log.txt');
            fs.readFile(logPath, 'utf8', (err, data) => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                if (err || !data) return res.end(JSON.stringify([])); 
                const diaries = data.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
                res.end(JSON.stringify(diaries));
            });
        }
        
        else if (pathname === '/api/events') { // Đọc log sự kiện
            const eventPath = path.join(__dirname, 'data', 'story.txt');
            fs.readFile(eventPath, 'utf8', (err, data) => {
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(data || '');
            });
        }

        else if (pathname === '/api/request-info') {
            res.setHeader('X-Powered-By', 'NodeJS-Learning-Diary');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(200);
            res.end(JSON.stringify({ url: req.url, method: req.method, query: parsedUrl.query, headers: req.headers, resHeaders: res.getHeaders() }));
        }

        else if (pathname === '/download-log') {
            const logPath = path.join(__dirname, 'data', 'log.txt');
            res.setHeader('Content-Disposition', 'attachment; filename=nhat_ky_backup.txt');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            fs.createReadStream(logPath).pipe(res);
        }

        else if (pathname === '/transform') {
            const logPath = path.join(__dirname, 'data', 'log.txt');
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            fs.createReadStream(logPath).pipe(new TextTransform()).pipe(res);
        }

        else if (pathname === '/image') {
            const imageName = parsedUrl.query.name;
            const imagePath = path.join(__dirname, 'public/images', imageName);
            const readStream = fs.createReadStream(imagePath);
            res.writeHead(200, { 'Content-Type': imageName.endsWith('.png') ? 'image/png' : 'image/jpeg' });
            readStream.pipe(res);
            readStream.on('error', () => { res.writeHead(404); res.end('Image not found'); });
        }
        else { res.writeHead(404); res.end('404 Not Found'); }
    } 
    
    else if (method === 'POST') {
        if (pathname === '/streams') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const id = Date.now().toString();
                    const imageName = `${id}_1.${data.ext}`; 

                    fs.createWriteStream(path.join(__dirname, 'public/images', imageName)).write(Buffer.from(data.imageBase64, 'base64'));
                    
                    const logEntry = { id, date: new Date().toLocaleString('vi-VN'), title: data.title, content: data.content, images: [imageName] };
                    const logStream = fs.createWriteStream(path.join(__dirname, 'data', 'log.txt'), { flags: 'a' });
                    logStream.write(JSON.stringify(logEntry) + '\n');
                    logStream.end();

                    appEmitter.emit('new_diary', id, data.title);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } catch (error) { res.writeHead(500); res.end('Server Error'); }
            });
        }
        
        else if (pathname === '/duplex') { // Gõ nháp
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            req.pipe(new EchoDuplex()).pipe(res);
        }
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});