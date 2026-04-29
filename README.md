# 💘 网页相亲模拟器

一个有趣的网页相亲模拟器，使用千问（Qwen）AI实现智能对话，完美适配手机端浏览器。

## 🌟 功能特性

- 📱 **移动端优先** - 完美适配 320px-428px 手机屏幕，无横向滚动
- 🚻 **性别选择** - 选择自己的性别，自动配对异性嘉宾
- 💝 **卡片浏览** - 左右滑动查看3位随机生成的相亲对象，每位都有独特人设
- 🤖 **AI智能聊天** - 集成阿里云千问大模型，回复风格严格按照人设特点
- 📊 **多维度评分** - 结束后生成详细的相亲报告，包含适合异性方向推荐
- ✨ **动画效果** - 打字机效果、消息气泡动画、页面切换过渡

## 📱 效果预览

```
登录选择 → 滑动卡片 → AI聊天 → 查看评分
   👤   →    💝    →   💬   →   📊
```

## 🚀 快速开始

### 方式一：纯前端运行（无AI，使用模拟回复）

直接用浏览器打开 `index.html` 即可！无需安装任何依赖。
模拟回复会根据角色人设生成，适合快速体验。

### 方式二：完整运行（含千问AI）

#### 1. 获取千问 API 密钥

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 登录阿里云账号（没有则注册）
3. 在左侧菜单点击 **"API-KEY"**
4. 点击 **"创建API-KEY"** 按钮
5. 复制生成的 API Key（格式类似：`sk-xxxxxxxxxxxxxxxx`）

> 💡 新用户通常有免费额度，足够体验本项目

#### 2. 启动后端服务

```bash
# 进入服务器目录
cd server

# 安装依赖
npm install

# 创建环境变量文件
# Windows:
echo DASHSCOPE_API_KEY=你的API密钥 > .env

# Mac/Linux:
echo "DASHSCOPE_API_KEY=你的API密钥" > .env

# 启动服务器
npm start
```

服务器启动后会看到：
```
🚀 相亲模拟器后端服务已启动
📡 地址：http://localhost:3000
🔑 API Key：已配置 ✅
```

#### 3. 配置前端

```bash
# 复制配置示例文件
cp config.example.js config.js
```

编辑 `config.js`，确认代理地址正确：
```javascript
const CONFIG = {
  enabled: true,
  proxyUrl: 'http://localhost:3000/api/chat'
};
```

在 `index.html` 中，在所有 `<script>` 标签之前添加：
```html
<script src="config.js"></script>
```

#### 4. 打开前端页面

用浏览器打开 `index.html`，或使用本地服务器：

```bash
# 使用 Python（大多数系统自带）
python3 -m http.server 8080

# 或使用 Node.js
npx serve .

# 然后访问
open http://localhost:8080
```

## ⚙️ 配置说明

### 环境变量（`server/.env`）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DASHSCOPE_API_KEY` | 千问 API 密钥（必填） | - |
| `PORT` | 服务器端口 | `3000` |
| `QWEN_MODEL` | 使用的模型 | `qwen-turbo` |

### 可用模型

| 模型 | 说明 | 推荐场景 |
|------|------|----------|
| `qwen-turbo` | 快速、低成本 | 日常体验（默认） |
| `qwen-plus` | 效果更好 | 追求质量 |
| `qwen-max` | 最强效果 | 最佳体验 |

## 📁 目录结构

```
datingweb/
├── index.html          # 主页面（单页应用）
├── css/
│   └── style.css       # 全局样式（移动端优先）
├── js/
│   ├── app.js          # 主应用逻辑（路由、流程控制）
│   ├── character.js    # 角色生成（随机人设、姓名、职业）
│   ├── chat.js         # 聊天功能（API调用、打字动画）
│   └── scoring.js      # 评分系统（多维度分析）
├── server/
│   ├── server.js       # Express 后端（千问API代理）
│   └── package.json    # 依赖配置
├── config.example.js   # 配置示例（复制为 config.js 使用）
└── README.md           # 项目文档
```

## 🛠️ 技术栈

- **前端**: 原生 HTML5 + CSS3 + JavaScript（无框架依赖）
- **后端**: Node.js + Express
- **AI**: 阿里云千问大模型 API（Qwen）
- **设计**: 移动端优先，粉色/紫色恋爱主题

## ❓ 常见问题

### Q: 不配置API密钥也能用吗？
A: 可以！直接打开 `index.html` 即可使用，会使用内置的模拟回复。模拟回复会根据角色的人设生成，能体验完整的相亲流程。

### Q: AI回复很慢怎么办？
A: 千问API有时响应较慢，通常在1-5秒内。可以尝试切换到 `qwen-turbo` 模型（速度最快）。

### Q: 出现 CORS 错误怎么办？
A: 确保后端服务器已启动（`npm start`），并且 `config.js` 中的 `proxyUrl` 配置正确。如果使用 Live Server 等工具打开前端，端口可能不同，需要在 `server.js` 的 CORS 配置中添加对应端口。

### Q: 如何更换AI模型？
A: 在 `server/.env` 中添加：
```
QWEN_MODEL=qwen-plus
```

### Q: 聊天记录会保存吗？
A: 不会。所有对话数据仅在当前浏览器会话中存在，关闭页面后自动清除，保护用户隐私。

### Q: 手机上如何使用？
A: 将 `index.html` 及相关文件部署到任意静态托管服务（如 GitHub Pages、Vercel 等），用手机浏览器访问即可。如需AI功能，还需要部署后端服务。

## 📄 License

MIT License - 可自由使用和修改