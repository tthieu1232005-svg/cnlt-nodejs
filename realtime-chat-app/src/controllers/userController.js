const User = require('../models/User');
const Message = require('../models/Message');
const fs = require('fs');
const path = require('path');

const getRecentChats = async (req, res) => {
    try {
        const userId = req.params.userId;
        const currentUser = await User.findById(userId);
        const pinned = currentUser.pinnedUsers.map(id => id.toString());
        const blocked = currentUser.blockedUsers.map(id => id.toString());

        const messages = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] }).sort({ time: -1 });
        const contactIds = [...new Set(messages.map(m => m.sender.toString() === userId ? m.receiver.toString() : m.sender.toString()))];

        let recentChats = await Promise.all(contactIds.map(async (id) => {
            const user = await User.findById(id).select('name phone avatar');
            const lastMsg = await Message.findOne({ $or: [{ sender: userId, receiver: id }, { sender: id, receiver: userId }] }).sort({ time: -1 });
            
            let status = 'normal';
            if (pinned.includes(id)) status = 'pinned';
            if (blocked.includes(id)) status = 'blocked';

            return {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
                lastMessage: lastMsg ? (lastMsg.type === 'sticker' ? '[Sticker]' : lastMsg.message) : '',
                time: lastMsg ? lastMsg.time : null,
                status: status
            };
        }));

        // Sắp xếp: Pinned lên đầu, Blocked xuống cuối
        recentChats.sort((a, b) => {
            if (a.status === 'pinned' && b.status !== 'pinned') return -1;
            if (a.status !== 'pinned' && b.status === 'pinned') return 1;
            if (a.status === 'blocked' && b.status !== 'blocked') return 1;
            if (a.status !== 'blocked' && b.status === 'blocked') return -1;
            return (b.time || 0) - (a.time || 0); // Ưu tiên thời gian nếu cùng status
        });

        res.status(200).json(recentChats);
    } catch (error) { res.status(500).json({ message: 'Lỗi server' }); }
};

const getStickers = (req, res) => {
    const stickersPath = path.join(__dirname, '../../public/stickers');
    fs.readdir(stickersPath, (err, files) => {
        if (err) return res.status(500).json({ message: 'Lỗi đọc sticker' });
        const stickerFiles = files.filter(file => ['.gif', '.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase()));
        res.status(200).json(stickerFiles);
    });
};

const updateAvatar = async (req, res) => {
    try {
        const { userId, avatarBase64 } = req.body;
        const user = await User.findByIdAndUpdate(userId, { avatar: avatarBase64 }, { new: true });
        res.status(200).json({ avatar: user.avatar });
    } catch (error) { res.status(500).json({ message: 'Lỗi cập nhật avatar' }); }
};

const toggleAction = async (req, res) => {
    try {
        const { userId, targetId, action } = req.body; // action: 'pin' hoặc 'block'
        const user = await User.findById(userId);
        const list = action === 'pin' ? user.pinnedUsers : user.blockedUsers;
        
        const index = list.indexOf(targetId);
        if (index > -1) list.splice(index, 1); // Đã có thì gỡ
        else list.push(targetId); // Chưa có thì thêm

        await user.save();
        res.status(200).json({ message: 'Thành công' });
    } catch (error) { res.status(500).json({ message: 'Lỗi thao tác' }); }
};

module.exports = { getRecentChats, getStickers, updateAvatar, toggleAction };