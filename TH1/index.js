const http = require('http')

const server = http.createServer((req, res) => {
    console.log(req.url)

    switch(req.url) {
        case "/":
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8'
            })
            res.end("Trang chủ")
            break

        case "/about":
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8'
            })
            res.end("Trang giới thiệu")
            break

        case "/contact":
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8'
            })
            res.end("Trang liên hệ")
            break

        default:
            res.writeHead(404, {
                'Content-Type': 'text/plain; charset=utf-8'
            })
            res.end("404 - Không tìm thấy trang")
    }
})

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000")
})