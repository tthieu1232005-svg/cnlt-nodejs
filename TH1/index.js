const http = require('http')

const server = http.createServer((req, res) => {
    console.log(req.url)

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    })

    switch(req.url) {
        case "/":
            res.end("Trang chủ")
            break
        case "/about":
            res.end("Trang giới thiệu")
            break
        case "/contact":
            res.end("Trang liên hệ")
            break
        default:
            res.writeHead(404, {
                'Content-Type': 'text/plain; charset=utf-8'
            })
            res.end("404 - Không tìm thấy trang")
    }
})

server.listen(3000)