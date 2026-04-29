/**
 * server.js - 网页相亲模拟器后端服务
 * Express服务器 + 千问API代理
 *
 * 使用方法：
 *   1. 在 server/ 目录下安装依赖：npm install
 *   2. 创建 .env 文件并填入 QWEN_API_KEY=你的密钥
 *   3. 启动：npm start
 *   4. 访问：http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

// 加载环境变量（.env 文件或系统环境变量）
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// 中间件配置
// =====================================================

// 允许跨域（开发时前端可能运行在不同端口）
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// 解析JSON请求体
app.use(express.json({ limit: '10kb' }));

// 提供前端静态文件（index.html, css/, js/）
app.use(express.static(path.join(__dirname, '..')));

// =====================================================
// 千问API 配置
// =====================================================
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-turbo';

// =====================================================
// API 路由
// =====================================================

/**
 * POST /api/chat
 * 接收前端消息，调用千问API，返回AI回复
 *
 * 请求体格式：
 * {
 *   character: { name, tags, interests, chatStyle, ... },
 *   messages: [{ role: 'user'|'assistant', content: '...' }],
 *   systemPrompt: '...'
 * }
 *
 * 返回格式：
 * { reply: 'AI回复文本' }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { character, messages, systemPrompt } = req.body;

    // 参数校验
    if (!character || !messages) {
      return res.status(400).json({ error: '缺少必要参数：character 或 messages' });
    }

    // 检查API密钥配置
    if (!QWEN_API_KEY) {
      console.warn('[Server] 未配置千问API密钥，使用降级回复');
      return res.json({ reply: getFallbackReply(character) });
    }

    console.log(`[Server] 收到聊天请求，角色：${character.name}，消息数：${messages.length}`);

    // 构造发给千问API的消息列表
    const apiMessages = [
      {
        role: 'system',
        content: systemPrompt || buildDefaultSystemPrompt(character)
      },
      ...messages.slice(-10)  // 只保留最近10条，避免超出token限制
    ];

    // 调用千问API
    const reply = await callQwenAPI(apiMessages);

    console.log(`[Server] 千问API回复：${reply.substring(0, 50)}...`);
    res.json({ reply });

  } catch (error) {
    console.error('[Server] 处理聊天请求失败:', error.message);
    res.status(500).json({
      error: 'AI服务暂时不可用，请稍后重试',
      detail: error.message
    });
  }
});

/**
 * GET /api/health
 * 健康检查接口
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyConfigured: !!QWEN_API_KEY,
    model: QWEN_MODEL,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// 工具函数
// =====================================================

/**
 * 调用阿里云千问API
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} AI回复文本
 */
function callQwenAPI(messages) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: QWEN_MODEL,
      input: {
        messages: messages
      },
      parameters: {
        max_tokens: 150,          // 限制回复长度
        temperature: 0.8,         // 适当的创意度
        top_p: 0.9,
        result_format: 'message'
      }
    });

    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/text-generation/generation',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          // 检查API返回错误
          if (parsed.code) {
            reject(new Error(`千问API错误 ${parsed.code}: ${parsed.message}`));
            return;
          }

          // 提取回复文本
          const reply = parsed.output?.choices?.[0]?.message?.content
            || parsed.output?.text
            || '（AI没有回复）';

          resolve(reply.trim());
        } catch (parseError) {
          reject(new Error(`解析API响应失败: ${parseError.message}`));
        }
      });
    });

    request.on('error', (err) => {
      reject(new Error(`网络请求失败: ${err.message}`));
    });

    // 设置超时（10秒）
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('千问API请求超时（10秒）'));
    });

    request.write(requestBody);
    request.end();
  });
}

/**
 * 构造默认系统提示词（备用）
 * @param {Object} character
 * @returns {string}
 */
function buildDefaultSystemPrompt(character) {
  return `你在扮演相亲对象${character.name}，${character.age}岁，${character.occupation}。
性格：${(character.tags || []).join('、')}。
兴趣：${(character.interests || []).join('、')}。
请用15-50字自然回复，符合角色性格。禁止自称是AI。`;
}

/**
 * API未配置时的降级回复
 * @param {Object} character
 * @returns {string}
 */
function getFallbackReply(character) {
  const replies = [
    `嗯，跟你聊天挺开心的！`,
    `哈哈，你说得对，我也这么觉得`,
    `我平时也喜欢${(character.interests || ['旅行'])[0]}，有机会可以交流`,
    `感觉我们还挺有共同话题的 😊`,
    `你是个有趣的人呢`
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

// =====================================================
// 启动服务器
// =====================================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     网页相亲模拟器后端服务已启动 💕      ║');
  console.log(`║     访问地址：http://localhost:${PORT}      ║`);
  console.log(`║     API状态：${QWEN_API_KEY ? '✅ 已配置千问API' : '⚠️  未配置API(降级模式)'}     ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  if (!QWEN_API_KEY) {
    console.warn('提示：未配置 QWEN_API_KEY，AI将使用预设回复。');
    console.warn('请在 server/.env 文件中添加：QWEN_API_KEY=你的千问API密钥');
    console.warn('申请地址：https://dashscope.aliyun.com/');
    console.warn('');
  }
});
