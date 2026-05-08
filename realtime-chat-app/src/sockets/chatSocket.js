const Message = require('../models/Message');
const User = require('../models/User'); // Quan trọng để kiểm tra tính năng Chặn
const onlineUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        
        socket.on('register-user', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('update-user-list', Array.from(onlineUsers.keys()));
        });

        socket.on('send-message', async (data) => {
            try {
                const sender = await User.findById(data.senderId);
                const receiver = await User.findById(data.receiverId);
                
                // Kiểm tra xem 1 trong 2 có đang chặn nhau không
                if ((sender.blockedUsers && sender.blockedUsers.includes(data.receiverId)) || 
                    (receiver.blockedUsers && receiver.blockedUsers.includes(data.senderId))) {
                    return socket.emit('error-msg', 'Không thể gửi tin nhắn (Đang chặn hoặc bị chặn).');
                }

                const newMessage = new Message({
                    sender: data.senderId,
                    receiver: data.receiverId,
                    message: data.message,
                    type: data.type || 'text',
                    fileName: data.fileName,
                    fileSize: data.fileSize
                });
                await newMessage.save();

                const receiverSid = onlineUsers.get(data.receiverId);
                if (receiverSid) io.to(receiverSid).emit('receive-message', newMessage);
                socket.emit('receive-message', newMessage);
            } catch (error) { console.log("Lỗi gửi tin:", error); }
        });

        // XỬ LÝ THU HỒI TIN NHẮN
        socket.on('unsend-message', async (msgId) => {
            try {
                const msg = await Message.findByIdAndUpdate(msgId, { isUnsent: true, message: 'Tin nhắn đã bị thu hồi' }, { new: true });
                io.emit('message-updated', msg); // Báo cho tất cả tải lại lịch sử
            } catch(e) { console.log(e); }
        });

        // XỬ LÝ CHỈNH SỬA TIN NHẮN
        socket.on('edit-message', async ({ msgId, newContent }) => {
            try {
                const msg = await Message.findByIdAndUpdate(msgId, { message: newContent, isEdited: true }, { new: true });
                io.emit('message-updated', msg);
            } catch(e) { console.log(e); }
        });

        // XỬ LÝ CẢM XÚC
        socket.on('react-message', async (data) => {
            try {
                const msg = await Message.findById(data.msgId);
                if (!msg) return;

                // Xóa cảm xúc cũ của user này nếu có
                msg.reactions = msg.reactions.filter(r => r.userId.toString() !== data.senderId);
                // Nếu không phải thao tác gỡ (chữ X) thì thêm cảm xúc mới vào
                if (data.reaction) msg.reactions.push({ userId: data.senderId, reaction: data.reaction });
                await msg.save();

                const receiverSid = onlineUsers.get(data.receiverId);
                if (receiverSid) io.to(receiverSid).emit('update-reaction', { msgId: data.msgId, reactions: msg.reactions });
                socket.emit('update-reaction', { msgId: data.msgId, reactions: msg.reactions });
            } catch(e) { console.log(e); }
        });

        // TRẠNG THÁI ĐÃ XEM
        // TRẠNG THÁI ĐÃ XEM
        socket.on('mark-as-read', async ({ msgId, senderId }) => {
            try {
                // Cập nhật Database
                await Message.findByIdAndUpdate(msgId, { isRead: true });
                
                // Tìm socket của người gửi để báo tin nhắn đã được xem
                const senderSid = onlineUsers.get(senderId);
                if (senderSid) {
                    io.to(senderSid).emit('message-read', { msgId });
                    // Báo thêm sự kiện updated để người gửi cập nhật lại sidebar (nếu cần)
                    io.to(senderSid).emit('message-updated');
                }
            } catch (error) {
                console.log("Lỗi cập nhật trạng thái xem:", error);
            }
        });

        // CẬP NHẬT AVATAR ĐỒNG BỘ
        socket.on('update-avatar', (data) => {
            socket.broadcast.emit('friend-avatar-updated', data);
        });

        socket.on('typing', (data) => {
            const receiverSid = onlineUsers.get(data.receiverId);
            if (receiverSid) io.to(receiverSid).emit('typing-status', data);
        });

        socket.on('get-online-status', () => {
            socket.emit('update-user-list', Array.from(onlineUsers.keys()));
        });

        socket.on('disconnect', () => {
            for (let [uId, sId] of onlineUsers.entries()) {
                if (sId === socket.id) {
                    onlineUsers.delete(uId);
                    break;
                }
            }
            io.emit('update-user-list', Array.from(onlineUsers.keys()));
        });
    });
};