const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// API lấy lịch sử chat giữa 2 người
router.get('/:userId/:friendId', async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        // Tìm các tin nhắn mà A gửi B HOẶC B gửi A
        const history = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        }).sort({ time: 1 }); // Sắp xếp theo thời gian gửi

        res.status(200).json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tải lịch sử tin nhắn' });
    }
});

module.exports = router;