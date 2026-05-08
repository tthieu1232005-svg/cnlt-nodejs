const User = require('../models/User');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    try {
        const { phone, name, password } = req.body;

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: 'Số điện thoại đã được đăng ký!' });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ phone, name, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi đăng ký' });
    }
};

const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Sai mật khẩu!' });
        }

        res.status(200).json({ 
            message: 'Đăng nhập thành công!',
            user: { id: user._id, name: user.name, phone: user.phone }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
};

module.exports = { register, login };