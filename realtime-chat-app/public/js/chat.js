const socket = io();
let currentUser = JSON.parse(localStorage.getItem('chat_user'));
let selectedUserId = null;

if (!currentUser) window.location.href = '/login.html';
else {
    document.getElementById('current-username').innerText = `Chào, ${currentUser.name}`;
    document.getElementById('my-avatar').src = currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    socket.emit('register-user', currentUser.id);
}

function logout() {
    localStorage.removeItem('chat_user');
    window.location.href = '/login.html';
}

// --- 1. DARK MODE ---
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerText = isDark ? '☀️' : '🌙';
    };
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerText = '☀️';
    }
}

// --- 2. UPLOAD AVATAR ---
document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return alert('Vui lòng chọn ảnh nhỏ hơn 3MB!');

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result;
        try {
            const response = await fetch('/api/users/avatar', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, avatarBase64: base64 })
            });
            if (response.ok) {
                document.getElementById('my-avatar').src = base64;
                currentUser.avatar = base64;
                localStorage.setItem('chat_user', JSON.stringify(currentUser));
                socket.emit('update-avatar', { userId: currentUser.id, avatar: base64 });
            }
        } catch (error) { console.error('Lỗi Upload:', error); }
    };
    reader.readAsDataURL(file);
});

socket.on('friend-avatar-updated', () => loadRecentChats());

// --- 3. LOAD DANH SÁCH & TÌM KIẾM ---
async function loadRecentChats() {
    try {
        const res = await fetch(`/api/users/recent/${currentUser.id}`);
        const chats = await res.json();
        const userList = document.getElementById('user-list');
        userList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `user-item ${selectedUserId === chat._id ? 'active' : ''}`;
            li.id = `user-${chat._id}`;
            li.onclick = () => selectUser(chat._id, chat.name);
            
            let icon = chat.status === 'pinned' ? '📌' : (chat.status === 'blocked' ? '🚫' : '');
            let avatarSrc = chat.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

            li.innerHTML = `
                <div class="user-item-info">
                    <img src="${avatarSrc}" class="friend-avatar">
                    <div class="user-text">
                        <div class="user-name-row">
                            <strong>${chat.name} <span class="icon-badge">${icon}</span></strong>
                            <span class="status-dot offline" id="dot-${chat._id}"></span>
                        </div>
                        <div class="last-msg">${chat.lastMessage}</div>
                    </div>
                </div>
            `;
            userList.appendChild(li);
        });
        socket.emit('get-online-status');
    } catch (e) { console.error(e); }
}
loadRecentChats();

async function toggleAction(action) {
    if(!selectedUserId) return;
    await fetch('/api/users/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetId: selectedUserId, action: action })
    });
    loadRecentChats();
}

// --- SỬA LẠI HÀM TÌM KIẾM BẠN BÈ ---
async function searchUser() {
    const phone = document.getElementById('searchPhone').value;
    if (!phone) return alert("Vui lòng nhập số điện thoại để tìm kiếm!");

    try {
        const res = await fetch(`/api/users/search/${phone}`);
        const user = await res.json();

        if (res.ok) {
            // 1. Kiểm tra xem người này đã có mặt trên thanh sidebar chưa
            let existingLi = document.getElementById(`user-${user._id}`);

            if (!existingLi) {
                // 2. Nếu CHƯA CÓ: Tạo một thẻ mới và chèn lên đầu danh sách (Sidebar)
                const userList = document.getElementById('user-list');
                const li = document.createElement('li');
                li.className = 'user-item';
                li.id = `user-${user._id}`;
                li.onclick = () => selectUser(user._id, user.name); // Chỉ mở chat khi click
                
                let avatarSrc = user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

                li.innerHTML = `
                    <div class="user-item-info">
                        <img src="${avatarSrc}" class="friend-avatar">
                        <div class="user-text">
                            <div class="user-name-row">
                                <strong>${user.name}</strong>
                                <span class="status-dot offline" id="dot-${user._id}"></span>
                            </div>
                            <div class="last-msg">Người liên hệ mới...</div>
                        </div>
                    </div>
                `;
                
                // prepend() giúp đẩy người dùng mới này lên vị trí trên cùng của danh sách
                userList.prepend(li); 
                
                // Cập nhật dấu chấm xanh nếu họ đang online
                socket.emit('get-online-status'); 
            } else {
                // 3. Nếu ĐÃ CÓ: Tự động cuộn danh sách tới vị trí người đó để bạn dễ thấy
                existingLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Hiệu ứng nhấp nháy nền nhẹ để gây chú ý
                existingLi.style.backgroundColor = 'var(--bg-hover)';
                setTimeout(() => {
                    existingLi.style.backgroundColor = '';
                }, 1000);
            }
            
            // Xóa trắng ô nhập liệu sau khi tìm thành công cho gọn gàng
            document.getElementById('searchPhone').value = '';

        } else {
            alert("Không tìm thấy số điện thoại này trong hệ thống!");
        }
    } catch (e) {
        console.error("Lỗi tìm kiếm:", e);
    }
}

async function selectUser(id, name) {
    selectedUserId = id;
    document.getElementById('chat-partner-name').innerText = `Đang chat với: ${name}`;
    document.getElementById('chat-actions').classList.remove('hidden');
    document.getElementById('msg-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    
    document.querySelectorAll('.user-item').forEach(el => el.classList.remove('active'));
    if (document.getElementById(`user-${id}`)) document.getElementById(`user-${id}`).classList.add('active');

    document.getElementById('message-container').innerHTML = '';
    try {
        const res = await fetch(`/api/messages/${currentUser.id}/${id}`);
        const history = await res.json();
        if (res.ok) {
            history.forEach(data => appendMessage(data));
            // Cuộn xuống cuối sau khi load xong lịch sử
            const container = document.getElementById('message-container');
            container.scrollTop = container.scrollHeight;
        }
    } catch (e) {}
}

// --- 4. RENDER TIN NHẮN (Bản hoàn chỉnh không rút gọn) ---
function reactMessage(msgId, reaction) {
    socket.emit('react-message', { msgId, reaction, senderId: currentUser.id, receiverId: selectedUserId });
}

// --- 4. RENDER TIN NHẮN (Bản sửa lỗi trạng thái Đã gửi/Đã xem) ---
function appendMessage(data) {
    const container = document.getElementById('message-container');
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${data.sender === currentUser.id ? 'sent' : 'received'}`;
    
    const div = document.createElement('div');
    div.className = `message ${data.sender === currentUser.id ? 'sent' : 'received'}`;
    // Luôn gán ID tin nhắn cho thẻ div chính
    div.setAttribute('data-id', data._id); 

    // Tạo một vùng riêng cho nội dung tin nhắn để tránh xung đột với các icon trạng thái
    const contentSpan = document.createElement('span');
    contentSpan.className = "message-content";

    if (data.isUnsent) {
        contentSpan.innerText = "Tin nhắn đã bị thu hồi";
        contentSpan.style.fontStyle = "italic";
        contentSpan.style.color = "#888";
        div.style.background = "transparent";
        div.style.border = "1px solid #ccc";
    } else {
        if (data.type === 'sticker') {
            contentSpan.innerHTML = `<img src="/stickers/${data.message}" style="width:100px; display:block;">`;
            div.style.background = 'transparent'; 
            div.style.boxShadow = 'none';
        } else if (data.type === 'file') {
            contentSpan.innerHTML = `📄 <a href="${data.message}" download="${data.fileName}">${data.fileName}</a> <br> <small>${data.fileSize}</small>`;
        } else {
            contentSpan.innerText = data.message;
            if (data.isEdited) {
                contentSpan.innerHTML += `<br><small style="font-size:10px; opacity:0.6;">(đã chỉnh sửa)</small>`;
            }
        }

        // Thêm khu vực chọn cảm xúc
        if (data._id) {
            const emojis = ['❤️', '😆', '😲', '😢', '😡'];
            let pickerHtml = `<div class="reaction-picker">`;
            emojis.forEach(e => pickerHtml += `<span onclick="reactMessage('${data._id}', '${e}')">${e}</span>`);
            pickerHtml += `<span onclick="reactMessage('${data._id}', '')">❌</span></div>`;
            div.innerHTML += pickerHtml;

            let reactionHtml = `<div class="reaction-bar" id="react-bar-${data._id}">`;
            if (data.reactions && data.reactions.length > 0) {
                data.reactions.forEach(r => reactionHtml += `<span>${r.reaction}</span>`);
            }
            reactionHtml += `</div>`;
            div.innerHTML += reactionHtml;
        }
    }

    div.appendChild(contentSpan);

    // Thời gian gửi
    const time = document.createElement('div');
    time.className = 'time';
    time.innerText = new Date(data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.appendChild(time);

    // Xử lý trạng thái Đã gửi / Đã xem (Chỉ dành cho tin nhắn mình gửi)
    if (data.sender === currentUser.id && data._id) {
        const status = document.createElement('span');
        status.id = `status-${data._id}`;
        status.className = `status-icon ${data.isRead ? 'read' : ''}`;
        status.innerText = data.isRead ? '✓✓ (Đã xem)' : '✓ (Đã gửi)';
        div.appendChild(status);
    } 
    
    // Nếu mình là người nhận và tin nhắn chưa được đọc, báo cho server
    if (data.sender !== currentUser.id && !data.isRead && data._id) {
        socket.emit('mark-as-read', { msgId: data._id, senderId: data.sender });
    }

    wrapper.appendChild(div);
    container.appendChild(wrapper);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

// Cập nhật trạng thái Đã xem thời gian thực khi đối phương vừa đọc tin
socket.on('message-read', ({ msgId }) => {
    const statusSpan = document.getElementById(`status-${msgId}`);
    if (statusSpan) {
        statusSpan.innerText = '✓✓ (Đã xem)';
        statusSpan.classList.add('read');
    }
});

// Khi đối phương online và load lại lịch sử chat, họ sẽ gửi hàng loạt mark-as-read
// Chúng ta cần đảm bảo sidebar cũng cập nhật tin nhắn cuối cùng đã xem hay chưa
socket.on('message-updated', () => {
    // Chỉ tải lại sidebar để cập nhật trạng thái đã xem/thu hồi ở danh sách bên trái
    loadRecentChats(); 
});

// --- 5. GỬI TIN NHẮN & FILE ---
document.getElementById('send-btn').onclick = () => {
    const message = document.getElementById('msg-input').value;
    if (!message || !selectedUserId) return;
    socket.emit('send-message', { senderId: currentUser.id, receiverId: selectedUserId, message, type: 'text' });
    document.getElementById('msg-input').value = '';
};
document.getElementById('msg-input').onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('send-btn').click(); };

const fileInput = document.getElementById('file-input');
if(fileInput) {
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedUserId) return;
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/messages/upload', { method: 'POST', body: formData });
        const fileData = await res.json();
        socket.emit('send-message', {
            senderId: currentUser.id, receiverId: selectedUserId,
            message: fileData.filePath, fileName: fileData.fileName, fileSize: fileData.fileSize, type: 'file'
        });
    };
}

// --- 6. NHẬN TIN TỪ SOCKET ---
socket.on('receive-message', (data) => {
    if (data.sender === selectedUserId || data.sender === currentUser.id) appendMessage(data);
    loadRecentChats();
});

socket.on('error-msg', (msg) => alert(msg));

socket.on('update-reaction', (data) => {
    const bar = document.getElementById(`react-bar-${data.msgId}`);
    if (bar) {
        bar.innerHTML = '';
        data.reactions.forEach(r => { if(r.reaction) bar.innerHTML += `<span>${r.reaction}</span>`; });
    }
});

socket.on('message-read', ({ msgId }) => {
    const status = document.getElementById(`status-${msgId}`);
    if (status) {
        status.innerText = '✓✓ (Đã xem)';
        status.classList.add('read');
    }
});

socket.on('message-updated', () => {
    // Tải lại toàn bộ lịch sử nếu có tin bị thu hồi/sửa để đồng bộ
    if(selectedUserId) selectUser(selectedUserId, document.getElementById('chat-partner-name').innerText.replace('Đang chat với: ', ''));
});

// --- 7. MENU CHUỘT PHẢI ---
let rightClickedMsgId = null;
window.oncontextmenu = (e) => {
    const msgEl = e.target.closest('.message.sent, .message.received');
    if (msgEl && msgEl.dataset.id) {
        e.preventDefault();
        rightClickedMsgId = msgEl.dataset.id;
        const menu = document.getElementById('context-menu');
        menu.style.top = `${e.pageY}px`;
        menu.style.left = `${e.pageX}px`;
        menu.classList.remove('hidden');

        const isMyMsg = msgEl.classList.contains('sent');
        document.getElementById('menu-edit').style.display = isMyMsg ? 'block' : 'none';
        document.getElementById('menu-unsend').style.display = isMyMsg ? 'block' : 'none';
    } else {
        document.getElementById('context-menu').classList.add('hidden');
    }
};

window.onclick = () => {
    const menu = document.getElementById('context-menu');
    if(menu) menu.classList.add('hidden');
};

const btnUnsend = document.getElementById('menu-unsend');
if(btnUnsend) {
    btnUnsend.onclick = (e) => {
        e.stopPropagation(); // Ngăn trình duyệt tắt menu trước khi chạy
        socket.emit('unsend-message', rightClickedMsgId);
        document.getElementById('context-menu').classList.add('hidden');
    };
}

const btnEdit = document.getElementById('menu-edit');
if(btnEdit) {
    btnEdit.onclick = (e) => {
        e.stopPropagation();
        const newContent = prompt("Nhập nội dung mới:");
        if (newContent) {
            socket.emit('edit-message', { msgId: rightClickedMsgId, newContent });
        }
        document.getElementById('context-menu').classList.add('hidden');
    };
}

const btnDelete = document.getElementById('menu-delete');
if(btnDelete) {
    btnDelete.onclick = (e) => {
        e.stopPropagation();
        const msgWrap = document.querySelector(`[data-id="${rightClickedMsgId}"]`).closest('.message-wrapper');
        if(msgWrap) msgWrap.classList.add('hidden');
        document.getElementById('context-menu').classList.add('hidden');
    };
}

// --- 8. STICKER & TYPING ---
async function loadStickersAuto() {
    const panel = document.getElementById('sticker-panel');
    const btn = document.getElementById('sticker-btn');
    if(!btn) return;
    btn.onclick = () => panel.classList.toggle('hidden');
    try {
        const res = await fetch('/api/users/get-all-stickers');
        const stickers = await res.json();
        panel.innerHTML = '';
        stickers.forEach(file => {
            const img = document.createElement('img');
            img.src = `/stickers/${file}`; img.className = 'sticker-img';
            img.onclick = () => { socket.emit('send-message', { senderId: currentUser.id, receiverId: selectedUserId, message: file, type: 'sticker' }); panel.classList.add('hidden'); };
            panel.appendChild(img);
        });
    } catch (e) {}
}
loadStickersAuto();

socket.on('update-user-list', (onlineIds) => {
    document.querySelectorAll('.status-dot').forEach(dot => { dot.classList.remove('online'); dot.classList.add('offline'); });
    onlineIds.forEach(id => {
        const dot = document.getElementById(`dot-${id}`);
        if (dot) { dot.classList.remove('offline'); dot.classList.add('online'); }
    });
});

document.getElementById('msg-input').oninput = () => {
    socket.emit('typing', { senderId: currentUser.id, receiverId: selectedUserId, isTyping: true });
    clearTimeout(window.typingT);
    window.typingT = setTimeout(() => socket.emit('typing', { senderId: currentUser.id, receiverId: selectedUserId, isTyping: false }), 2000);
};
socket.on('typing-status', (data) => {
    if (data.senderId === selectedUserId) { document.getElementById('typing-status').innerText = data.isTyping ? "Đang nhập..." : ""; }
});