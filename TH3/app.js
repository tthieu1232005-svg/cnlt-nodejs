const express = require('express')
const app = express()

// cấu hình template engine
app.set('view engine','ejs')

// route trang chủ
app.get('/', (req,res)=>{
    res.render('index')
})

// chạy server
app.listen(3000, ()=>{
    console.log("Server running")
})
