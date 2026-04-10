const { Duplex } = require('stream');

class EchoDuplex extends Duplex {
    constructor(options) {
        super(options);
    }

    // 1. Writable part: Nhận dữ liệu từ Client
    _write(chunk, encoding, callback) {
        const text = chunk.toString('utf8');
        
        // Tính toán số từ
        const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        // Xử lý dữ liệu và đẩy ngược lại vào Readable part
        const echoMsg = `[Hệ thống Echo] Bạn vừa gõ ${wordCount} từ. Nội dung: ${text}\n`;
        this.push(Buffer.from(echoMsg, 'utf8'));
        
        callback();
    }

    // 2. Readable part: Trả dữ liệu về Client
    _read(size) {
        // Không cần code thêm vì _write đã chủ động push dữ liệu ra rồi
    }
}

module.exports = EchoDuplex;