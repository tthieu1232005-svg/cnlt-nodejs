const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['text', 'sticker', 'file'], default: 'text' },
    fileName: { type: String }, // Lưu tên file gốc
    fileSize: { type: String },
    time: { type: Date, default: Date.now },
    reactions: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reaction: String }],
    isUnsent: { type: Boolean, default: false }, // Thu hồi
    isEdited: { type: Boolean, default: false }, // Chỉnh sửa
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Xóa phía mình
    isRead: { type: Boolean, default: false } // Trạng thái đã xem
});

module.exports = mongoose.model('Message', messageSchema);