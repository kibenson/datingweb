/**
 * server.js - Express 后端代理服务器
 * 负责将前端的聊天请求转发给千问 (Qwen) API
 * 避免在前端暴露 API 密钥
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件配置 =====

// 解析 JSON 请求体
app.use(express.json({ limit: '1mb' }));

// CORS 配置（允许本地前端访问）
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'null' // file:// 协议
  ],
  credentials: true
}));

// 请求日志中间件
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString('zh-CN');
  console.log(`[${time}] ${req.method} ${req.path}`);
  next();
});

// ===== API 配置 =====

/** 千问 API 配置 */
const QWEN_CONFIG = {
  apiKey: process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || '',
  baseUrl: 'dashscope.aliyuncs.com',
  path: '/compatible-mode/v1/chat/completions',
  model: process.env.QWEN_MODEL || 'qwen-turbo',  // 可选: qwen-plus, qwen-max
  maxTokens: 150,  // 限制回复长度，确保简短
  temperature: 0.9
};

// ===== 路由 =====

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: !!QWEN_CONFIG.apiKey,
    model: QWEN_CONFIG.model,
    time: new Date().toISOString()
  });
});

/**
 * 聊天代理端点
 * POST /api/chat
 * Body: { messages: [...], character: {...} }
 */
app.post('/api/chat', async (req, res) => {
  // 检查 API Key
  if (!QWEN_CONFIG.apiKey) {
    return res.status(500).json({
      error: 'API密钥未配置，请在服务器设置 DASHSCOPE_API_KEY 环境变量',
      hint: '请参考 README.md 获取千问API密钥'
    });
  }

  const { messages, character } = req.body;

  // 参数验证
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '无效的请求参数：messages 必须是数组' });
  }

  if (messages.length === 0) {
    return res.status(400).json({ error: '消息列表不能为空' });
  }

  // 限制消息历史长度（防止过长请求）
  const limitedMessages = messages.slice(-30);

  try {
    const reply = await callQwenAPI(limitedMessages);
    res.json({ reply, model: QWEN_CONFIG.model });
  } catch (error) {
    console.error('千问API调用失败:', error.message);
    res.status(502).json({
      error: 'AI服务调用失败，请稍后重试',
      detail: error.message
    });
  }
});

// ===== 千问 API 调用 =====

/**
 * 调用千问 API
 * @param {Array} messages - 消息列表 [{role, content}]
 * @returns {Promise<string>} AI回复文本
 */
function callQwenAPI(messages) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: QWEN_CONFIG.model,
      messages: messages,
      max_tokens: QWEN_CONFIG.maxTokens,
      temperature: QWEN_CONFIG.temperature,
      top_p: 0.9
    });

    const options = {
      hostname: QWEN_CONFIG.baseUrl,
      path: QWEN_CONFIG.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          // 检查 API 错误
          if (parsed.error) {
            reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
            return;
          }

          // 提取回复文本
          const reply = parsed.choices?.[0]?.message?.content;
          if (!reply) {
            reject(new Error('API返回格式异常：' + data.substring(0, 200)));
            return;
          }

          // 截断过长回复（确保符合15-50字要求）
          const trimmed = reply.trim();
          resolve(trimmed);
        } catch (e) {
          reject(new Error('响应解析失败：' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('网络请求失败：' + err.message));
    });

    // 设置30秒超时
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时（30秒）'));
    });

    req.write(requestBody);
    req.end();
  });
}

// ===== 错误处理中间件 =====

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// ===== 启动服务器 =====

app.listen(PORT, () => {
  console.log('\n🚀 相亲模拟器后端服务已启动');
  console.log(`📡 地址：http://localhost:${PORT}`);
  console.log(`🔑 API Key：${QWEN_CONFIG.apiKey ? '已配置 ✅' : '未配置 ❌'}`);
  console.log(`🤖 模型：${QWEN_CONFIG.model}`);
  console.log('\n📖 API端点：');
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/chat`);

  if (!QWEN_CONFIG.apiKey) {
    console.warn('\n⚠️  警告：未检测到 DASHSCOPE_API_KEY 环境变量');
    console.warn('   请在 server/ 目录创建 .env 文件，内容如下：');
    console.warn('   DASHSCOPE_API_KEY=your_api_key_here');
    console.warn('   或参考 README.md 获取配置说明\n');
  }
});

module.exports = app;
