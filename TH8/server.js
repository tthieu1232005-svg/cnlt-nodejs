const express = require("express");
const multer = require("multer");
const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

// Cấu hình Multer để nhận mảng file với tên là 'many-files', tối đa 17 file [cite: 128-129, 134]
let uploadManyFiles = multer({ storage: storage }).array("many-files", 17);

// 1. Giao diện HTML (Thêm thuộc tính multiple) [cite: 126-127]
app.get("/", (req, res) => {
    res.send(`
        <form action="/upload-many" method="post" enctype="multipart/form-data">
            <input type="file" name="many-files" multiple />
            <button type="submit">Upload Many</button>
        </form>
    `);
});

// 2. Route xử lý upload nhiều file [cite: 130-131]
app.post("/upload-many", (req, res) => {
    uploadManyFiles(req, res, (err) => {
        if (err) return res.send("Lỗi upload nhiều file");
        res.send("Upload nhiều file thành công.");
    });
});

app.listen(8017, () => {
    console.log("Server chạy tại http://localhost:8017");
});