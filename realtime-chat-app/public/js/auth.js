// Xử lý form Đăng ký
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Ngăn trình duyệt reload lại trang
        
        const phone = document.getElementById('regPhone').value;
        const name = document.getElementById('regName').value;
        const password = document.getElementById('regPassword').value;

        try {
            // Gửi dữ liệu lên API Backend
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, name, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Đăng ký thành công! Chuyển sang trang đăng nhập.');
                window.location.href = '/login.html'; // Chuyển hướng
            } else {
                alert(data.message); // Hiển thị lỗi (vd: SĐT đã tồn tại)
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra khi kết nối đến server!');
        }
    });
}

// Xử lý form Đăng nhập
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Đăng nhập thành công -> Lưu thông tin user vào localStorage của trình duyệt
                localStorage.setItem('chat_user', JSON.stringify(data.user));
                alert('Đăng nhập thành công!');
                window.location.href = '/'; // Chuyển hướng về trang chủ chat
            } else {
                alert(data.message); // Báo lỗi sai SĐT hoặc mật khẩu
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra khi kết nối đến server!');
        }
    });
}