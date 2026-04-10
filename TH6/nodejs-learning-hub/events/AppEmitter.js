const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// Tạo class kế thừa từ EventEmitter (Yêu cầu bài thực hành)
class AppEmitter extends EventEmitter {
    constructor() {
        super();
        
        // Lắng nghe sự kiện 'new_diary'
        this.on('new_diary', (id, title) => {
            const time = new Date().toLocaleString('vi-VN');
            const logMessage = `[${time}] SỰ KIỆN: Đã tạo nhật ký mới - ID: ${id} - Tiêu đề: "${title}"\n`;
            
            console.log(logMessage);
            
            // Ghi log sự kiện vào file (đảm bảo thư mục data đã tồn tại)
            const logPath = path.join(__dirname, '../data/story.txt');
            fs.appendFile(logPath, logMessage, (err) => {
                if (err) console.error("Lỗi khi ghi event log:", err);
            });
        });
    }
}

// Xuất ra một instance duy nhất (Singleton pattern)
module.exports = new AppEmitter();