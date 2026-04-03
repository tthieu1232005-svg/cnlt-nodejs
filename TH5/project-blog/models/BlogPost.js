const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlogPostSchema = new Schema({
    title: String,
    body: String,
    views: { type: Number, default: 0 },
    comments: [{
        username: String,
        content: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
module.exports = BlogPost;