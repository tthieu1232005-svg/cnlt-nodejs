const BlogPost = require('../models/BlogPost');

// Xem danh sách bài viết
exports.index = async (req, res) => {
    const posts = await BlogPost.find({}).sort({ createdAt: -1 });
    res.render('index', { posts });
};

// Giao diện thêm bài viết mới
exports.getNewPost = (req, res) => {
    res.render('create');
};

// Lưu bài viết mới
exports.storePost = async (req, res) => {
    await BlogPost.create({
        title: req.body.title,
        body: req.body.body
    });
    res.redirect('/');
};
// Xem chi tiết bài viết + Tăng lượt xem
exports.getDetailPost = async (req, res) => {
    // Tìm bài viết và tăng views lên 1 ($inc: { views: 1 })
    const post = await BlogPost.findByIdAndUpdate(
        req.params.id, 
        { $inc: { views: 1 } }, 
        { new: true } // Trả về dữ liệu sau khi đã cập nhật
    );
    res.render('detail', { post });
};

// Thêm bình luận mới
exports.addComment = async (req, res) => {
    await BlogPost.findByIdAndUpdate(req.params.id, {
        $push: { 
            comments: { 
                username: req.body.username, 
                content: req.body.content 
            } 
        }
    });
    res.redirect(`/blogposts/${req.params.id}`);
};

// Giao diện sửa bài viết
exports.editPost = async (req, res) => {
    const post = await BlogPost.findById(req.params.id);
    res.render('edit', { post });
};

exports.updatePost = async (req, res) => {
    await BlogPost.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        body: req.body.body
    });
    res.redirect('/');
};

exports.deletePost = async (req, res) => {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.redirect('/');
};