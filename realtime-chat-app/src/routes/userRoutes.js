const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getStickers, getRecentChats, updateAvatar, toggleAction } = require('../controllers/userController');

router.get('/search/:phone', async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.params.phone }).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy!' });
        res.status(200).json(user);
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
});

router.get('/recent/:userId', getRecentChats);
router.get('/get-all-stickers', getStickers);

// API Mới
router.post('/avatar', updateAvatar);
router.post('/action', toggleAction);

module.exports = router;