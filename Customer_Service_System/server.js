const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// 允许所有跨域请求（开发环境）
app.use(cors());
// 解析 JSON 请求体
app.use(express.json());
// 托管当前目录下的所有静态文件（让 index.html 可以被访问）
app.use(express.static('.'));

// ★★★ 你的 Dify API 密钥在这里（只存在于服务器端）★★★
const DIFY_API_KEY = 'app-IHEAlIb5wSI0xqgQxXbGRJv6';
const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';

// 代理路由：前端所有聊天请求都发到这里
app.post('/api/chat', async (req, res) => {
    try {
        // 把前端发来的数据（query, conversation_id, user 等）原样转发
        const requestBody = req.body;

        // 向 Dify 发起请求（带上密钥）
        const response = await fetch(DIFY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Dify API 错误:', response.status, errorText);
            return res.status(response.status).send(errorText);
        }

        // ★★★ 关键：将 Dify 返回的流（SSE）直接转发给前端 ★★★
        // 设置正确的响应头（保持流式传输）
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 将 Dify 的响应流管道传输到前端的响应流
        response.body.pipe(res);
    } catch (error) {
        console.error('代理错误:', error);
        res.status(500).send('代理服务器内部错误');
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`✅ 代理服务器已启动，监听 http://localhost:${port}`);
    console.log(`✅ 请将前端 API_URL 改为 http://localhost:${port}/api/chat`);
});