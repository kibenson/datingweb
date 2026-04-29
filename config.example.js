/**
 * config.example.js - 配置示例文件
 *
 * 使用方法：
 * 1. 复制此文件为 server/.env（不是 config.js）
 * 2. 填入你的千问API密钥
 *
 * 注意：.env 文件包含敏感信息，已加入 .gitignore，不会被提交到仓库
 */

// ================================================
// 千问API密钥获取教程：
// 1. 访问 https://dashscope.aliyun.com/
// 2. 注册/登录阿里云账号
// 3. 开通"模型服务灵积"（DashScope）
// 4. 在控制台 -> API-KEY 管理中创建密钥
// 5. 复制密钥，填入下方
// ================================================

// 在 server/.env 文件中配置以下内容（删除注释）：
/*
# 千问API密钥（必填）
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 使用的模型（可选，默认 qwen-turbo）
# 可选值：qwen-turbo（快速）、qwen-plus（平衡）、qwen-max（最强）
QWEN_MODEL=qwen-turbo

# 服务器端口（可选，默认3000）
PORT=3000
*/
