/**
 * config.example.js - API配置示例文件
 *
 * 使用说明：
 * 1. 复制此文件并重命名为 config.js
 * 2. 填入你的千问API密钥（获取方式见 README.md）
 * 3. 在 index.html 中引入 config.js（确保在 app.js 之前）
 *
 * 注意：config.js 已加入 .gitignore，不会被提交到代码仓库
 * 请妥善保管你的 API 密钥，不要分享给他人
 */

// 如果你使用后端代理模式（推荐），只需配置代理地址
// 不需要在前端暴露 API 密钥
const CONFIG = {
  // 是否启用AI对话（false时使用模拟回复）
  enabled: true,

  // 后端代理服务器地址（本地运行时的默认值）
  proxyUrl: 'http://localhost:3000/api/chat'
};
