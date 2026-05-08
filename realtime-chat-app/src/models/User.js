const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    avatar: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }, // Ảnh mặc định
    pinnedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);