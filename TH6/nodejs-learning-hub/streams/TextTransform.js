const { Transform } = require('stream');

class TextTransform extends Transform {
    constructor(options) {
        super(options);
    }

    // Ghi đè hàm _transform
    _transform(chunk, encoding, callback) {
        let text = chunk.toString('utf8');
        
        // 1. Chuyển thành chữ in hoa
        text = text.toUpperCase();
        
        // 2. Replace: Làm mờ ID (giả lập bảo mật dữ liệu)
        // Tìm chữ "ID":"bất kỳ số nào" và đổi thành "ID":"***"
        text = text.replace(/"ID":"\d+"/g, '"ID":"***"');
        
        // Đẩy dữ liệu đã biến đổi đi tiếp
        this.push(text);
        
        // Báo hiệu đã xử lý xong chunk này
        callback();
    }
}

module.exports = TextTransform;